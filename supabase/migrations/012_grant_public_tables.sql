-- ============================================================
-- Migration 012: Explicit grants for PostgREST / supabase-js
-- Required: Starting Oct 30, 2026, new tables in the public
-- schema won't be exposed to the Data API without explicit grants.
-- Run in Supabase → SQL Editor
-- ============================================================

grant usage on schema public to anon, authenticated;

grant all on public.projects             to authenticated;
grant all on public.income_entries       to authenticated;
grant all on public.expense_categories   to authenticated;
grant all on public.expenses             to authenticated;
grant all on public.materials            to authenticated;
grant all on public.material_purchases   to authenticated;
grant all on public.workers              to authenticated;
grant all on public.payroll_entries      to authenticated;
grant all on public.stock_movements      to authenticated;
grant all on public.suppliers            to authenticated;
grant all on public.schedule_tasks       to authenticated;
grant all on public.project_phases       to authenticated;
