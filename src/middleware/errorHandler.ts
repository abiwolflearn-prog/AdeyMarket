import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Handle 404 errors for API routes
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler with Sentry/Structured Error Logging
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If status code is 200, set to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Log error via structured logger / Sentry
  logger.error(`API Error: ${err.message}`, err, {
    url: req.originalUrl,
    method: req.method,
    statusCode,
    ip: req.ip,
  });

  res.json({
    message: err.message,
    // Include stack trace only in development
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
