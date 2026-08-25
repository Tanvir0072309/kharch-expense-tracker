const { isValidDateString } = require("./common.validator");

const TYPES = new Set(["income", "expense"]);
const SORTABLE_FIELDS = new Set(["transactionDate", "amount", "createdAt"]);
const SORT_ORDERS = new Set(["asc", "desc"]);

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const isPositiveAmount = (amount) => {
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0;
};

const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

const validateCreateTransaction = (req, res, next) => {
  const { type, amount, categoryId, description, transactionDate } =
    req.body;

  const errors = {};

  if (typeof type !== "string" || !TYPES.has(type)) {
    errors.type = "Type must be either 'income' or 'expense'";
  }

  if (!isPositiveAmount(amount)) {
    errors.amount = "Amount must be a positive number";
  }

  if (categoryId !== undefined && categoryId !== null) {
    if (!isPositiveInt(categoryId)) {
      errors.categoryId = "Category id must be a positive integer";
    }
  }

  if (description !== undefined && description !== null) {
    if (
      typeof description !== "string" ||
      description.length > MAX_DESCRIPTION_LENGTH
    ) {
      errors.description = `Description must be a string up to ${MAX_DESCRIPTION_LENGTH} characters`;
    }
  }

  if (transactionDate !== undefined && transactionDate !== null) {
    if (!isValidDateString(transactionDate)) {
      errors.transactionDate = "Transaction date must be in YYYY-MM-DD format";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = {
    type,
    amount,
    categoryId: categoryId ?? null,
    description:
      typeof description === "string" ? description.trim() : null,
    transactionDate: transactionDate ?? null,
  };

  next();
};

const validateUpdateTransaction = (req, res, next) => {
  const { amount, categoryId, description, transactionDate, type } =
    req.body;

  const errors = {};
  const updates = {};

  if (amount !== undefined) {
    if (!isPositiveAmount(amount)) {
      errors.amount = "Amount must be a positive number";
    } else {
      updates.amount = amount;
    }
  }

  if (type !== undefined) {
    if (typeof type !== "string" || !TYPES.has(type)) {
      errors.type = "Type must be either 'income' or 'expense'";
    } else {
      updates.type = type;
    }
  }

  if (categoryId !== undefined) {
    if (categoryId !== null && !isPositiveInt(categoryId)) {
      errors.categoryId = "Category id must be a positive integer";
    } else {
      updates.categoryId = categoryId;
    }
  }

  if (description !== undefined) {
    if (
      description !== null &&
      (typeof description !== "string" ||
        description.length > MAX_DESCRIPTION_LENGTH)
    ) {
      errors.description = `Description must be a string up to ${MAX_DESCRIPTION_LENGTH} characters`;
    } else {
      updates.description =
        typeof description === "string" ? description.trim() : description;
    }
  }

  if (transactionDate !== undefined) {
    if (!isValidDateString(transactionDate)) {
      errors.transactionDate = "Transaction date must be in YYYY-MM-DD format";
    } else {
      updates.transactionDate = transactionDate;
    }
  }

  if (Object.keys(updates).length === 0 && Object.keys(errors).length === 0) {
    errors.body = "At least one field must be provided";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = updates;

  next();
};

// Query params for GET /transactions. Anything malformed is coerced to a
// safe default rather than rejected outright, since this is a read/listing
// endpoint - a bad `page` value shouldn't 400, it should just behave like it
// wasn't sent.
const validateListTransactions = (req, res, next) => {
  const query = req.query;
  const errors = {};

  const page = Number.parseInt(query.page, 10);
  const limit = Number.parseInt(query.limit, 10);

  const filters = {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit:
      Number.isInteger(limit) && limit > 0
        ? Math.min(limit, MAX_LIMIT)
        : DEFAULT_LIMIT,
  };

  if (query.type !== undefined) {
    if (!TYPES.has(query.type)) {
      errors.type = "Type must be either 'income' or 'expense'";
    } else {
      filters.type = query.type;
    }
  }

  if (query.categoryId !== undefined) {
    const categoryId = Number(query.categoryId);

    if (!isPositiveInt(categoryId)) {
      errors.categoryId = "Category id must be a positive integer";
    } else {
      filters.categoryId = categoryId;
    }
  }

  if (query.startDate !== undefined) {
    if (!isValidDateString(query.startDate)) {
      errors.startDate = "Start date must be in YYYY-MM-DD format";
    } else {
      filters.startDate = query.startDate;
    }
  }

  if (query.endDate !== undefined) {
    if (!isValidDateString(query.endDate)) {
      errors.endDate = "End date must be in YYYY-MM-DD format";
    } else {
      filters.endDate = query.endDate;
    }
  }

  if (
    query.search !== undefined &&
    typeof query.search === "string" &&
    query.search.trim().length > 0
  ) {
    filters.search = query.search.trim().slice(0, 200);
  }

  if (query.sortBy !== undefined) {
    if (!SORTABLE_FIELDS.has(query.sortBy)) {
      errors.sortBy = "sortBy must be one of: transactionDate, amount, createdAt";
    } else {
      filters.sortBy = query.sortBy;
    }
  }

  if (query.sortOrder !== undefined) {
    const sortOrder = String(query.sortOrder).toLowerCase();

    if (!SORT_ORDERS.has(sortOrder)) {
      errors.sortOrder = "sortOrder must be either 'asc' or 'desc'";
    } else {
      filters.sortOrder = sortOrder;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.transactionFilters = filters;

  next();
};

module.exports = {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateListTransactions,
};
