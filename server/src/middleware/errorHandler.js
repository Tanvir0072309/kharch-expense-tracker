const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const errorMap = {
    USER_ALREADY_EXISTS: { status: 409, message: "User already exists" },
    INVALID_CREDENTIALS: { status: 401, message: "Invalid email or password" },
    EMAIL_NOT_VERIFIED: { status: 403, message: "Email is not verified" },
    OTP_EXPIRED: { status: 400, message: "OTP has expired" },
    INVALID_OTP: { status: 400, message: "Invalid OTP" },
    OTP_ATTEMPTS_EXCEEDED: { status: 400, message: "Maximum OTP attempts exceeded" },
    USER_NOT_FOUND: { status: 404, message: "User not found" },
  };
  const errorInfo = errorMap[err.code] || { status: 500, message: err.message || "Internal server error" };
  const response = { success: false, message: errorInfo.message };
  if (process.env.NODE_ENV === "development") {
    response.error = err.message;
    response.stack = err.stack;
  }
  return res.status(errorInfo.status).json(response);
};
module.exports = errorHandler;
