-- ── Agrega "Comida / Bebida" a proyectos existentes ──────────
insert into public.expense_categories (project_id, name, color, icon, type)
select id, 'Comida / Bebida', '#ef4444', 'restaurant', 'other'
from public.projects
where id not in (
  select project_id from public.expense_categories where name = 'Comida / Bebida'
);

-- ── Actualiza la función seed para proyectos futuros ─────────
create or replace function public.seed_default_categories(p_project_id uuid)
returns void as $$
begin
  insert into public.expense_categories (project_id, name, color, icon, type) values
    (p_project_id, 'Materiales',        '#3b82f6', 'cube',                 'materials'),
    (p_project_id, 'Mano de Obra',      '#f59e0b', 'person',               'labor'),
    (p_project_id, 'Herramientas',      '#8b5cf6', 'build',                'services'),
    (p_project_id, 'Transporte',        '#06b6d4', 'car',                  'services'),
    (p_project_id, 'Maquinaria pesada', '#f97316', 'construct',            'services'),
    (p_project_id, 'Servicios',         '#ec4899', 'flash',                'services'),
    (p_project_id, 'Comida / Bebida',   '#ef4444', 'restaurant',           'other'),
    (p_project_id, 'Otros',             '#6b7280', 'ellipsis-horizontal',  'other');
end;
$$ language plpgsql security definer;
