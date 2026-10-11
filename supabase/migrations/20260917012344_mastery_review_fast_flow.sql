-- A target judgment retains the source evidence without inventing response scores.
alter table public.mastery_evidence_reviews
  add column rating_mode text not null default 'evidence' check (rating_mode in ('target','evidence')),
  add column note text not null default '';
alter table public.mastery_evidence_reviews alter column mean drop not null;
alter table public.mastery_evidence_reviews add constraint mastery_review_mode_mean
  check ((rating_mode='target' and mean is null) or (rating_mode='evidence' and mean is not null));

create or replace function public.submit_mastery_review(
  p_id uuid, p_user uuid, p_reviewer text, p_target uuid, p_lesson uuid,
  p_evidence jsonb, p_message text, p_mode text, p_level smallint, p_note text
) returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare prior public.mastery_evidence_reviews; result public.mastery_evidence_reviews;
  score numeric; overall smallint; rec uuid; feedback uuid; e jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into prior from public.mastery_evidence_reviews where id=p_id;
  if found then
    if prior.user_id<>p_user or prior.target_id<>p_target or prior.lesson_id<>p_lesson or prior.reviewer_email<>p_reviewer then raise exception 'Review identifier conflict'; end if;
    return jsonb_build_object('id',prior.id,'level',prior.overall_level,'mean',prior.mean,'review',to_jsonb(prior));
  end if;
  if p_mode is null or p_mode not in ('target','evidence') then raise exception 'Invalid rating mode'; end if;
  if p_evidence is null or jsonb_typeof(p_evidence)<>'array' or jsonb_array_length(p_evidence) not between 1 and 300 then raise exception 'Invalid evidence'; end if;
  for e in select value from jsonb_array_elements(p_evidence) loop
    if jsonb_typeof(e->'key') is distinct from 'string' or length(e->>'key')=0 then raise exception 'Invalid evidence identity'; end if;
    if p_mode='evidence' then
      if not(e ? 'level') or (e->'level'<>'null'::jsonb and e->'level' not in ('1'::jsonb,'2'::jsonb,'3'::jsonb)) then raise exception 'Invalid evidence score'; end if;
      if e->'level'='null'::jsonb and length(trim(coalesce(e->>'reason','')))=0 then raise exception 'Exclusion needs a reason'; end if;
    elsif e ? 'level' then raise exception 'Target assessments cannot assign response scores';
    end if;
  end loop;
  if (select count(distinct value->>'key') from jsonb_array_elements(p_evidence))<>jsonb_array_length(p_evidence) then raise exception 'Duplicate evidence'; end if;
  if p_mode='target' then
    if p_level is null or p_level not between 1 and 3 then raise exception 'Invalid mastery rating'; end if;
    overall:=p_level;
  else
    select avg((value->>'level')::numeric) into score from jsonb_array_elements(p_evidence) where value->'level'<>'null'::jsonb;
    if score is null then raise exception 'At least one response rating required'; end if;
    overall:=round(score)::smallint;
  end if;
  insert into public.mastery_records(user_id,target_id,level,rated_by,evidence_source)
    values(p_user,p_target,overall,p_reviewer,'lesson evidence review') returning id into rec;
  insert into public.teacher_feedback(user_id,teacher_email,target_id,message)
    values(p_user::text,p_reviewer,p_target,p_message) returning id into feedback;
  insert into public.mastery_evidence_reviews(id,user_id,target_id,lesson_id,reviewer_email,evidence,mean,overall_level,message,record_id,feedback_id,rating_mode,note)
    values(p_id,p_user,p_target,p_lesson,p_reviewer,p_evidence,score,overall,p_message,rec,feedback,p_mode,coalesce(p_note,'')) returning * into result;
  -- Returning/unlocking a submitted lesson is a separate explicit teacher action.
  return jsonb_build_object('id',p_id,'level',overall,'mean',score,'review',to_jsonb(result));
end $$;
revoke all on function public.submit_mastery_review(uuid,uuid,text,uuid,uuid,jsonb,text,text,smallint,text) from public,anon,authenticated;
grant execute on function public.submit_mastery_review(uuid,uuid,text,uuid,uuid,jsonb,text,text,smallint,text) to service_role;
