-- ============================================================
-- 0003_requirements.sql
-- Requirement Management: categories, templates, instances, assignments.
-- Run in Supabase SQL Editor after 0001 and 0002.
-- ============================================================

-- ---------- REQUIREMENT CATEGORIES ----------
-- e.g. Instruction, Research, Extension (matches the Google Drive folder spec)
create table if not exists requirement_categories (
  id serial primary key,
  name text unique not null,
  created_at timestamptz not null default now()
);

insert into requirement_categories (name) values
  ('Instruction'), ('Research'), ('Extension')
on conflict (name) do nothing;

-- ---------- REQUIREMENT TEMPLATES ----------
-- Reusable definition, e.g. "Syllabus". Not tied to a semester.
create table if not exists requirement_templates (
  id serial primary key,
  category_id integer references requirement_categories(id),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- REQUIREMENT INSTANCES ----------
-- A template applied to a specific academic year + semester.
-- This is what actually gets assigned and submitted against.
create table if not exists requirement_instances (
  id serial primary key,
  template_id integer references requirement_templates(id) on delete cascade,
  academic_year_id integer references academic_years(id),
  semester_id integer references semesters(id),
  due_date date,
  created_at timestamptz not null default now(),
  unique (template_id, semester_id)
);

-- ---------- ASSIGNMENTS ----------
-- Who a requirement instance applies to: exactly one of faculty_id / organization_id.
create table if not exists assignments (
  id serial primary key,
  requirement_instance_id integer references requirement_instances(id) on delete cascade,
  faculty_id uuid references users(id) on delete cascade,
  organization_id integer references organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint assignments_exactly_one_assignee check (
    (faculty_id is not null and organization_id is null) or
    (faculty_id is null and organization_id is not null)
  )
);

-- ---------- RLS ----------
alter table requirement_categories enable row level security;
alter table requirement_templates enable row level security;
alter table requirement_instances enable row level security;
alter table assignments enable row level security;

create policy "requirement_categories_read" on requirement_categories
  for select using (can_read('Requirements'));
create policy "requirement_categories_write" on requirement_categories
  for all using (can_write('Requirements')) with check (can_write('Requirements'));

create policy "requirement_templates_read" on requirement_templates
  for select using (can_read('Requirements'));
create policy "requirement_templates_write" on requirement_templates
  for all using (can_write('Requirements')) with check (can_write('Requirements'));

create policy "requirement_instances_read" on requirement_instances
  for select using (can_read('Requirements'));
create policy "requirement_instances_write" on requirement_instances
  for all using (can_write('Requirements')) with check (can_write('Requirements'));

-- Assignments: writeable by whoever can write Requirements; readable by
-- that same group, PLUS the assigned faculty member can see their own.
create policy "assignments_read" on assignments
  for select using (can_read('Requirements') or faculty_id = auth.uid());
create policy "assignments_write" on assignments
  for all using (can_write('Requirements')) with check (can_write('Requirements'));

-- ---------- PERMISSIONS ----------
-- 'Requirements' module permissions already exist from 0001_init_auth.sql.
-- Chair already has CRUD on everything from that same migration. Here we
-- extend read access to the other roles per the Permission Matrix (Section XXV).
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name in ('Secretary', 'Records', 'Coordinator', 'Faculty')
  and p.module = 'Requirements'
  and p.action = 'Read'
on conflict do nothing;

NOTIFY pgrst, 'reload schema';