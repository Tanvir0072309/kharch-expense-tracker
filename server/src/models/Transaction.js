const pool = require("../config/database");

const Transaction = {
  async create({ userId, amount, type, description = null }) {
    const query = `
      INSERT INTO transactions (
        user_id,
        amount,
        type,
        description
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id,
        amount,
        type,
        description,
        created_at,
        updated_at
    `;

    const values = [userId, amount, type, description];

    const { rows } = await pool.query(query, values);

    return rows[0];
  },

  async findById(id, userId) {
    const query = `
      SELECT
        id,
        user_id,
        amount,
        type,
        description,
        created_at,
        updated_at
      FROM transactions
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id, userId]);

    return rows[0] ?? null;
  },

  async findByUserId(userId, limit = 50) {
    const query = `
      SELECT
        id,
        user_id,
        amount,
        type,
        description,
        created_at,
        updated_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [userId, limit]);

    return rows;
  },

  async update(id, userId, { amount, type, description }) {
    const query = `
      UPDATE transactions
      SET
        amount = $1,
        type = $2,
        description = $3,
        updated_at = NOW()
      WHERE id = $4
        AND user_id = $5
      RETURNING
        id,
        user_id,
        amount,
        type,
        description,
        created_at,
        updated_at
    `;

    const values = [amount, type, description ?? null, id, userId];

    const { rows } = await pool.query(query, values);

    return rows[0] ?? null;
  },

  async delete(id, userId) {
    const query = `
      DELETE FROM transactions
      WHERE id = $1
        AND user_id = $2
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id, userId]);

    return rows[0] ?? null;
  },
};

module.exports = Transaction;