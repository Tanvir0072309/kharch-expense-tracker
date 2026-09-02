-- Transactions table: matches src/models/Transaction.js.
CREATE TABLE IF NOT EXISTS transactions (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount            NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  -- Deleting a category never deletes its transactions - they just become
  -- uncategorized (see src/services/category.service.js).
  category_id       INTEGER NULL REFERENCES categories(id) ON DELETE SET NULL,
  description       TEXT NULL,
  transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Every query in Transaction.js filters by user_id first, then usually
-- orders/filters by transaction_date - composite index covers both.
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type
  ON transactions (user_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id
  ON transactions (category_id);
