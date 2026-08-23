const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../utils/password");
const {
  generateAndStoreOtp,
  verifyOtp,
  generateAndStoreResetToken,
  verifyAndConsumeResetToken,
} = require("./otp.service");
const { sendOtpEmail, sendPasswordChangedEmail } = require("./email.service");
const tokenService = require("./token.service");

const signup = async ({ name, email, password }) => {
  const existingUser = await User.findByEmail(email);

  if (existingUser) {
    const error = new Error("User already exists");
    error.code = "USER_ALREADY_EXISTS";
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const { otp, expiresIn } = await generateAndStoreOtp(email, "signup");

  try {
    await sendOtpEmail({
      to: email,
      otp,
      expiresInSeconds: expiresIn,
    });
  } catch (error) {
    // If email delivery fails, remove the newly-created user so we don't
    // leave behind an unverifiable, unusable account.
    await User.deleteById(user.id);
    throw error;
  }

  return {
    userId: user.id,
    email: user.email,
    message: "Verification code sent to your email",
  };
};

const verifySignupOtp = async ({ email, otp }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("Invalid verification request");
    error.code = "INVALID_VERIFICATION";
    throw error;
  }

  if (user.is_email_verified) {
    const error = new Error("Email is already verified");
    error.code = "EMAIL_ALREADY_VERIFIED";
    throw error;
  }

  await verifyOtp(email, otp, "signup");

  const verifiedUser = await User.verifyEmail(user.id);

  // Signup + OTP verification already proves both "knows the password" and
  // "owns the email", which is the same bar /login + /verify-login-otp
  // clears - so issue tokens here too instead of forcing a second login.
  const tokens = await tokenService.issueTokens({
    userId: verifiedUser.id,
    email: verifiedUser.email,
  });

  return {
    user: {
      id: verifiedUser.id,
      name: verifiedUser.name,
      email: verifiedUser.email,
      isEmailVerified: verifiedUser.is_email_verified,
    },
    ...tokens,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const passwordValid = await verifyPassword(password, user.password_hash);

  if (!passwordValid) {
    const error = new Error("Invalid email or password");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  if (!user.is_email_verified) {
    const error = new Error("Email verification required");
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  const { otp, expiresIn } = await generateAndStoreOtp(email, "login");

  await sendOtpEmail({
    to: email,
    otp,
    expiresInSeconds: expiresIn,
  });

  return {
    userId: user.id,
    email: user.email,
    message: "Verification code sent to your email",
  };
};

const verifyLoginOtp = async ({ email, otp }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("Invalid verification request");
    error.code = "INVALID_VERIFICATION";
    throw error;
  }

  await verifyOtp(email, otp, "login");

  const tokens = await tokenService.issueTokens({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.is_email_verified,
    },
    ...tokens,
  };
};

const refreshToken = async (token) => {
  if (typeof token !== "string" || token.trim().length === 0) {
    const error = new Error("Refresh token is required");
    error.code = "MISSING_REFRESH_TOKEN";
    throw error;
  }

  return tokenService.rotateRefreshToken(token);
};

const logout = async ({ refreshToken: token }) => {
  if (typeof token !== "string" || token.trim().length === 0) {
    const error = new Error("Refresh token is required");
    error.code = "MISSING_REFRESH_TOKEN";
    throw error;
  }

  await tokenService.revokeRefreshToken(token);

  // Intentionally not distinguishing "token not found" from "revoked
  // successfully" in the response - logging out an already-invalid token
  // should still look like a clean logout to the caller.
  return {
    message: "Logged out successfully",
  };
};

// Deliberately returns the same generic message whether or not the email is
// registered, so this endpoint can't be used to enumerate valid accounts.
// The OTP is only ever actually generated and emailed when a matching,
// verified user exists.
const forgotPassword = async ({ email }) => {
  const genericResult = {
    email,
    message:
      "If an account with that email exists, a verification code has been sent",
  };

  const user = await User.findByEmail(email);

  if (!user || !user.is_email_verified) {
    return genericResult;
  }

  const { otp, expiresIn } = await generateAndStoreOtp(
    email,
    "password_reset",
  );

  await sendOtpEmail({
    to: email,
    otp,
    expiresInSeconds: expiresIn,
  });

  return genericResult;
};

// Step 2 of password reset: exchanges a valid "password_reset" OTP for a
// short-lived, single-use reset token. Keeping this as its own step (rather
// than folding the OTP straight into /reset-password) means the OTP is
// consumed exactly once and the token used to authorize the actual password
// change is unrelated to the 6-digit code that was emailed.
const verifyResetOtp = async ({ email, otp }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    // Same error shape/code as a wrong OTP - don't leak account existence.
    const error = new Error("Invalid OTP");
    error.code = "INVALID_OTP";
    throw error;
  }

  await verifyOtp(email, otp, "password_reset");

  const { resetToken, expiresIn } = await generateAndStoreResetToken(email);

  return {
    resetToken,
    expiresIn,
  };
};

const resetPassword = async ({ email, resetToken, password }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("Invalid or expired reset token");
    error.code = "INVALID_RESET_TOKEN";
    throw error;
  }

  await verifyAndConsumeResetToken(email, resetToken);

  const passwordHash = await hashPassword(password);

  await User.updatePassword(user.id, passwordHash);

  // A password reset is a strong signal the account may have been
  // compromised (or the owner simply wants a clean slate) - revoke every
  // existing refresh token so all other logged-in devices are signed out.
  await tokenService.revokeAllSessionsForUser(user.id);

  try {
    await sendPasswordChangedEmail({ to: user.email });
  } catch (error) {
    // Don't fail the whole request just because the confirmation email
    // couldn't be sent - the password change itself already succeeded.
    console.error("Failed to send password-changed email:", error);
  }

  return {
    message: "Password has been reset successfully",
  };
};

