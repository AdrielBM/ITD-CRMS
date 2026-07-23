-- ============================================================
-- 0001_init_auth.sql
-- Core auth/permission schema. Run this in the Supabase SQL editor,
-- or via `supabase db push` once the Supabase CLI is linked.
-- ============================================================

-- ---------- BASE GRANTS ----------
-- Supabase's API talks to Postgres as anon/authenticated/service_role.
-- Without these grants, every query fails with "permission denied for
-- table X" even when RLS policies are correct — RLS only decides which
-- ROWS a role can see, these grants decide whether it can touch the
-- table at all. Safe to re-run.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ---------- ROLES ----------
create table if not exists roles (
  id serial primary key,
  name text unique not null -- 'Chair', 'Secretary', 'Records', 'Coordinator', 'Faculty'
);

insert into roles (name) values
  ('Chair'), ('Secretary'), ('Records'), ('Coordinator'), ('Faculty')
on conflict (name) do nothing;

-- ---------- PERMISSIONS ----------
create table if not exists permissions (
  id serial primary key,
  module text not null,          -- e.g. 'Users', 'Requirements', 'Submission', 'Reports'
  action text not null,          -- e.g. 'CRUD', 'Read', 'Verify', 'Review', 'Upload', 'All', 'Personal', 'No'
  unique (module, action)
);

-- ---------- ROLE <-> PERMISSION ----------
create table if not exists role_permissions (
  role_id integer references roles(id) on delete cascade,
  permission_id integer references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- ---------- USER PROFILES ----------
-- Supabase Auth already stores the login (auth.users). This table holds
-- app-level profile + role data, keyed 1:1 to an auth.users row.
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role_id integer references roles(id) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- HELPER: current user's role name ----------
-- Used inside RLS policies so they can check "is this user a Chair?"
-- without a join in every single policy.
create or replace function current_user_role()
returns text
language sql
security definer
stable
as $$
  select r.name
  from users u
  join roles r on r.id = u.role_id
  where u.id = auth.uid()
$$;

-- ---------- ENABLE RLS ----------
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table users enable row level security;

-- ---------- POLICIES ----------

-- Everyone logged in can read roles/permissions (needed to render UI conditionally)
create policy "roles_read_all" on roles
  for select using (auth.uid() is not null);

create policy "permissions_read_all" on permissions
  for select using (auth.uid() is not null);

create policy "role_permissions_read_all" on role_permissions
  for select using (auth.uid() is not null);

-- Users: everyone can read their own row; Chair can read/write everyone's
create policy "users_read_self" on users
  for select using (auth.uid() = id);

create policy "users_read_all_if_chair" on users
  for select using (current_user_role() = 'Chair');

create policy "users_update_self" on users
  for update using (auth.uid() = id);

create policy "users_write_if_chair" on users
  for all using (current_user_role() = 'Chair')
  with check (current_user_role() = 'Chair');

-- ---------- SEED PERMISSIONS FROM THE PERMISSION MATRIX ----------
-- Fill this in to match your actual Permission Matrix doc (Section XXV).
-- Example seed for the "Users" and "Requirements" rows shown in the spec:
insert into permissions (module, action) values
  ('Users', 'CRUD'), ('Users', 'Read'), ('Users', 'No'),
  ('Requirements', 'CRUD'), ('Requirements', 'Read'),
  ('Submission', 'Read'), ('Submission', 'Verify'), ('Submission', 'Review'), ('Submission', 'Upload'),
  ('Reports', 'All'), ('Reports', 'Read'), ('Reports', 'Personal')
on conflict (module, action) do nothing;

-- Wire up Chair = full CRUD everywhere (adjust to your real matrix)
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'Chair'
on conflict do nothing;

-- Tell PostgREST to pick up the new tables/columns immediately instead
-- of waiting for its next automatic schema cache refresh.
NOTIFY pgrst, 'reload schema';