const express = require("express");

const authController = require("../controllers/auth.controller");
const {
  validateSignup,
  validateVerifyOtp,
  validateLogin,
  validateEmail,
  validateResetPassword,
  validateRefreshToken,
  validateResendOtp,
} = require("../validators/auth.validator");
const { rateLimitByIp, rateLimitByEmail } = require("../middleware/rate-limit.middleware");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// --- Rate limiters -----------------------------------------------------
// Sliding-window limits, kept fairly generous so real users never notice
// them, but tight enough to blunt automated credential-stuffing / OTP
// brute-force / email-bombing attempts. IP-based and email-based limits are
// combined on the sensitive endpoints so an attacker can't dodge one by
// spreading requests across many IPs, or the other by spreading across many
// throwaway emails from one IP.

const signupLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "signup",
  message: "Too many signup attempts. Please try again later.",
});

const loginIpLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "login-ip",
  message: "Too many login attempts. Please try again later.",
});

const loginEmailLimiter = rateLimitByEmail({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: "login-email",
  message: "Too many login attempts for this account. Please try again later.",
});

const otpVerifyIpLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "otp-verify-ip",
  message: "Too many attempts. Please try again later.",
});

const otpVerifyEmailLimiter = rateLimitByEmail({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "otp-verify-email",
  message: "Too many attempts for this account. Please try again later.",
});

const forgotPasswordLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "forgot-password",
  message: "Too many password reset requests. Please try again later.",
});

const resendOtpLimiter = rateLimitByIp({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyPrefix: "resend-otp",
  message: "Too many resend requests. Please try again later.",
});

const refreshLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyPrefix: "refresh",
  message: "Too many token refresh requests. Please try again later.",
});

// --- Routes --------------------------------------------------------------

// Signup
router.post("/signup", signupLimiter, validateSignup, authController.signup);

// Verify signup OTP
router.post(
  "/verify-signup-otp",
  otpVerifyIpLimiter,
  otpVerifyEmailLimiter,
  validateVerifyOtp,
  authController.verifySignupOtp,
);

// Login - Step 1 (password check -> OTP sent)
router.post(
  "/login",
  loginIpLimiter,
  loginEmailLimiter,
  validateLogin,
  authController.login,
);

// Login - Step 2 (OTP verification -> tokens issued)
router.post(
  "/verify-login-otp",
  otpVerifyIpLimiter,
  otpVerifyEmailLimiter,
  validateVerifyOtp,
  authController.verifyLoginOtp,
);

// Refresh access token
router.post(
  "/refresh",
  refreshLimiter,
  validateRefreshToken,
  authController.refreshToken,
);

// Logout (revokes the given refresh token)
router.post(
  "/logout",
  validateRefreshToken,
  authController.logout,
);

// Forgot password - Step 1 (request OTP)
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateEmail,
  authController.forgotPassword,
);

// Forgot password - Step 2 (verify OTP -> get short-lived reset token)
router.post(
  "/verify-reset-otp",
  otpVerifyIpLimiter,
  otpVerifyEmailLimiter,
  validateVerifyOtp,
  authController.verifyResetOtp,
);

// Forgot password - Step 3 (reset token + new password -> password changed)
router.post(
  "/reset-password",
  forgotPasswordLimiter,
  validateResetPassword,
  authController.resetPassword,
);

// Resend OTP for signup / login / password_reset flows
router.post(
  "/resend-otp",
  resendOtpLimiter,
  validateResendOtp,
  authController.resendOtp,
);

// --- Protected routes (require a valid JWT access token) -----------------
// These demonstrate the actual "secure route" pattern: the `authenticate`
// middleware verifies the Authorization: Bearer <accessToken> JWT before the
// controller ever runs, and attaches the decoded { id, email } to req.user.
// A missing/invalid/expired token is rejected with 401 before any DB work.

// Get the logged-in user's own profile.
router.get("/me", authenticate, authController.me);

// Sign out of every device (revokes all refresh tokens for this user).
router.post("/logout-all", authenticate, authController.logoutAll);

module.exports = router;
