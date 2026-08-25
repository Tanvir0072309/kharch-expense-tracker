const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../utils/password");
const tokenService = require("./token.service");

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  isEmailVerified: user.is_email_verified,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

// `userId` always comes from the verified JWT (req.user.id), set by the
// `authenticate` middleware - never from anything client-supplied.
const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  return toPublicUser(user);
};

const updateProfile = async (userId, { name }) => {
  const user = await User.updateProfile(userId, { name });

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  return toPublicUser(user);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findByIdWithPasswordHash(userId);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const isCurrentPasswordValid = await verifyPassword(
    currentPassword,
    user.password_hash,
  );

  if (!isCurrentPasswordValid) {
    const error = new Error("Current password is incorrect");
    error.code = "INVALID_CURRENT_PASSWORD";
    throw error;
  }

  const newPasswordHash = await hashPassword(newPassword);

  await User.updatePassword(userId, newPasswordHash);

  // Changing the password is a security-sensitive event - sign the user out
  // of every other active session, same as the forgot-password flow does.
  await tokenService.revokeAllSessionsForUser(userId);

  return {
    message: "Password changed successfully. Please log in again.",
  };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
