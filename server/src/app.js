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

// 1. CORS Setup
const allowedOriginPattern =
  /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|(\d{1,3}\.){3}\d{1,3}):\d+$/;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOriginPattern.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Global CORS Middleware (Automatically handles Pre-Flight OPTIONS requests)
app.use(cors(corsOptions));

// 2. Security Headers
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

// 3. Body Parser
app.use(express.json({ limit: "10kb" }));

// 4. Sensitive Field Masking Logic
const SENSITIVE_FIELDS = new Set([
  "password",
  "otp",
  "resetToken",
  "refreshToken",
  "currentPassword",
  "newPassword",
]);

function maskSensitiveBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const masked = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key)) {
      masked[key] = "***";
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

// 5. Request Logger Middleware
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

// 6. Health Check Endpoint
app.get(["/", "/health"], async (req, res) => {
  try {
    const [, redisStatus] = await Promise.all([
      pool.query("SELECT 1"),
      redisClient.ping(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Kharch API is running",
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
      instance: os.hostname(),
      services: {
        database: "unknown",
        redis: "unknown",
      },
    });
  }
});

// 7. API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// 8. Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;