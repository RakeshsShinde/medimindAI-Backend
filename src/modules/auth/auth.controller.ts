import { Request, Response } from "express";
import { LoginUser, registerUser, refreshAccessToken, logoutUser } from "./auth.service";
import { ApiError } from "../../utils/ApiError";
import { generateAccessToken, generateRefreshToken } from "../../utils/token";
import { refreshTokens } from "../../db/Schema";
import { db } from "../../config/db";
import { env } from "../../config/env";

export const registerAPI = async (req: Request, res: Response) => {
  const user = await registerUser({
    email: req.body.email,
    password: req.body.password,
    profilePic: req.file,
  });

  res.status(201).json({
    success: true,
    data: user,
  });
};

export const loginAPI = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const data = await LoginUser({
    email,
    password,
  })

  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    accessToken: data?.accessToken,
    user: data?.user
  });
};

export const refreshTokenAPI = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const result = await refreshAccessToken(refreshToken);

  // set new refresh token in cookies 
  res.cookie("refreshToken", result?.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const logoutAPI = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  await logoutUser(userId);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};


export const googleLoginAPI = async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (!reqUser) {
    throw new ApiError(401, "Google authentication failed",);
  }

  const user = reqUser;

  // create an access token 
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
  });

  // create a refresh token 
  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
  });

  // save the refresh token inside the db
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  // store refresh token in cookies 
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Redirect to frontend dashboard with token and serialized user info
  const serializedUser = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
    })
  );

  const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/dashboard?token=${accessToken}&user=${serializedUser}`);
}


