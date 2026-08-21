// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Map error codes to appropriate status codes and messages
  const errorMap = {
    USER_ALREADY_EXISTS: { status: 409, message: "User already exists" },
    INVALID_CREDENTIALS: { status: 401, message: "Invalid email or password" },
    EMAIL_NOT_VERIFIED: { status: 403, message: "Email is not verified" },
    EMAIL_ALREADY_VERIFIED: { status: 400, message: "Email is already verified" },
    INVALID_VERIFICATION: { status: 400, message: "Invalid verification request" },
    OTP_EXPIRED: { status: 400, message: "OTP has expired" },
    INVALID_OTP: { status: 400, message: "Invalid OTP" },
    OTP_ATTEMPTS_EXCEEDED: { status: 400, message: "Maximum OTP attempts exceeded" },
    OTP_RESEND_COOLDOWN: { status: 429, message: "Please wait before requesting another OTP" },
    USER_NOT_FOUND: { status: 404, message: "User not found" },
    INVALID_REFRESH_TOKEN: { status: 401, message: "Invalid refresh token" },
    REFRESH_TOKEN_REVOKED: { status: 401, message: "Refresh token has been revoked" },
    REFRESH_TOKEN_EXPIRED: { status: 401, message: "Refresh token has expired" },
  };

  const errorInfo = errorMap[err.code] || {
    status: 500,
    message: "Internal server error",
  };

  const response = {
    success: false,
    message: errorInfo.message,
  };

  // Add retryAfter for cooldown
  if (err.code === "OTP_RESEND_COOLDOWN" && err.retryAfter) {
    response.retryAfter = err.retryAfter;
  }

  // Add details in development
  if (process.env.NODE_ENV === "development") {
    response.error = err.message;
    response.stack = err.stack;
  }

  return res.status(errorInfo.status).json(response);
};

module.exports = errorHandler;