const express = require("express");

const transactionController = require("../controllers/transaction.controller");
const {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateListTransactions,
} = require("../validators/transaction.validator");
const { validateIdParam } = require("../validators/common.validator");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Every /transactions route acts only on the authenticated caller's own
// data - enforced at the model layer (WHERE user_id = $authenticatedId).
router.use(authenticate);

router.post("/", validateCreateTransaction, transactionController.createTransaction);
router.get("/", validateListTransactions, transactionController.listTransactions);
router.get("/:id", validateIdParam(), transactionController.getTransaction);
router.patch(
  "/:id",
  validateIdParam(),
  validateUpdateTransaction,
  transactionController.updateTransaction,
);
router.delete("/:id", validateIdParam(), transactionController.deleteTransaction);

module.exports = router;
