-- ============================================================
-- 0011_coordinator_roles.sql
-- Split Coordinator into IT Coordinator and CS Coordinator.
-- Run in Supabase SQL Editor after 0001-0010.
-- ============================================================

-- Add new roles
insert into roles (name) values
  ('IT Coordinator'), ('CS Coordinator')
on conflict (name) do nothing;

-- Copy Coordinator permissions to both new roles
insert into role_permissions (role_id, permission_id)
select r.id, rp.permission_id
from roles r
cross join role_permissions rp
join roles old on old.id = rp.role_id
where r.name in ('IT Coordinator', 'CS Coordinator')
  and old.name = 'Coordinator'
on conflict do nothing;

NOTIFY pgrst, 'reload schema';
