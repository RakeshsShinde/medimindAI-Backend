import bcrypt from "bcrypt";
import { db } from "../../config/db";
import { users } from "../../db/Schema/users";
import { refreshTokens } from "../../db/Schema/refreshTokens";
import { eq, and, gt } from "drizzle-orm";
import { uploadToCloudinary } from "../../utils/cloudinary-upload";
import { ApiError } from "../../utils/ApiError";
import { AuthProvider, LoginInput, RegisterInput } from "../../types";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/token";


export const registerUser = async (input: RegisterInput) => {
  const { email, password, profilePic } = input;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length > 0) {
    throw new ApiError(409, "Email already exists");
  }

  let avatarUrl: string | undefined = undefined;

  if (profilePic) {
    const uploadResult: any = await uploadToCloudinary(profilePic.buffer);
    avatarUrl = uploadResult.secure_url;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      avatar: avatarUrl,
      authProvider: AuthProvider.LOCAL
    })
    .returning();

  return user;
};


export const LoginUser = async (body: LoginInput) => {
  const { email, password } = body;

  // 1. check if user exists 
  const existingUser = await db.select().from(users).where(eq(users.email, email));

  if (existingUser.length == 0) {
    throw new ApiError(404, "User not exists")
  }

  const user = existingUser[0];

  // 2. Validate password (if registered locally)
  if (!user.password) {
    throw new ApiError(400, "User registered with OAuth. Please login with Google.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 3. Generate JWT Tokens
  const accessToken = generateAccessToken({ id: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

  // 4. Save Refresh Token to Database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  // set refresh token in cookies 



  // 5. Return sanitized user details and tokens
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (oldRefreshToken: string) => {
  if (!oldRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    // Verify the signature and standard expiration of the refresh token
    const decoded = verifyRefreshToken(oldRefreshToken);

    // Query database to ensure token exists and has not expired in DB
    const tokenRecords = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, oldRefreshToken),
          gt(refreshTokens.expiresAt, new Date())
        )
      );

    if (tokenRecords.length === 0) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const record = tokenRecords[0];

    // Ensure the token belongs to the valid user
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, record.userId));

    if (userRecords.length === 0) {
      throw new ApiError(404, "User not found");
    }

    const user = userRecords[0];

    // Generate new tokens (Rotation)
    const newAccessToken = generateAccessToken({ id: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // Delete the old refresh token
    await db.delete(refreshTokens).where(eq(refreshTokens.id, record.id));

    // Save the new refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);



    await db.insert(refreshTokens).values({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid or expired refresh token");
  }
};

export const logoutUser = async (userId: string) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
};


