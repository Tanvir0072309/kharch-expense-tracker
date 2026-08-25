-- Adds category support and a proper transaction_date to the expense/income
-- tracking core (transactions were previously just amount/type/description).

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A user can't have two categories with the same name (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_unique
  ON categories (user_id, LOWER(name))
  WHERE user_id IS NOT NULL;

-- Default/global categories (user_id IS NULL) must also be unique by name.
CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_unique
  ON categories (LOWER(name))
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);

-- Extend transactions with category + an explicit transaction date (separate
-- from created_at, since a user may log an expense after the fact).
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transaction_date DATE NOT NULL DEFAULT CURRENT_DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_amount_positive'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_type_check'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense'));
  END IF;
END $$;

-- Query patterns this needs to be fast for: "my transactions, newest first,
-- optionally filtered by type/category/date range" (listing + dashboard +
-- analytics all shape their WHERE/ORDER BY this way).
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type
  ON transactions (user_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id
  ON transactions (category_id);

-- A handful of sensible default categories every user starts with. Scoped
-- as global (user_id IS NULL) rather than duplicated per-user.
INSERT INTO categories (name, is_default, user_id)
VALUES
  ('Food', TRUE, NULL),
  ('Transport', TRUE, NULL),
  ('Shopping', TRUE, NULL),
  ('Bills & Utilities', TRUE, NULL),
  ('Entertainment', TRUE, NULL),
  ('Health', TRUE, NULL),
  ('Salary', TRUE, NULL),
  ('Other', TRUE, NULL)
ON CONFLICT DO NOTHING;
