const express = require("express");
const cors = require("cors");
const os = require("os");

const pool = require("./config/database");
const redisClient = require("./config/redis");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const transactionRoutes = require("./routes/transaction.routes");
const categoryRoutes = require("./routes/category.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: "http://localhost:8081",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Security headers
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

// Cap body size
app.use(express.json({ limit: "10kb" }));

// Lightweight request logger
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
        `-> ${res.statusCode} (${durationMs}ms) ip=${req.ip} ` +
        `body=${JSON.stringify(maskSensitiveBody(req.body))}`,
    );
  });

  next();
});

// Never print sensitive values to logs
const SENSITIVE_FIELDS = new Set([
  "password",
  "otp",
  "resetToken",
  "refreshToken",
  "currentPassword",
  "newPassword",
]);

function maskSensitiveBody(body) {
  if (!body || typeof body !== "object") {
    return body;
  }

  const masked = { ...body };

  for (const field of SENSITIVE_FIELDS) {
    if (field in masked) {
      masked[field] = "***";
    }
  }

  return masked;
}

// Health check
app.get("/health", async (req, res) => {
  try {
    const [, redisStatus] = await Promise.all([
      pool.query("SELECT 1"),
      redisClient.ping(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Kharch API is running",

      // Temporary field for load-balancer testing.
      // Remove this after testing.
      instance: os.hostname(),

      services: {
        database: "connected",
        redis: redisStatus === "PONG" ? "connected" : "unknown",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(503).json({
      success: false,
      message: "One or more services are unavailable",

      // Temporary field for load-balancer testing.
      instance: os.hostname(),

      services: {
        database: "unknown",
        redis: "unknown",
      },
    });
  }
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;