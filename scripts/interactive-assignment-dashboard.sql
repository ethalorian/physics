alter table public.interactive_assignments add column due_on date;
create table public.interactive_assignment_ai_reviews (
 submission_id uuid primary key references public.interactive_assignment_submissions(id),
 status text not null default 'queued' check(status in ('queued','processing','ready','error')),
 result jsonb, model text, rubric_version text not null default 'velocity-v1',
 attempts integer not null default 0, lock_id uuid, locked_until timestamptz,
 error text, input_tokens integer, output_tokens integer,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'ready' or result is not null)
);
alter table public.interactive_assignment_ai_reviews enable row level security;
revoke all on public.interactive_assignment_ai_reviews from public,anon,authenticated;
grant select,insert,update on public.interactive_assignment_ai_reviews to service_role;
create function public.queue_interactive_assignment_ai() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 insert into interactive_assignment_ai_reviews(submission_id) values(new.id) on conflict do nothing;
 return new;
end $$;
create trigger interactive_assignment_ai_queue after insert on public.interactive_assignment_submissions for each row execute function public.queue_interactive_assignment_ai();
-- Older submissions stay available for teacher review; only current unrated snapshots need analysis.
insert into public.interactive_assignment_ai_reviews(submission_id)
 select s.id from public.interactive_assignment_submissions s join public.interactive_assignment_work w on w.assignment_id=s.assignment_id and w.user_id=s.user_id and w.version=s.version and w.status='submitted'
 where not exists(select 1 from public.interactive_assignment_reviews r where r.submission_id=s.id);
create function public.claim_interactive_assignment_ai(p_submission uuid,p_retry boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare j interactive_assignment_ai_reviews; snapshot jsonb;
begin
 select s.state into snapshot from interactive_assignment_submissions s join interactive_assignment_work w on w.assignment_id=s.assignment_id and w.user_id=s.user_id and w.version=s.version and w.status='submitted'
 join interactive_assignments a on a.id=s.assignment_id join courses c on c.id=a.course_id and c.archived_at is null
 join course_students cs on cs.course_id=a.course_id and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE'
 where s.id=p_submission and not exists(select 1 from interactive_assignment_reviews r where r.submission_id=s.id);
 if not found then return null; end if;
 update interactive_assignment_ai_reviews set status='processing',attempts=attempts+1,lock_id=gen_random_uuid(),locked_until=now()+interval '3 minutes',error=null,updated_at=now()
 where submission_id=p_submission and (status='queued' or (status='processing' and locked_until<now()) or (p_retry and status='error')) returning * into j;
 if not found then return null; end if;
 return jsonb_build_object('submission_id',j.submission_id,'lock_id',j.lock_id,'state',snapshot);
end $$;
create function public.finish_interactive_assignment_ai(p_submission uuid,p_lock uuid,p_result jsonb,p_model text,p_input integer,p_output integer,p_error text)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 update interactive_assignment_ai_reviews set status=case when p_error is null and p_result is not null then 'ready' else 'error' end,result=p_result,model=p_model,input_tokens=p_input,output_tokens=p_output,error=p_error,locked_until=null,lock_id=null,updated_at=now()
 where submission_id=p_submission and lock_id=p_lock and status='processing';
 return found;
end $$;
revoke all on function public.queue_interactive_assignment_ai(),public.claim_interactive_assignment_ai(uuid,boolean),public.finish_interactive_assignment_ai(uuid,uuid,jsonb,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.queue_interactive_assignment_ai(),public.claim_interactive_assignment_ai(uuid,boolean),public.finish_interactive_assignment_ai(uuid,uuid,jsonb,text,integer,integer,text) to service_role;
