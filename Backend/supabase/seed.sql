-- ============================================
-- NAUTILUS Banking System — Seed Data
-- Run this in Supabase SQL Editor AFTER schema.sql
-- Creates test users in each bank with sample balances
-- ============================================

INSERT INTO cpb_database (account_holder_name, balance) VALUES
    ('Alice', 50000),
    ('Bob', 30000),
    ('Charlie', 10000);

INSERT INTO eb_database (account_holder_name, balance) VALUES
    ('Diana', 75000),
    ('Eve', 20000);

INSERT INTO sb_database (account_holder_name, balance) VALUES
    ('Frank', 100000),
    ('Grace', 45000);
