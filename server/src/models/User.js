// models/User.js - Add these methods

const updatePassword = async (userId, passwordHash) => {
  const query = `
    UPDATE users 
    SET password_hash = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING id
  `;
  
  const result = await pool.query(query, [passwordHash, userId]);
  return result.rows[0];
};

const revokeAllRefreshTokens = async (userId) => {
  const query = `
    UPDATE refresh_tokens 
    SET revoked_at = NOW() 
    WHERE user_id = $1 AND revoked_at IS NULL
  `;
  
  await pool.query(query, [userId]);
};

module.exports = {
  // ... existing methods
  updatePassword,
  revokeAllRefreshTokens,
};