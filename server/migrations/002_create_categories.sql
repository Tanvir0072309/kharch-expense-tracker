-- Categories table: matches src/models/Category.js.
-- user_id IS NULL  -> global default category, visible to every user.
-- user_id = <id>   -> a custom category owned by that one user.
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);

-- Prevent duplicate names within the same scope (case-insensitive):
-- one global default named "Food", and one "Food" per individual user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_global_name
  ON categories (LOWER(name))
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user_name
  ON categories (user_id, LOWER(name))
  WHERE user_id IS NOT NULL;

-- Seed the global default categories every user sees automatically.
INSERT INTO categories (user_id, name, is_default)
VALUES
  (NULL, 'Food', TRUE),
  (NULL, 'Transport', TRUE),
  (NULL, 'Shopping', TRUE),
  (NULL, 'Bills & Utilities', TRUE),
  (NULL, 'Entertainment', TRUE),
  (NULL, 'Health', TRUE),
  (NULL, 'Salary', TRUE),
  (NULL, 'Other', TRUE)
ON CONFLICT DO NOTHING;
