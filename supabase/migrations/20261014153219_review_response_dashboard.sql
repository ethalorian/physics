create table public.review_module_scores (
 module_slug text not null,
 user_id uuid not null,
 work_version integer not null,
 work_status text not null check(work_status in ('draft','submitted')),
 response_snapshot jsonb not null,
 rubric_version text not null,
 status text not null default 'queued' check(status in ('queued','running','ready','error')),
 result jsonb,
 overrides jsonb not null default '{}',
 score numeric(5,2) check(score between 0 and 100),
 model text,
 input_tokens integer not null default 0,
 output_tokens integer not null default 0,
 attempts integer not null default 0,
 error text,
 lock_id uuid,
 lease_until timestamptz,
 revision integer not null default 0,
 graded_at timestamptz,
 updated_at timestamptz not null default now(),
 primary key(module_slug,user_id),
 foreign key(module_slug,user_id) references public.review_module_work(module_slug,user_id) on delete cascade,
 check(jsonb_typeof(response_snapshot)='object' and octet_length(response_snapshot::text)<=200000),
 check(result is null or (jsonb_typeof(result)='object' and octet_length(result::text)<=100000)),
 check(jsonb_typeof(overrides)='object' and octet_length(overrides::text)<=100000)
);
create index review_module_scores_queue_idx on public.review_module_scores(status,updated_at);
alter table public.review_module_scores enable row level security;
revoke all on public.review_module_scores from public,anon,authenticated;
grant all on public.review_module_scores to service_role;

create function public.queue_review_scores(p_slugs text[],p_users uuid[],p_drafts boolean default false,p_retry boolean default false)
returns integer language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
 insert into review_module_scores as g(module_slug,user_id,work_version,work_status,response_snapshot,rubric_version)
 select w.module_slug,w.user_id,w.version,w.status,w.state->'responses','review-v1' from review_module_work w
 where w.module_slug=any(p_slugs) and w.user_id=any(p_users) and (w.status='submitted' or p_drafts)
 and exists(select 1 from jsonb_each_text(w.state->'responses') r where length(btrim(r.value))>0)
 on conflict(module_slug,user_id) do update set work_version=excluded.work_version,work_status=excluded.work_status,response_snapshot=excluded.response_snapshot,rubric_version=excluded.rubric_version,status='queued',result=null,overrides='{}',score=null,error=null,lock_id=null,lease_until=null,attempts=0,graded_at=null,updated_at=now(),revision=g.revision+1
 where g.response_snapshot<>excluded.response_snapshot or g.work_status<>excluded.work_status or g.rubric_version<>excluded.rubric_version or (p_retry and (g.status='error' or (g.status='running' and g.lease_until<now())));
 get diagnostics n=row_count;
 return n;
end $$;
create function public.claim_review_score(p_slugs text[],p_users uuid[])
returns setof public.review_module_scores language plpgsql security invoker set search_path=public as $$
declare job review_module_scores;
begin
 select g.* into job from review_module_scores g join review_module_work w using(module_slug,user_id)
 where g.module_slug=any(p_slugs) and g.user_id=any(p_users) and g.attempts<3
 and (g.status='queued' or (g.status='running' and g.lease_until<now()))
 and g.response_snapshot=w.state->'responses' and g.work_status=w.status
 order by case when w.status='submitted' then 0 else 1 end,g.updated_at for update of g skip locked limit 1;
 if not found then return;end if;
 return query update review_module_scores g set status='running',lock_id=gen_random_uuid(),lease_until=now()+interval '3 minutes',attempts=g.attempts+1,updated_at=now()
 where g.module_slug=job.module_slug and g.user_id=job.user_id returning g.*;
end $$;
create function public.finish_review_score(p_slug text,p_user uuid,p_lock uuid,p_result jsonb,p_score numeric,p_model text,p_input integer,p_output integer,p_error text default null)
returns boolean language plpgsql security invoker set search_path=public as $$
declare job review_module_scores;current_work review_module_work;
begin
 select * into job from review_module_scores where module_slug=p_slug and user_id=p_user and lock_id=p_lock for update;
 if not found then return false;end if;
 select * into current_work from review_module_work where module_slug=p_slug and user_id=p_user for share;
 if job.response_snapshot<>current_work.state->'responses' or job.work_status<>current_work.status then
 update review_module_scores set status='error',error='Responses changed during analysis. Analyze the latest responses.',lease_until=null,lock_id=null,updated_at=now() where module_slug=p_slug and user_id=p_user;
 return false;
 end if;
 update review_module_scores set status=case when p_error is null then 'ready' else 'error' end,result=p_result,score=p_score,model=p_model,input_tokens=p_input,output_tokens=p_output,error=p_error,lease_until=null,lock_id=null,graded_at=case when p_error is null then now() else null end,updated_at=now(),revision=revision+1 where module_slug=p_slug and user_id=p_user;
 return true;
end $$;
revoke all on function public.queue_review_scores(text[],uuid[],boolean,boolean),public.claim_review_score(text[],uuid[]),public.finish_review_score(text,uuid,uuid,jsonb,numeric,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.queue_review_scores(text[],uuid[],boolean,boolean),public.claim_review_score(text[],uuid[]),public.finish_review_score(text,uuid,uuid,jsonb,numeric,text,integer,integer,text) to service_role;
