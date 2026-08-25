const MAX_NAME_LENGTH = 50;

const isValidName = (name) => {
  return (
    typeof name === "string" &&
    name.trim().length >= 1 &&
    name.trim().length <= MAX_NAME_LENGTH
  );
};

const validateCreateCategory = (req, res, next) => {
  const { name } = req.body;

  if (!isValidName(name)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: {
        name: `Name must be between 1 and ${MAX_NAME_LENGTH} characters`,
      },
    });
  }

  req.body = { name: name.trim() };

  next();
};

// Update uses the same shape as create - a category only ever has a name.
const validateUpdateCategory = validateCreateCategory;

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
};
