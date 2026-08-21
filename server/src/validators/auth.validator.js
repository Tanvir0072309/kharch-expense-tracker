const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

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
  }

  if (password && password.length > 128) {
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

const validateResetPassword = (req, res, next) => {
  const { email, otp, password } = req.body;

  const errors = {};

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    errors.otp = "OTP must be a 6-digit code";
  }

  if (typeof password !== "string" || password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (password && password.length > 128) {
    errors.password = "Password must not exceed 128 characters";
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

const validateResendOtp = (req, res, next) => {
  const { email, type } = req.body;

  const errors = {};

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (!type || !["signup", "login", "reset"].includes(type)) {
    errors.type = "Type must be one of: signup, login, reset";
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
  validateResendOtp,
};