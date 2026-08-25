const Transaction = require("../models/Transaction");

const RECENT_TRANSACTIONS_LIMIT = 5;

const getSummary = async (userId, { startDate, endDate } = {}) => {
  // All three queries are scoped to this user and run in parallel - each is
  // already a single optimized aggregation query rather than N+1 lookups.
  const [totals, categoryBreakdown, recentTransactions] = await Promise.all([
    Transaction.getSummaryTotals(userId, { startDate, endDate }),
    Transaction.getCategoryBreakdown(userId, { startDate, endDate }),
    Transaction.getRecentForUser(userId, RECENT_TRANSACTIONS_LIMIT),
  ]);

  const income = Number(totals.income);
  const expense = Number(totals.expense);

  return {
    income,
    expense,
    balance: income - expense,
    categories: categoryBreakdown.map((row) => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      income: Number(row.income),
      expense: Number(row.expense),
      transactionCount: Number(row.transaction_count),
    })),
    recentTransactions: recentTransactions.map((row) => ({
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      description: row.description,
      transactionDate: row.transaction_date,
      categoryId: row.category_id,
      categoryName: row.category_name,
    })),
  };
};

module.exports = {
  getSummary,
};
