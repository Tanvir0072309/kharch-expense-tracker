const express = require("express");

const pool = require("./config/database");
const redisClient = require("./config/redis");
const authRoutes = require("./routes/auth.routes");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Trust the first proxy hop (nginx, per infrastructure/nginx) so
// `req.ip` reflects the real client IP instead of the proxy's - this
// matters a lot for the IP-based rate limiters.
app.set("trust proxy", 1);

// A small, dependency-free set of security headers. Kept minimal on purpose
// (no helmet dependency) since the app is a pure JSON API behind nginx.
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

// Cap body size - auth payloads are tiny, so this also doubles as basic
// protection against oversized-payload DoS attempts.
app.use(express.json({ limit: "10kb" }));

// Lightweight request logger (no morgan dependency needed). Prints every
// incoming request with a timestamp + IP so duplicate/double-fired requests
// from a client (double-tap, retry-on-timeout, React effect firing twice,
// etc.) are immediately visible in the server console - very useful when
// debugging "why did this OTP get consumed twice" style issues.
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

// Never print raw passwords/OTPs/tokens to the console, even in a debug logger.
const SENSITIVE_FIELDS = new Set([
  "password",
  "otp",
  "resetToken",
  "refreshToken",
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

app.get("/health", async (req, res) => {
  try {
    const [, redisStatus] = await Promise.all([
      pool.query("SELECT 1"),
      redisClient.ping(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Kharch API is running",
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
      services: {
        database: "unknown",
        redis: "unknown",
      },
    });
  }
});

app.use("/api/v1/auth", authRoutes);

// Anything that falls through the routes above is a 404, not a silently
// hanging request.
app.use(notFoundHandler);

// Centralized error handler - must be registered last so Express treats it
// as an error-handling middleware (4-arg signature).
app.use(errorHandler);

module.exports = app;
