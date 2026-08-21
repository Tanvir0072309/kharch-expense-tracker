const express = require("express");

const authController = require("../controllers/auth.controller");
const {
  validateSignup,
  validateVerifyOtp,
  validateLogin,
  validateEmail,
  validateResetPassword,
  validateResendOtp,
} = require("../validators/auth.validator");

const router = express.Router();

// Signup
router.post(
  "/signup",
  validateSignup,
  authController.signup,
);

// Verify signup OTP
router.post(
  "/verify-signup-otp",
  validateVerifyOtp,
  authController.verifySignupOtp,
);

// Login - Step 1
router.post(
  "/login",
  validateLogin,
  authController.login,
);

// Verify login OTP - Step 2
router.post(
  "/verify-login-otp",
  validateVerifyOtp,
  authController.verifyLoginOtp,
);

// Refresh access token
router.post(
  "/refresh",
  authController.refreshToken,
);

// Logout
router.post(
  "/logout",
  authController.logout,
);

// Forgot password
router.post(
  "/forgot-password",
  validateEmail,
  authController.forgotPassword,
);

// Verify reset password OTP
router.post(
  "/verify-reset-otp",
  validateVerifyOtp,
  authController.verifyResetOtp,
);

// Reset password
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword,
);

// Resend OTP
router.post(
  "/resend-otp",
  validateResendOtp,
  authController.resendOtp,
);

module.exports = router;