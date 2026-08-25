const isValidPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
};

// PATCH /users/me only allows `name` to be changed here - explicitly
// whitelisted so extra fields in the body (e.g. email, isEmailVerified) are
// silently dropped rather than accidentally trusted.
const validateUpdateProfile = (req, res, next) => {
  const { name } = req.body;

  const errors = {};

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    errors.name = "Name must be between 2 and 100 characters";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = { name: name.trim() };

  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const errors = {};

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    errors.currentPassword = "Current password is required";
  }

  if (!isValidPassword(newPassword)) {
    errors.newPassword = "New password must be between 8 and 128 characters";
  } else if (newPassword === currentPassword) {
    errors.newPassword =
      "New password must be different from the current password";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

module.exports = {
  validateUpdateProfile,
  validateChangePassword,
};
