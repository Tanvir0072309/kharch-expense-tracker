const transactionService = require("../services/transaction.service");
const { sendSuccess } = require("../utils/response");

const createTransaction = async (req, res, next) => {
  try {
    // user_id always comes from the authenticated JWT (req.user.id), never
    // from the request body.
    const transaction = await transactionService.createTransaction(
      req.user.id,
      req.body,
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: "Transaction created successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

const listTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.listTransactions(
      req.user.id,
      req.transactionFilters,
    );

    return sendSuccess(res, {
      message: "Transactions fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransaction(
      req.params.id,
      req.user.id,
    );

    return sendSuccess(res, {
      message: "Transaction fetched successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(
      req.params.id,
      req.user.id,
      req.body,
    );

    return sendSuccess(res, {
      message: "Transaction updated successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.deleteTransaction(
      req.params.id,
      req.user.id,
    );

    return sendSuccess(res, {
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
};
