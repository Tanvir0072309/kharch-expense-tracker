const User = require("../models/User");
const {
  hashPassword,
  verifyPassword,
} = require("../utils/password");
const {
  generateAndStoreOtp,
  verifyOtp,
} = require("./otp.service");
const { sendOtpEmail } = require("./email.service");
const {
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken,
} = require("./token.service");

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

  const { otp, expiresIn } = await generateAndStoreOtp(email);

  try {
    await sendOtpEmail({
      to: email,
      otp,
      expiresInSeconds: expiresIn,
    });
  } catch (error) {
    // If email delivery fails, remove the newly-created user
    // so we don't leave behind an unusable unverified account.
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

  await verifyOtp(email, otp);

  const verifiedUser = await User.verifyEmail(user.id);

  // Issue tokens after successful verification
  const tokens = await issueTokens({
    userId: verifiedUser.id,
    email: verifiedUser.email,
  });

  return {
    user: verifiedUser,
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

  const passwordValid = await verifyPassword(
    password,
    user.password_hash,
  );

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

  const { otp, expiresIn } = await generateAndStoreOtp(email);

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

  if (!user.is_email_verified) {
    const error = new Error("Email is not verified");
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  await verifyOtp(email, otp);

  // Issue tokens after successful login verification
  const tokens = await issueTokens({
    userId: user.id,
    email: user.email,
  });

  return {
    userId: user.id,
    email: user.email,
    ...tokens,
  };
};

const refreshToken = async (refreshToken) => {
  const result = await rotateRefreshToken(refreshToken);
  return result;
};

const logout = async ({ refreshToken }) => {
  await revokeRefreshToken(refreshToken);
  return {
    message: "Logged out successfully",
  };
};

const forgotPassword = async ({ email }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  if (!user.is_email_verified) {
    const error = new Error("Email is not verified");
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  const { otp, expiresIn } = await generateAndStoreOtp(email);

  await sendOtpEmail({
    to: email,
    otp,
    expiresInSeconds: expiresIn,
  });

  return {
    email: user.email,
    message: "Password reset OTP sent to your email",
  };
};

const verifyResetOtp = async ({ email, otp }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  await verifyOtp(email, otp);

  return {
    message: "OTP verified successfully",
  };
};

const resetPassword = async ({ email, otp, password }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  await verifyOtp(email, otp);

  const passwordHash = await hashPassword(password);

  await User.updatePassword(user.id, passwordHash);

  // Revoke all refresh tokens for this user
  await User.revokeAllRefreshTokens(user.id);

  return {
    message: "Password reset successfully",
  };
};

const resendOtp = async ({ email, type }) => {
  const user = await User.findByEmail(email);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  // Validate based on type
  if (type === "signup" && user.is_email_verified) {
    const error = new Error("Email is already verified");
    error.code = "EMAIL_ALREADY_VERIFIED";
    throw error;
  }

  if (type === "login" && !user.is_email_verified) {
    const error = new Error("Email is not verified");
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  const { otp, expiresIn } = await generateAndStoreOtp(email);

  await sendOtpEmail({
    to: email,
    otp,
    expiresInSeconds: expiresIn,
  });

  return {
    email: user.email,
    expiresIn,
    message: `OTP resent successfully for ${type}`,
  };
};

module.exports = {
  signup,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  refreshToken,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendOtp,
};