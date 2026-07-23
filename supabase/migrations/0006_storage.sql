-- ============================================================
-- 0006_storage.sql
-- Supabase Storage bucket for requirement submission files.
-- Run after 0001-0005, in the Supabase SQL Editor.
-- ============================================================

-- Create the storage bucket (private — no public access)
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- ---------- STORAGE RLS ----------
-- Allow authenticated users to read files (gated by app-level policies below)
create policy "authenticated_read"
  on storage.objects for select
  using (bucket_id = 'submissions' and auth.role() = 'authenticated');

-- Faculty can upload files; path prefix = their user id
create policy "faculty_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Faculty can update/delete their own files
create policy "faculty_manage_own"
  on storage.objects for update
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "faculty_delete_own"
  on storage.objects for delete
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);

NOTIFY pgrst, 'reload schema';
