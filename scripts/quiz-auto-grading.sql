-- Claude grades are private evidence for teacher review; these functions never write mastery.
create table public.quiz_ai_reviews (
 submission_id uuid primary key references public.quiz_submissions(id),
 status text not null default 'queued' check(status in ('queued','processing','ready','error')),
 result jsonb, model text, rubric_version text not null default 'quiz-points-v1',
 attempts integer not null default 0,lock_id uuid,locked_until timestamptz,error text,
 input_tokens integer,output_tokens integer,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(status<>'ready' or result is not null)
);
alter table public.quiz_ai_reviews enable row level security;
revoke all on public.quiz_ai_reviews from public,anon,authenticated;
grant select,insert,update on public.quiz_ai_reviews to service_role;
create function public.queue_quiz_ai() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 insert into public.quiz_ai_reviews(submission_id) values(new.id) on conflict do nothing;
 return new;
end $$;
create trigger quiz_ai_queue after insert on public.quiz_submissions for each row execute function public.queue_quiz_ai();
insert into public.quiz_ai_reviews(submission_id)
 select s.id from public.quiz_submissions s join public.quiz_work w on w.submission_id=s.id and w.state='submitted'
 where not exists(select 1 from public.quiz_reviews r where r.submission_id=s.id)
 on conflict do nothing;
create function public.claim_quiz_ai(p_submission uuid,p_retry boolean default false)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare j public.quiz_ai_reviews;s public.quiz_submissions;
begin
 select sub.* into s from public.quiz_submissions sub
 join public.quiz_work w on w.quiz_id=sub.quiz_id and w.user_id=sub.user_id and w.submission_id=sub.id and w.state='submitted'
 join public.quiz_assignments a on a.id=sub.quiz_id and a.deleted_at is null
 join public.courses c on c.id=a.course_id and c.archived_at is null
 join public.course_students cs on cs.course_id=a.course_id and cs.student_id=sub.user_id and cs.enrollment_state='ACTIVE'
 join public.students st on st.id=sub.user_id and st.is_active is not false
 where sub.id=p_submission and (a.student_ids is null or sub.user_id=any(a.student_ids))
 and not exists(select 1 from public.quiz_reviews r where r.submission_id=sub.id);
 if not found then return null;end if;
 update public.quiz_ai_reviews set status='processing',attempts=attempts+1,lock_id=gen_random_uuid(),locked_until=now()+interval '4 minutes',error=null,updated_at=now()
 where submission_id=s.id and (status='queued' or (status='processing' and locked_until<now()) or (p_retry and status='error')) returning * into j;
 if not found then return null;end if;
 return jsonb_build_object('lock_id',j.lock_id,'snapshot',s.snapshot,'answers',s.answers);
end $$;
create function public.finish_quiz_ai(p_submission uuid,p_lock uuid,p_result jsonb,p_model text,p_input integer,p_output integer,p_error text)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 update public.quiz_ai_reviews set status=case when p_error is null and p_result is not null then 'ready' else 'error' end,
 result=p_result,model=p_model,input_tokens=p_input,output_tokens=p_output,error=p_error,locked_until=null,lock_id=null,updated_at=now()
 where submission_id=p_submission and lock_id=p_lock and status='processing';
 return found;
end $$;
revoke all on function public.queue_quiz_ai(),public.claim_quiz_ai(uuid,boolean),public.finish_quiz_ai(uuid,uuid,jsonb,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.queue_quiz_ai(),public.claim_quiz_ai(uuid,boolean),public.finish_quiz_ai(uuid,uuid,jsonb,text,integer,integer,text) to service_role;
