-- NextAuth application: all access passes through scoped server APIs, as with quizzes.
create table public.worksheet_assignments (
 id uuid primary key, course_id uuid not null references public.courses(id),
 unit_id text not null references public.units(id), day integer not null check(day between 1 and 22),
 edition text not null check(edition in ('cpa','honors','cpa-sei','honors-sei')),
 title text not null, target_ids uuid[] not null, source_sha256 text not null,
 quiz_id uuid not null unique references public.quiz_assignments(id),
 due_at timestamptz not null, status text not null default 'published' check(status in ('published','archived')),
 student_ids uuid[], version integer not null default 1, created_by text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index worksheet_assignments_course on public.worksheet_assignments(course_id,status,due_at);
create table public.worksheet_receipts (
 assignment_id uuid not null references public.worksheet_assignments(id), user_id uuid not null references public.students(id),
 state text not null check(state in ('received','not_received','excused')), version integer not null default 1,
 recorded_by text not null, recorded_at timestamptz not null default now(), primary key(assignment_id,user_id)
);
create index worksheet_receipts_student on public.worksheet_receipts(user_id,assignment_id);
create table public.worksheet_receipt_history (
 id bigint generated always as identity primary key, assignment_id uuid not null references public.worksheet_assignments(id),
 user_id uuid not null references public.students(id), state text not null, version integer not null,
 recorded_by text not null, recorded_at timestamptz not null default now()
);
create index worksheet_receipt_history_assignment on public.worksheet_receipt_history(assignment_id,user_id);
alter table public.worksheet_assignments enable row level security;
alter table public.worksheet_receipts enable row level security;
alter table public.worksheet_receipt_history enable row level security;
revoke all on public.worksheet_assignments,public.worksheet_receipts,public.worksheet_receipt_history from public,anon,authenticated;
grant select,insert,update on public.worksheet_assignments,public.worksheet_receipts to service_role;
grant select,insert on public.worksheet_receipt_history to service_role;
grant usage,select on sequence public.worksheet_receipt_history_id_seq to service_role;

create function public.assign_worksheet_pair(p_id uuid,p_unit text,p_day integer,p_edition text,p_due timestamptz,p_source text,p_quiz jsonb,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.worksheet_assignments; q jsonb; c public.courses; targets uuid[];
begin
 select * into c from public.courses where id=(p_quiz->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null and program='physics' for share;
 if not found then raise exception 'Choose your own active Physics class.';end if;
 if p_unit !~ '^unit-[1-8]$' or p_day<1 or p_day>(case p_unit when 'unit-1' then 22 when 'unit-2' then 16 when 'unit-3' then 14 when 'unit-4' then 22 when 'unit-5' then 12 when 'unit-6' then 18 when 'unit-7' then 18 else 9 end) or p_edition not in ('cpa','honors','cpa-sei','honors-sei') or p_source !~ '^[a-f0-9]{64}$' then raise exception 'Choose an available worksheet edition.';end if;
 if p_due is null or p_quiz->>'due_at' is null or p_due>(p_quiz->>'due_at')::timestamptz then raise exception 'Schedule paper hand-in before or at the quiz deadline.';end if;
 if p_quiz->>'status'<>'published' or p_quiz->>'kind'<>'understanding' or p_quiz->>'grade_mode'<>'numeric' or jsonb_array_length(p_quiz->'questions')<>6 or exists(select 1 from jsonb_array_elements(p_quiz->'questions') x where x->>'kind'<>'choice' or jsonb_array_length(x->'options')<>4) then raise exception 'The paired quiz must have six multiple-choice questions.';end if;
 select array_agg(distinct (x->>'target_id')::uuid) into targets from jsonb_array_elements(p_quiz->'questions') x;
 if exists(select 1 from unnest(targets) t where not exists(select 1 from public.learning_targets l where l.id=t and l.unit_id=p_unit and not l.exclude_from_growth)) then raise exception 'Worksheet targets must belong to its unit.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into a from public.worksheet_assignments where id=p_id for update;
 if found then
  if a.course_id=c.id and a.quiz_id=(p_quiz->>'id')::uuid and a.unit_id=p_unit and a.day=p_day and a.edition=p_edition and a.due_at=p_due and a.source_sha256=p_source and exists(select 1 from public.quiz_assignments saved where saved.id=a.quiz_id and saved.due_at=(p_quiz->>'due_at')::timestamptz and saved.questions=p_quiz->'questions' and to_jsonb(saved.student_ids) is not distinct from nullif(p_quiz->'student_ids','null'::jsonb)) then return to_jsonb(a);end if;
  raise exception 'This scheduling request already exists. Reload the worksheet.';
 end if;
 q:=public.save_quiz_assignment(p_quiz,p_actor,p_owner);
 insert into public.worksheet_assignments(id,course_id,unit_id,day,edition,title,target_ids,source_sha256,quiz_id,due_at,student_ids,created_by)
 values(p_id,c.id,p_unit,p_day,p_edition,replace(p_quiz->>'title',' · Paired quiz',' · Worksheet'),targets,p_source,(q->>'id')::uuid,p_due,case when p_quiz->'student_ids'='null'::jsonb then null else array(select value::uuid from jsonb_array_elements_text(p_quiz->'student_ids')) end,p_actor) returning * into a;
 return to_jsonb(a);
end $$;

create function public.record_worksheet_receipt(p_id uuid,p_user uuid,p_state text,p_version integer,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.worksheet_assignments;r public.worksheet_receipts;
begin
 select w.* into a from public.worksheet_assignments w join public.courses c on c.id=w.course_id where w.id=p_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for share of w,c;
 if not found then raise exception 'Worksheet unavailable for this class.';end if;
 if a.status<>'published' then raise exception 'Restore the worksheet before changing paper receipt.';end if;
 if p_state not in ('received','not_received','excused') or p_version<0 or p_version is null then raise exception 'Invalid paper status.';end if;
 if (a.student_ids is not null and not p_user=any(a.student_ids)) or not exists(select 1 from public.course_students cs join public.students s on s.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Choose an assigned active student.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text||':'||p_user::text,0));
 select * into r from public.worksheet_receipts where assignment_id=p_id and user_id=p_user for update;
 if found and r.version=p_version+1 and r.state=p_state then return to_jsonb(r);end if;
 if coalesce(r.version,0)<>p_version then raise exception 'Paper status changed. Reload before saving.';end if;
 insert into public.worksheet_receipts(assignment_id,user_id,state,version,recorded_by) values(p_id,p_user,p_state,p_version+1,p_actor)
 on conflict(assignment_id,user_id) do update set state=excluded.state,version=excluded.version,recorded_by=excluded.recorded_by,recorded_at=now() returning * into r;
 insert into public.worksheet_receipt_history(assignment_id,user_id,state,version,recorded_by) values(p_id,p_user,p_state,r.version,p_actor);
 return to_jsonb(r);
end $$;

create function public.update_worksheet_pair(p_id uuid,p_version integer,p_due timestamptz,p_quiz_due timestamptz,p_status text,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.worksheet_assignments;q public.quiz_assignments;
begin
 select w.* into a from public.worksheet_assignments w join public.courses c on c.id=w.course_id where w.id=p_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for update of w;
 if not found then raise exception 'Worksheet unavailable for this class.';end if;
 select * into q from public.quiz_assignments where id=a.quiz_id for update;
 if q.deleted_at is not null then raise exception 'The paired quiz is unavailable.';end if;
 if p_due is null or p_quiz_due is null or p_due>p_quiz_due or p_status not in ('published','archived') then raise exception 'Choose both deadlines with the quiz after paper hand-in.';end if;
 if a.version=p_version+1 and a.due_at=p_due and q.due_at=p_quiz_due and a.status=p_status and q.status=p_status then return to_jsonb(a);end if;
 if a.version<>p_version then raise exception 'This worksheet changed. Reload before saving.';end if;
 update public.quiz_assignments set due_at=p_quiz_due,status=p_status,version=version+1,updated_at=now() where id=q.id;
 update public.worksheet_assignments set due_at=p_due,status=p_status,version=version+1,updated_at=now() where id=a.id returning * into a;
 return to_jsonb(a);
end $$;
revoke all on function public.assign_worksheet_pair(uuid,text,integer,text,timestamptz,text,jsonb,text,text),public.record_worksheet_receipt(uuid,uuid,text,integer,text,text),public.update_worksheet_pair(uuid,integer,timestamptz,timestamptz,text,text,text) from public,anon,authenticated;
grant execute on function public.assign_worksheet_pair(uuid,text,integer,text,timestamptz,text,jsonb,text,text),public.record_worksheet_receipt(uuid,uuid,text,integer,text,text),public.update_worksheet_pair(uuid,integer,timestamptz,timestamptz,text,text,text) to service_role;
