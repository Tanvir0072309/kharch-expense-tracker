const pool = require("../config/database");

const RefreshToken = {
  async create({ userId, tokenHash, expiresAt }) {
    const query = `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        user_id,
        expires_at,
        revoked_at,
        created_at,
        last_used_at
    `;

    const values = [userId, tokenHash, expiresAt];

    const { rows } = await pool.query(query, values);

    return rows[0];
  },

  async findByTokenHash(tokenHash) {
    const query = `
      SELECT
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at,
        last_used_at
      FROM refresh_tokens
      WHERE token_hash = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [tokenHash]);

    return rows[0] ?? null;
  },

  async markAsUsed(id) {
    const query = `
      UPDATE refresh_tokens
      SET last_used_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        user_id,
        expires_at,
        revoked_at,
        last_used_at
    `;

    const { rows } = await pool.query(query, [id]);

    return rows[0] ?? null;
  },

  async revoke(id) {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        revoked_at
    `;

    const { rows } = await pool.query(query, [id]);

    return rows[0] ?? null;
  },

  async revokeAllForUser(userId) {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND revoked_at IS NULL
    `;

    const { rowCount } = await pool.query(query, [userId]);

    return rowCount;
  },
};

module.exports = RefreshToken;