supabase/migrations/0005_approval_workflow.sql-- ============================================================
-- 0005_approval_workflow.sql
-- Submission system and approval workflow state machine.
-- Run after 0001, 0002, 0003, 0004.
-- ============================================================

-- ---------- SUBMISSIONS ----------
-- One submission per assignment. Faculty creates it, then it moves
-- through the 4-step pipeline: Coordinator → Records → Secretary → Chair.
-- Resubmissions create new versions but keep the same submission row.
create table if not exists submissions (
  id serial primary key,
  assignment_id integer references assignments(id) on delete cascade not null,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'needs_revision', 'completed')),
  current_step integer not null default 0
    check (current_step between 0 and 4),
  created_by uuid references users(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id)
);

-- ---------- SUBMISSION VERSIONS ----------
-- Each time faculty uploads/resubmits, a new version is created.
create table if not exists submission_versions (
  id serial primary key,
  submission_id integer references submissions(id) on delete cascade not null,
  version_number integer not null,
  notes text,
  created_by uuid references users(id) not null,
  created_at timestamptz not null default now(),
  unique (submission_id, version_number)
);

-- ---------- SUBMISSION FILES ----------
-- Metadata for files attached to a submission version.
-- Actual files stored in Supabase Storage or Google Drive (Phase 4.5).
create table if not exists submission_files (
  id serial primary key,
  submission_version_id integer references submission_versions(id) on delete cascade not null,
  file_name text not null,
  file_url text,
  file_type text,
  file_size bigint,
  storage_path text,
  created_at timestamptz not null default now()
);

-- ---------- APPROVALS ----------
-- Records every approve/reject action at each workflow step.
-- step_role: the reviewer's role name at time of action.
create table if not exists approvals (
  id serial primary key,
  submission_id integer references submissions(id) on delete cascade not null,
  step_number integer not null check (step_number between 0 and 3),
  step_role text not null,
  reviewer_id uuid references users(id) not null,
  status text not null check (status in ('approved', 'rejected')),
  remarks text,
  created_at timestamptz not null default now()
);

-- ---------- HELPER: get assigned faculty for a submission ----------
create or replace function submission_faculty_id(p_submission_id integer)
returns uuid
language sql
stable
as $$
  select a.faculty_id
  from submissions s
  join assignments a on a.id = s.assignment_id
  where s.id = p_submission_id
$$;

-- ---------- RLS ----------
alter table submissions enable row level security;
alter table submission_versions enable row level security;
alter table submission_files enable row level security;
alter table approvals enable row level security;

-- SUBMISSIONS
create policy "submissions_read_own" on submissions
  for select using (created_by = auth.uid());

create policy "submissions_read_assigned" on submissions
  for select using (
    exists (
      select 1 from assignments a
      where a.id = assignment_id and a.faculty_id = auth.uid()
    )
  );

create policy "submissions_read_reviewer" on submissions
  for select using (
    auth.uid() in (
      select id from users where role_id in (
        select id from roles where name in ('Chair', 'Secretary', 'Records', 'Coordinator')
      )
    )
  );

create policy "submissions_write_faculty" on submissions
  for insert with check (
    exists (
      select 1 from assignments a
      where a.id = assignment_id and a.faculty_id = auth.uid()
    )
  );

create policy "submissions_update_own" on submissions
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

-- SUBMISSION VERSIONS: readable by submission owner, assigned faculty, and reviewers
create policy "submission_versions_read" on submission_versions
  for select using (
    exists (
      select 1 from submissions s
      where s.id = submission_id
        and (s.created_by = auth.uid()
          or exists (select 1 from assignments a where a.id = s.assignment_id and a.faculty_id = auth.uid())
          or auth.uid() in (select id from users where role_id in (select id from roles where name in ('Chair', 'Secretary', 'Records', 'Coordinator')))
        )
    )
  );

create policy "submission_versions_write" on submission_versions
  for insert with check (
    exists (
      select 1 from submissions s
      where s.id = submission_id and s.created_by = auth.uid()
    )
  );

-- SUBMISSION FILES: same visibility as versions
create policy "submission_files_read" on submission_files
  for select using (
    exists (
      select 1 from submission_versions sv
      join submissions s on s.id = sv.submission_id
      where sv.id = submission_version_id
        and (s.created_by = auth.uid()
          or exists (select 1 from assignments a where a.id = s.assignment_id and a.faculty_id = auth.uid())
          or auth.uid() in (select id from users where role_id in (select id from roles where name in ('Chair', 'Secretary', 'Records', 'Coordinator')))
        )
    )
  );

create policy "submission_files_write" on submission_files
  for insert with check (
    exists (
      select 1 from submission_versions sv
      join submissions s on s.id = sv.submission_id
      where sv.id = submission_version_id and s.created_by = auth.uid()
    )
  );

-- APPROVALS: readable by submission participants; insertable by the reviewer role
create policy "approvals_read" on approvals
  for select using (
    exists (
      select 1 from submissions s
      where s.id = submission_id
        and (s.created_by = auth.uid()
          or exists (select 1 from assignments a where a.id = s.assignment_id and a.faculty_id = auth.uid())
          or auth.uid() in (select id from users where role_id in (select id from roles where name in ('Chair', 'Secretary', 'Records', 'Coordinator')))
        )
    )
  );

create policy "approvals_write" on approvals
  for insert with check (
    exists (
      select 1 from submissions s
      where s.id = submission_id
        and s.status = 'submitted'
    )
  );

-- ---------- PERMISSIONS ----------
insert into permissions (module, action) values
  ('Submission', 'CRUD'), ('Submission', 'Read')
on conflict (module, action) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Chair'
  and p.module = 'Submission'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name in ('Secretary', 'Records', 'Coordinator', 'Faculty')
  and p.module = 'Submission'
  and p.action = 'Read'
on conflict do nothing;

NOTIFY pgrst, 'reload schema';
