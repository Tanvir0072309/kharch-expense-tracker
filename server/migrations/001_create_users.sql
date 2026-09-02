-- Users table: matches src/models/User.js exactly.
CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  email              VARCHAR(255) NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,
  is_email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User.findByEmail() runs on every login/signup/OTP call, so this needs an index.
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
