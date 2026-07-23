-- ============================================================
-- 0002_academic.sql
-- Programs, Academic Years, Semesters, Faculty profiles, Organizations.
-- Run in Supabase SQL Editor after 0001_init_auth.sql.
-- ============================================================

-- ---------- GENERIC PERMISSION HELPERS ----------
-- Reuses the role_permissions/permissions tables from 0001 instead of
-- hardcoding role names into every policy. Adjust the seeds at the bottom
-- to match your real Permission Matrix (Section XXV) exactly.

create or replace function can_write(p_module text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from role_permissions rp
    join permissions p on p.id = rp.permission_id
    join users u on u.role_id = rp.role_id
    where u.id = auth.uid()
      and p.module = p_module
      and p.action in ('CRUD', 'All')
  )
$$;

create or replace function can_read(p_module text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from role_permissions rp
    join permissions p on p.id = rp.permission_id
    join users u on u.role_id = rp.role_id
    where u.id = auth.uid()
      and p.module = p_module
      and p.action <> 'No'
  )
$$;

-- ---------- PROGRAMS ----------
create table if not exists programs (
  id serial primary key,
  name text not null,
  code text unique not null,
  created_at timestamptz not null default now()
);

-- ---------- ACADEMIC YEARS ----------
create table if not exists academic_years (
  id serial primary key,
  label text unique not null,      -- e.g. '2026-2027'
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- SEMESTERS ----------
create table if not exists semesters (
  id serial primary key,
  academic_year_id integer references academic_years(id) on delete cascade,
  name text not null,               -- 'First Semester' | 'Second Semester' | 'Summer'
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (academic_year_id, name)
);

-- ---------- FACULTY PROFILES ----------
-- Extends a `users` row (role = Faculty) with academic-specific fields.
create table if not exists faculty_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  program_id integer references programs(id),
  position text,               -- e.g. 'Assistant Professor'
  employment_type text,        -- e.g. 'Full-time', 'Part-time'
  created_at timestamptz not null default now()
);

-- ---------- ORGANIZATIONS ----------
create table if not exists organizations (
  id serial primary key,
  name text not null,
  acronym text,
  program_id integer references programs(id),
  adviser_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table programs enable row level security;
alter table academic_years enable row level security;
alter table semesters enable row level security;
alter table faculty_profiles enable row level security;
alter table organizations enable row level security;

-- Programs
create policy "programs_read" on programs
  for select using (can_read('Programs'));
create policy "programs_write" on programs
  for all using (can_write('Programs')) with check (can_write('Programs'));

-- Academic Years
create policy "academic_years_read" on academic_years
  for select using (can_read('Programs'));
create policy "academic_years_write" on academic_years
  for all using (can_write('Programs')) with check (can_write('Programs'));

-- Semesters
create policy "semesters_read" on semesters
  for select using (can_read('Programs'));
create policy "semesters_write" on semesters
  for all using (can_write('Programs')) with check (can_write('Programs'));

-- Faculty profiles: readable by anyone with Faculty-module read access;
-- a faculty member can also always read their own row.
create policy "faculty_profiles_read" on faculty_profiles
  for select using (can_read('Faculty') or user_id = auth.uid());
create policy "faculty_profiles_write" on faculty_profiles
  for all using (can_write('Faculty')) with check (can_write('Faculty'));

-- Organizations
create policy "organizations_read" on organizations
  for select using (can_read('Organizations'));
create policy "organizations_write" on organizations
  for all using (can_write('Organizations')) with check (can_write('Organizations'));

-- ---------- SEED PERMISSIONS ----------
insert into permissions (module, action) values
  ('Programs', 'CRUD'), ('Programs', 'Read'),
  ('Faculty', 'CRUD'), ('Faculty', 'Read'),
  ('Organizations', 'CRUD'), ('Organizations', 'Read')
on conflict (module, action) do nothing;

-- Chair: full CRUD on all three new modules
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Chair'
  and p.module in ('Programs', 'Faculty', 'Organizations')
on conflict do nothing;

-- Secretary, Records, Coordinator, Faculty: read-only on all three
-- (adjust per your real Permission Matrix if any of these need write access)
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name in ('Secretary', 'Records', 'Coordinator', 'Faculty')
  and p.module in ('Programs', 'Faculty', 'Organizations')
  and p.action = 'Read'
on conflict do nothing;

-- Tell PostgREST to pick up the new tables/columns immediately instead
-- of waiting for its next automatic schema cache refresh.
NOTIFY pgrst, 'reload schema';