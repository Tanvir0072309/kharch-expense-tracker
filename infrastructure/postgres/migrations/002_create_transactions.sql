CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,

    type VARCHAR(10) NOT NULL,

    description VARCHAR(500),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_transactions_amount
        CHECK (amount > 0),

    CONSTRAINT chk_transactions_type
        CHECK (type IN ('income', 'expense'))
);

CREATE INDEX idx_transactions_user_created_at
    ON transactions (user_id, created_at DESC);