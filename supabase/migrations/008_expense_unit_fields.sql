-- ============================================================
-- Migration 008: Add unit_price and quantity to expenses
-- Run in Supabase → SQL Editor
-- ============================================================

alter table public.expenses
  add column if not exists unit_price numeric(12,2) null,
  add column if not exists quantity   numeric(10,3) null;
