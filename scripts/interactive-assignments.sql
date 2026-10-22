create table public.interactive_assignments (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id),
 slug text not null check(slug='day-3-velocity'), target_id uuid not null references public.learning_targets(id),
 created_at timestamptz not null default now(), unique(course_id,slug)
);
create table public.interactive_assignment_work (
 assignment_id uuid not null references public.interactive_assignments(id), user_id uuid not null references public.students(id),
 state jsonb not null default '{}'::jsonb, version integer not null default 0, status text not null default 'draft' check(status in ('draft','submitted')),
 updated_at timestamptz not null default now(), primary key(assignment_id,user_id)
);
create table public.interactive_assignment_submissions (
 id uuid primary key, assignment_id uuid not null references public.interactive_assignments(id), user_id uuid not null references public.students(id),
 state jsonb not null, version integer not null, submitted_at timestamptz not null default now(), unique(assignment_id,user_id,version)
);
create table public.interactive_assignment_reviews (
 id uuid primary key, submission_id uuid not null unique references public.interactive_assignment_submissions(id),
 level smallint not null check(level between 1 and 3), feedback text not null default '' check(length(feedback)<=1600), reviewer_email text not null,
 record_id uuid not null references public.mastery_records(id), created_at timestamptz not null default now()
);
create index interactive_assignment_work_user on public.interactive_assignment_work(user_id);
create index interactive_assignment_submissions_user on public.interactive_assignment_submissions(user_id,assignment_id,submitted_at desc);
alter table public.interactive_assignments enable row level security;
alter table public.interactive_assignment_work enable row level security;
alter table public.interactive_assignment_submissions enable row level security;
alter table public.interactive_assignment_reviews enable row level security;
revoke all on public.interactive_assignments,public.interactive_assignment_work,public.interactive_assignment_submissions,public.interactive_assignment_reviews from public,anon,authenticated;
grant select,insert,update on public.interactive_assignments,public.interactive_assignment_work,public.interactive_assignment_submissions,public.interactive_assignment_reviews to service_role;

create function public.write_interactive_assignment(p_assignment uuid,p_user uuid,p_version integer,p_state jsonb,p_submit uuid default null)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare w interactive_assignment_work; prior interactive_assignment_submissions;
begin
 if not exists(select 1 from interactive_assignments a join course_students cs on cs.course_id=a.course_id join courses c on c.id=a.course_id where a.id=p_assignment and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and c.archived_at is null) then raise exception 'Assignment unavailable'; end if;
 if p_submit is not null then
  select * into prior from interactive_assignment_submissions where id=p_submit;
  if found then
   if prior.user_id<>p_user or prior.assignment_id<>p_assignment then raise exception 'Submission conflict'; end if;
   return jsonb_build_object('version',prior.version,'status','submitted','submission_id',prior.id);
  end if;
 end if;
 insert into interactive_assignment_work(assignment_id,user_id) values(p_assignment,p_user) on conflict do nothing;
 select * into w from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user for update;
 if w.version<>p_version or w.status='submitted' then raise exception 'Your saved work changed. Reload before continuing.'; end if;
 update interactive_assignment_work set state=p_state,version=version+1,status=case when p_submit is null then 'draft' else 'submitted' end,updated_at=now() where assignment_id=p_assignment and user_id=p_user returning * into w;
 if p_submit is not null then insert into interactive_assignment_submissions(id,assignment_id,user_id,state,version) values(p_submit,p_assignment,p_user,p_state,w.version); end if;
 return jsonb_build_object('version',w.version,'status',w.status,'submission_id',p_submit);
end $$;

create function public.rate_interactive_assignment(p_id uuid,p_submission uuid,p_reviewer text,p_level smallint,p_feedback text,p_admin boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare s interactive_assignment_submissions; a interactive_assignments; r interactive_assignment_reviews; record uuid; w interactive_assignment_work;
begin
 if p_level not between 1 and 3 or length(p_feedback)>1600 then raise exception 'Invalid rating'; end if;
 select * into s from interactive_assignment_submissions where id=p_submission;
 if not found then raise exception 'Submission unavailable'; end if;
 select * into a from interactive_assignments where id=s.assignment_id;
 if not exists(select 1 from courses c join course_students cs on cs.course_id=c.id where c.id=a.course_id and (p_admin or lower(c.teacher_email)=lower(p_reviewer)) and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE') then raise exception 'Only the teacher of this class can rate this work'; end if;
 select * into w from interactive_assignment_work where assignment_id=s.assignment_id and user_id=s.user_id for update;
 select * into r from interactive_assignment_reviews where submission_id=p_submission;
 if found then
  if r.id=p_id and r.reviewer_email=p_reviewer then return to_jsonb(r); end if;
  raise exception 'This submission already has a rating. Reload to see it.';
 end if;
 if w.status<>'submitted' or w.version<>s.version then raise exception 'A newer revision exists. Review the current submission.'; end if;
 insert into mastery_records(user_id,target_id,level,rated_by,evidence_source)
 values(s.user_id,a.target_id,p_level,p_reviewer,'Interactive lesson assignment · Day 3 Velocity · submission '||s.id::text) returning id into record;
 insert into interactive_assignment_reviews(id,submission_id,level,feedback,reviewer_email,record_id) values(p_id,s.id,p_level,p_feedback,p_reviewer,record) returning * into r;
 return to_jsonb(r);
end $$;

create function public.reopen_interactive_assignment(p_assignment uuid,p_user uuid,p_version integer,p_reviewer text,p_admin boolean default false)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id where a.id=p_assignment and (p_admin or lower(c.teacher_email)=lower(p_reviewer)) and cs.student_id=p_user and cs.enrollment_state='ACTIVE') then raise exception 'Only the teacher of this class can return this work'; end if;
 update interactive_assignment_work set status='draft',version=version+1,updated_at=now() where assignment_id=p_assignment and user_id=p_user and version=p_version and status='submitted';
 if not found then raise exception 'Work changed. Reload before returning it.'; end if;
end $$;
revoke all on function public.write_interactive_assignment(uuid,uuid,integer,jsonb,uuid),public.rate_interactive_assignment(uuid,uuid,text,smallint,text,boolean),public.reopen_interactive_assignment(uuid,uuid,integer,text,boolean) from public,anon,authenticated;
grant execute on function public.write_interactive_assignment(uuid,uuid,integer,jsonb,uuid),public.rate_interactive_assignment(uuid,uuid,text,smallint,text,boolean),public.reopen_interactive_assignment(uuid,uuid,integer,text,boolean) to service_role;
