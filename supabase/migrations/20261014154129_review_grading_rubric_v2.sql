drop function public.queue_review_scores(text[],uuid[],boolean,boolean);
create function public.queue_review_scores(p_slugs text[],p_users uuid[],p_drafts boolean default false,p_retry boolean default false,p_rubric text default 'review-v1')
returns integer language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
 insert into review_module_scores as g(module_slug,user_id,work_version,work_status,response_snapshot,rubric_version)
 select w.module_slug,w.user_id,w.version,w.status,w.state->'responses',p_rubric from review_module_work w
 where w.module_slug=any(p_slugs) and w.user_id=any(p_users) and (w.status='submitted' or p_drafts)
 and exists(select 1 from jsonb_each_text(w.state->'responses') r where length(btrim(r.value))>0)
 on conflict(module_slug,user_id) do update set work_version=excluded.work_version,work_status=excluded.work_status,response_snapshot=excluded.response_snapshot,rubric_version=excluded.rubric_version,status='queued',result=null,overrides='{}',score=null,error=null,lock_id=null,lease_until=null,attempts=0,graded_at=null,updated_at=now(),revision=g.revision+1
 where g.response_snapshot<>excluded.response_snapshot or g.work_status<>excluded.work_status or g.rubric_version<>excluded.rubric_version or (p_retry and (g.status='error' or (g.status='running' and g.lease_until<now())));
 get diagnostics n=row_count;
 return n;
end $$;

revoke all on function public.queue_review_scores(text[],uuid[],boolean,boolean,text) from public,anon,authenticated;
grant execute on function public.queue_review_scores(text[],uuid[],boolean,boolean,text) to service_role;
notify pgrst,'reload schema';
