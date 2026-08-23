const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password) => {
  return typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128;
};

const RESEND_OTP_PURPOSES = new Set(["signup", "login", "password_reset"]);

const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;

  const errors = {};

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    errors.name = "Name must be between 2 and 100 characters";
  }

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (typeof password !== "string" || password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (password.length > 128) {
    errors.password = "Password must not exceed 128 characters";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "A valid email address is required",
      errors: {
        email: "Invalid email address",
      },
    });
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

const validateVerifyOtp = (req, res, next) => {
  const { email, otp } = req.body;

  const errors = {};

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    errors.otp = "OTP must be a 6-digit code";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();
  req.body.otp = otp;

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = {};

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (typeof password !== "string" || password.length === 0) {
    errors.password = "Password is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

// Used for POST /reset-password: the OTP has already been exchanged for a
// short-lived reset token (see /verify-reset-otp), so this step only needs
// the token + the new password, not the OTP itself.
const validateResetPassword = (req, res, next) => {
  const { email, resetToken, password } = req.body;

  const errors = {};

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (typeof resetToken !== "string" || resetToken.trim().length === 0) {
    errors.resetToken = "A valid reset token is required";
  }

  if (!isValidPassword(password)) {
    errors.password = "Password must be between 8 and 128 characters";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();
  req.body.resetToken = resetToken.trim();

  next();
};

const validateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (typeof refreshToken !== "string" || refreshToken.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "A refresh token is required",
      errors: {
        refreshToken: "Refresh token is required",
      },
    });
  }

  req.body.refreshToken = refreshToken.trim();

  next();
};

const validateResendOtp = (req, res, next) => {
  const { email, purpose } = req.body;

  const errors = {};

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (typeof purpose !== "string" || !RESEND_OTP_PURPOSES.has(purpose)) {
    errors.purpose =
      "Purpose must be one of: signup, login, password_reset";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

module.exports = {
  validateSignup,
  validateEmail,
  validateVerifyOtp,
  validateLogin,
  validateResetPassword,
  validateRefreshToken,
  validateResendOtp,
};
