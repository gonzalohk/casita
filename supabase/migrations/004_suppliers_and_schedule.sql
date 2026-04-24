-- ============================================================
-- Casita Construcción — Migration 004
-- Proveedores + Cronograma de obra
-- Run in Supabase SQL Editor
-- ============================================================

-- ── TABLE: suppliers ────────────────────────────────────────
create table if not exists public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  category    text not null default 'materials'
              check (category in ('materials', 'services', 'equipment', 'other')),
  address     text,
  notes       text,
  status      text not null default 'active'
              check (status in ('active', 'inactive')),
  created_at  timestamptz not null default now()
);

alter table public.suppliers enable row level security;

create policy "Users can manage suppliers for their project"
  on public.suppliers for all
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

create index if not exists suppliers_project_id_idx on public.suppliers(project_id);

-- ── TABLE: schedule_tasks ────────────────────────────────────
create table if not exists public.schedule_tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  description text,
  phase       text not null default 'General',
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'pending'
              check (status in ('pending', 'in_progress', 'completed', 'delayed')),
  progress    integer not null default 0
              check (progress >= 0 and progress <= 100),
  created_at  timestamptz not null default now(),
  constraint schedule_tasks_dates_check check (end_date >= start_date)
);

alter table public.schedule_tasks enable row level security;

create policy "Users can manage schedule for their project"
  on public.schedule_tasks for all
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

create index if not exists schedule_tasks_project_id_idx on public.schedule_tasks(project_id);
create index if not exists schedule_tasks_dates_idx on public.schedule_tasks(start_date, end_date);
