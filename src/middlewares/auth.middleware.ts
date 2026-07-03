import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token";
import { ApiError } from "../utils/ApiError";
import { AuthenticatedRequest } from "../types";
import { db } from "../config/db";
import { refreshTokens } from "../db/Schema/refreshTokens";
import { eq } from "drizzle-orm";

export const Authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token required");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Invalid token !");
    }

    const decoded = verifyAccessToken(token);

    // Verify user has at least one active session (refresh token) in the database
    const activeSessions = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, decoded.id));

    if (activeSessions.length === 0) {
      throw new ApiError(401, "Session expired or user logged out");
    }

    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Access token expired"));
    }
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(401, "Invalid or expired authorization token"));
  }
};

