const authService = require("../services/auth.service");

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(201).json({
      success: true,
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

    return res.status(200).json({
      success: true,
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

    return res.status(200).json({
      success: true,
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

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    const result = await authService.refreshToken(token);

    return res.status(200).json({
      success: true,
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

    return res.status(200).json({
      success: true,
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

    return res.status(200).json({
      success: true,
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

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword({
      email: req.body.email,
      otp: req.body.otp,
      password: req.body.password,
    });

    return res.status(200).json({
      success: true,
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
      type: req.body.type, // 'signup', 'login', 'reset'
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
        expiresIn: result.expiresIn,
      },
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
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendOtp,
};