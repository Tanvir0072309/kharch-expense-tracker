const express = require("express");

const dashboardController = require("../controllers/dashboard.controller");
const { validateDateRange } = require("../validators/analytics.validator");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/summary", validateDateRange, dashboardController.getSummary);

module.exports = router;
