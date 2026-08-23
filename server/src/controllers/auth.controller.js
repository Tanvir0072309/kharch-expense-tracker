const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/response");

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: result.message,
      data: {
        userId: result.userId,
        email: result.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifySignupOtp = async (req, res, next) => {
  try {
    const result = await authService.verifySignupOtp({
      email: req.body.email,
      otp: req.body.otp,
    });

    return sendSuccess(res, {
      message: "Email verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    return sendSuccess(res, {
      message: result.message,
      data: {
        userId: result.userId,
        email: result.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyLoginOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyLoginOtp({
      email: req.body.email,
      otp: req.body.otp,
    });

    return sendSuccess(res, {
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);

    return sendSuccess(res, {
      message: "Access token refreshed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await authService.logout({
      refreshToken: req.body.refreshToken,
    });

    return sendSuccess(res, {
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword({
      email: req.body.email,
    });

    return sendSuccess(res, {
      message: result.message,
      data: {
        email: result.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyResetOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyResetOtp({
      email: req.body.email,
      otp: req.body.otp,
    });

    return sendSuccess(res, {
      message: "OTP verified successfully",
      data: {
        resetToken: result.resetToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword({
      email: req.body.email,
      resetToken: req.body.resetToken,
      password: req.body.password,
    });

    return sendSuccess(res, {
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp({
      email: req.body.email,
      purpose: req.body.purpose,
    });

    return sendSuccess(res, {
      message: result.message,
      data: {
        email: result.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Protected: reads the authenticated user's own id off req.user, which was
// set by the `authenticate` middleware after verifying the JWT access token.
const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    return sendSuccess(res, {
      message: "Current user fetched successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Protected: signs the authenticated user out of every device by revoking
// all of their refresh tokens.
const logoutAll = async (req, res, next) => {
  try {
    const result = await authService.logoutAll(req.user.id);

    return sendSuccess(res, {
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendOtp,
  me,
};
