-- ============================================================
-- Migration 010: Open RLS — any authenticated user can access
-- all projects and their related data.
-- Run in Supabase → SQL Editor
-- ============================================================

-- ── projects ─────────────────────────────────────────────────
drop policy if exists "Users can manage their own project" on public.projects;

create policy "Authenticated users can manage all projects"
  on public.projects for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── income_entries ───────────────────────────────────────────
drop policy if exists "Users can manage income for their project" on public.income_entries;

create policy "Authenticated users can manage all income"
  on public.income_entries for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── expense_categories ───────────────────────────────────────
drop policy if exists "Users can manage categories for their project" on public.expense_categories;

create policy "Authenticated users can manage all categories"
  on public.expense_categories for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── expenses ─────────────────────────────────────────────────
drop policy if exists "Users can manage expenses for their project" on public.expenses;

create policy "Authenticated users can manage all expenses"
  on public.expenses for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── materials ────────────────────────────────────────────────
drop policy if exists "Users can manage materials for their project" on public.materials;

create policy "Authenticated users can manage all materials"
  on public.materials for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── material_purchases ───────────────────────────────────────
drop policy if exists "Users can manage material purchases for their project" on public.material_purchases;

create policy "Authenticated users can manage all material purchases"
  on public.material_purchases for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── workers ──────────────────────────────────────────────────
drop policy if exists "Users can manage workers for their project" on public.workers;

create policy "Authenticated users can manage all workers"
  on public.workers for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── payroll_entries ──────────────────────────────────────────
drop policy if exists "Users can manage payroll for their project" on public.payroll_entries;

create policy "Authenticated users can manage all payroll"
  on public.payroll_entries for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── stock_movements ───────────────────────────────────────────
drop policy if exists "Users can manage stock movements for their project" on public.stock_movements;

create policy "Authenticated users can manage all stock movements"
  on public.stock_movements for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── suppliers ─────────────────────────────────────────────────
drop policy if exists "Users can manage suppliers for their project" on public.suppliers;

create policy "Authenticated users can manage all suppliers"
  on public.suppliers for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── schedule ──────────────────────────────────────────────────
drop policy if exists "Users can manage schedule for their project" on public.schedule_tasks;

create policy "Authenticated users can manage all schedule"
  on public.schedule_tasks for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── phases ────────────────────────────────────────────────────
drop policy if exists "Users can manage phases for their project" on public.project_phases;

create policy "Authenticated users can manage all phases"
  on public.project_phases for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
