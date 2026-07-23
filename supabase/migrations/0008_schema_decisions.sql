-- ============================================================
-- 0008_schema_decisions.sql
-- Multi-role support, program-scoped coordinators,
-- Student Org Leader role.
-- Run after 0001-0007 in the Supabase SQL Editor.
-- ============================================================

-- ---------- 1. MULTI-ROLE SUPPORT ----------
-- Junction table so a user can hold multiple roles.
-- Existing users.role_id remains as the "primary" role for
-- backward compatibility during migration.
create table if not exists user_roles (
  user_id uuid references users(id) on delete cascade not null,
  role_id integer references roles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

-- Migrate existing single-role assignments
insert into user_roles (user_id, role_id)
select id, role_id from users
on conflict do nothing;

alter table user_roles enable row level security;

create policy "user_roles_read_own" on user_roles
  for select using (user_id = auth.uid());

create policy "user_roles_read_admin" on user_roles
  for select using (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'Chair'
    )
  );

create policy "user_roles_insert_admin" on user_roles
  for insert with check (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'Chair'
    )
  );

create policy "user_roles_delete_admin" on user_roles
  for delete using (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'Chair'
    )
  );

-- Helper: check if a user has a specific role
create or replace function user_has_role(p_user_id uuid, p_role_name text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = p_user_id and r.name = p_role_name
  )
$$;

-- Helper: get all role names for a user
create or replace function user_role_names(p_user_id uuid)
returns text[]
language sql
stable
as $$
  select array_agg(r.name order by r.id)
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = p_user_id
$$;

-- ---------- 2. STUDENT ORG LEADER ROLE ----------
insert into roles (name) values ('Student Org Leader')
on conflict (name) do nothing;

-- Grant basic read permissions to Student Org Leader
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Student Org Leader'
  and p.module in ('Requirements', 'Submission')
  and p.action = 'Read'
on conflict do nothing;

-- ---------- 3. PROGRAM-SCOPED COORDINATORS ----------
-- Links a Coordinator user to a specific program.
-- NULL program_id = "all programs" (department-wide coordinator).
create table if not exists program_coordinators (
  id serial primary key,
  user_id uuid references users(id) on delete cascade not null,
  program_id integer references programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, program_id)
);

alter table program_coordinators enable row level security;

create policy "program_coordinators_read" on program_coordinators
  for select using (true);

create policy "program_coordinators_write_admin" on program_coordinators
  for insert with check (
    exists (select 1 from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = auth.uid() and r.name = 'Chair')
  );

create policy "program_coordinators_delete_admin" on program_coordinators
  for delete using (
    exists (select 1 from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = auth.uid() and r.name = 'Chair')
  );

NOTIFY pgrst, 'reload schema';
