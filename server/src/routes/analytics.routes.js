const express = require("express");

const analyticsController = require("../controllers/analytics.controller");
const {
  validateDateRange,
  validateMonthlyQuery,
} = require("../validators/analytics.validator");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/overview", validateDateRange, analyticsController.getOverview);
router.get(
  "/categories",
  validateDateRange,
  analyticsController.getCategoryAnalytics,
);
router.get(
  "/monthly",
  validateMonthlyQuery,
  analyticsController.getMonthlyAnalytics,
);

module.exports = router;
