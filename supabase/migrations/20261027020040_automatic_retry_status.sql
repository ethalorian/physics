-- Distinguish first attempts still preparing from failed attempts being retried.
create or replace function public.automatic_grading_status(p_owner_emails text[]) returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 with candidates as (select distinct c.source,c.source_id,c.version,c.status from automatic_grading_candidates() c where c.teacher_email=any(p_owner_emails)), waiting as (select c.*,j.attempts,j.status job_status from candidates c left join automatic_grading_jobs j using(source,source_id,version) where c.status<>'ready')
 select jsonb_build_object('enabled',exists(select 1 from automatic_grading_settings where teacher_email=any(p_owner_emails) and enabled),'waiting',(select count(*) from waiting),'retrying',(select count(*) from waiting where (job_status='queued' and attempts>0 or job_status='running' and attempts>1)),'attention',(select count(*) from waiting where job_status='attention'),'lastStartedAt',(select last_started_at from automatic_grading_heartbeat where id),'lastFinishedAt',(select last_finished_at from automatic_grading_heartbeat where id))
$$;
revoke all on function public.automatic_grading_status(text[]) from public,anon,authenticated;
grant execute on function public.automatic_grading_status(text[]) to service_role;

