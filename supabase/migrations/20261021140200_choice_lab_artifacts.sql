-- Individual lab work stays with its existing selection and grade.
alter table public.choice_selections
  add column artifact_response jsonb not null default '{}',
  add column artifact_submitted_at timestamptz,
  add column artifact_version integer not null default 0;
create table public.choice_lab_files (
  id uuid primary key,
  section_id uuid not null references public.choice_sections(id),
  option_id text not null,
  user_id uuid not null references public.students(id),
  path text not null unique,
  name text not null,
  content_type text not null check(content_type in ('image/png','image/jpeg','image/webp','application/pdf')),
  size integer not null check(size > 0 and size <= 4000000),
  created_at timestamptz not null default now()
);
create index choice_lab_files_owner on public.choice_lab_files(user_id,section_id,option_id);
alter table public.choice_lab_files enable row level security;
revoke all on public.choice_lab_files from public,anon,authenticated;
grant all on public.choice_lab_files to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('student-lab-artifacts','student-lab-artifacts',false,4000000,array['image/png','image/jpeg','image/webp','application/pdf']);

-- Service-only RPC: route authentication supplies p_user, never the request body.
create function public.save_choice_lab_artifact(p_section uuid,p_option text,p_user uuid,p_version integer,p_text text,p_file uuid,p_submit boolean)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare sec choice_sections; opt jsonb; sel choice_selections; receipt jsonb := '{}';
begin
  select * into sec from choice_sections where id=p_section for update;
  if not found or not sec.published or now()<sec.opens_at then raise exception 'This choice menu is not available.'; end if;
  if not exists(select 1 from courses c join course_students cs on cs.course_id=c.id where c.id=sec.course_id and c.archived_at is null and coalesce(c.program,'physics')='physics' and cs.student_id=p_user and cs.enrollment_state='ACTIVE') then raise exception 'Student is not enrolled in this class.'; end if;
  select value into opt from jsonb_array_elements(sec.options) where value->>'id'=p_option;
  if opt is null or not coalesce((opt->>'lab')::boolean,false) or coalesce(trim(opt->>'artifactInstructions'),'')='' then raise exception 'This lab does not require an artifact.'; end if;
  if p_version is null or p_submit is null or p_text is null or length(p_text)>30000 then raise exception 'Check the lab response.'; end if;
  select * into sel from choice_selections where section_id=p_section and option_id=p_option and user_id=p_user for update;
  if not found or not sel.selected then raise exception 'Choose this lab before turning in work.'; end if;
  if sel.artifact_version<>p_version then raise exception 'Your work changed in another tab. Refresh before saving.'; end if;
  if sel.artifact_submitted_at is not null then raise exception 'This lab artifact has already been submitted.'; end if;
  if p_file is not null then
    select jsonb_build_object('fileId',id,'fileName',name) into receipt from choice_lab_files where id=p_file and section_id=p_section and option_id=p_option and user_id=p_user;
    if not found then raise exception 'Choose your own uploaded file for this lab.'; end if;
  end if;
  if trim(p_text)='' and p_file is null then raise exception 'Type a response or upload your work.'; end if;
  update choice_selections set artifact_response=receipt||jsonb_build_object('text',p_text),artifact_submitted_at=case when p_submit then now() else null end,artifact_version=artifact_version+1 where section_id=p_section and option_id=p_option and user_id=p_user;
  insert into choice_audit(section_id,user_id,actor,action,detail) values(p_section,p_user,p_user::text,case when p_submit then 'submit-lab-artifact' else 'save-lab-artifact' end,jsonb_build_object('option_id',p_option));
  return jsonb_build_object('ok',true,'version',p_version+1);
