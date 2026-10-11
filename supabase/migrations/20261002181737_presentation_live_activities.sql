-- Presentation activities belong to Course Plans days. Only teacher review changes mastery.
alter table public.lobby_sessions add column present_session_id uuid references public.present_sessions(id) on delete set null;
create index lobby_presentation_active on public.lobby_sessions(present_session_id,created_at desc) where status<>'closed';
alter table public.present_pulses drop constraint present_pulses_kind_check;
alter table public.present_pulses add constraint present_pulses_kind_check check(kind in ('readiness','confidence','custom','warmup','exit_ticket'));
alter table public.present_pulses add column target_id uuid references public.learning_targets(id), add column prompt text, add column options text[], add column required boolean not null default false, add column locked boolean not null default false, add column revealed boolean not null default false;
alter table public.present_pulses add constraint present_custom_poll check(kind<>'custom' or (prompt is not null and length(trim(prompt)) between 1 and 1000 and options is not null and cardinality(options) between 2 and 6 and array_position(options,null) is null));
alter table public.present_pulse_responses drop constraint present_pulse_responses_choice_check;
alter table public.present_pulse_responses add constraint present_pulse_responses_choice_check check(choice between 0 and 5);

-- Serialize competing activity launches on the presentation row.
create function public.launch_present_pulse(p_session uuid,p_kind text,p_anonymous boolean,p_required boolean,p_prompt text default null,p_options text[] default null,p_target uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.present_sessions; result uuid; unit text;
begin
 select * into s from public.present_sessions where id=p_session for update;
 if not found or s.status<>'live' then raise exception 'This presentation has ended.';end if;
 if s.poll_block_id is not null or exists(select 1 from public.lobby_sessions l where l.status<>'closed' and (l.present_session_id=s.id or (l.present_session_id is null and l.lesson_id=s.lesson_id and l.course_id=s.course_id and l.created_by=s.teacher_id and l.created_at>=s.created_at))) or exists(select 1 from public.present_pulses where session_id=s.id and status='open') then raise exception 'Close the current activity before opening another poll.';end if;
 if p_kind is null or p_kind not in ('readiness','confidence','custom','warmup','exit_ticket') or p_anonymous is null or p_required is null then raise exception 'Invalid live poll.';end if;
 if p_kind='custom' and (p_prompt is null or length(trim(p_prompt)) not between 1 and 1000 or p_options is null or cardinality(p_options) not between 2 and 6 or exists(select 1 from unnest(p_options) o where o is null or length(trim(o)) not between 1 and 200) or (select count(distinct lower(trim(o))) from unnest(p_options) o)<>cardinality(p_options)) then raise exception 'Enter a question and 2–6 different answer choices.';end if;
 if p_kind in ('warmup','exit_ticket') then
  select coalesce(s.plan_unit_id,l.unit_id) into unit from (values(1)) seed(n) left join public.lessons l on l.id=s.lesson_id;
  if p_anonymous or p_prompt is null or length(trim(p_prompt)) not between 1 and 1000 or not exists(select 1 from public.learning_targets where id=p_target and unit_id=unit) then raise exception 'Choose a learning target from this presentation unit and enter a question.';end if;
 elsif p_target is not null then raise exception 'Only warm-ups and exit tickets collect mastery evidence.';end if;
 insert into public.present_pulses(session_id,kind,anonymous,required,prompt,options,target_id) values(s.id,p_kind,p_anonymous,p_required,case when p_kind in ('custom','warmup','exit_ticket') then trim(p_prompt) end,case when p_kind='custom' then p_options end,p_target) returning id into result;
 return result;
end $$;
revoke all on function public.launch_present_pulse(uuid,text,boolean,boolean,text,text[],uuid) from public,anon,authenticated;
grant execute on function public.launch_present_pulse(uuid,text,boolean,boolean,text,text[],uuid) to service_role;

create function public.validate_present_lobby() returns trigger language plpgsql security invoker set search_path='' as $$
declare s public.present_sessions;
begin
 if new.present_session_id is null or new.status='closed' then return new;end if;
 select * into s from public.present_sessions where id=new.present_session_id for update;
 if not found or s.status<>'live' or s.course_id is distinct from new.course_id or s.teacher_id is distinct from new.created_by or s.lesson_id is distinct from new.lesson_id then raise exception 'This presentation is unavailable for the lobby.';end if;
 if s.poll_block_id is not null or exists(select 1 from public.present_pulses where session_id=s.id and status='open') or exists(select 1 from public.lobby_sessions where present_session_id=s.id and status<>'closed' and id<>new.id) then raise exception 'Close the current activity before opening a lobby.';end if;
 return new;
end $$;
revoke all on function public.validate_present_lobby() from public,anon,authenticated;
grant execute on function public.validate_present_lobby() to service_role;
create trigger validate_present_lobby before insert or update of present_session_id,status on public.lobby_sessions for each row execute function public.validate_present_lobby();

create or replace function public.submit_present_pulse(p_session uuid,p_pulse uuid,p_user text,p_choice integer)
returns void language plpgsql security invoker set search_path='' as $$
declare pulse public.present_pulses;
begin
 perform 1 from public.present_sessions where id=p_session and status='live' for share;
 if not found then raise exception 'Presentation ended';end if;
 select * into pulse from public.present_pulses where id=p_pulse and session_id=p_session for share;
 if not found or pulse.kind in ('warmup','exit_ticket') or pulse.status<>'open' or pulse.locked or p_choice is null or p_choice<0 or p_choice>=(case when pulse.kind='custom' then cardinality(pulse.options) else 3 end) then raise exception 'Poll unavailable';end if;
 if not exists(select 1 from public.course_students c join public.present_sessions s on s.course_id=c.course_id join public.courses k on k.id=s.course_id where s.id=p_session and c.student_id::text=p_user and c.enrollment_state='ACTIVE' and k.archived_at is null) then raise exception 'Not enrolled';end if;
 insert into public.present_pulse_responses(pulse_id,respondent_key,user_id,choice) values(p_pulse,md5(pulse.salt::text||p_user),case when pulse.anonymous then null else p_user end,p_choice) on conflict(pulse_id,respondent_key) do update set choice=excluded.choice;
end $$;
revoke all on function public.submit_present_pulse(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.submit_present_pulse(uuid,uuid,text,integer) to service_role;

create function public.end_present_activities() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status='ended' and old.status<>'ended' then
  update public.present_pulses set status='closed' where session_id=new.id and status='open';
  update public.lobby_sessions set status='closed',closed_at=clock_timestamp() where present_session_id=new.id and status<>'closed';
 end if;
 return new;
end $$;
revoke all on function public.end_present_activities() from public,anon,authenticated;
grant execute on function public.end_present_activities() to service_role;
create trigger end_present_activities after update of status on public.present_sessions for each row execute function public.end_present_activities();

-- Notify the projector to fetch authorized state. Never broadcast student data.
create or replace function public.present_broadcast_change() returns trigger language plpgsql set search_path='' as $$
declare sid uuid; event_name text;
begin
 if tg_table_name='present_sessions' then sid:=new.id;event_name:='session';
 elsif tg_table_name='lobby_sessions' then
  for sid in select id from public.present_sessions where status='live' and (id=new.present_session_id or (new.present_session_id is null and teacher_id=new.created_by and course_id=new.course_id and lesson_id=new.lesson_id and created_at<=new.created_at)) loop
   perform realtime.send('{}'::jsonb,'activity','present:'||sid,false);
  end loop;
  return new;
 else sid:=new.session_id;event_name:='tools';end if;
 perform realtime.send('{}'::jsonb,event_name,'present:'||sid,false);
 return new;
exception when others then raise warning 'Presentation notification unavailable (%)',sqlstate;return new;
end $$;
revoke all on function public.present_broadcast_change() from public,anon,authenticated;
grant execute on function public.present_broadcast_change() to service_role;

create function public.validate_present_question() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.poll_block_id is not null and new.poll_block_id is distinct from old.poll_block_id and (exists(select 1 from public.present_pulses where session_id=new.id and status='open') or exists(select 1 from public.lobby_sessions where present_session_id=new.id and status<>'closed')) then raise exception 'Close the current activity before opening a lesson poll.';end if;
 return new;
end $$;
revoke all on function public.validate_present_question() from public,anon,authenticated;
grant execute on function public.validate_present_question() to service_role;
create trigger validate_present_question before update of poll_block_id on public.present_sessions for each row execute function public.validate_present_question();

-- Named, immutable written responses; never exposed through the browser Data API.
alter table public.present_pulses add constraint present_ticket_target check((kind in ('warmup','exit_ticket') and not anonymous and target_id is not null and prompt is not null and length(trim(prompt)) between 1 and 1000) or (kind not in ('warmup','exit_ticket') and target_id is null));
create table public.present_ticket_responses (
 id uuid primary key default gen_random_uuid(), pulse_id uuid not null references public.present_pulses(id),
 user_id uuid not null references public.students(id), response text not null check(length(trim(response)) between 1 and 5000),
 created_at timestamptz not null default now(), unique(pulse_id,user_id)
);
create index present_ticket_student on public.present_ticket_responses(user_id,created_at desc);
alter table public.present_ticket_responses enable row level security;
revoke all on public.present_ticket_responses from public,anon,authenticated;
grant select,insert on public.present_ticket_responses to service_role;
alter table public.mastery_evidence_reviews alter column lesson_id drop not null;
alter table public.mastery_evidence_reviews add column present_pulse_id uuid references public.present_pulses(id);
alter table public.mastery_evidence_reviews add constraint mastery_review_origin check((lesson_id is not null and present_pulse_id is null) or (lesson_id is null and present_pulse_id is not null));
create index mastery_review_presentation on public.mastery_evidence_reviews(present_pulse_id,user_id) where present_pulse_id is not null;

create function public.submit_present_ticket(p_session uuid,p_pulse uuid,p_user uuid,p_response text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.present_sessions; p public.present_pulses; prior public.present_ticket_responses; result uuid;
begin
 select * into s from public.present_sessions where id=p_session for share;
 select * into p from public.present_pulses where id=p_pulse and session_id=p_session for share;
 if p.id is null or p.kind not in ('warmup','exit_ticket') or p.anonymous then raise exception 'Activity unavailable';end if;
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
end $$;
revoke all on function public.submit_present_ticket(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.submit_present_ticket(uuid,uuid,uuid,text) to service_role;

-- Reuse the mastery drawer's review history; atomically commit rating + feedback.
create function public.review_present_ticket(p_id uuid,p_user uuid,p_reviewer text,p_pulse uuid,p_target uuid,p_evidence jsonb,p_mode text,p_level integer,p_message text,p_note text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior public.mastery_evidence_reviews; p public.present_pulses; rec uuid; feedback uuid; result public.mastery_evidence_reviews;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text,0));
 select * into prior from public.mastery_evidence_reviews where id=p_id;
 if found then
  if prior.user_id is distinct from p_user or prior.present_pulse_id is distinct from p_pulse or prior.target_id is distinct from p_target or prior.reviewer_email is distinct from p_reviewer then raise exception 'Review identifier conflict';end if;
  return to_jsonb(prior);
 end if;
 select * into p from public.present_pulses where id=p_pulse;
 if p.target_id is distinct from p_target or p.kind not in ('warmup','exit_ticket') or p_mode not in ('target','evidence') or p_level is null or p_level not between 1 and 3 or not exists(select 1 from public.present_ticket_responses where pulse_id=p_pulse and user_id=p_user) then raise exception 'Invalid presentation evidence review';end if;
 if p_evidence is null or jsonb_typeof(p_evidence)<>'array' or jsonb_array_length(p_evidence)<>1 then raise exception 'Review one submitted response';end if;
 insert into public.mastery_records(user_id,target_id,level,rated_by,evidence_source) values(p_user,p_target,p_level,p_reviewer,case when p.kind='warmup' then 'Warm-up' else 'Exit ticket' end||' presentation review') returning id into rec;
 insert into public.teacher_feedback(user_id,teacher_email,target_id,message) values(p_user::text,p_reviewer,p_target,p_message) returning id into feedback;
 insert into public.mastery_evidence_reviews(id,user_id,target_id,lesson_id,present_pulse_id,reviewer_email,evidence,mean,overall_level,message,record_id,feedback_id,rating_mode,note)
 values(p_id,p_user,p_target,null,p_pulse,p_reviewer,p_evidence,case when p_mode='evidence' then p_level end,p_level,p_message,rec,feedback,p_mode,p_note) returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.review_present_ticket(uuid,uuid,text,uuid,uuid,jsonb,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.review_present_ticket(uuid,uuid,text,uuid,uuid,jsonb,text,integer,text,text) to service_role;

-- A presentation rating must never dismiss a separate legacy lesson submission.
do $$ declare definition text;begin
 if to_regprocedure('public.bridge_legacy_lesson_review()') is not null then
  select pg_get_functiondef('public.bridge_legacy_lesson_review()'::regprocedure) into definition;
  definition:=replace(definition,$old$event->>'evidence_source'='lesson evidence review'$old$,$new$event->>'evidence_source' in ('lesson evidence review','Warm-up presentation review','Exit ticket presentation review')$new$);
  execute definition;
 end if;
end $$;
