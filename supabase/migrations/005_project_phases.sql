-- ============================================================
-- Casita Construcción — Migration 005
-- Fases de obra (project_phases)
-- Run in Supabase SQL Editor
-- ============================================================

-- ── TABLE: project_phases ───────────────────────────────────
create table if not exists public.project_phases (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  color       text not null default '#4f7bff',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.project_phases enable row level security;

create policy "Users can manage phases for their project"
  on public.project_phases for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create index if not exists project_phases_project_id_idx on public.project_phases(project_id);

-- ── Update schedule_tasks: add phase_id FK, make phase nullable ─
alter table public.schedule_tasks
  add column if not exists phase_id uuid references public.project_phases(id) on delete set null;

-- Make 'phase' text column nullable (phase_id is now the primary reference)
alter table public.schedule_tasks alter column phase drop not null;
alter table public.schedule_tasks alter column phase set default null;
