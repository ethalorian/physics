create or replace function public.save_quiz_assignment(p_quiz jsonb,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.quiz_assignments;c public.courses;q jsonb;ids text[]:='{}'; audience uuid[];v integer;
begin
 select * into c from public.courses where id=(p_quiz->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null for share;
 if not found then raise exception 'Choose your own active class.';end if;
 if p_quiz->>'status' not in ('draft','published') or p_quiz->>'grade_mode' not in ('numeric','letter','credit') or p_quiz->>'kind' not in ('vocabulary','understanding','mixed') then raise exception 'Invalid quiz settings.';end if;
 if jsonb_typeof(p_quiz->'questions') is distinct from 'array' or jsonb_array_length(p_quiz->'questions')>30 or (p_quiz->>'status'='published' and jsonb_array_length(p_quiz->'questions')<1) then raise exception 'Add 1–30 questions before publishing.';end if;
 for q in select value from jsonb_array_elements(p_quiz->'questions') loop
  if (q->>'id')::uuid is null or q->>'id'=any(ids) or q->>'kind' not in ('choice','written','problem') or (q->>'points')::numeric not between 1 and 20 or (q->>'points')::numeric<>trunc((q->>'points')::numeric) then raise exception 'Invalid quiz question.';end if;
  ids:=array_append(ids,q->>'id');
  if coalesce(q->>'target_id','')<>'' and not exists(select 1 from public.learning_targets where id=(q->>'target_id')::uuid and coalesce(program,'physics')=coalesce(c.program,'physics') and not exclude_from_growth) then raise exception 'Choose targets from this class curriculum.';end if;
  if p_quiz->>'status'='published' then
   if coalesce(btrim(q->>'prompt'),'')='' or coalesce(btrim(q->>'guide'),'')='' or coalesce(q->>'target_id','')='' then raise exception 'Complete the prompt, answer guide and target for every question.';end if;
   if q->>'kind'='choice' and (jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') not between 2 and 6 or coalesce((q->>'correct_index')::integer,-1) not between 0 and jsonb_array_length(q->'options')-1) then raise exception 'Complete the choices and answer key.';end if;
  end if;
 end loop;
 if p_quiz->'student_ids' is distinct from 'null'::jsonb then
  if jsonb_typeof(p_quiz->'student_ids') is distinct from 'array' or jsonb_array_length(p_quiz->'student_ids')<1 then raise exception 'Choose a class audience.';end if;
  audience:=array(select distinct value::uuid from jsonb_array_elements_text(p_quiz->'student_ids'));
  if exists(select 1 from unnest(audience) audience_row(student_id) where not exists(select 1 from public.course_students cs where cs.course_id=c.id and cs.student_id=audience_row.student_id and cs.enrollment_state='ACTIVE')) then raise exception 'Choose active students in this class.';end if;
 end if;
 if p_quiz->>'source_quiz_id' is not null and not exists(select 1 from public.quiz_assignments where id=(p_quiz->>'source_quiz_id')::uuid and course_id=c.id) then raise exception 'Reassessments must stay in the same class.';end if;
 v:=(p_quiz->>'version')::integer;
 perform pg_advisory_xact_lock(hashtextextended(p_quiz->>'id',0));
 select * into a from public.quiz_assignments where id=(p_quiz->>'id')::uuid for update;
 if found then
  if a.course_id=c.id and a.version=v+1 and a.title=p_quiz->>'title' and a.kind=p_quiz->>'kind' and a.instructions=p_quiz->>'instructions' and a.grade_mode=p_quiz->>'grade_mode' and a.questions=p_quiz->'questions' and a.student_ids is not distinct from audience and a.due_at is not distinct from (p_quiz->>'due_at')::timestamptz and a.status=p_quiz->>'status' and a.source_quiz_id is not distinct from (p_quiz->>'source_quiz_id')::uuid then return to_jsonb(a);end if;
  if a.course_id<>c.id or a.status<>'draft' or a.version<>v then raise exception 'This quiz changed or was published. Reload it; published questions stay fixed.';end if;
  update public.quiz_assignments set title=p_quiz->>'title',kind=p_quiz->>'kind',instructions=p_quiz->>'instructions',grade_mode=p_quiz->>'grade_mode',questions=p_quiz->'questions',student_ids=audience,due_at=(p_quiz->>'due_at')::timestamptz,status=p_quiz->>'status',source_quiz_id=(p_quiz->>'source_quiz_id')::uuid,version=version+1,updated_at=now() where id=a.id returning * into a;
 else
  if v<>0 then raise exception 'Quiz unavailable.';end if;
  insert into public.quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,student_ids,due_at,status,source_quiz_id)
  values((p_quiz->>'id')::uuid,c.id,p_actor,p_quiz->>'title',p_quiz->>'kind',p_quiz->>'instructions',p_quiz->>'grade_mode',p_quiz->'questions',audience,(p_quiz->>'due_at')::timestamptz,p_quiz->>'status',(p_quiz->>'source_quiz_id')::uuid) returning * into a;
 end if;
 return to_jsonb(a);
end $$;