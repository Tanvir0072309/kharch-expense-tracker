const { verifyAccessToken } = require("../services/token.service");

// Verifies the `Authorization: Bearer <accessToken>` header and attaches the
// decoded claims to `req.user`. Not wired into any of the /auth routes
// (they're all pre-login by definition) but kept ready for protected
// routes such as /transactions.
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    const error = new Error("Access token is required");
    error.code = "MISSING_ACCESS_TOKEN";
    return next(error);
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      const error = new Error("Invalid access token");
      error.code = "INVALID_ACCESS_TOKEN";
      return next(error);
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    return next();
  } catch (error) {
    // Let the central error handler translate jwt's own error classes
    // (TokenExpiredError / JsonWebTokenError) into a clean response.
    return next(error);
  }
};

module.exports = {
  authenticate,
};
