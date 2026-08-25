const dashboardService = require("../services/dashboard.service");
const { sendSuccess } = require("../utils/response");

const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(
      req.user.id,
      req.dateRange,
    );

    return sendSuccess(res, {
      message: "Dashboard summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
};
