// models/RefreshToken.js

const revoke = async (id) => {
  const query = `
    UPDATE refresh_tokens 
    SET revoked_at = NOW() 
    WHERE id = $1 
    RETURNING id
  `;
  
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  // ... existing methods
  revoke,
};