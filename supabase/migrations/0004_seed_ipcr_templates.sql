-- ============================================================
-- 0004_seed_ipcr_templates.sql
-- Seeds the real requirement categories/templates used by the department
-- (matches the paper "IPCR Attachments" / "For Faculty Portfolio" sheet),
-- and prevents assigning the same instance to the same faculty/org twice.
-- Run in Supabase SQL Editor after 0001, 0002, 0003.
-- ============================================================

-- ---------- CATEGORIES ----------
insert into requirement_categories (name) values
  ('IPCR Attachments'),
  ('For Faculty Portfolio')
on conflict (name) do nothing;

-- ---------- TEMPLATES: IPCR Attachments ----------
insert into requirement_templates (category_id, name)
select c.id, t.name
from requirement_categories c
cross join (values
  ('Approved Faculty Schedule'),
  ('Approved Course Syllabus'),
  ('Instructional Modules'),
  ('Approved Midterm Exam'),
  ('Approved Midterm TOS'),
  ('Approved Final Exam'),
  ('Approved Final TOS'),
  ('Teaching Aids (PPTs, Google Slide, etc)'),
  ('Consultation Slip Form/Log Sheet Form/Stakeholder Feedback Form')
) as t(name)
where c.name = 'IPCR Attachments'
on conflict do nothing;

-- ---------- TEMPLATES: For Faculty Portfolio ----------
insert into requirement_templates (category_id, name)
select c.id, t.name
from requirement_categories c
cross join (values
  ('Local Training Certificates'),
  ('Regional Training Certificates'),
  ('International Training Certificates'),
  ('SET Rating'),
  ('5s Rating'),
  ('Sample Quizzes of Students'),
  ('Sample Activities of Students'),
  ('Syllabus Acceptance Form'),
  ('Student''s Attendance'),
  ('Discussion of Examination Form')
) as t(name)
where c.name = 'For Faculty Portfolio'
on conflict do nothing;

-- ---------- PREVENT DUPLICATE ASSIGNMENTS ----------
-- Without this, the same faculty/org could get assigned to the same
-- instance twice (e.g. clicking "assign to all faculty" a second time).
create unique index if not exists assignments_unique_faculty
  on assignments (requirement_instance_id, faculty_id)
  where faculty_id is not null;

create unique index if not exists assignments_unique_org
  on assignments (requirement_instance_id, organization_id)
  where organization_id is not null;

NOTIFY pgrst, 'reload schema';