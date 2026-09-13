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

  app.use(cors());

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
      message: "EthioInfluence API is running",
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