-- ============================================================
-- 0007_notifications.sql
-- In-app notification system for submission workflow events.
-- Run after 0001-0006 in the Supabase SQL Editor.
-- ============================================================

create table if not exists notifications (
  id serial primary key,
  user_id uuid references users(id) on delete cascade not null,
  type text not null check (type in (
    'submission_submitted',
    'submission_approved',
    'submission_rejected',
    'submission_needs_revision',
    'submission_completed'
  )),
  title text not null,
  body text,
  submission_id integer references submissions(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on notifications (user_id, is_read) where is_read = false;

alter table notifications enable row level security;

create policy "notifications_read_own" on notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications_insert_service" on notifications
  for insert with check (true);

NOTIFY pgrst, 'reload schema';
