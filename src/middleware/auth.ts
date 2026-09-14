import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User, { IUser } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET || "fallback_access_secret";
      const decoded = jwt.verify(token, jwtSecret) as { userId: string; email?: string; role?: string };

      // Look up user by ID
      let user: IUser | null = null;
      if (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
        user = await User.findById(decoded.userId).select("-passwordHash");
      }

      // Resilient fallback: If not found by ID (e.g. in-memory MongoDB restarted with new ObjectIds), check email
      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email.toLowerCase() }).select("-passwordHash");
      }

      if (!user) {
        res.status(401).json({ message: "Not authorized, user not found" });
        return;
      }
      
      if (user.status === "suspended") {
        res.status(403).json({ message: "Not authorized, account suspended" });
        return;
      }

      // Attach user to the request object
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const jwtSecret = process.env.JWT_SECRET || "fallback_access_secret";
      const decoded = jwt.verify(token, jwtSecret) as { userId: string; email?: string; role?: string };

      let user: IUser | null = null;
      if (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
        user = await User.findById(decoded.userId).select("-passwordHash");
      }
      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email.toLowerCase() }).select("-passwordHash");
      }

      if (user && user.status !== "suspended") {
        req.user = user;
      }
    } catch {
      // Ignore token failure for optional auth
    }
  }
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "User role not authorized" });
      return;
    }
    next();
  };
};
