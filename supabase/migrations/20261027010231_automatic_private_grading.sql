-- Durable private analysis. No automatic path writes grades or mastery.
create table public.automatic_grading_settings(teacher_email text primary key check(teacher_email=lower(teacher_email)),enabled boolean not null default false);
create table public.automatic_grading_jobs(source text not null,source_id text not null,version text not null,user_id uuid not null references public.students(id),status text not null default 'queued' check(status in ('queued','running','ready','attention','obsolete')),attempts integer not null default 0,next_attempt_at timestamptz not null default now(),lock_id uuid,lease_until timestamptz,last_error text,updated_at timestamptz not null default now(),primary key(source,source_id,version));
create index automatic_grading_pending on public.automatic_grading_jobs(next_attempt_at) where status in ('queued','running');
create table public.automatic_grading_heartbeat(id boolean primary key default true check(id),last_started_at timestamptz,last_finished_at timestamptz);
alter table public.automatic_grading_settings enable row level security; revoke all on public.automatic_grading_settings from public,anon,authenticated; grant select,insert,update on public.automatic_grading_settings to service_role;
alter table public.automatic_grading_jobs enable row level security; revoke all on public.automatic_grading_jobs from public,anon,authenticated; grant select,insert,update on public.automatic_grading_jobs to service_role;
alter table public.automatic_grading_heartbeat enable row level security; revoke all on public.automatic_grading_heartbeat from public,anon,authenticated; grant select,insert,update on public.automatic_grading_heartbeat to service_role;
alter table public.assessment_suggestions drop constraint assessment_suggestions_source_check;
alter table public.assessment_suggestions add constraint assessment_suggestions_source_check check(source in ('lesson','reading','math','presentation','choice','vocabulary','checkpoint','review','mission'));
create function public.automatic_grading_candidates() returns table(source text,source_id text,version text,user_id uuid,teacher_email text,status text,locked_until timestamptz,submitted_at timestamptz) language sql stable security invoker set search_path=public,pg_temp as $$
with roster as (select distinct cs.student_id,c.id course_id,lower(c.teacher_email) teacher_email,c.program from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id join public.automatic_grading_settings cfg on cfg.teacher_email=lower(c.teacher_email) and cfg.enabled where cs.enrollment_state='ACTIVE' and c.archived_at is null and st.is_active is not false)
select distinct * from (select 'quiz'::text source,s.id::text source_id,s.id::text version,s.user_id,r.teacher_email,coalesce(ai.status,'queued') status,ai.locked_until,s.submitted_at from public.quiz_submissions s join public.quiz_work w on w.submission_id=s.id and w.state='submitted' join public.quiz_assignments a on a.id=s.quiz_id and a.deleted_at is null and a.status='published' join roster r on r.course_id=a.course_id and r.student_id=s.user_id left join public.quiz_ai_reviews ai on ai.submission_id=s.id where (a.student_ids is null or s.user_id=any(a.student_ids)) and not exists(select 1 from public.quiz_reviews rev where rev.submission_id=s.id)
union all
select 'interactive',s.id::text,s.id::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.submitted_at from public.interactive_assignment_submissions s join public.interactive_assignment_work w on w.assignment_id=s.assignment_id and w.user_id=s.user_id and w.version=s.version and w.status='submitted' join public.interactive_assignments a on a.id=s.assignment_id and a.due_on is not null join roster r on r.course_id=a.course_id and r.student_id=s.user_id left join public.interactive_assignment_ai_reviews ai on ai.submission_id=s.id where not exists(select 1 from public.simulation_lab_grades g where g.submission_id=s.id)
union all
select 'review',w.module_slug||':'||w.user_id,w.version::text,w.user_id,r.teacher_email,case when ai.status='ready' and ai.response_snapshot=w.state->'responses' and ai.work_status=w.status and sug.status='ready' then 'ready' when ai.status='running' and ai.lease_until>now() then 'processing' else 'queued' end,ai.lease_until,w.submitted_at from public.review_module_work w join public.review_module_assignments a on a.slug=w.module_slug join roster r on r.course_id=any(a.course_ids) and r.student_id=w.user_id left join public.review_module_scores ai on ai.module_slug=w.module_slug and ai.user_id=w.user_id left join public.assessment_suggestions sug on sug.source='review' and sug.source_id=w.module_slug||':'||w.user_id and sug.version=w.version::text where w.status='submitted' and ai.released_at is null
union all
select 'reading',s.id::text,s.id::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.submitted_at from public.textbook_submissions s join public.textbook_work w on w.submission_id=s.id and w.state='submitted' join public.textbook_assignments a on a.id=s.assignment_id and a.status='published' join roster r on r.course_id=a.course_id and r.student_id=s.user_id left join public.assessment_suggestions ai on ai.source='reading' and ai.source_id=s.id::text where not exists(select 1 from public.textbook_reviews rev where rev.submission_id=s.id) and not exists(select 1 from public.textbook_reading_exemptions e where e.assignment_id=a.id and e.user_id=s.user_id)
union all
select 'lesson',s.id::text,s.id::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.submitted_at from public.lesson_submissions s join public.lessons l on l.id=s.lesson_id and l.published join roster r on r.student_id=s.user_id and exists(select 1 from public.units u where u.id=l.unit_id and coalesce(u.program,'physics')=coalesce(r.program,'physics')) join public.lesson_class_windows win on win.lesson_id=s.lesson_id::text and win.course_id=r.course_id::text and win.due_at is not null left join public.assessment_suggestions ai on ai.source='lesson' and ai.source_id=s.id::text where not exists(select 1 from public.lesson_submissions newer where newer.lesson_id=s.lesson_id and newer.user_id=s.user_id and (newer.submitted_at,newer.id)>(s.submitted_at,s.id)) and not exists(select 1 from public.lesson_reviews rev where rev.submission_id=s.id)
union all
select 'math',s.id::text,coalesce(rev.id,s.id)::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,coalesce(rev.submitted_at,s.submitted_at) from public.math_warmup_submissions s join roster r on r.student_id=s.user_id left join public.math_warmup_revisions rev on rev.submission_id=s.id and rev.status='pending' left join public.assessment_suggestions ai on ai.source='math' and ai.source_id=s.id::text and ai.version::timestamptz=coalesce(rev.submitted_at,s.submitted_at) where s.reviewed_at is null and s.status='pending' or rev.id is not null
union all
select 'presentation',s.id::text,s.id::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.created_at from public.present_ticket_responses s join public.present_pulses p on p.id=s.pulse_id and p.target_id is not null join public.present_sessions a on a.id=p.session_id join roster r on r.course_id=a.course_id and r.student_id=s.user_id left join public.assessment_suggestions ai on ai.source='presentation' and ai.source_id=s.id::text
union all
select 'choice',s.section_id||':'||s.option_id||':'||s.user_id,s.artifact_version::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.artifact_submitted_at from public.choice_selections s join public.choice_sections a on a.id=s.section_id and a.published join roster r on r.course_id=a.course_id and r.student_id=s.user_id left join public.assessment_suggestions ai on ai.source='choice' and ai.source_id=s.section_id||':'||s.option_id||':'||s.user_id and ai.version=s.artifact_version::text where s.selected and s.artifact_submitted_at is not null and s.graded_by is null
union all
select 'vocabulary',s.id::text,s.id::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.completed_at from public.vocab_checks s join public.vocab_tasks a on a.id=s.task_id and a.active and not a.syllabus_draft and a.quiz_format is distinct from 'checkpoint' join roster r on r.course_id=a.course_id and r.student_id=s.user_id left join public.assessment_suggestions ai on ai.source='vocabulary' and ai.source_id=s.id::text where s.completed_at is not null and s.reviewed_at is null and s.user_id=any(a.student_ids) and not exists(select 1 from public.vocab_checks newer where newer.task_id=s.task_id and newer.user_id=s.user_id and newer.completed_at>s.completed_at)
union all
select 'checkpoint',s.id::text,s.id::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.submitted_at from public.vocab_checkpoint_attempts s join public.vocab_tasks a on a.id=s.task_id and a.active and not a.syllabus_draft join roster r on r.course_id=a.course_id and r.student_id=s.user_id left join public.assessment_suggestions ai on ai.source='checkpoint' and ai.source_id=s.id::text where s.submitted_at is not null and s.released_at is null and s.user_id=any(a.student_ids) and not exists(select 1 from public.vocab_checkpoint_attempts newer where newer.task_id=s.task_id and newer.user_id=s.user_id and newer.number>s.number)
union all
select 'mission',s.id::text,s.id::text,s.user_id,r.teacher_email,coalesce(ai.status,'queued'),ai.locked_until,s.completed_at from public.math_mission_sessions s join public.math_mission_assignments a on a.id=s.assignment_id and a.cancelled_at is null join roster r on r.student_id=s.user_id and r.teacher_email=lower(a.teacher_email) left join public.assessment_suggestions ai on ai.source='mission' and ai.source_id=s.id::text where s.status='completed' and not s.staff and s.reviewed_at is null) candidates
$$;
create function public.claim_automatic_grading(p_limit integer default 6) returns setof public.automatic_grading_jobs language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 insert into automatic_grading_heartbeat(id,last_started_at) values(true,now()) on conflict(id) do update set last_started_at=now();
 insert into automatic_grading_jobs(source,source_id,version,user_id) select distinct source,source_id,version,user_id from automatic_grading_candidates() c where c.status<>'ready' on conflict do nothing;
 update automatic_grading_jobs set status='attention',lock_id=null,lease_until=null,last_error='Automatic retries exhausted. Review the work or retry after checking the issue.',updated_at=now() where status='running' and lease_until<now() and attempts>=6;
 return query with candidates as (select j.source,j.source_id,j.version from automatic_grading_jobs j where j.attempts<6 and j.next_attempt_at<=now() and (j.status='queued' or j.status='running' and j.lease_until<now()) and exists(select 1 from automatic_grading_candidates() c where c.source=j.source and c.source_id=j.source_id and c.version=j.version and c.status<>'ready' and (c.locked_until is null or c.locked_until<now())) order by j.next_attempt_at,j.updated_at,j.source,j.source_id for update of j skip locked limit greatest(0,least(p_limit,6)))
 update automatic_grading_jobs j set status='running',attempts=j.attempts+1,lock_id=gen_random_uuid(),lease_until=now()+interval '6 minutes',updated_at=now() from candidates c where j.source=c.source and j.source_id=c.source_id and j.version=c.version returning j.*;
 update automatic_grading_heartbeat set last_finished_at=now() where id and not exists(select 1 from automatic_grading_jobs where status='running' and lease_until>now());
