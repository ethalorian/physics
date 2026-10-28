-- Explicit lab designation is authored by staff, never supplied by students.
-- Existing review identities, submissions, grades and mastery records are unchanged.
alter table public.interactive_assignment_templates add column is_lab boolean not null default false;
insert into public.interactive_assignment_templates(slug,day,title,target_slugs,is_lab) values ('day-3-foundation-velocity',3,'Day 3 · Foundation lab: Velocity',array['u1.capture-pt-graph'],true);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values ('unit-1-day-3','day-3-foundation-velocity','day-3-velocity',array['f3-rate','f3-time','f3-predict','f3-trials','f3-slopes','f3-revise','f3-height','f3-transfer','f3-return','f3-exit'],array['r2-1a','r2-1b','r2-1c','r2-2a','r2-2b','r2-2c','r2-3a','r2-3b','r2-3c','r2-3d','r2-4a','r2-4b','r2-5a','r2-6a','r2-6b','r2-7a','r2-7b'],'{"title":"Day 3 · Quiz: Velocity and position–time graphs","instructions":"Work independently after submitting the foundation lab and review. Show signs and units. Your teacher releases the quiz grade and reviews mastery separately.","questions":[{"kind":"choice","prompt":"A cart goes from 1 m at 2 s to 7 m at 5 s. What is its average velocity?","options":["+1.4 m/s","+2 m/s","+3 m/s","+6 m/s"],"correct_index":1,"guide":"(7 − 1) / (5 − 2) = +2 m/s.","points":1,"demand":{"blooms":"Apply","dok":2,"evidence":"Uses position change and elapsed time rather than final values."}},{"kind":"choice","prompt":"A position–time graph is horizontal at 6 m. What does this mean?","options":["The speed is 6 m/s","The velocity is positive","The object stays at 6 m with zero velocity","The object returns to the origin"],"correct_index":2,"guide":"Constant position gives zero slope and velocity.","points":1,"demand":{"blooms":"Understand","dok":1,"evidence":"Interprets a horizontal position–time segment."}},{"kind":"choice","prompt":"Positive is away from a sensor. Which velocity describes motion toward it at a speed of 0.8 m/s?","options":["+0.8 m/s","−0.8 m/s","0 m/s","The speed must be negative"],"correct_index":1,"guide":"Negative velocity points toward the sensor under this convention; speed is its nonnegative magnitude.","points":1,"demand":{"blooms":"Understand","dok":1,"evidence":"Connects velocity sign to a stated axis."}},{"kind":"choice","prompt":"A student travels 5 m out and 5 m back in 10 s. Which gives average speed and average velocity?","options":["0 m/s and 1 m/s","1 m/s and 1 m/s","0.5 m/s and 0 m/s","1 m/s and 0 m/s"],"correct_index":3,"guide":"10 m distance / 10 s = 1 m/s; zero displacement / 10 s = zero average velocity.","points":1,"demand":{"blooms":"Apply","dok":2,"evidence":"Distinguishes round-trip average speed from average velocity."}},{"kind":"written","prompt":"A graph joins (0 s, 2 m), (3 s, 8 m), (5 s, 8 m), and (8 s, 2 m) with straight segments. Explain each segment’s velocity and the whole-trip average velocity. Defend why zero whole-trip average does not mean no motion.","guide":"Segments +2, 0 and −2 m/s; whole-trip average is zero. The changing intermediate positions demonstrate motion despite coincident endpoints. Include units and the signed direction convention.","points":3,"demand":{"blooms":"Analyze","dok":3,"evidence":"Combines segment and whole-trip reasoning to reject an overgeneralization."}},{"kind":"written","prompt":"Two detector trials have the same start and finish positions and elapsed time. A student claims both trials must have identical constant velocity throughout. Evaluate the claim. Propose additional measurements and explain how they could distinguish the trials.","guide":"Equal endpoints and elapsed time establish equal average velocity, not constant or identical motion. Intermediate timed positions or full traces could reveal pauses, reversals or changing slopes. Explain a discriminating pattern rather than only asking for more data.","points":3,"demand":{"blooms":"Evaluate","dok":3,"evidence":"Evaluates the limits of endpoint evidence and justifies a discriminating measurement plan."}}]}'::jsonb);

-- Four-dimension releases use the explicit CPA/Honors syllabus conversion table.
-- No existing grades or mastery records are rewritten. Earlier releases remain readable.
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
      or jsonb_typeof(decision->'feedback')<>'string' or length(decision->>'feedback')>1600
      or (decision->'level'='null'::jsonb and length(trim(decision->>'feedback'))=0) then raise exception 'Invalid mastery decision'; end if;
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
revoke all on function public.release_simulation_lab_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.release_simulation_lab_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text) to service_role;

-- Older mastery-only analyses can be explicitly refreshed for a lab grade.
create or replace function public.claim_interactive_assignment_ai(p_submission uuid,p_retry boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare j interactive_assignment_ai_reviews; snapshot jsonb; lesson_slug text;
begin
 select s.state,a.slug into snapshot,lesson_slug from interactive_assignment_submissions s
 join interactive_assignment_work w on w.assignment_id=s.assignment_id and w.user_id=s.user_id and w.version=s.version and w.status='submitted'
 join interactive_assignments a on a.id=s.assignment_id join interactive_assignment_templates t on t.slug=a.slug
 join courses c on c.id=a.course_id and c.archived_at is null
 join course_students cs on cs.course_id=a.course_id and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE'
 where s.id=p_submission and ((select count(*) from interactive_assignment_reviews r where r.submission_id=s.id)<cardinality(t.target_slugs)
   or ((a.slug like 'simulation-%' or t.is_lab) and not exists(select 1 from simulation_lab_grades g where g.submission_id=s.id and g.rubric_version='lab-four-dimensions-v1')));
 if not found then return null; end if;
 update interactive_assignment_ai_reviews set status='processing',rubric_version=case when (lesson_slug like 'simulation-%' or exists(select 1 from interactive_assignment_templates where slug=lesson_slug and is_lab)) then 'lab-four-dimensions-v1' else 'unit1-v2' end,
   attempts=attempts+1,lock_id=gen_random_uuid(),locked_until=now()+interval '3 minutes',error=null,updated_at=now()
 where submission_id=p_submission and (status='queued' or (status='processing' and locked_until<now()) or (p_retry and (status='error'
   or (status='ready' and (lesson_slug like 'simulation-%' or exists(select 1 from interactive_assignment_templates where slug=lesson_slug and is_lab)) and not (coalesce(result,'{}'::jsonb) ? 'lab_dimensions'))))) returning * into j;
 if not found then return null; end if;
 return jsonb_build_object('submission_id',j.submission_id,'lock_id',j.lock_id,'state',snapshot,'slug',lesson_slug);
end $$;
revoke all on function public.claim_interactive_assignment_ai(uuid,boolean) from public,anon,authenticated;
grant execute on function public.claim_interactive_assignment_ai(uuid,boolean) to service_role;

