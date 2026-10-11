-- Named solo deck questions reuse the existing response and mastery-review pipeline.
alter table public.present_pulses drop constraint present_pulses_kind_check;
alter table public.present_pulses add constraint present_pulses_kind_check check(kind in ('readiness','confidence','custom','warmup','exit_ticket','solo'));
alter table public.present_pulses drop constraint present_ticket_target;
alter table public.present_pulses add constraint present_ticket_target check((kind in ('warmup','exit_ticket','solo') and not anonymous and target_id is not null and prompt is not null and length(trim(prompt)) between 1 and 1000) or (kind not in ('warmup','exit_ticket','solo') and target_id is null));

CREATE OR REPLACE FUNCTION public.launch_present_pulse(p_session uuid, p_kind text, p_anonymous boolean, p_required boolean, p_prompt text DEFAULT NULL::text, p_options text[] DEFAULT NULL::text[], p_target uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s public.present_sessions; result uuid; unit text;
begin
 select * into s from public.present_sessions where id=p_session for update;
 if not found or s.status<>'live' then raise exception 'This presentation has ended.';end if;
 if s.poll_block_id is not null or exists(select 1 from public.lobby_sessions l where l.status<>'closed' and (l.present_session_id=s.id or (l.present_session_id is null and l.lesson_id=s.lesson_id and l.course_id=s.course_id and l.created_by=s.teacher_id and l.created_at>=s.created_at))) or exists(select 1 from public.present_pulses where session_id=s.id and status='open') then raise exception 'Close the current activity before opening another poll.';end if;
 if p_kind is null or p_kind not in ('readiness','confidence','custom','warmup','exit_ticket','solo') or p_anonymous is null or p_required is null then raise exception 'Invalid live poll.';end if;
 if p_kind='custom' and (p_prompt is null or length(trim(p_prompt)) not between 1 and 1000 or p_options is null or cardinality(p_options) not between 2 and 6 or exists(select 1 from unnest(p_options) o where o is null or length(trim(o)) not between 1 and 200) or (select count(distinct lower(trim(o))) from unnest(p_options) o)<>cardinality(p_options)) then raise exception 'Enter a question and 2–6 different answer choices.';end if;
 if p_kind in ('warmup','exit_ticket','solo') then
  select coalesce(s.plan_unit_id,l.unit_id) into unit from (values(1)) seed(n) left join public.lessons l on l.id=s.lesson_id;
  if p_anonymous or p_prompt is null or length(trim(p_prompt)) not between 1 and 1000 or not exists(select 1 from public.learning_targets where id=p_target and unit_id=unit) then raise exception 'Choose a learning target from this presentation unit and enter a question.';end if;
 elsif p_target is not null then raise exception 'Only warm-ups and exit tickets collect mastery evidence.';end if;
 insert into public.present_pulses(session_id,kind,anonymous,required,prompt,options,target_id) values(s.id,p_kind,p_anonymous,p_required,case when p_kind in ('custom','warmup','exit_ticket','solo') then trim(p_prompt) end,case when p_kind='custom' then p_options end,p_target) returning id into result;
 return result;
end $function$
;

CREATE OR REPLACE FUNCTION public.review_present_ticket(p_id uuid, p_user uuid, p_reviewer text, p_pulse uuid, p_target uuid, p_evidence jsonb, p_mode text, p_level integer, p_message text, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare prior public.mastery_evidence_reviews; p public.present_pulses; rec uuid; feedback uuid; result public.mastery_evidence_reviews;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text,0));
 select * into prior from public.mastery_evidence_reviews where id=p_id;
 if found then
  if prior.user_id is distinct from p_user or prior.present_pulse_id is distinct from p_pulse or prior.target_id is distinct from p_target or prior.reviewer_email is distinct from p_reviewer then raise exception 'Review identifier conflict';end if;
  return to_jsonb(prior);
 end if;
 select * into p from public.present_pulses where id=p_pulse;
 if p.target_id is distinct from p_target or p.kind not in ('warmup','exit_ticket','solo') or p_mode not in ('target','evidence') or p_level is null or p_level not between 1 and 3 or not exists(select 1 from public.present_ticket_responses where pulse_id=p_pulse and user_id=p_user) then raise exception 'Invalid presentation evidence review';end if;
 if p_evidence is null or jsonb_typeof(p_evidence)<>'array' or jsonb_array_length(p_evidence)<>1 then raise exception 'Review one submitted response';end if;
 insert into public.mastery_records(user_id,target_id,level,rated_by,evidence_source) values(p_user,p_target,p_level,p_reviewer,case when p.kind='warmup' then 'Warm-up' when p.kind='solo' then 'Solo activity' else 'Exit ticket' end||' presentation review') returning id into rec;
 insert into public.teacher_feedback(user_id,teacher_email,target_id,message) values(p_user::text,p_reviewer,p_target,p_message) returning id into feedback;
 insert into public.mastery_evidence_reviews(id,user_id,target_id,lesson_id,present_pulse_id,reviewer_email,evidence,mean,overall_level,message,record_id,feedback_id,rating_mode,note)
 values(p_id,p_user,p_target,null,p_pulse,p_reviewer,p_evidence,case when p_mode='evidence' then p_level end,p_level,p_message,rec,feedback,p_mode,p_note) returning * into result;
 return to_jsonb(result);
