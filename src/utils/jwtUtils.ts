import jwt from "jsonwebtoken";
import { Response } from "express";

export const generateTokens = (res: Response, userId: string) => {
  const jwtSecret = process.env.JWT_SECRET || "fallback_access_secret";
  const refreshSecret = process.env.REFRESH_SECRET || "fallback_refresh_secret";

  const accessToken = jwt.sign({ userId }, jwtSecret, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, refreshSecret, {
    expiresIn: "7d",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict", // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return accessToken;
};
