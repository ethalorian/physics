-- Short real-world applications use the existing submission workflow and a separate release ledger.
-- No class assignments, submissions, or existing grades are created or modified.
create table public.transfer_task_grades (
 submission_id uuid primary key references public.interactive_assignment_submissions(id),
 rubric_version text not null check (rubric_version='transfer-brief-four-dimensions-v1'),
 items jsonb not null check(jsonb_typeof(items)='array'),
 mastery jsonb not null check(jsonb_typeof(mastery)='array'),
 earned integer not null check(earned in (50,75,85,89,96)),
 possible integer not null check(possible=100),
 feedback text not null default '',
 revision integer not null check(revision>0),
 request_id uuid not null,
 released_by text not null,
 released_at timestamptz not null default now()
);
alter table public.transfer_task_grades enable row level security;
revoke all on public.transfer_task_grades from public,anon,authenticated;
grant select,insert,update on public.transfer_task_grades to service_role;

insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values
 ('transfer-brief-robot-stopping',8,'Will the delivery robot stop in time?',array['u1.pick-equation-of-motion'],false),
 ('transfer-brief-river-crossing',6,'Where should the rescue boat aim?',array['u1.vectors-tip-to-tail'],false),
 ('transfer-brief-cargo-braking',17,'Will the cargo slide when the van brakes?',array['u1.fma-solve-net-force','u1.friction-static-kinetic'],false);

