import jwt from "jsonwebtoken";
import { Response } from "express";

export const generateTokens = (
  res: Response,
  userId: string,
  email?: string,
  role?: string
) => {
  const jwtSecret = process.env.JWT_SECRET || "fallback_access_secret";
  const refreshSecret = process.env.REFRESH_SECRET || "fallback_refresh_secret";

  const payload = { userId, email, role };

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: "7d",
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: "30d",
  });

  // Set HTTP-only cookie with sameSite: "none" and secure: true for iframe compatibility
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return { accessToken, refreshToken };
};
