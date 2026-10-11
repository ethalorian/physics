-- Add a deadline independently of the access window. Existing classes and
-- schedules keep their current access; no homework dates are invented.
alter table public.lesson_class_windows add column if not exists due_at timestamptz;
comment on column public.lesson_class_windows.due_at is 'Assignment deadline; does not grant or revoke student access.';
