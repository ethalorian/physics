-- NextAuth owns sessions. Only the authenticated server may access these private plans.
create table public.student_learning_plans (
  user_id uuid not null references public.students(id) on delete cascade,
  assignment_key text not null check (assignment_key ~ '^(video|reading|quiz|vocabulary):[0-9a-fA-F-]{36}$'),
  planned_on date,
  updated_at timestamptz not null default now(),
  primary key (user_id, assignment_key)
);
alter table public.student_learning_plans enable row level security;
revoke all on public.student_learning_plans from public, anon, authenticated;
grant select, insert, update, delete on public.student_learning_plans to service_role;
comment on table public.student_learning_plans is 'Private student work intentions. Does not alter teacher due dates or submitted work. Server scopes every request by the signed-in student.';
