-- Independent paper assignments. No sequence, quiz, mastery, or AI-grading triggers.
create table public.student_choice_assignments (
 id uuid primary key, course_id uuid not null references public.courses(id),
 unit_id text not null references public.units(id), day integer not null check(day>0),
 edition text not null check(edition in ('cpa','honors')), title text not null,
 packet_key text not null, packet_version text not null,
 due_at timestamptz not null, status text not null default 'published' check(status in ('published','archived')),
 version integer not null default 1 check(version>0), created_by text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index student_choice_course_due on public.student_choice_assignments(course_id,due_at,id);
create table public.student_choice_reviews (
 assignment_id uuid not null references public.student_choice_assignments(id), user_id uuid not null references public.students(id),
 state text not null check(state in ('received','not_received','excused')),
 letter_grade text check(letter_grade in ('A+','A','A−','B+','B','B−','C+','C','C−','D+','D','D−','F')),
 feedback text not null default '' check(length(feedback)<=3000), version integer not null check(version>0),
 recorded_by text not null, recorded_at timestamptz not null default now(), primary key(assignment_id,user_id),
 check(letter_grade is null or state='received')
);
create table public.student_choice_review_history (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.student_choice_assignments(id),
 user_id uuid not null references public.students(id), state text not null, letter_grade text, feedback text not null,
 version integer not null, recorded_by text not null, recorded_at timestamptz not null default now(), unique(assignment_id,user_id,version)
);
alter table public.student_choice_assignments enable row level security;
alter table public.student_choice_reviews enable row level security;
alter table public.student_choice_review_history enable row level security;
revoke all on public.student_choice_assignments,public.student_choice_reviews,public.student_choice_review_history from public,anon,authenticated,service_role;
grant select,insert,update on public.student_choice_assignments,public.student_choice_reviews to service_role;
grant select,insert on public.student_choice_review_history to service_role;

create function public.save_student_choice_assignment(p_id uuid,p_course uuid,p_packet text,p_packet_version text,p_unit text,p_day integer,p_edition text,p_title text,p_due timestamptz,p_status text,p_version integer,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.student_choice_assignments;
begin
 if p_actor is null or btrim(p_actor)='' or not exists(select 1 from public.courses where id=p_course and lower(teacher_email)=lower(p_owner) and program='physics' and archived_at is null) then raise exception 'Choose your own active Physics class.';end if;
 if p_due is null or p_status is null or p_status not in ('published','archived') or p_version is null or p_version<0 or p_day is null or p_day<1 or p_edition is null or p_edition not in ('cpa','honors') or p_packet is null or p_packet_version is null or p_title is null or btrim(p_title)='' then raise exception 'Invalid Student Choice assignment.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into a from public.student_choice_assignments where id=p_id for update;
 if found then
  if a.course_id<>p_course or a.packet_key<>p_packet or a.packet_version<>p_packet_version or a.unit_id<>p_unit or a.day<>p_day or a.edition<>p_edition or a.title<>p_title then raise exception 'An assigned page edition cannot be replaced. Create a new assignment.';end if;
  if a.version=p_version+1 and a.due_at=p_due and a.status=p_status then return to_jsonb(a);end if;
  if a.version<>p_version then raise exception 'This assignment changed. Reload before saving.';end if;
  update public.student_choice_assignments set due_at=p_due,status=p_status,version=version+1,updated_at=now() where id=p_id returning * into a;
 else
  if p_version<>0 or p_status<>'published' then raise exception 'Reload before saving.';end if;
  insert into public.student_choice_assignments(id,course_id,unit_id,day,edition,title,packet_key,packet_version,due_at,status,created_by)
  values(p_id,p_course,p_unit,p_day,p_edition,p_title,p_packet,p_packet_version,p_due,p_status,p_actor) returning * into a;
 end if;
 return to_jsonb(a);
end $$;

create function public.record_student_choice_review(p_id uuid,p_user uuid,p_state text,p_letter text,p_feedback text,p_version integer,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.student_choice_assignments;r public.student_choice_reviews;
begin
 select w.* into a from public.student_choice_assignments w join public.courses c on c.id=w.course_id where w.id=p_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for share of w,c;
 if not found then raise exception 'Student Choice unavailable for this class.';end if;
 if a.status<>'published' then raise exception 'Restore the assignment before changing its review.';end if;
 if p_actor is null or btrim(p_actor)='' or p_state is null or p_state not in ('received','not_received','excused') or p_version is null or p_version<0 or p_feedback is null or length(p_feedback)>3000 then raise exception 'Invalid paper review.';end if;
 if p_letter is not null and (p_state<>'received' or p_letter not in ('A+','A','A−','B+','B','B−','C+','C','C−','D+','D','D−','F')) then raise exception 'Choose a letter grade after reviewing the received paper.';end if;
 if not exists(select 1 from public.course_students cs join public.students s on s.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Choose an assigned active student.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text||':'||p_user::text,0));
 select * into r from public.student_choice_reviews where assignment_id=p_id and user_id=p_user for update;
 if found and r.version=p_version+1 and r.state=p_state and r.letter_grade is not distinct from p_letter and r.feedback=p_feedback then return to_jsonb(r);end if;
 if coalesce(r.version,0)<>p_version then raise exception 'This review changed. Reload before saving.';end if;
 insert into public.student_choice_reviews(assignment_id,user_id,state,letter_grade,feedback,version,recorded_by)
 values(p_id,p_user,p_state,p_letter,p_feedback,p_version+1,p_actor)
 on conflict(assignment_id,user_id) do update set state=excluded.state,letter_grade=excluded.letter_grade,feedback=excluded.feedback,version=excluded.version,recorded_by=excluded.recorded_by,recorded_at=now() returning * into r;
 insert into public.student_choice_review_history(assignment_id,user_id,state,letter_grade,feedback,version,recorded_by) values(p_id,p_user,p_state,p_letter,p_feedback,r.version,p_actor);
 return to_jsonb(r);
end $$;
revoke all on function public.save_student_choice_assignment(uuid,uuid,text,text,text,integer,text,text,timestamptz,text,integer,text,text),public.record_student_choice_review(uuid,uuid,text,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.save_student_choice_assignment(uuid,uuid,text,text,text,integer,text,text,timestamptz,text,integer,text,text),public.record_student_choice_review(uuid,uuid,text,text,text,integer,text,text) to service_role;
