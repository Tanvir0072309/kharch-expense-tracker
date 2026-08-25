const pool = require("../config/database");

const User = {
    async create({ name, email, passwordHash }) {
        const query = `
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        is_email_verified,
        created_at,
        updated_at
    `;

        const values = [name, email, passwordHash];

        const { rows } = await pool.query(query, values);

        return rows[0];
    },

    async findByEmail(email) {
        const query = `
      SELECT
        id,
        name,
        email,
        password_hash,
        is_email_verified,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `;

        const { rows } = await pool.query(query, [email]);

        return rows[0] ?? null;
    },
    async deleteById(id) {
        const query = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
  `;

        const { rows } = await pool.query(query, [id]);

        return rows[0] ?? null;
    },

    async findById(id) {
        const query = `
      SELECT
        id,
        name,
        email,
        is_email_verified,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

        const { rows } = await pool.query(query, [id]);

        return rows[0] ?? null;
    },

    async updateProfile(id, { name }) {
        const query = `
      UPDATE users
      SET
        name = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        email,
        is_email_verified,
        created_at,
        updated_at
    `;

        const { rows } = await pool.query(query, [id, name]);

        return rows[0] ?? null;
    },

    async findByIdWithPasswordHash(id) {
        const query = `
      SELECT
        id,
        name,
        email,
        password_hash,
        is_email_verified,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

        const { rows } = await pool.query(query, [id]);

        return rows[0] ?? null;
    },

    async verifyEmail(id) {
        const query = `
      UPDATE users
      SET
        is_email_verified = TRUE,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        email,
        is_email_verified,
        updated_at
    `;

        const { rows } = await pool.query(query, [id]);

        return rows[0] ?? null;
    },

    async updatePassword(id, passwordHash) {
        const query = `
      UPDATE users
      SET
        password_hash = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        email,
        updated_at
    `;

        const { rows } = await pool.query(query, [id, passwordHash]);

        return rows[0] ?? null;
    },
};

module.exports = User;