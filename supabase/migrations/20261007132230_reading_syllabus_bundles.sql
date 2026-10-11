-- A-2, M-1: additive syllabus connections; completion never assigns mastery.
alter table public.textbook_assignments add column passage text check(passage is null or length(passage) between 1 and 12000);

alter table public.textbook_assignments add column honors_reading jsonb check(honors_reading is null or jsonb_typeof(honors_reading)='object');
alter table public.vocab_tasks add column syllabus_step_id text;
alter table public.vocab_tasks add column syllabus_draft boolean not null default false;

CREATE OR REPLACE FUNCTION public.save_textbook_assignment(p_assignment jsonb, p_actor text, p_owner text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare a public.textbook_assignments; c public.courses; q jsonb;
begin
  select * into c from public.courses where id=(p_assignment->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null for share;
  if not found then raise exception 'This class is unavailable.'; end if;

  if p_assignment->>'origin_key' is not null then
    if p_assignment->>'origin_key' !~* '^lesson:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[^[:space:]]{1,160}$' then
      raise exception 'Invalid lesson reading link.';
    end if;
    if not exists (
      select 1 from public.lessons l join public.units u on u.id=l.unit_id
      cross join lateral jsonb_array_elements(coalesce(l.content_blocks->'blocks','[]'::jsonb)) b
      where l.id=split_part(p_assignment->>'origin_key',':',2)::uuid
      and b->>'id'=substring(p_assignment->>'origin_key' from 45)
      and b->>'type'='reading' and coalesce(u.program,'physics')=coalesce(c.program,'physics')
      and (l.visibility_track is null or l.visibility_track=coalesce(c.track,'cpa'))
      and (b->>'visibilityTrack' is null or b->>'visibilityTrack'=coalesce(c.track,'cpa'))
    ) then raise exception 'This lesson reading is not available for this class.'; end if;
  end if;
  if p_assignment->'honors_reading' is not null and p_assignment->'honors_reading'<>'null'::jsonb and c.track is distinct from 'honors' then raise exception 'OpenStax syllabus readings are assigned to Honors classes.'; end if;
  if p_assignment->>'passage' is not null and length(p_assignment->>'passage') not between 1 and 12000 then raise exception 'Check the course reading.'; end if;
  if p_assignment->>'status' not in ('draft','published') then raise exception 'Invalid assignment state.'; end if;
  if jsonb_typeof(p_assignment->'questions') is distinct from 'array' or jsonb_array_length(p_assignment->'questions') not between 1 and 30 then raise exception 'Add 1–30 questions.'; end if;
  for q in select value from jsonb_array_elements(p_assignment->'questions') loop
    if not exists(select 1 from public.learning_targets where id=(q->>'target_id')::uuid and coalesce(program,'physics')=coalesce(c.program,'physics') and not exclude_from_growth) then raise exception 'Choose mastery targets from this class curriculum.'; end if;
  end loop;
  -- Serializes first-save retries, too: row locks alone cannot lock a missing row.
  perform pg_advisory_xact_lock(hashtextextended(p_assignment->>'id',0));
  select * into a from public.textbook_assignments where id=(p_assignment->>'id')::uuid for update;
  if found then
    -- Older open editors do not know the new source fields. Omission preserves
    -- them; an explicit null still switches the source intentionally.
    p_assignment:=jsonb_build_object('passage',a.passage,'honors_reading',a.honors_reading)||p_assignment;
    -- Same payload + previous version is an exact retry after a lost response.
    if a.honors_reading is not distinct from nullif(p_assignment->'honors_reading','null'::jsonb) and a.passage is not distinct from (p_assignment->>'passage') and a.origin_key is not distinct from (p_assignment->>'origin_key') and a.course_id=c.id and a.version=(p_assignment->>'version')::integer+1 and a.title=p_assignment->>'title' and a.chapter=(p_assignment->>'chapter')::integer and a.reading=p_assignment->>'reading' and a.section_ids=array(select jsonb_array_elements_text(p_assignment->'section_ids')) and a.instructions=p_assignment->>'instructions' and a.questions=p_assignment->'questions' and a.due_at is not distinct from (p_assignment->>'due_at')::timestamptz and a.status=p_assignment->>'status' then return to_jsonb(a); end if;
    if a.course_id<>c.id or a.status<>'draft' or a.version<>(p_assignment->>'version')::integer then raise exception 'This assignment changed. Reload it before saving.'; end if;
    update public.textbook_assignments set honors_reading=nullif(p_assignment->'honors_reading','null'::jsonb),passage=p_assignment->>'passage',origin_key=p_assignment->>'origin_key',title=p_assignment->>'title',chapter=(p_assignment->>'chapter')::integer,reading=p_assignment->>'reading',section_ids=array(select jsonb_array_elements_text(p_assignment->'section_ids')),instructions=p_assignment->>'instructions',questions=p_assignment->'questions',due_at=(p_assignment->>'due_at')::timestamptz,status=p_assignment->>'status',version=version+1,updated_at=now() where id=a.id returning * into a;
  else
    if (p_assignment->>'version')::integer<>0 then raise exception 'Assignment unavailable.'; end if;
    insert into public.textbook_assignments(id,honors_reading,passage,origin_key,course_id,created_by,title,chapter,reading,section_ids,instructions,questions,due_at,status)
    values ((p_assignment->>'id')::uuid,nullif(p_assignment->'honors_reading','null'::jsonb),p_assignment->>'passage',p_assignment->>'origin_key',c.id,p_actor,p_assignment->>'title',(p_assignment->>'chapter')::integer,p_assignment->>'reading',array(select jsonb_array_elements_text(p_assignment->'section_ids')),p_assignment->>'instructions',p_assignment->'questions',(p_assignment->>'due_at')::timestamptz,p_assignment->>'status') returning * into a;
  end if;
  return to_jsonb(a);
end $function$
;

create table public.reading_syllabus_bundles (
 course_id uuid not null references public.courses(id),
 step_id text not null check(step_id ~ '^[a-z0-9-]{1,80}$'),
 reading_id uuid not null unique references public.textbook_assignments(id),
 practice_id uuid not null unique references public.vocab_tasks(id),
 reading_quiz_id uuid not null unique references public.quiz_assignments(id),
 vocabulary_quiz_id uuid not null unique references public.quiz_assignments(id),
 created_at timestamptz not null default now(),
 primary key(course_id,step_id)
);
alter table public.reading_syllabus_bundles enable row level security;
revoke all on public.reading_syllabus_bundles from public,anon,authenticated;
grant select,insert on public.reading_syllabus_bundles to service_role;

-- All four assignments are created together. Retry after a lost response returns
-- the same bundle; no student work, scores, or mastery rows are created here.
create function public.create_reading_syllabus_bundle(p_payload jsonb,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.courses; b public.reading_syllabus_bundles; word jsonb; term public.vocabulary_terms;
 set_id uuid; word_ids uuid[]:='{}'; word_rows jsonb:='[]'; a jsonb; rq jsonb; vq jsonb; practice uuid:=gen_random_uuid();
begin
 select * into c from public.courses where id=(p_payload->'reading'->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null and program='physics' for share;
 if not found then raise exception 'Choose your own active Physics class.'; end if;
 if p_payload->>'step_id' !~ '^[a-z0-9-]{1,80}$' or p_payload->>'unit' !~ '^unit-[1-8]$' then raise exception 'Choose a syllabus step.'; end if;
 if not exists(select 1 from public.learning_targets where id=(p_payload->>'vocabularyTarget')::uuid and domain='knowledge' and program='physics' and not exclude_from_growth) then raise exception 'Choose an available vocabulary Knowledge target.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(c.id::text||':syllabus:'||(p_payload->>'step_id'),0));
 select * into b from public.reading_syllabus_bundles where course_id=c.id and step_id=p_payload->>'step_id';
 if found then return to_jsonb(b); end if;
 if jsonb_typeof(p_payload->'words') is distinct from 'array' or jsonb_array_length(p_payload->'words') not between 2 and 12 then raise exception 'Choose 2–12 vocabulary words.'; end if;
 -- Reuse canonical unit terms when provided; missing terms get an ordinary
 -- published vocabulary set, accessible to students only through assignment scope.
 perform pg_advisory_xact_lock(hashtextextended(lower(p_owner)||':syllabus-vocabulary:'||(p_payload->>'step_id'),0));
 for word in select value from jsonb_array_elements(p_payload->'words') loop
   term:=null;
   if word->>'id' is not null then
     select t.* into term from public.vocabulary_terms t join public.vocabulary_sets s on s.id=t.vocabulary_set_id
       join public.units u on u.id=s.unit_id
       where t.id=(word->>'id')::uuid and not t.archived and not s.archived and s.published and u.program='physics'
         and s.unit_id=p_payload->>'unit' and lower(trim(t.term))=lower(trim(word->>'term'));
     if not found then raise exception 'Vocabulary changed. Refresh this step.'; end if;
   else
     if set_id is null then
       select id into set_id from public.vocabulary_sets where name='Reading syllabus · '||(p_payload->>'step_id') and unit_id=p_payload->>'unit' and lower(created_by)=lower(p_owner) and not archived limit 1;
       if set_id is null then
         insert into public.vocabulary_sets(name,description,unit_id,published,created_by)
         values('Reading syllabus · '||(p_payload->>'step_id'),'Essential words for '||(p_payload->'reading'->>'title'),p_payload->>'unit',true,p_owner) returning id into set_id;
       end if;
     end if;
     select * into term from public.vocabulary_terms where vocabulary_set_id=set_id and lower(trim(vocabulary_terms.term))=lower(trim(word->>'term')) and not archived limit 1;
     if not found then
       if length(trim(word->>'term')) not between 1 and 150 or length(trim(word->>'definition')) not between 1 and 3000 then raise exception 'Complete each vocabulary definition.'; end if;
       insert into public.vocabulary_terms(vocabulary_set_id,term,definition,tier,order_index)
         values(set_id,word->>'term',word->>'definition',3,cardinality(word_ids)) returning * into term;
     end if;
   end if;
   if term.id=any(word_ids) then raise exception 'Each word must be distinct.'; end if;
   word_ids:=array_append(word_ids,term.id);
   word_rows:=word_rows||jsonb_build_array(jsonb_build_object('id',term.id,'term',term.term,'definition',term.definition,'tier',term.tier,'vocabulary_set_id',term.vocabulary_set_id,'translations',term.translations,'definition_es',term.definition_es,'cognate',term.cognate,'icon',term.icon,'example',term.example));
 end loop;
 if p_payload->'reading'->>'status'<>'draft' or p_payload->'readingQuiz'->>'status'<>'draft' or p_payload->'vocabularyQuiz'->>'status'<>'draft'
   or (p_payload->'readingQuiz'->>'course_id')::uuid<>c.id or (p_payload->'vocabularyQuiz'->>'course_id')::uuid<>c.id then raise exception 'Create drafts in the selected class.'; end if;
 a:=public.save_textbook_assignment(p_payload->'reading',p_actor,p_owner);
 rq:=public.save_quiz_assignment(p_payload->'readingQuiz',p_actor,p_owner);
 vq:=public.save_quiz_assignment(p_payload->'vocabularyQuiz',p_actor,p_owner);
 insert into public.vocab_tasks(id,course_id,target_id,title,assigned_by,student_ids,term_ids,words,note,active,task_kind,check_mode,threshold,min_checks,syllabus_step_id,syllabus_draft)
 values(practice,c.id,(p_payload->>'vocabularyTarget')::uuid,(a->>'title')||' · Vocabulary practice',p_actor,'{}',word_ids,word_rows,
   'Read the connected passage, then practice these words. Explain and use each word in context. Meet the practice goal shown below; your teacher determines mastery.',false,'practice','recognition',80,2,p_payload->>'step_id',true);
 insert into public.reading_syllabus_bundles(course_id,step_id,reading_id,practice_id,reading_quiz_id,vocabulary_quiz_id)
 values(c.id,p_payload->>'step_id',(a->>'id')::uuid,practice,(rq->>'id')::uuid,(vq->>'id')::uuid) returning * into b;
 return to_jsonb(b);
end $$;

create function public.release_reading_syllabus_step(p_course uuid,p_step text,p_owner text,p_actor text,p_version integer,p_due timestamptz)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.reading_syllabus_bundles; a public.textbook_assignments; audience uuid[]; task public.vocab_tasks; quiz public.quiz_assignments;
begin
 perform 1 from public.courses where id=p_course and lower(teacher_email)=lower(p_owner) and archived_at is null for share;
 if not found then raise exception 'Choose your own active class.'; end if;
 select * into b from public.reading_syllabus_bundles where course_id=p_course and step_id=p_step for update;
 if not found then raise exception 'Prepare this step first.'; end if;
 select * into a from public.textbook_assignments where id=b.reading_id for update;
 select * into task from public.vocab_tasks where id=b.practice_id for update;
 select * into quiz from public.quiz_assignments where id=b.reading_quiz_id for update;
 if quiz.deleted_at is not null or quiz.status='archived' then raise exception 'Restore the reading quiz before assigning this step.'; end if;
 if a.status='published' and task.active and quiz.status='published' then return to_jsonb(b); end if;
 if a.version<>p_version or a.status='archived' then raise exception 'This reading changed. Refresh before assigning.'; end if;
 audience:=array(select cs.student_id from public.course_students cs join public.students s on s.id=cs.student_id where cs.course_id=p_course and cs.enrollment_state='ACTIVE' and s.is_active is not false);
 if cardinality(audience)=0 then raise exception 'Enroll students before assigning this step.'; end if;
 if exists(select 1 from unnest(task.term_ids) tid left join public.vocabulary_terms t on t.id=tid left join public.vocabulary_sets s on s.id=t.vocabulary_set_id where t.id is null or t.archived or s.archived or not s.published) then raise exception 'Some vocabulary is unavailable. Restore its word set before assigning.'; end if;
 if a.status='draft' then perform public.save_textbook_assignment(to_jsonb(a)||jsonb_build_object('status','published','due_at',p_due),p_actor,p_owner); end if;
 -- Publish the reviewed quiz with the step. Per-student submission gates below
 -- keep its questions inaccessible until that student completes the reading.
 if quiz.status='draft' then perform public.save_quiz_assignment(to_jsonb(quiz)||jsonb_build_object('status','published'),p_actor,p_owner); end if;
 update public.vocab_tasks set active=true,syllabus_draft=false,student_ids=audience,due_on=((case when a.status='draft' then p_due else a.due_at end) at time zone 'America/New_York')::date where id=b.practice_id;
 return to_jsonb(b);
end $$;
revoke all on function public.create_reading_syllabus_bundle(jsonb,text,text),public.release_reading_syllabus_step(uuid,text,text,text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.create_reading_syllabus_bundle(jsonb,text,text),public.release_reading_syllabus_step(uuid,text,text,text,integer,timestamptz) to service_role;

create function public.guard_reading_quiz_completion() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if exists(select 1 from public.reading_syllabus_bundles b where b.reading_quiz_id=new.quiz_id
   and not exists(select 1 from public.textbook_submissions s where s.assignment_id=b.reading_id and s.user_id=new.user_id)) then
   raise exception 'Complete and submit the reading assignment before starting its quiz.';
 end if;
 return new;
end $$;
create trigger reading_quiz_work_requires_submission before insert or update of answers on public.quiz_work
 for each row execute function public.guard_reading_quiz_completion();
create trigger reading_quiz_attempt_requires_submission before insert on public.quiz_submissions
 for each row execute function public.guard_reading_quiz_completion();
revoke all on function public.guard_reading_quiz_completion() from public,anon,authenticated;
grant execute on function public.guard_reading_quiz_completion() to service_role;
