-- ============================================================
-- Casita Construcción — Supabase Migration 001
-- Run this in your Supabase project → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── TABLE: projects ─────────────────────────────────────────
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  total_budget  numeric(12,2) not null default 0,
  start_date    date not null default current_date,
  status        text not null default 'active' check (status in ('active','paused','completed')),
  created_at    timestamptz not null default now(),
  -- One project per user
  constraint projects_user_id_unique unique (user_id)
);

alter table public.projects enable row level security;

create policy "Users can manage their own project"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── TABLE: income_entries ───────────────────────────────────
create table if not exists public.income_entries (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  description text not null,
  source      text not null default 'personal' check (source in ('personal','loan','other')),
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.income_entries enable row level security;

create policy "Users can manage income for their project"
  on public.income_entries for all
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

-- ── TABLE: expense_categories ───────────────────────────────
create table if not exists public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  color       text not null default '#3b82f6',
  icon        text not null default 'tag',
  type        text not null default 'other' check (type in ('materials','labor','services','other')),
  created_at  timestamptz not null default now()
);

alter table public.expense_categories enable row level security;

create policy "Users can manage categories for their project"
  on public.expense_categories for all
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

-- ── TABLE: expenses ─────────────────────────────────────────
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  category_id  uuid references public.expense_categories(id) on delete set null,
  amount       numeric(12,2) not null check (amount > 0),
  description  text not null,
  date         date not null default current_date,
  receipt_url  text,
  created_at   timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can manage expenses for their project"
  on public.expenses for all
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

-- ── TABLE: materials ───────────────────────────────────────
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  name          text not null,
  unit          text not null default 'unidad',
  stock_current numeric(10,2) not null default 0,
  stock_min     numeric(10,2) not null default 0,
  category      text not null default 'general',
  created_at    timestamptz not null default now()
);

alter table public.materials enable row level security;

create policy "Users can manage materials for their project"
  on public.materials for all
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

-- ── TABLE: material_purchases ──────────────────────────────
create table if not exists public.material_purchases (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references public.expenses(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  quantity    numeric(10,2) not null check (quantity > 0),
  unit_price  numeric(12,2) not null check (unit_price >= 0),
  supplier    text,
  created_at  timestamptz not null default now()
);

alter table public.material_purchases enable row level security;

create policy "Users can manage material purchases for their project"
  on public.material_purchases for all
  using (
    exists (
      select 1 from public.expenses e
      join public.projects p on p.id = e.project_id
      where e.id = expense_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.expenses e
      join public.projects p on p.id = e.project_id
      where e.id = expense_id and p.user_id = auth.uid()
    )
  );

-- ── TABLE: workers ─────────────────────────────────────────
create table if not exists public.workers (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  role        text not null default 'Albañil',
  daily_rate  numeric(10,2) not null default 0,
  phone       text,
  status      text not null default 'active' check (status in ('active','inactive')),
  created_at  timestamptz not null default now()
);

alter table public.workers enable row level security;

create policy "Users can manage workers for their project"
  on public.workers for all
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

-- ── TABLE: payroll_entries ─────────────────────────────────
create table if not exists public.payroll_entries (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  worker_id    uuid not null references public.workers(id) on delete restrict,
  amount       numeric(12,2) not null check (amount > 0),
  period_start date not null,
  period_end   date not null,
  days_worked  numeric(4,1) not null default 0,
  notes        text,
  date_paid    date not null default current_date,
  created_at   timestamptz not null default now(),
  constraint payroll_dates_check check (period_end >= period_start)
);

alter table public.payroll_entries enable row level security;

create policy "Users can manage payroll for their project"
  on public.payroll_entries for all
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

-- ── INDEXES ─────────────────────────────────────────────────
create index if not exists idx_income_entries_project    on public.income_entries(project_id, date desc);
create index if not exists idx_expenses_project          on public.expenses(project_id, date desc);
create index if not exists idx_materials_project         on public.materials(project_id);
create index if not exists idx_workers_project_status    on public.workers(project_id, status);
create index if not exists idx_payroll_project           on public.payroll_entries(project_id, date_paid desc);
create index if not exists idx_payroll_worker            on public.payroll_entries(worker_id);

-- ── VIEW: v_balance_summary ─────────────────────────────────
create or replace view public.v_balance_summary as
select
  p.id                                             as project_id,
  p.total_budget                                   as budget,
  coalesce(sum(distinct_i.total_income), 0)        as total_income,
  coalesce(sum(distinct_e.total_expenses), 0)      as total_expenses,
  coalesce(sum(distinct_pr.total_payroll), 0)      as total_payroll,
  coalesce(sum(distinct_i.total_income), 0)
    - coalesce(sum(distinct_e.total_expenses), 0)
    - coalesce(sum(distinct_pr.total_payroll), 0)  as balance,
  case
    when p.total_budget = 0 then 0
    else round(
      (
        (coalesce(sum(distinct_e.total_expenses), 0) + coalesce(sum(distinct_pr.total_payroll), 0))
        / p.total_budget
      ) * 100, 2
    )
  end                                              as budget_used_pct
from public.projects p
left join lateral (
  select sum(i.amount) as total_income
  from public.income_entries i where i.project_id = p.id
) distinct_i on true
left join lateral (
  select sum(e.amount) as total_expenses
  from public.expenses e where e.project_id = p.id
) distinct_e on true
left join lateral (
  select sum(pr.amount) as total_payroll
  from public.payroll_entries pr where pr.project_id = p.id
) distinct_pr on true
group by p.id, p.total_budget;

-- ── VIEW: v_monthly_expenses ─────────────────────────────────
create or replace view public.v_monthly_expenses as
select
  e.project_id,
  to_char(e.date, 'YYYY-MM')    as month,
  coalesce(c.name, 'Sin categoría') as category_name,
  coalesce(c.color, '#6b7280')       as category_color,
  sum(e.amount)                  as total
from public.expenses e
left join public.expense_categories c on c.id = e.category_id
group by e.project_id, to_char(e.date, 'YYYY-MM'), c.name, c.color
order by month desc;

-- ── FUNCTION: update_material_stock ──────────────────────────
-- Trigger function: auto-increment material stock when a purchase is inserted
create or replace function public.update_material_stock()
returns trigger as $$
begin
  update public.materials
  set stock_current = stock_current + new.quantity
  where id = new.material_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_material_stock
  after insert on public.material_purchases
  for each row execute function public.update_material_stock();

-- Trigger: decrement stock on purchase delete
create or replace function public.revert_material_stock()
returns trigger as $$
begin
  update public.materials
  set stock_current = greatest(0, stock_current - old.quantity)
  where id = old.material_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger trg_revert_material_stock
  after delete on public.material_purchases
  for each row execute function public.revert_material_stock();

-- ── SEED: default expense categories ────────────────────────
-- Called after creating a project (from app trigger or RPC)
create or replace function public.seed_default_categories(p_project_id uuid)
returns void as $$
begin
  insert into public.expense_categories (project_id, name, color, icon, type) values
    (p_project_id, 'Materiales',       '#3b82f6', 'cube',          'materials'),
    (p_project_id, 'Mano de Obra',     '#f59e0b', 'person',        'labor'),
    (p_project_id, 'Herramientas',     '#8b5cf6', 'build',         'services'),
    (p_project_id, 'Transporte',       '#06b6d4', 'car',           'services'),
    (p_project_id, 'Servicios',        '#ec4899', 'flash',         'services'),
    (p_project_id, 'Otros',            '#6b7280', 'ellipsis-horizontal', 'other');
end;
$$ language plpgsql security definer;
