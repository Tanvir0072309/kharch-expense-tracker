const express = require("express");

const userController = require("../controllers/user.controller");
const {
  validateUpdateProfile,
  validateChangePassword,
} = require("../validators/user.validator");
const { authenticate } = require("../middleware/auth.middleware");
const { rateLimitByIp } = require("../middleware/rate-limit.middleware");

const router = express.Router();

// All /users routes act on the authenticated caller's own account.
router.use(authenticate);

const changePasswordLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "change-password",
  message: "Too many password change attempts. Please try again later.",
});

router.get("/me", userController.getMe);
router.patch("/me", validateUpdateProfile, userController.updateMe);
router.post(
  "/me/change-password",
  changePasswordLimiter,
  validateChangePassword,
  userController.changePassword,
);

module.exports = router;
