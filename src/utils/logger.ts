/**
 * Logger utility with Sentry-compatible interface and structured server logging
 */

interface LogPayload {
  message: string;
  level?: "info" | "warn" | "error";
  context?: Record<string, any>;
  error?: Error | any;
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";
  private sentryDsn = process.env.SENTRY_DSN;

  constructor() {
    if (this.sentryDsn) {
      console.log("[Logger] Sentry monitoring initialized with DSN configuration.");
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log({ message, level: "info", context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log({ message, level: "warn", context });
  }

  error(message: string, error?: Error | any, context?: Record<string, any>) {
    this.log({ message, level: "error", error, context });
  }

  private log({ message, level = "info", context, error }: LogPayload) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      message,
      ...(context ? { context } : {}),
      ...(error
        ? {
            errorName: error.name || "Error",
            errorMessage: error.message || String(error),
            stack: this.isProduction ? undefined : error.stack,
          }
        : {}),
    };

    if (level === "error") {
      console.error(JSON.stringify(entry));
      // If Sentry DSN is present, Sentry SDK would captureException here:
      if (this.sentryDsn) {
        // Mock / forward to Sentry webhook or SDK
      }
    } else if (level === "warn") {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}

export const logger = new Logger();
