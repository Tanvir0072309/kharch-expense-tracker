const jwt = require("jsonwebtoken");

// Maps our internal, service-layer error codes to HTTP status codes.
// Every thrown error in services/controllers should set `error.code` to one
// of these so the client gets a stable, documented status + code instead of
// a generic 500.
const ERROR_STATUS_MAP = {
  // Validation
  VALIDATION_ERROR: 400,

  // Signup / email verification
  USER_ALREADY_EXISTS: 409,
  INVALID_VERIFICATION: 400,
  EMAIL_ALREADY_VERIFIED: 400,

  // Login
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,

  // OTP
  OTP_EXPIRED: 400,
  INVALID_OTP: 400,
  OTP_ATTEMPTS_EXCEEDED: 429,
  OTP_RESEND_COOLDOWN: 429,
  INVALID_OTP_PURPOSE: 400,

  // Refresh / access tokens
  MISSING_REFRESH_TOKEN: 400,
  INVALID_REFRESH_TOKEN: 401,
  REFRESH_TOKEN_REVOKED: 401,
  REFRESH_TOKEN_EXPIRED: 401,
  MISSING_ACCESS_TOKEN: 401,
  INVALID_ACCESS_TOKEN: 401,

  // Password reset
  INVALID_RESET_TOKEN: 400,
  RESET_TOKEN_EXPIRED: 400,

  // Generic
  RATE_LIMIT_EXCEEDED: 429,
  NOT_FOUND: 404,

  // Users
  USER_NOT_FOUND: 404,
  INVALID_CURRENT_PASSWORD: 401,

  // Transactions
  TRANSACTION_NOT_FOUND: 404,

  // Categories
  CATEGORY_NOT_FOUND: 404,
  CATEGORY_ALREADY_EXISTS: 409,
};

const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Express recognizes this as an error handler purely by its 4-argument
// signature, so `next` must stay even though it's unused.
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  if (error instanceof jwt.TokenExpiredError) {
    return res.status(401).json({
      success: false,
      message: "Token has expired",
      code: "TOKEN_EXPIRED",
    });
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  const statusCode = ERROR_STATUS_MAP[error.code] || 500;

  const payload = {
    success: false,
    message: statusCode === 500 ? "Internal server error" : error.message,
  };

  if (error.code) {
    payload.code = error.code;
  }

  if (error.retryAfter !== undefined) {
    payload.retryAfter = error.retryAfter;
  }

  if (error.errors) {
    payload.errors = error.errors;
  }

  // Never leak stack traces / raw error messages for unexpected (5xx)
  // failures - log server-side for debugging, keep the client response generic.
  if (statusCode >= 500) {
    console.error("Unhandled error:", error);
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
