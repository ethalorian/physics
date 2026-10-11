-- A classroom presentation can follow an authored Course Plans day without a
-- student lesson. Existing lesson sessions, ownership, RLS, and broadcasts stay.
alter table public.present_sessions alter column lesson_id drop not null;
alter table public.present_sessions
  add column plan_unit_id text,
  add column plan_day integer,
  add column plan_track text;
alter table public.present_sessions add constraint present_session_source check (
  (lesson_id is not null and plan_unit_id is null and plan_day is null and plan_track is null)
  or
  (lesson_id is null and plan_unit_id is not null and length(plan_unit_id)>0
    and plan_day is not null and plan_day>0 and plan_track is not null and plan_track in ('cpa','honors'))
);
create index present_sessions_plan_live on public.present_sessions(teacher_id,course_id,plan_unit_id,plan_day) where status='live' and plan_unit_id is not null;
comment on column public.present_sessions.plan_track is 'CPA or Honors deck edition selected when this Course Plans presentation was started.';
