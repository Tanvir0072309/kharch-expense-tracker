const pool = require("../config/database");

const Category = {
  // "Available to" a user = the global default categories (user_id IS NULL)
  // plus that user's own custom ones.
  async findAllForUser(userId) {
    const query = `
      SELECT
        id,
        user_id,
        name,
        is_default,
        created_at,
        updated_at
      FROM categories
      WHERE user_id = $1
         OR user_id IS NULL
      ORDER BY is_default DESC, name ASC
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
  },

  async findById(id) {
    const query = `
      SELECT
        id,
        user_id,
        name,
        is_default,
        created_at,
        updated_at
      FROM categories
      WHERE id = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id]);

    return rows[0] ?? null;
  },

  // Only matches categories actually owned by this user - default/global
  // categories and other users' categories both come back null here, which
  // callers treat as "not yours to modify".
  async findByIdForUser(id, userId) {
    const query = `
      SELECT
        id,
        user_id,
        name,
        is_default,
        created_at,
        updated_at
      FROM categories
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id, userId]);

    return rows[0] ?? null;
  },

  async findByNameForUser(name, userId) {
    const query = `
      SELECT id, user_id, name, is_default
      FROM categories
      WHERE LOWER(name) = LOWER($1)
        AND (user_id = $2 OR user_id IS NULL)
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [name, userId]);

    return rows[0] ?? null;
  },

  async create({ userId, name }) {
    const query = `
      INSERT INTO categories (
        user_id,
        name,
        is_default
      )
      VALUES ($1, $2, FALSE)
      RETURNING
        id,
        user_id,
        name,
        is_default,
        created_at,
        updated_at
    `;

    const { rows } = await pool.query(query, [userId, name]);

    return rows[0];
  },

  async update(id, userId, { name }) {
    const query = `
      UPDATE categories
      SET
        name = $1,
        updated_at = NOW()
      WHERE id = $2
        AND user_id = $3
      RETURNING
        id,
        user_id,
        name,
        is_default,
        created_at,
        updated_at
    `;

    const { rows } = await pool.query(query, [name, id, userId]);

    return rows[0] ?? null;
  },

  // Deleting a category never deletes the transactions that reference it -
  // the FK (category_id -> categories.id) is ON DELETE SET NULL, so those
  // transactions simply become uncategorized.
  async delete(id, userId) {
    const query = `
      DELETE FROM categories
      WHERE id = $1
        AND user_id = $2
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id, userId]);

    return rows[0] ?? null;
  },
};

module.exports = Category;
