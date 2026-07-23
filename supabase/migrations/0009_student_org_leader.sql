-- ============================================================
-- 0009_student_org_leader.sql
-- Links Student Org Leader users to organizations.
-- Run after 0001-0008 in the Supabase SQL Editor.
-- ============================================================

-- Add org_leader_id to organizations (nullable — not all orgs have
-- a student leader assigned)
alter table organizations add column if not exists org_leader_id uuid references users(id) on delete set null;

-- Student Org Leader can see their org + members
create policy "org_leader_read_own" on organizations
  for select using (
    org_leader_id = auth.uid()
    or exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'Chair'
    )
  );

create policy "org_leader_update_own" on organizations
  for update using (org_leader_id = auth.uid())
  with check (org_leader_id = auth.uid());

NOTIFY pgrst, 'reload schema';
