import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };

      // Get user from the token, excluding the password hash
      const user = await User.findById(decoded.userId).select("-passwordHash");

      if (!user) {
        res.status(401).json({ message: "Not authorized, user not found" });
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
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      const user = await User.findById(decoded.userId).select("-passwordHash");
      if (user) {
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
