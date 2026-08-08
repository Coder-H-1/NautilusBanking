-- ============================================
-- NAUTILUS Banking System — Supabase Schema
-- Run this in Supabase SQL Editor to recreate tables
-- ============================================

-- Drop old tables if recreating
DROP TABLE IF EXISTS cpb_database CASCADE;
DROP TABLE IF EXISTS eb_database CASCADE;
DROP TABLE IF EXISTS sb_database CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS ip_blocks CASCADE;

-- ========================================
-- BANK USER TABLES (one per bank)
-- account_holder_name: lowercase, letters and spaces only
-- ========================================

CREATE TABLE IF NOT EXISTS cpb_database (
    bank_user_id BIGINT PRIMARY KEY,
    account_holder_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 100 CHECK (balance >= 0 AND balance <= 100000000),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on-hold')),
    deletion_requested_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eb_database (
    bank_user_id BIGINT PRIMARY KEY,
    account_holder_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 100 CHECK (balance >= 0 AND balance <= 100000000),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on-hold')),
    deletion_requested_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sb_database (
    bank_user_id BIGINT PRIMARY KEY,
    account_holder_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 100 CHECK (balance >= 0 AND balance <= 100000000),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on-hold')),
    deletion_requested_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- OTP VERIFICATION TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    bank_id TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_email_bank ON otp_codes(email, bank_id);

-- ========================================
-- IP BLOCKS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS ip_blocks (
    id SERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL,
    blocked_until TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_blocks_ip ON ip_blocks(ip_address);

-- ========================================
-- TRANSACTION LEDGER
-- ========================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_bank TEXT NOT NULL,
    sender_user_id BIGINT NOT NULL,
    receiver_bank TEXT NOT NULL,
    receiver_user_id BIGINT NOT NULL,
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
-- ========================================

CREATE OR REPLACE FUNCTION transfer_money(
    p_sender_bank TEXT,
    p_sender_user_id BIGINT,
    p_receiver_bank TEXT,
    p_receiver_user_id BIGINT,
    p_amount BIGINT
) RETURNS UUID AS $$
DECLARE
    v_txn_id UUID;
    v_sender_balance BIGINT;
    v_receiver_balance BIGINT;
    v_sender_status TEXT;
    v_receiver_status TEXT;
BEGIN
    -- Generate transaction ID
    v_txn_id := gen_random_uuid();

    -- Insert pending transaction record
    INSERT INTO transactions (id, sender_bank, sender_user_id,
        receiver_bank, receiver_user_id, amount, status)
    VALUES (v_txn_id, p_sender_bank, p_sender_user_id,
        p_receiver_bank, p_receiver_user_id, p_amount, 'pending');

    -- Check sender balance and status (dynamic table, lowercase)
    EXECUTE format(
        'SELECT balance, status FROM %I WHERE bank_user_id = $1 FOR UPDATE',
        lower(p_sender_bank) || '_database'
    ) INTO v_sender_balance, v_sender_status USING p_sender_user_id;

    IF v_sender_balance IS NULL THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Sender account not found'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    IF v_sender_status = 'on-hold' THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Sender account is on-hold'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    IF v_sender_balance < p_amount THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Insufficient balance'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    -- Check receiver exists, check status and lock row
    EXECUTE format(
        'SELECT balance, status FROM %I WHERE bank_user_id = $1 FOR UPDATE',
        lower(p_receiver_bank) || '_database'
    ) INTO v_receiver_balance, v_receiver_status USING p_receiver_user_id;

    IF v_receiver_balance IS NULL THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Receiver account not found'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    IF v_receiver_status = 'on-hold' THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Receiver account is on-hold'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    -- Check receiver max balance cap ($100,000,000)
    IF (v_receiver_balance + p_amount) > 100000000 THEN
        UPDATE transactions SET status = 'failed',
            failure_reason = 'Receiver account balance cannot exceed $100,000,000'
            WHERE id = v_txn_id;
        RETURN v_txn_id;
    END IF;

    -- DOUBLE LEDGER: Debit sender, Credit receiver
    EXECUTE format(
        'UPDATE %I SET balance = balance - $1, updated_at = NOW()
         WHERE bank_user_id = $2',
        lower(p_sender_bank) || '_database'
    ) USING p_amount, p_sender_user_id;

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
