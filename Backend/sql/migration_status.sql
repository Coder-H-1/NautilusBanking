-- ============================================
-- NAUTILUS Banking System — Migration: Account Status & Deletion
-- Run this in Supabase SQL Editor if columns or transfer_money function need to be updated.
-- ============================================

-- 1. Add status and deletion_requested_at columns
ALTER TABLE cpb_database ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE cpb_database ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE eb_database ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE eb_database ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE sb_database ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE sb_database ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Update transfer_money function to guard against on-hold accounts
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
