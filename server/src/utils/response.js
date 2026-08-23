const sendSuccess = (
  res,
  { statusCode = 200, message = "Success", data = null } = {},
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (
  res,
  { statusCode = 400, message = "Something went wrong", errors = undefined } = {},
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
