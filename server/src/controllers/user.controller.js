const userService = require("../services/user.service");
const { sendSuccess } = require("../utils/response");

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);

    return sendSuccess(res, {
      message: "Profile fetched successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, {
      name: req.body.name,
    });

    return sendSuccess(res, {
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await userService.changePassword(req.user.id, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return sendSuccess(res, {
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
};