end $$;
revoke all on function public.save_choice_lab_artifact(uuid,text,uuid,integer,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.save_choice_lab_artifact(uuid,text,uuid,integer,text,uuid,boolean) to service_role;

-- Uploaded or saved lab work needs teacher approval to swap.
create or replace function public.choice_option_attempted(p_option jsonb, p_user uuid)
returns boolean language plpgsql stable security invoker set search_path = public as $$
declare s jsonb; sid uuid;
begin
  if exists(select 1 from choice_selections where user_id=p_user and option_id=p_option->>'id' and artifact_version>0) or exists(select 1 from choice_lab_files where user_id=p_user and option_id=p_option->>'id') then return true; end if;
  for s in select value from jsonb_array_elements(p_option->'steps') loop
    sid := (s->>'sourceId')::uuid;
    if s->>'kind'='interactive' and (exists(select 1 from interactive_assignment_work where assignment_id=sid and user_id=p_user and version>0) or exists(select 1 from interactive_assignment_submissions where assignment_id=sid and user_id=p_user)) then return true; end if;
    if s->>'kind'='reading' and exists(select 1 from textbook_work where assignment_id=sid and user_id=p_user and (answers<>'{}'::jsonb or submission_id is not null)) then return true; end if;
    if s->>'kind'='quiz' and exists(select 1 from quiz_work where quiz_id=sid and user_id=p_user and (answers<>'{}'::jsonb or submission_id is not null)) then return true; end if;
    if s->>'kind'='lesson' and (exists(select 1 from block_responses where lesson_id=sid and user_id=p_user) or exists(select 1 from block_drafts where lesson_id=sid and user_id=p_user) or exists(select 1 from lesson_submissions where lesson_id=sid and user_id=p_user) or exists(select 1 from lesson_artifacts where lesson_id=sid and user_id=p_user)) then return true; end if;
    if s->>'kind'='vocabulary' and (exists(select 1 from vocab_checks where task_id=sid and user_id=p_user and (coalesce(result,'[]'::jsonb)<>'[]'::jsonb or completed_at is not null)) or exists(select 1 from vocab_checkpoint_attempts where task_id=sid and user_id=p_user and (answers<>'{}'::jsonb or submitted_at is not null)) or exists(select 1 from vocab_attempts a join vocab_tasks t on a.term_id=any(t.term_ids) and a.created_at>=t.created_at where t.id=sid and a.user_id=p_user)) then return true; end if;
    if s->>'kind'='simulation' and exists(select 1 from student_simulation_assignments where simulation_assignment_id=sid and student_id=p_user::text and (started_at is not null or submitted_at is not null)) then return true; end if;
    if s->>'kind'='math' and exists(select 1 from math_mission_sessions where assignment_id=sid and user_id=p_user) then return true; end if;
  end loop;
  return false;
end $$;
revoke all on function public.choice_option_attempted(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.choice_option_attempted(jsonb,uuid) to service_role;


alter table public.choice_selections add column artifact_ratings jsonb not null default '{}';
create function public.rate_choice_lab_artifact(p_section uuid,p_option text,p_user uuid,p_target uuid,p_version integer,p_level integer,p_note text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare sec choice_sections; opt jsonb; sel choice_selections; record_id uuid; rating jsonb;
begin
  select * into sec from choice_sections where id=p_section for update;
  if not found or not exists(select 1 from courses where id=sec.course_id and teacher_email=p_actor and archived_at is null) or not exists(select 1 from course_students where course_id=sec.course_id and student_id=p_user and enrollment_state='ACTIVE') then raise exception 'Choose a student in your class.'; end if;
  select value into opt from jsonb_array_elements(sec.options) where value->>'id'=p_option;
  if opt is null or not coalesce((opt->>'lab')::boolean,false) or not (opt->'targetIds' ? p_target::text) or not exists(select 1 from learning_targets where id=p_target and coalesce(program,'physics')='physics') then raise exception 'Choose a target linked to this lab.'; end if;
  select * into sel from choice_selections where section_id=p_section and option_id=p_option and user_id=p_user for update;
  if not found or sel.artifact_submitted_at is null or sel.artifact_version<>p_version then raise exception 'The submitted evidence changed. Refresh before rating.'; end if;
  if p_level is null or p_level not between 1 and 3 or p_note is null or trim(p_note)='' or length(p_note)>2000 then raise exception 'Choose a 1–3 rating and explain the evidence.'; end if;
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
revoke all on function public.rate_choice_lab_artifact(uuid,text,uuid,uuid,integer,integer,text,text) from public,anon,authenticated;
grant execute on function public.rate_choice_lab_artifact(uuid,text,uuid,uuid,integer,integer,text,text) to service_role;
