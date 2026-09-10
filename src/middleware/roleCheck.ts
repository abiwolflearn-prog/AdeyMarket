import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * Middleware to restrict access to specific roles.
 * Must be used after the `protect` middleware.
 * @param roles Array of allowed roles (e.g., ["creator", "brand"])
 */
export const roleCheck = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: You do not have the required role to access this route" });
      return;
    }

    next();
  };
};