const resendOtp = async ({ email, purpose }) => {
  if (purpose === "signup") {
    const user = await User.findByEmail(email);

    if (!user) {
      const error = new Error("Invalid request");
      error.code = "INVALID_VERIFICATION";
      throw error;
    }

    if (user.is_email_verified) {
      const error = new Error("Email is already verified");
      error.code = "EMAIL_ALREADY_VERIFIED";
      throw error;
    }

    const { otp, expiresIn } = await generateAndStoreOtp(email, "signup");

    await sendOtpEmail({ to: email, otp, expiresInSeconds: expiresIn });

    return { email, message: "Verification code resent" };
  }

  if (purpose === "login") {
    const user = await User.findByEmail(email);

    if (!user || !user.is_email_verified) {
      const error = new Error("Invalid request");
      error.code = "INVALID_VERIFICATION";
      throw error;
    }

    const { otp, expiresIn } = await generateAndStoreOtp(email, "login");

    await sendOtpEmail({ to: email, otp, expiresInSeconds: expiresIn });

    return { email, message: "Verification code resent" };
  }

  // password_reset: stay silent about whether the account exists, same as
  // forgotPassword above.
  const user = await User.findByEmail(email);

  if (user && user.is_email_verified) {
    const { otp, expiresIn } = await generateAndStoreOtp(
      email,
      "password_reset",
    );

    await sendOtpEmail({ to: email, otp, expiresInSeconds: expiresIn });
  }

  return {
    email,
    message:
      "If an account with that email exists, a verification code has been sent",
  };
};

// Used by GET /me - a protected route. `userId` comes from a verified JWT
// access token (see middleware/auth.middleware.js), never from the request
// body, so there's no way for a caller to ask for anyone's data but their own.
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    // The access token was valid (correct signature, not expired), but the
    // account it points to no longer exists - treat it the same as an
    // invalid token rather than leaking internal state.
    const error = new Error("User not found");
    error.code = "INVALID_ACCESS_TOKEN";
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at,
  };
};

// Used by POST /logout-all - also protected. Revokes every refresh token
// for the authenticated user, signing out all of their devices/sessions at
// once (the access token already in a client's memory will simply expire
// naturally within its short 15m lifetime).
const logoutAll = async (userId) => {
  await tokenService.revokeAllSessionsForUser(userId);

  return {
    message: "Logged out from all devices successfully",
  };
};

module.exports = {
  signup,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendOtp,
  getCurrentUser,
};
