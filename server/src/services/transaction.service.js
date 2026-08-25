const Transaction = require("../models/Transaction");
const Category = require("../models/Category");

const toPublicTransaction = (transaction) => ({
  id: transaction.id,
  type: transaction.type,
  amount: Number(transaction.amount),
  categoryId: transaction.category_id,
  description: transaction.description,
  transactionDate: transaction.transaction_date,
  createdAt: transaction.created_at,
  updatedAt: transaction.updated_at,
});

// If a categoryId is supplied, it must actually be a category this user can
// use (their own custom category, or a global default one) - never trust an
// arbitrary id from the client without checking it resolves to something.
const assertCategoryIsUsable = async (categoryId, userId) => {
  if (categoryId === null || categoryId === undefined) {
    return;
  }

  const category = await Category.findById(categoryId);

  if (!category || (category.user_id !== null && category.user_id !== userId)) {
    const error = new Error("Category not found");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }
};

const createTransaction = async (userId, input) => {
  await assertCategoryIsUsable(input.categoryId, userId);

  const transaction = await Transaction.create({
    userId,
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    description: input.description,
    transactionDate: input.transactionDate,
  });

  return toPublicTransaction(transaction);
};

const listTransactions = async (userId, filters) => {
  const { transactions, total } = await Transaction.findAllForUser(
    userId,
    filters,
  );

  const totalPages = total === 0 ? 0 : Math.ceil(total / filters.limit);

  return {
    transactions: transactions.map(toPublicTransaction),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages,
    },
  };
};

const getTransaction = async (id, userId) => {
  const transaction = await Transaction.findById(id, userId);

  if (!transaction) {
    const error = new Error("Transaction not found");
    error.code = "TRANSACTION_NOT_FOUND";
    throw error;
  }

  return toPublicTransaction(transaction);
};

const updateTransaction = async (id, userId, updates) => {
  if (updates.categoryId !== undefined) {
    await assertCategoryIsUsable(updates.categoryId, userId);
  }

  const transaction = await Transaction.update(id, userId, updates);

  if (!transaction) {
    const error = new Error("Transaction not found");
    error.code = "TRANSACTION_NOT_FOUND";
    throw error;
  }

  return toPublicTransaction(transaction);
};

const deleteTransaction = async (id, userId) => {
  const deleted = await Transaction.delete(id, userId);

  if (!deleted) {
    const error = new Error("Transaction not found");
    error.code = "TRANSACTION_NOT_FOUND";
    throw error;
  }

  return { message: "Transaction deleted successfully" };
};

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  toPublicTransaction,
};