end $$;
create function public.finish_automatic_grading(p_source text,p_id text,p_version text,p_lock uuid,p_error text default null) returns text language plpgsql security invoker set search_path=public,pg_temp as $$
declare j automatic_grading_jobs; c record; outcome text;
begin
 select * into j from automatic_grading_jobs where source=p_source and source_id=p_id and version=p_version and lock_id=p_lock and status='running' for update; if not found then return 'stale';end if;
 select * into c from automatic_grading_candidates() where source=p_source and source_id=p_id and version=p_version limit 1;
 outcome:=case when not found then 'obsolete' when c.status='ready' then 'ready' when j.attempts>=6 then 'attention' else 'queued' end;
 update automatic_grading_jobs set status=outcome,lock_id=null,lease_until=null,next_attempt_at=now()+make_interval(secs=>least(3600,60*power(2,greatest(0,j.attempts-1)))::integer),last_error=case when outcome in ('ready','obsolete') then null else left(coalesce(p_error,'Analysis is awaiting an automatic retry.'),250) end,updated_at=now() where source=p_source and source_id=p_id and version=p_version;
 update automatic_grading_heartbeat set last_finished_at=now() where id;return outcome;
end $$;
revoke all on function public.automatic_grading_candidates() from public,anon,authenticated;grant execute on function public.automatic_grading_candidates() to service_role;
revoke all on function public.claim_automatic_grading(integer) from public,anon,authenticated;grant execute on function public.claim_automatic_grading(integer) to service_role;
revoke all on function public.finish_automatic_grading(text,text,text,uuid,text) from public,anon,authenticated;grant execute on function public.finish_automatic_grading(text,text,text,uuid,text) to service_role;

