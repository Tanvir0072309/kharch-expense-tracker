const categoryService = require("../services/category.service");
const { sendSuccess } = require("../utils/response");

const listCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.listCategories(req.user.id);

    return sendSuccess(res, {
      message: "Categories fetched successfully",
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.user.id, {
      name: req.body.name,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.user.id,
      { name: req.body.name },
    );

    return sendSuccess(res, {
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(
      req.params.id,
      req.user.id,
    );

    return sendSuccess(res, {
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
