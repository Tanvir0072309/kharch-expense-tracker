const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value) => {
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime());
};

// Validates the numeric `:id` route param used by /transactions/:id and
// /categories/:id. Rejects before the controller/service/DB ever runs.
const validateIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const raw = req.params[paramName];
    const id = Number(raw);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: {
          [paramName]: `A valid ${paramName} is required`,
        },
      });
    }

    req.params[paramName] = id;

    next();
  };
};

module.exports = {
  isValidDateString,
  validateIdParam,
};
