-- ============================================================
-- 0010_soft_delete.sql
-- Adds soft-delete support to key tables.
-- Run after 0001-0009 in the Supabase SQL Editor.
-- ============================================================

-- Add deleted_at / deleted_by columns
alter table programs add column if not exists deleted_at timestamptz;
alter table programs add column if not exists deleted_by uuid references users(id);

alter table academic_years add column if not exists deleted_at timestamptz;
alter table academic_years add column if not exists deleted_by uuid references users(id);

alter table semesters add column if not exists deleted_at timestamptz;
alter table semesters add column if not exists deleted_by uuid references users(id);

alter table requirement_categories add column if not exists deleted_at timestamptz;
alter table requirement_categories add column if not exists deleted_by uuid references users(id);

alter table requirement_templates add column if not exists deleted_at timestamptz;
alter table requirement_templates add column if not exists deleted_by uuid references users(id);

alter table requirement_instances add column if not exists deleted_at timestamptz;
alter table requirement_instances add column if not exists deleted_by uuid references users(id);

alter table assignments add column if not exists deleted_at timestamptz;
alter table assignments add column if not exists deleted_by uuid references users(id);

NOTIFY pgrst, 'reload schema';