end $function$
;

CREATE OR REPLACE FUNCTION public.submit_present_pulse(p_session uuid, p_pulse uuid, p_user text, p_choice integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare pulse public.present_pulses;
begin
 perform 1 from public.present_sessions where id=p_session and status='live' for share;
 if not found then raise exception 'Presentation ended';end if;
 select * into pulse from public.present_pulses where id=p_pulse and session_id=p_session for share;
 if not found or pulse.kind in ('warmup','exit_ticket','solo') or pulse.status<>'open' or pulse.locked or p_choice is null or p_choice<0 or p_choice>=(case when pulse.kind='custom' then cardinality(pulse.options) else 3 end) then raise exception 'Poll unavailable';end if;
 if not exists(select 1 from public.course_students c join public.present_sessions s on s.course_id=c.course_id join public.courses k on k.id=s.course_id where s.id=p_session and c.student_id::text=p_user and c.enrollment_state='ACTIVE' and k.archived_at is null) then raise exception 'Not enrolled';end if;
 insert into public.present_pulse_responses(pulse_id,respondent_key,user_id,choice) values(p_pulse,md5(pulse.salt::text||p_user),case when pulse.anonymous then null else p_user end,p_choice) on conflict(pulse_id,respondent_key) do update set choice=excluded.choice;
end $function$
;

CREATE OR REPLACE FUNCTION public.submit_present_ticket(p_session uuid, p_pulse uuid, p_user uuid, p_response text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare s public.present_sessions; p public.present_pulses; prior public.present_ticket_responses; result uuid;
begin
 select * into s from public.present_sessions where id=p_session for share;
 select * into p from public.present_pulses where id=p_pulse and session_id=p_session for share;
 if p.id is null or p.kind not in ('warmup','exit_ticket','solo') or p.anonymous then raise exception 'Activity unavailable';end if;
 if not exists(select 1 from public.course_students c join public.courses k on k.id=c.course_id where c.course_id=s.course_id and c.student_id=p_user and c.enrollment_state='ACTIVE' and k.archived_at is null) then raise exception 'Not enrolled';end if;
 if p_response is null or length(trim(p_response)) not between 1 and 5000 then raise exception 'Write a response of 1–5000 characters.';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_pulse::text||p_user::text,0));
 select * into prior from public.present_ticket_responses where pulse_id=p_pulse and user_id=p_user;
 if found then
  if prior.response<>trim(p_response) then raise exception 'This response has already been submitted.';end if;
  return prior.id;
 end if;
 if s.status<>'live' or p.status<>'open' or p.locked then raise exception 'This activity is closed.';end if;
 insert into public.present_ticket_responses(pulse_id,user_id,response) values(p_pulse,p_user,trim(p_response)) returning id into result;
 return result;
end $function$
;