CREATE OR REPLACE FUNCTION public.release_transfer_brief_grade(p_submission uuid, p_request uuid, p_revision integer, p_reviewer text, p_admin boolean, p_rubric text, p_items jsonb, p_mastery jsonb, p_feedback text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare s interactive_assignment_submissions; a interactive_assignments; w interactive_assignment_work;
  g transfer_task_grades; t interactive_assignment_templates; prior interactive_assignment_reviews;
  item jsonb; decision jsonb; target uuid; record uuid; total integer:=0; maximum integer:=0; lowest integer:=4;
begin
  select * into s from interactive_assignment_submissions where id=p_submission;
  if not found then raise exception 'Submission unavailable'; end if;
  select * into a from interactive_assignments where id=s.assignment_id;
  select * into t from interactive_assignment_templates where slug=a.slug;
  if a.slug not like 'transfer-brief-%' or t.slug is null or t.is_lab then raise exception 'Transfer Brief unavailable'; end if;
  if p_rubric is distinct from 'transfer-brief-four-dimensions-v1' then raise exception 'Use the Transfer Brief rubric'; end if;
  if p_reviewer is null or not exists(select 1 from courses c join course_students cs on cs.course_id=c.id
    where c.id=a.course_id and c.archived_at is null and (p_admin or lower(c.teacher_email)=lower(p_reviewer))
    and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE') then raise exception 'Only the teacher of this class can release this work'; end if;
  select * into w from interactive_assignment_work where assignment_id=s.assignment_id and user_id=s.user_id for update;
  if w.status is distinct from 'submitted' or w.version is distinct from s.version or (case when exists(select 1 from daily_lesson_templates where foundation_slug=a.slug) then (w.state-'partner_exchange') is distinct from (s.state-'partner_exchange') else w.state is distinct from s.state end) then raise exception 'A newer revision exists. Reload the current submission'; end if;
  select * into g from transfer_task_grades where submission_id=p_submission for update;
  if g.request_id=p_request then
    if g.items=p_items and g.mastery=p_mastery and g.feedback=p_feedback and g.rubric_version=p_rubric and lower(g.released_by)=lower(p_reviewer) then return to_jsonb(g); end if;
    raise exception 'Release request changed. Reload before continuing';
  end if;
  if p_revision is null or coalesce(g.revision,0)<>p_revision then raise exception 'The released grade changed. Reload before continuing'; end if;
  if p_request is null or p_rubric not in ('transfer-brief-four-dimensions-v1') or p_rubric is null or p_feedback is null or length(p_feedback)>1600
    or jsonb_typeof(p_items) is distinct from 'array' or jsonb_typeof(p_mastery) is distinct from 'array' then raise exception 'Invalid grade'; end if;
  if g.rubric_version='transfer-brief-four-dimensions-v1' and p_rubric<>'transfer-brief-four-dimensions-v1' then raise exception 'Use the four-dimension rubric to correct this grade'; end if;
  if p_rubric='transfer-brief-four-dimensions-v1' and jsonb_array_length(p_items)<>4 then raise exception 'Review all four dimensions'; end if;
  if jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>200 or
    (select count(distinct x->>'id') from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception 'Invalid score items'; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if not (item ?& array['id','earned','possible','feedback']) or jsonb_typeof(item->'earned')<>'number' or jsonb_typeof(item->'possible')<>'number'
      or (item->>'earned')!~'^[0-9]+$' or (item->>'possible') not in ('1','4')
      or (item->>'earned')::integer>(item->>'possible')::integer or jsonb_typeof(item->'feedback')<>'string' or length(item->>'feedback')>1200 then raise exception 'Invalid score item'; end if;
    if p_rubric='transfer-brief-four-dimensions-v1' then
      if item->>'id' not in ('science','reasoning','communication','transfer') or item->>'possible'<>'4' then raise exception 'Invalid rubric dimension'; end if;
      lowest=least(lowest,(item->>'earned')::integer);
    end if;
    total=total+(item->>'earned')::integer; maximum=maximum+(item->>'possible')::integer;
  end loop;
  if p_rubric='transfer-brief-four-dimensions-v1' then
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
        values(s.user_id,target,(decision->>'level')::smallint,p_reviewer,'Transfer Brief · '||t.title||' · submission '||s.id::text) returning id into record;
      insert into interactive_assignment_reviews(id,submission_id,target_id,level,feedback,reviewer_email,record_id)
        values(gen_random_uuid(),s.id,target,(decision->>'level')::smallint,decision->>'feedback',p_reviewer,record);
    end if;
  end loop;
  insert into transfer_task_grades(submission_id,rubric_version,items,mastery,earned,possible,feedback,revision,request_id,released_by)
    values(s.id,p_rubric,p_items,p_mastery,total,maximum,p_feedback,p_revision+1,p_request,p_reviewer)
    on conflict(submission_id) do update set rubric_version=excluded.rubric_version,items=excluded.items,mastery=excluded.mastery,earned=excluded.earned,possible=excluded.possible,
      feedback=excluded.feedback,revision=excluded.revision,request_id=excluded.request_id,released_by=excluded.released_by,released_at=now()
    returning * into g;
  return to_jsonb(g);
end $function$;

revoke all on function public.release_transfer_brief_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.release_transfer_brief_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text) to service_role;

CREATE OR REPLACE FUNCTION public.claim_interactive_assignment_ai(p_submission uuid, p_retry boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare j interactive_assignment_ai_reviews; snapshot jsonb; lesson_slug text;
begin
 select s.state,a.slug into snapshot,lesson_slug from interactive_assignment_submissions s
 join interactive_assignment_work w on w.assignment_id=s.assignment_id and w.user_id=s.user_id and w.version=s.version and w.status='submitted'
 join interactive_assignments a on a.id=s.assignment_id join interactive_assignment_templates t on t.slug=a.slug
 join courses c on c.id=a.course_id and c.archived_at is null
 join course_students cs on cs.course_id=a.course_id and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE'
 where s.id=p_submission and not exists(select 1 from transfer_task_grades g where g.submission_id=s.id) and ((a.slug like 'transfer-brief-%') or (select count(*) from interactive_assignment_reviews r where r.submission_id=s.id)<cardinality(t.target_slugs)
   or ((a.slug like 'simulation-%' or t.is_lab) and not exists(select 1 from simulation_lab_grades g where g.submission_id=s.id and g.rubric_version='lab-four-dimensions-v1')));
 if not found then return null; end if;
 update interactive_assignment_ai_reviews set status='processing',rubric_version=case when lesson_slug like 'transfer-brief-%' then 'transfer-brief-four-dimensions-v1' when (lesson_slug like 'simulation-%' or exists(select 1 from interactive_assignment_templates where slug=lesson_slug and is_lab)) then 'lab-four-dimensions-v1' else 'unit1-v2' end,
   attempts=attempts+1,lock_id=gen_random_uuid(),locked_until=now()+interval '3 minutes',error=null,updated_at=now()
 where submission_id=p_submission and (status='queued' or (status='processing' and locked_until<now()) or (p_retry and (status='error'
   or (status='ready' and (lesson_slug like 'transfer-brief-%' or lesson_slug like 'simulation-%' or exists(select 1 from interactive_assignment_templates where slug=lesson_slug and is_lab)) and not (coalesce(result,'{}'::jsonb) ? 'lab_dimensions'))))) returning * into j;
 if not found then return null; end if;
 return jsonb_build_object('submission_id',j.submission_id,'lock_id',j.lock_id,'state',snapshot,'slug',lesson_slug);
end $function$;

-- Add the release exclusion without replacing unrelated candidate branches.
do $migration$
declare original text; needle text := 'where not exists(select 1 from public.simulation_lab_grades g where g.submission_id=s.id)';
begin
 original := pg_get_functiondef('public.automatic_grading_candidates()'::regprocedure);
 if position(needle in original)=0 then raise exception 'Automatic grading candidates changed; review migration before applying'; end if;
 execute replace(original,needle,needle||' and not exists(select 1 from public.transfer_task_grades g where g.submission_id=s.id)');
end $migration$;
