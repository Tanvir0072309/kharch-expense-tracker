const analyticsService = require("../services/analytics.service");
const { sendSuccess } = require("../utils/response");

const getOverview = async (req, res, next) => {
  try {
    const overview = await analyticsService.getOverview(
      req.user.id,
      req.dateRange,
    );

    return sendSuccess(res, {
      message: "Analytics overview fetched successfully",
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryAnalytics = async (req, res, next) => {
  try {
    const categories = await analyticsService.getCategoryAnalytics(
      req.user.id,
      req.dateRange,
    );

    return sendSuccess(res, {
      message: "Category analytics fetched successfully",
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const result = await analyticsService.getMonthlyAnalytics(
      req.user.id,
      req.analyticsYear,
    );

    return sendSuccess(res, {
      message: "Monthly analytics fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getCategoryAnalytics,
  getMonthlyAnalytics,
};
