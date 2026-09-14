import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { notFound, errorHandler } from "./middleware/errorHandler";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set("trust proxy", 1);

  await connectDB();

  const allowedOrigins = [
    "https://adeymarket.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, server-to-server, or same-origin)
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".run.app") ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  };

  app.use("/api", cors(corsOptions));
  app.options("*", cors(corsOptions));


  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use("/api", morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const {
    apiLimiter,
    authLimiter,
    mongoSanitize,
    xssClean,
  } = await import("./middleware/security");

  app.use("/api", apiLimiter);
  app.use("/api", mongoSanitize);
  app.use("/api", xssClean);

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Adey API is running",
    });
  });

  app.use(
    "/api/auth",
    authLimiter,
    (await import("./routes/authRoutes")).default
  );

  app.use(
    "/api/profile",
    (await import("./routes/profileRoutes")).default
  );

  app.use(
    "/api/shop",
    (await import("./routes/shopRoutes")).default
  );

  app.use(
    "/api/products",
    (await import("./routes/productRoutes")).default
  );

  app.use(
    "/api/referral",
    (await import("./routes/referralRoutes")).default
  );

  app.use(
    "/api/orders",
    (await import("./routes/orderRoutes")).default
  );

  app.use(
    "/api/payments",
    (await import("./routes/paymentRoutes")).default
  );

  app.use(
    "/api/campaigns",
    (await import("./routes/campaignRoutes")).default
  );

  app.use(
    "/api/agreements",
    (await import("./routes/agreementRoutes")).default
  );

  app.use(
    "/api/admin",
    (await import("./routes/adminRoutes")).default
  );

  app.use("/api", notFound);
  app.use(errorHandler);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});