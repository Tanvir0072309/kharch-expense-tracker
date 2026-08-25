const Category = require("../models/Category");

const toPublicCategory = (category) => ({
  id: category.id,
  name: category.name,
  isDefault: category.is_default,
  isOwn: category.user_id !== null,
  createdAt: category.created_at,
  updatedAt: category.updated_at,
});

const listCategories = async (userId) => {
  const categories = await Category.findAllForUser(userId);

  return categories.map(toPublicCategory);
};

const createCategory = async (userId, { name }) => {
  const existing = await Category.findByNameForUser(name, userId);

  if (existing) {
    const error = new Error("A category with this name already exists");
    error.code = "CATEGORY_ALREADY_EXISTS";
    throw error;
  }

  const category = await Category.create({ userId, name });

  return toPublicCategory(category);
};

const updateCategory = async (id, userId, { name }) => {
  // findByIdForUser only matches categories this user actually owns -
  // default/global categories and other users' categories can't be edited.
  const owned = await Category.findByIdForUser(id, userId);

  if (!owned) {
    const error = new Error("Category not found");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  const existing = await Category.findByNameForUser(name, userId);

  if (existing && existing.id !== id) {
    const error = new Error("A category with this name already exists");
    error.code = "CATEGORY_ALREADY_EXISTS";
    throw error;
  }

  const category = await Category.update(id, userId, { name });

  return toPublicCategory(category);
};

const deleteCategory = async (id, userId) => {
  const owned = await Category.findByIdForUser(id, userId);

  if (!owned) {
    const error = new Error("Category not found");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  // The FK on transactions.category_id is ON DELETE SET NULL, so any
  // transactions using this category become uncategorized automatically -
  // they are never deleted.
  await Category.delete(id, userId);

  return { message: "Category deleted successfully" };
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
