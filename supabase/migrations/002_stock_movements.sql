-- ============================================================
-- Casita Construcción — Migration 002
-- Stock movement log: tracks every inventory adjustment
-- Run in Supabase → SQL Editor → New query
-- ============================================================

create table if not exists public.stock_movements (
  id           uuid primary key default gen_random_uuid(),
  material_id  uuid not null references public.materials(id) on delete cascade,
  project_id   uuid not null references public.projects(id)  on delete cascade,
  user_id      uuid not null references auth.users(id)       on delete cascade,
  delta        numeric(10,2) not null,          -- positive = added, negative = removed
  stock_after  numeric(10,2) not null,          -- stock value after this movement
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_stock_movements_material
  on public.stock_movements(material_id, created_at desc);

create index if not exists idx_stock_movements_project
  on public.stock_movements(project_id, created_at desc);

alter table public.stock_movements enable row level security;

create policy "Users can manage stock movements for their project"
  on public.stock_movements for all
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
