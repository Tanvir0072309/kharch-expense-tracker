-- Refresh tokens table: matches src/models/RefreshToken.js.
-- Only the sha256 hash of the token is ever stored (see token.service.js),
-- never the raw value.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    CHAR(64) NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ NULL
);

-- rotateRefreshToken() / revokeRefreshToken() look up by hash on every call.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- logoutAll() / revokeAllForUser() scan all active tokens for a user.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active
  ON refresh_tokens (user_id)
  WHERE revoked_at IS NULL;
