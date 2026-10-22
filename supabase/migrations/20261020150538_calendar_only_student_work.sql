-- Calendar checks run at transaction completion, so existing reading-sequence
-- operations may update related dates and publication states atomically.
create function public.require_calendar_assignment_date()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare current_row jsonb; assigned boolean; due text;
begin
 execute format('select to_jsonb(t) from %I.%I t where id=$1',TG_TABLE_SCHEMA,TG_TABLE_NAME) into current_row using new.id;
 if current_row is null then return null; end if;
 assigned:=case TG_ARGV[1]
   when 'status' then current_row->>'status'='published'
   when 'active' then (current_row->>'active')::boolean
   when 'mission' then current_row->>'cancelled_at' is null
   when 'legacy' then (current_row->>'published')::boolean and (current_row->>'is_active')::boolean
   when 'published' then (current_row->>'published')::boolean
   when 'window' then current_row->>'close_at' is null or (current_row->>'close_at')::timestamptz>(current_row->>'updated_at')::timestamptz
   else false end;
 due:=current_row->>TG_ARGV[0];
 if assigned and (due is null or due in ('infinity','-infinity')) then
   raise exception using errcode='23514',message='Choose a date on the class calendar before assigning this work.',constraint='calendar_date_required';
 end if;
 return null;
end $$;
revoke all on function public.require_calendar_assignment_date() from public,anon,authenticated;
grant execute on function public.require_calendar_assignment_date() to service_role;
create constraint trigger calendar_date_required after insert or update on public.quiz_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_at','status');
create constraint trigger calendar_date_required after insert or update on public.textbook_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_at','status');
create constraint trigger calendar_date_required after insert or update on public.vocab_tasks
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_on','active');
create constraint trigger calendar_date_required after insert or update on public.vocab_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_on','active');
create constraint trigger calendar_date_required after insert or update on public.math_mission_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_at','mission');
create constraint trigger calendar_date_required after insert or update on public.simulation_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_date','legacy');
create constraint trigger calendar_date_required after insert or update on public.lesson_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_date','legacy');
create constraint trigger calendar_date_required after insert or update on public.assignment_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_date','legacy');
create constraint trigger calendar_date_required after insert or update on public.unified_assignments
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_date','published');
create constraint trigger calendar_date_required after insert or update on public.lesson_class_windows
 deferrable initially deferred for each row execute function public.require_calendar_assignment_date('due_at','window');

-- Omitted activation flags must never assign imported or prepared material.
alter table public.quiz_assignments alter column status set default 'draft';
alter table public.textbook_assignments alter column status set default 'draft';
alter table public.vocab_tasks alter column active set default false;
alter table public.vocab_assignments alter column active set default false;
alter table public.lesson_assignments alter column published set default false;
alter table public.assignment_assignments alter column published set default false;
alter table public.simulation_assignments alter column published set default false;

-- The legacy insert trigger used to create student tasks even for draft content.
drop trigger if exists trigger_create_student_records on public.unified_assignments;
create trigger trigger_create_student_records after insert or update of published,due_date on public.unified_assignments
for each row when (new.published and new.due_date is not null)
execute function public.create_student_assignment_records();

-- Nothing is seeded. A teacher explicitly selects each class/date in the calendar.
create table public.calendar_warmups (
  course_id uuid not null references public.courses(id) on delete cascade,
  day date not null check (isfinite(day) and extract(isodow from day) in (2,4)),
  assigned_by text not null check (length(trim(assigned_by)) > 0),
  assigned_at timestamptz not null default now(),
  primary key (course_id,day)
);
alter table public.calendar_warmups enable row level security;
revoke all on table public.calendar_warmups from public, anon, authenticated;
grant select,insert,update,delete on table public.calendar_warmups to service_role;
comment on table public.calendar_warmups is 'Explicit teacher calendar assignments only. No recurring or automatic warm-up release.';

-- Retired reviews cannot be reassigned by restoring their former class list alone.
alter table public.review_module_assignments add column due_on date;
alter table public.review_module_assignments add constraint review_calendar_date_required
 check (cardinality(course_ids)=0 or (due_on is not null and isfinite(due_on)));
