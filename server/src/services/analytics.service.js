const Transaction = require("../models/Transaction");

const getOverview = async (userId, { startDate, endDate } = {}) => {
  const totals = await Transaction.getSummaryTotals(userId, {
    startDate,
    endDate,
  });

  const income = Number(totals.income);
  const expense = Number(totals.expense);
  const incomeCount = Number(totals.income_count);
  const expenseCount = Number(totals.expense_count);
  const transactionCount = incomeCount + expenseCount;

  return {
    income,
    expense,
    balance: income - expense,
    transactionCount,
    averageIncome: incomeCount > 0 ? income / incomeCount : 0,
    averageExpense: expenseCount > 0 ? expense / expenseCount : 0,
    savingsRate: income > 0 ? Number((((income - expense) / income) * 100).toFixed(2)) : 0,
  };
};

const getCategoryAnalytics = async (userId, { startDate, endDate } = {}) => {
  const rows = await Transaction.getCategoryBreakdown(userId, {
    startDate,
    endDate,
  });

  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    income: Number(row.income),
    expense: Number(row.expense),
    transactionCount: Number(row.transaction_count),
  }));
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getMonthlyAnalytics = async (userId, year) => {
  const rows = await Transaction.getMonthlyForUser(userId, year);

  const months = rows.map((row) => ({
    month: MONTH_NAMES[row.month_number - 1],
    income: Number(row.income),
    expense: Number(row.expense),
  }));

  return { year, months };
};

module.exports = {
  getOverview,
  getCategoryAnalytics,
  getMonthlyAnalytics,
};
