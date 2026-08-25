const { isValidDateString } = require("./common.validator");

// Shared by /dashboard/summary, /analytics/overview and /analytics/categories
// - all three accept the same optional startDate/endDate query params.
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  const errors = {};
  const range = {};

  if (startDate !== undefined) {
    if (!isValidDateString(startDate)) {
      errors.startDate = "Start date must be in YYYY-MM-DD format";
    } else {
      range.startDate = startDate;
    }
  }

  if (endDate !== undefined) {
    if (!isValidDateString(endDate)) {
      errors.endDate = "End date must be in YYYY-MM-DD format";
    } else {
      range.endDate = endDate;
    }
  }

  if (
    range.startDate &&
    range.endDate &&
    range.startDate > range.endDate
  ) {
    errors.endDate = "End date must be on or after start date";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.dateRange = range;

  next();
};

const CURRENT_YEAR = new Date().getFullYear();

const validateMonthlyQuery = (req, res, next) => {
  const yearParam = req.query.year;
  const year = yearParam !== undefined ? Number.parseInt(yearParam, 10) : CURRENT_YEAR;

  if (!Number.isInteger(year) || year < 2000 || year > CURRENT_YEAR + 1) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: {
        year: "Year must be a valid 4-digit year",
      },
    });
  }

  req.analyticsYear = year;

  next();
};

module.exports = {
  validateDateRange,
  validateMonthlyQuery,
};
