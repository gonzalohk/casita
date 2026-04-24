-- ============================================================
-- Migration 006 — Link financial records to project phases
-- Run in Supabase SQL Editor
-- ============================================================

-- Add phase_id to expenses
alter table public.expenses
  add column if not exists phase_id uuid references public.project_phases(id) on delete set null;

-- Add phase_id to income_entries
alter table public.income_entries
  add column if not exists phase_id uuid references public.project_phases(id) on delete set null;

-- Add phase_id to materials
alter table public.materials
  add column if not exists phase_id uuid references public.project_phases(id) on delete set null;

-- Indexes for querying by phase
create index if not exists expenses_phase_id_idx        on public.expenses(phase_id);
create index if not exists income_entries_phase_id_idx  on public.income_entries(phase_id);
create index if not exists materials_phase_id_idx       on public.materials(phase_id);
