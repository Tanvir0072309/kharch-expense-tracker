const express = require("express");

const categoryController = require("../controllers/category.controller");
const {
  validateCreateCategory,
  validateUpdateCategory,
} = require("../validators/category.validator");
const { validateIdParam } = require("../validators/common.validator");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", categoryController.listCategories);
router.post("/", validateCreateCategory, categoryController.createCategory);
router.patch(
  "/:id",
  validateIdParam(),
  validateUpdateCategory,
  categoryController.updateCategory,
);
router.delete("/:id", validateIdParam(), categoryController.deleteCategory);

module.exports = router;
