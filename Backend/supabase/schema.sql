-- ============================================
-- NAUTILUS Banking System — Supabase Schema
-- Run this in Supabase SQL Editor
-- All table names lowercase to avoid PostgreSQL case issues
-- ============================================


-- ========================================
-- BANK USER TABLES (one per bank)
-- ========================================

CREATE TABLE IF NOT EXISTS cpb_database (
    bank_user_id SERIAL PRIMARY KEY,
    account_holder_name TEXT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eb_database (
    bank_user_id SERIAL PRIMARY KEY,
    account_holder_name TEXT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sb_database (
    bank_user_id SERIAL PRIMARY KEY,
    account_holder_name TEXT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========================================
-- TRANSACTION LEDGER
-- ========================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_bank TEXT NOT NULL,
    sender_user_id INT NOT NULL,
    receiver_bank TEXT NOT NULL,
    receiver_user_id INT NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'success', 'failed')),
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_sender ON transactions(sender_bank, sender_user_id);
CREATE INDEX IF NOT EXISTS idx_txn_receiver ON transactions(receiver_bank, receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_txn_status ON transactions(status);


-- ========================================
-- ATOMIC TRANSFER FUNCTION (Double Ledger)
-- Pass bank IDs in lowercase: 'cpb', 'eb', 'sb'
-- This function runs as a single ACID transaction.
-- If anything fails, the whole thing rolls back.
-- ========================================

CREATE OR REPLACE FUNCTION transfer_money(
    p_sender_bank TEXT,
    p_sender_user_id INT,
    p_receiver_bank TEXT,
    p_receiver_user_id INT,
    p_amount BIGINT
) RETURNS UUID AS $$
DECLARE
    v_txn_id UUID;
    v_sender_balance BIGINT;
    v_receiver_exists INT;
BEGIN
    -- Generate transaction ID
    v_txn_id := gen_random_uuid();

    -- Insert pending transaction record
    INSERT INTO transactions (id, sender_bank, sender_user_id,
        receiver_bank, receiver_user_id, amount, status)
    VALUES (v_txn_id, p_sender_bank, p_sender_user_id,
        p_receiver_bank, p_receiver_user_id, p_amount, 'pending');

    -- Check sender balance (dynamic table, lowercase)
    -- FOR UPDATE locks the row to prevent race conditions
    EXECUTE format(
        'SELECT balance FROM %I WHERE bank_user_id = $1 FOR UPDATE',
        lower(p_sender_bank) || '_database'
    ) INTO v_sender_balance USING p_sender_user_id;

    IF v_sender_balance IS NULL THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Sender account not found'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    IF v_sender_balance < p_amount THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Insufficient balance'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    -- Check receiver exists
    EXECUTE format(
        'SELECT bank_user_id FROM %I WHERE bank_user_id = $1',
        lower(p_receiver_bank) || '_database'
    ) INTO v_receiver_exists USING p_receiver_user_id;

    IF v_receiver_exists IS NULL THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Receiver account not found'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    -- DOUBLE LEDGER: Debit sender, Credit receiver
    -- Both happen in same transaction — if one fails, both roll back

    -- Debit sender
    EXECUTE format(
        'UPDATE %I SET balance = balance - $1, updated_at = NOW()
         WHERE bank_user_id = $2',
        lower(p_sender_bank) || '_database'
    ) USING p_amount, p_sender_user_id;

    -- Credit receiver
    EXECUTE format(
        'UPDATE %I SET balance = balance + $1, updated_at = NOW()
         WHERE bank_user_id = $2',
        lower(p_receiver_bank) || '_database'
    ) USING p_amount, p_receiver_user_id;

    -- Mark success
    UPDATE transactions SET status = 'success' WHERE id = v_txn_id;

    RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql;
