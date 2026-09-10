import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * General API Rate Limiter
 * 300 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false,
  },
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again in 15 minutes.",
  },
});

/**
 * Auth Endpoints Rate Limiter (Login, Register)
 * Stricter to prevent brute force attacks: 30 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false,
  },
  message: {
    status: 429,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
});

/**
 * Recursive sanitizer for MongoDB Operator Injection ($ and . keys)
 */
function cleanNoSqlInjection(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(cleanNoSqlInjection);
  }

  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    // Strip keys starting with $ or containing dots
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    cleaned[key] = cleanNoSqlInjection(obj[key]);
  }
  return cleaned;
}

export const mongoSanitize = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = cleanNoSqlInjection(req.body);
  }
  if (req.query) {
    req.query = cleanNoSqlInjection(req.query);
  }
  if (req.params) {
    req.params = cleanNoSqlInjection(req.params);
  }
  next();
};

/**
 * XSS Sanitizer
 * Strips script tags, javascript: urls, and inline event handlers from strings
 */
function stripXSS(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .replace(/onclick\s*=/gi, "");
}

function cleanXSS(obj: any): any {
  if (typeof obj === "string") {
    return stripXSS(obj);
  }
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanXSS);
  }
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    cleaned[key] = cleanXSS(obj[key]);
  }
  return cleaned;
}

export const xssClean = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = cleanXSS(req.body);
  }
  if (req.query) {
    req.query = cleanXSS(req.query);
  }
  next();
};