-- Private teacher choices are separate from model output and the released snapshot.
alter table public.review_module_scores add column review_draft jsonb, add column released_review jsonb;
create or replace function public.invalidate_review_module_release() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.response_snapshot is distinct from old.response_snapshot or new.work_status is distinct from old.work_status then new.review_draft:=null;new.released_review:=null;end if;
 if new.result is distinct from old.result or new.overrides is distinct from old.overrides or new.response_snapshot is distinct from old.response_snapshot or new.work_status is distinct from old.work_status or new.status is distinct from old.status then new.released_at:=null;new.released_by:=null;end if;
 return new;
end $$;
create function public.review_module_decision(p_slug text,p_user uuid,p_revision integer,p_actor text,p_owner_emails text[],p_draft jsonb,p_release boolean default false)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare w public.review_module_work; s public.review_module_scores; targets jsonb; choice record; st public.students;
begin
 if not exists(select 1 from public.review_module_assignments a join public.course_students cs on cs.course_id=any(a.course_ids) join public.courses c on c.id=cs.course_id where a.slug=p_slug and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and lower(c.teacher_email)=any(p_owner_emails) and lower(a.owner_email)=any(p_owner_emails) and c.archived_at is null) then raise exception 'Teacher scope changed.';end if;
 select * into st from public.students where id=p_user and is_active is not false;if not found then raise exception 'Student is unavailable.';end if;
 select * into w from public.review_module_work where module_slug=p_slug and user_id=p_user for update;
 select * into s from public.review_module_scores where module_slug=p_slug and user_id=p_user for update;
 if s.status is distinct from 'ready' or w.status is distinct from 'submitted' or s.work_status is distinct from 'submitted' or s.revision is distinct from p_revision or s.response_snapshot is distinct from w.state->'responses' then raise exception 'Responses or scoring changed. Refresh before release.';end if;
 if p_draft is null or jsonb_typeof(p_draft)<>'object' or jsonb_typeof(p_draft->'summary') is distinct from 'string' or length(p_draft->>'summary')>2500 or jsonb_typeof(p_draft->'next_step') is distinct from 'string' or length(p_draft->>'next_step')>1000 or jsonb_typeof(p_draft->'feedback') is distinct from 'object' or jsonb_typeof(p_draft->'ratings') is distinct from 'object' then raise exception 'Choose valid mastery and feedback decisions.';end if;
 if exists(select 1 from jsonb_object_keys(p_draft) k where k not in ('summary','next_step','feedback','ratings')) then raise exception 'Invalid review fields.';end if;
 select a.targets into targets from public.assessment_suggestions a where a.source='review' and a.source_id=p_slug||':'||p_user and a.version=w.version::text;
 if targets is null then raise exception 'Mastery targets are not ready. Refresh the review.';end if;
 if exists(select 1 from jsonb_each(p_draft->'ratings') x where x.value not in ('1'::jsonb,'2'::jsonb,'3'::jsonb,'null'::jsonb) or not exists(select 1 from jsonb_array_elements(targets) t where t->>'id'=x.key)) then raise exception 'Invalid mastery decision.';end if;
 if exists(select 1 from jsonb_each(p_draft->'feedback') x where jsonb_typeof(x.value)<>'string' or length(x.value#>>'{}')>800 or not exists(select 1 from jsonb_array_elements(s.result->'items') i where i->>'id'=x.key)) then raise exception 'Invalid question feedback.';end if;
 if p_release and exists(select 1 from jsonb_array_elements(targets) t where not ((p_draft->'ratings') ? (t->>'id'))) then raise exception 'Choose a mastery rating or skip for every target.';end if;
 if s.released_at is not null then if s.released_review=p_draft then return true;else raise exception 'This review has already been released.';end if;end if;
 if p_release then
  for choice in select * from jsonb_each(p_draft->'ratings') where value<>'null'::jsonb loop
   insert into public.mastery_records(user_id,user_email,target_id,level,rated_by,evidence_source) values(p_user,st.email,choice.key::uuid,(choice.value#>>'{}')::smallint,p_actor,'review:'||p_slug||':'||w.version);
  end loop;
  update public.review_module_scores set review_draft=p_draft,released_review=p_draft,released_at=now(),released_by=p_actor,updated_at=now() where module_slug=p_slug and user_id=p_user;
 else
  update public.review_module_scores set review_draft=p_draft,revision=revision+1,updated_at=now() where module_slug=p_slug and user_id=p_user;
 end if;
 return true;
end $$;
revoke all on function public.review_module_decision(text,uuid,integer,text,text[],jsonb,boolean) from public,anon,authenticated;
grant execute on function public.review_module_decision(text,uuid,integer,text,text[],jsonb,boolean) to service_role;

-- Feedback is optional for a teacher-selected skip.
create or replace function public.release_simulation_lab_grade(
  p_submission uuid,p_request uuid,p_revision integer,p_reviewer text,p_admin boolean,
  p_rubric text,p_items jsonb,p_mastery jsonb,p_feedback text
) returns jsonb language plpgsql security invoker set search_path=public as $$
declare s interactive_assignment_submissions; a interactive_assignments; w interactive_assignment_work;
  g simulation_lab_grades; t interactive_assignment_templates; prior interactive_assignment_reviews;
  item jsonb; decision jsonb; target uuid; record uuid; total integer:=0; maximum integer:=0; lowest integer:=4;
begin
  select * into s from interactive_assignment_submissions where id=p_submission;
  if not found then raise exception 'Submission unavailable'; end if;
  select * into a from interactive_assignments where id=s.assignment_id;
  select * into t from interactive_assignment_templates where slug=a.slug;
  if (a.slug not like 'simulation-%' and not coalesce(t.is_lab,false)) or t.slug is null then raise exception 'Lab unavailable'; end if;
  if t.is_lab and p_rubric is distinct from 'lab-four-dimensions-v1' then raise exception 'Use the four-dimension rubric for this lab'; end if;
  if p_reviewer is null or not exists(select 1 from courses c join course_students cs on cs.course_id=c.id
    where c.id=a.course_id and c.archived_at is null and (p_admin or lower(c.teacher_email)=lower(p_reviewer))
    and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE') then raise exception 'Only the teacher of this class can release this work'; end if;
  select * into w from interactive_assignment_work where assignment_id=s.assignment_id and user_id=s.user_id for update;
  if w.status is distinct from 'submitted' or w.version is distinct from s.version or (case when exists(select 1 from daily_lesson_templates where foundation_slug=a.slug) then (w.state-'partner_exchange') is distinct from (s.state-'partner_exchange') else w.state is distinct from s.state end) then raise exception 'A newer revision exists. Reload the current submission'; end if;
  select * into g from simulation_lab_grades where submission_id=p_submission for update;
  if g.request_id=p_request then
    if g.items=p_items and g.mastery=p_mastery and g.feedback=p_feedback and g.rubric_version=p_rubric and lower(g.released_by)=lower(p_reviewer) then return to_jsonb(g); end if;
    raise exception 'Release request changed. Reload before continuing';
  end if;
  if p_revision is null or coalesce(g.revision,0)<>p_revision then raise exception 'The released grade changed. Reload before continuing'; end if;
  if p_request is null or p_rubric not in ('lab-response-v1','lab-four-dimensions-v1') or p_rubric is null or p_feedback is null or length(p_feedback)>1600
    or jsonb_typeof(p_items) is distinct from 'array' or jsonb_typeof(p_mastery) is distinct from 'array' then raise exception 'Invalid grade'; end if;
  if g.rubric_version='lab-four-dimensions-v1' and p_rubric<>'lab-four-dimensions-v1' then raise exception 'Use the four-dimension rubric to correct this grade'; end if;
  if p_rubric='lab-four-dimensions-v1' and jsonb_array_length(p_items)<>4 then raise exception 'Review all four dimensions'; end if;
  if jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>200 or
    (select count(distinct x->>'id') from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception 'Invalid score items'; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if not (item ?& array['id','earned','possible','feedback']) or jsonb_typeof(item->'earned')<>'number' or jsonb_typeof(item->'possible')<>'number'
      or (item->>'earned')!~'^[0-9]+$' or (item->>'possible') not in ('1','4')
      or (item->>'earned')::integer>(item->>'possible')::integer or jsonb_typeof(item->'feedback')<>'string' or length(item->>'feedback')>1200 then raise exception 'Invalid score item'; end if;
    if p_rubric='lab-four-dimensions-v1' then
      if item->>'id' not in ('science','reasoning','communication','transfer') or item->>'possible'<>'4' then raise exception 'Invalid rubric dimension'; end if;
      lowest=least(lowest,(item->>'earned')::integer);
    end if;
    total=total+(item->>'earned')::integer; maximum=maximum+(item->>'possible')::integer;
  end loop;
  if p_rubric='lab-four-dimensions-v1' then
    total=case lowest when 4 then 96 when 3 then 89 when 2 then 85 when 1 then 75 else 50 end;
    maximum=100;
  end if;
  if jsonb_array_length(p_mastery)<>cardinality(t.target_slugs) or
    (select count(distinct x->>'target_id') from jsonb_array_elements(p_mastery) x)<>cardinality(t.target_slugs) then raise exception 'Review every mastery target'; end if;
  for decision in select value from jsonb_array_elements(p_mastery) loop
    target=(decision->>'target_id')::uuid;
    if not (decision ?& array['target_id','level','feedback']) or not exists(select 1 from learning_targets where id=target and slug=any(t.target_slugs))
      or (decision->'level'<>'null'::jsonb and decision->>'level' not in ('1','2','3'))
      or jsonb_typeof(decision->'feedback')<>'string' or length(decision->>'feedback')>1600 then raise exception 'Invalid mastery decision'; end if;
    select * into prior from interactive_assignment_reviews where submission_id=p_submission and target_id=target;
    if found then
      if (decision->>'level')::smallint is distinct from prior.level or decision->>'feedback' is distinct from prior.feedback then raise exception 'A mastery rating was already saved. Reload before releasing'; end if;
    elsif decision->'level'<>'null'::jsonb then
      insert into mastery_records(user_id,target_id,level,rated_by,evidence_source)
        values(s.user_id,target,(decision->>'level')::smallint,p_reviewer,'Lab · '||t.title||' · submission '||s.id::text) returning id into record;
      insert into interactive_assignment_reviews(id,submission_id,target_id,level,feedback,reviewer_email,record_id)
        values(gen_random_uuid(),s.id,target,(decision->>'level')::smallint,decision->>'feedback',p_reviewer,record);
    end if;
  end loop;
  insert into simulation_lab_grades(submission_id,rubric_version,items,mastery,earned,possible,feedback,revision,request_id,released_by)
    values(s.id,p_rubric,p_items,p_mastery,total,maximum,p_feedback,p_revision+1,p_request,p_reviewer)
    on conflict(submission_id) do update set rubric_version=excluded.rubric_version,items=excluded.items,mastery=excluded.mastery,earned=excluded.earned,possible=excluded.possible,
      feedback=excluded.feedback,revision=excluded.revision,request_id=excluded.request_id,released_by=excluded.released_by,released_at=now()
    returning * into g;
  return to_jsonb(g);
end $$;

create or replace function public.rate_choice_lab_artifact(p_section uuid,p_option text,p_user uuid,p_target uuid,p_version integer,p_level integer,p_note text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare sec choice_sections; opt jsonb; sel choice_selections; record_id uuid; rating jsonb;
begin
  select * into sec from choice_sections where id=p_section for update;
  if not found or not exists(select 1 from courses where id=sec.course_id and teacher_email=p_actor and archived_at is null) or not exists(select 1 from course_students where course_id=sec.course_id and student_id=p_user and enrollment_state='ACTIVE') then raise exception 'Choose a student in your class.'; end if;
  select value into opt from jsonb_array_elements(sec.options) where value->>'id'=p_option;
  if opt is null or not coalesce((opt->>'lab')::boolean,false) or not (opt->'targetIds' ? p_target::text) or not exists(select 1 from learning_targets where id=p_target and coalesce(program,'physics')='physics') then raise exception 'Choose a target linked to this lab.'; end if;
  select * into sel from choice_selections where section_id=p_section and option_id=p_option and user_id=p_user for update;
  if not found or sel.artifact_submitted_at is null or sel.artifact_version<>p_version then raise exception 'The submitted evidence changed. Refresh before rating.'; end if;
  if p_level is null or p_level not between 1 and 3 or p_note is null or length(p_note)>2000 then raise exception 'Choose a 1–3 rating and optional feedback.'; end if;
  if sel.artifact_ratings ? p_target::text then
    rating:=sel.artifact_ratings->p_target::text;
    if (rating->>'version')::integer=p_version and (rating->>'level')::integer=p_level and rating->>'note'=p_note then return jsonb_build_object('ok',true,'id',rating->>'recordId'); end if;
    raise exception 'This lab evidence has already been rated for this target.';
  end if;
  insert into mastery_records(user_id,rated_by,target_id,level,evidence_source,observed_at)
  values(p_user,p_actor,p_target,p_level,'choice-lab:'||p_section::text||':'||p_option||':v'||p_version::text,now()) returning id into record_id;
  rating:=jsonb_build_object('version',p_version,'level',p_level,'note',p_note,'recordId',record_id,'ratedAt',now());
  update choice_selections set artifact_ratings=artifact_ratings||jsonb_build_object(p_target::text,rating) where section_id=p_section and option_id=p_option and user_id=p_user;
  insert into choice_audit(section_id,user_id,actor,action,detail) values(p_section,p_user,p_actor,'rate-lab-artifact',jsonb_build_object('option_id',p_option,'target_id',p_target,'rating',rating));
  return jsonb_build_object('ok',true,'id',record_id);
end $$;

alter table public.math_mission_sessions add column review_rating smallint check(review_rating between 1 and 3);
create function public.release_math_mission_review(p_id uuid,p_actor text,p_owner_emails text[],p_revision integer,p_level smallint,p_note text)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.math_mission_sessions; target uuid;
begin
 select * into s from math_mission_sessions where id=p_id for update;
 if not found or s.status<>'completed' or s.staff or s.revision<>p_revision or not exists(select 1 from course_students cs join courses c on c.id=cs.course_id join students st on st.id=cs.student_id where cs.student_id=s.user_id and cs.enrollment_state='ACTIVE' and c.archived_at is null and st.is_active is not false and lower(c.teacher_email)=any(p_owner_emails)) then raise exception 'Refresh a completed session from your active class.';end if;
 if p_level is not null and p_level not between 1 and 3 or p_note is null or length(p_note)>4000 then raise exception 'Choose valid mastery and feedback.';end if;
 if s.reviewed_at is not null then if s.review_rating is not distinct from p_level and s.review_note=p_note then return true;else raise exception 'This session has already been reviewed.';end if;end if;
 select id into target from math_competencies where code=s.code and is_active limit 1;
 if p_level is not null then
  if target is null then raise exception 'The competency is unavailable.';end if;
  insert into math_competency_records(user_id,user_email,competency_id,level,observed_at,evidence_source) values(s.user_id,s.user_email,target,p_level,now(),'mission:'||s.id);
 end if;
 update math_mission_sessions set review_rating=p_level,review_note=p_note,reviewed_by=p_actor,reviewed_at=now() where id=p_id;
 return true;
end $$;
revoke all on function public.release_math_mission_review(uuid,text,text[],integer,smallint,text) from public,anon,authenticated;
grant execute on function public.release_math_mission_review(uuid,text,text[],integer,smallint,text) to service_role;

-- Historical published vocabulary results keep their prior visibility. New quiz
-- attempts explicitly require teacher release, including objective formats.
alter table public.vocab_checks add column requires_release boolean not null default false;

create function public.release_vocab_checkpoint_review(p_task uuid,p_user uuid,p_actor text,p_attempt uuid,p_version integer,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.vocab_checkpoint_attempts; t public.vocab_tasks; q jsonb; result jsonb; fingerprint text; previous uuid; chosen smallint;
begin
 select * into t from vocab_tasks where id=p_task for update;
 if not found or not exists(select 1 from courses where id=t.course_id and teacher_email=p_actor and archived_at is null) or not exists(select 1 from course_students where course_id=t.course_id and student_id=p_user and enrollment_state='ACTIVE') or not(p_user=any(t.student_ids)) then raise exception 'Choose an assigned student in your active class.';end if;
 select * into a from vocab_checkpoint_attempts where id=p_attempt and task_id=p_task and user_id=p_user for update;
 if not found then raise exception 'Attempt unavailable.';end if;
 if a.released_at is not null then return to_jsonb(a);end if;
 if a.version<>p_version or a.submitted_at is null then raise exception 'Refresh the submitted attempt before releasing.';end if;
 if jsonb_typeof(p_payload->'scores') is distinct from 'object' or jsonb_typeof(p_payload->'notes') is distinct from 'object' or not(p_payload?'level') or p_payload->'level' not in ('1'::jsonb,'2'::jsonb,'3'::jsonb,'null'::jsonb) then raise exception 'Review scores and choose mastery or skip.';end if;
 if jsonb_typeof(p_payload->'feedback') is distinct from 'string' or length(p_payload->>'feedback')>2000 then raise exception 'Feedback must be under 2000 characters.';end if;
 update vocab_checkpoint_attempts set notes=notes||jsonb_build_object('_overall',p_payload->>'feedback') where id=p_attempt;
 for q in select value from jsonb_array_elements(a.questions) where value->>'part'='explain' loop
  result:=mutate_vocab_checkpoint(p_task,p_user,p_actor,true,'score',a.version,jsonb_build_object('question_id',q->>'id','points',p_payload->'scores'->(q->>'id'),'note',coalesce(p_payload->'notes'->>(q->>'id'),'')),p_attempt);
  a.version:=(result->>'version')::integer;
 end loop;
 result:=mutate_vocab_checkpoint(p_task,p_user,p_actor,true,'release',a.version,'{}',p_attempt);
 if p_payload->'level'<>'null'::jsonb then
  chosen:=(p_payload->>'level')::smallint;
  select string_agg(id::text||':'||coalesce(review_version,0)::text,',' order by id) into fingerprint from vocab_checks where task_id=p_task and user_id=p_user and completed_at is not null;
  select id into previous from vocab_mastery_reviews where task_id=p_task and user_id=p_user and target_id=t.target_id order by created_at desc,id desc limit 1;
  perform submit_vocab_mastery_review(gen_random_uuid(),p_task,p_user,t.target_id,p_actor,chosen,coalesce(p_payload->>'feedback',''),fingerprint,previous);
 end if;
 return result;
end $$;
revoke all on function public.release_vocab_checkpoint_review(uuid,uuid,text,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.release_vocab_checkpoint_review(uuid,uuid,text,uuid,integer,jsonb) to service_role;

create function public.require_vocab_quiz_release() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if exists(select 1 from vocab_tasks where id=new.task_id and task_kind='quiz') then new.requires_release:=true;end if;
 return new;
end $$;
create trigger require_vocab_quiz_release before insert on public.vocab_checks for each row execute function public.require_vocab_quiz_release();
revoke all on function public.require_vocab_quiz_release() from public,anon,authenticated;
grant execute on function public.require_vocab_quiz_release() to service_role;

create function public.automatic_grading_status(p_owner_emails text[]) returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 with candidates as (select distinct c.source,c.source_id,c.version,c.status from automatic_grading_candidates() c where c.teacher_email=any(p_owner_emails)), waiting as (select c.*,j.attempts,j.status job_status from candidates c left join automatic_grading_jobs j using(source,source_id,version) where c.status<>'ready')
 select jsonb_build_object('enabled',exists(select 1 from automatic_grading_settings where teacher_email=any(p_owner_emails) and enabled),'waiting',(select count(*) from waiting),'retrying',(select count(*) from waiting where attempts>0 and job_status<>'attention'),'attention',(select count(*) from waiting where job_status='attention'),'lastStartedAt',(select last_started_at from automatic_grading_heartbeat where id),'lastFinishedAt',(select last_finished_at from automatic_grading_heartbeat where id))
$$;
revoke all on function public.automatic_grading_status(text[]) from public,anon,authenticated;
grant execute on function public.automatic_grading_status(text[]) to service_role;

revoke all on function public.release_simulation_lab_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.release_simulation_lab_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text) to service_role;
revoke all on function public.rate_choice_lab_artifact(uuid,text,uuid,uuid,integer,integer,text,text) from public,anon,authenticated;
grant execute on function public.rate_choice_lab_artifact(uuid,text,uuid,uuid,integer,integer,text,text) to service_role;

alter table public.vocab_checks add column review_decision jsonb;
create function public.release_vocab_quiz_review(p_check uuid,p_task uuid,p_actor text,p_owner_emails text[],p_version integer,p_grades jsonb,p_level smallint)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare t vocab_tasks; c vocab_checks; owner_email text; graded jsonb; fingerprint text; previous uuid; decision jsonb;
begin
 select * into t from vocab_tasks where id=p_task for update;
 select teacher_email into owner_email from courses where id=t.course_id and lower(teacher_email)=any(p_owner_emails) and archived_at is null;
 if t.id is null or owner_email is null or not t.active or t.task_kind<>'quiz' or t.quiz_format='checkpoint' then raise exception 'Choose a quiz in your active class.';end if;
 select * into c from vocab_checks where id=p_check and task_id=p_task for update;
 if not found or c.completed_at is null or not(c.user_id=any(t.student_ids)) or not exists(select 1 from course_students where course_id=t.course_id and student_id=c.user_id and enrollment_state='ACTIVE') then raise exception 'Submitted quiz unavailable.';end if;
 decision:=jsonb_build_object('grades',p_grades,'level',p_level);
 if c.review_version=p_version+1 and c.review_decision=decision then return true;end if;
 if c.review_version<>p_version then raise exception 'This review changed. Refresh before releasing.';end if;
 if p_level is not null and p_level not between 1 and 3 or jsonb_typeof(p_grades) is distinct from 'array' or jsonb_array_length(p_grades)<>jsonb_array_length(c.result) or (select count(distinct g->>'term_id') from jsonb_array_elements(p_grades) g)<>jsonb_array_length(c.result) or exists(select 1 from jsonb_array_elements(p_grades) g where jsonb_typeof(g->'correct') is distinct from 'boolean' or jsonb_typeof(g->'feedback') is distinct from 'string' or length(g->>'feedback')>2000 or not exists(select 1 from jsonb_array_elements(c.result) r where r->>'term_id'=g->>'term_id')) then raise exception 'Review every answer before releasing.';end if;
 select jsonb_agg(r||jsonb_build_object('correct',g->'correct','feedback',g->'feedback') order by ord) into graded from jsonb_array_elements(c.result) with ordinality x(r,ord) join jsonb_array_elements(p_grades) g on g->>'term_id'=r->>'term_id';
 update vocab_checks set result=graded,review_version=p_version+1,reviewed_by=p_actor,reviewed_at=now(),review_decision=decision where id=p_check;
 if p_level is not null then
  select string_agg(id::text||':'||coalesce(review_version,0)::text,',' order by id) into fingerprint from vocab_checks where task_id=p_task and user_id=c.user_id and completed_at is not null;
  select id into previous from vocab_mastery_reviews where task_id=p_task and user_id=c.user_id and target_id=t.target_id order by created_at desc,id desc limit 1;
  perform submit_vocab_mastery_review(gen_random_uuid(),p_task,c.user_id,t.target_id,owner_email,p_level,'',fingerprint,previous);
 end if;
 return true;
end $$;
revoke all on function public.release_vocab_quiz_review(uuid,uuid,text,text[],integer,jsonb,smallint) from public,anon,authenticated;
grant execute on function public.release_vocab_quiz_review(uuid,uuid,text,text[],integer,jsonb,smallint) to service_role;
