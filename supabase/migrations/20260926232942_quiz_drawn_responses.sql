-- Shared validation for text or drawn problem stages; legacy text remains valid.
CREATE OR REPLACE FUNCTION public.problem_stage_valid(v jsonb, require_evidence boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path TO '' AS $$
DECLARE s jsonb; p jsonb;
BEGIN
 IF jsonb_typeof(v)='string' THEN RETURN length(v#>>'{}')<=10000 AND (NOT require_evidence OR btrim(v#>>'{}')<>''); END IF;
 IF jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(v) k WHERE k NOT IN ('text','strokes','mode'))
   OR jsonb_typeof(v->'text') IS DISTINCT FROM 'string' OR length(v->>'text')>10000
   OR coalesce(v->>'mode','') NOT IN ('text','drawing')
   OR jsonb_typeof(v->'strokes') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
 IF jsonb_array_length(v->'strokes')>500 THEN RETURN false; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(v->'strokes') LOOP
  IF jsonb_typeof(s) IS DISTINCT FROM 'object' OR jsonb_typeof(s->'color') IS DISTINCT FROM 'string'
    OR (s->>'color') !~ '^#[0-9a-fA-F]{6}$' OR jsonb_typeof(s->'points') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(s->'points') NOT BETWEEN 1 AND 10000 THEN RETURN false; END IF;
  IF s ? 'width' THEN
   IF jsonb_typeof(s->'width') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
   IF (s->>'width')::numeric NOT BETWEEN 0 AND 64 THEN RETURN false; END IF;
  END IF;
  IF s ? 'tool' AND coalesce(s->>'tool','') NOT IN ('pen','line','arrow','rect','ellipse','spray','text') THEN RETURN false; END IF;
  IF s ? 'fill' AND jsonb_typeof(s->'fill') IS DISTINCT FROM 'boolean' THEN RETURN false; END IF;
  IF s ? 'text' AND (jsonb_typeof(s->'text') IS DISTINCT FROM 'string' OR length(s->>'text')>48) THEN RETURN false; END IF;
  IF s->>'tool'='text' AND coalesce(btrim(s->>'text'),'')='' THEN RETURN false; END IF;
  FOR p IN SELECT value FROM jsonb_array_elements(s->'points') LOOP
   IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR jsonb_typeof(p->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(p->'y') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
   IF abs((p->>'x')::numeric)>10000 OR abs((p->>'y')::numeric)>10000 THEN RETURN false; END IF;
  END LOOP;
 END LOOP;
 RETURN NOT require_evidence OR btrim(v->>'text')<>'' OR jsonb_array_length(v->'strokes')>0;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.problem_stage_valid(jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.problem_stage_valid(jsonb,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.quiz_student_action(p_quiz uuid, p_user uuid, p_action text, p_answers jsonb, p_version integer, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare a public.quiz_assignments;w public.quiz_work;s public.quiz_submissions;q jsonb;e record;k text;
begin
 select * into a from public.quiz_assignments where id=p_quiz and status='published' for share;
 if not found or (a.student_ids is not null and not p_user=any(a.student_ids)) or not exists(select 1 from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null) then raise exception 'This quiz is unavailable.';end if;
 if p_action not in ('save','submit') or p_request is null or p_version<0 then raise exception 'Invalid quiz action.';end if;
 if jsonb_typeof(p_answers) is distinct from 'object' or octet_length(p_answers::text)>2500000 then raise exception 'Invalid answers.';end if;
 for e in select * from jsonb_each(p_answers) loop
  select value into q from jsonb_array_elements(a.questions) where value->>'id'=e.key;
  if not found then raise exception 'Answer does not belong to this quiz.';end if;
  if q->>'kind'='problem' then
   if jsonb_typeof(e.value) is distinct from 'object' or exists(select 1 from jsonb_object_keys(e.value) key where key not in ('model','plan','work','answer')) then raise exception 'Invalid problem response.';end if;
   foreach k in array array['model','plan','work','answer'] loop
    if NOT public.problem_stage_valid(e.value->k,p_action='submit') then raise exception 'Complete Model, Plan, Work and Answer.';end if;
   end loop;
  else
   if jsonb_typeof(e.value) is distinct from 'string' or length(e.value#>>'{}')>10000 or (p_action='submit' and btrim(e.value#>>'{}')='') then raise exception 'Add a response to every question.';end if;
   if q->>'kind'='choice' and e.value#>>'{}'<>'' and not exists(select 1 from jsonb_array_elements(q->'options') with ordinality o where (o.ordinality-1)::text=e.value#>>'{}') then raise exception 'Choose an available answer.';end if;
  end if;
 end loop;
 insert into public.quiz_work(quiz_id,user_id) values(a.id,p_user) on conflict do nothing;
 select * into w from public.quiz_work where quiz_id=a.id and user_id=p_user for update;
 if p_action='submit' then
  select * into s from public.quiz_submissions where id=p_request;
  if found then
   if s.quiz_id<>a.id or s.user_id<>p_user or s.answers<>p_answers then raise exception 'Submission request changed.';end if;
   return to_jsonb(w);
  end if;
 end if;
 if w.version<>p_version then raise exception 'Your work changed in another window. Keep a copy of your answers, then reload.';end if;
 if w.state not in ('in_progress','returned') then raise exception 'This quiz is already submitted.';end if;
 if p_action='submit' then
  if exists(select 1 from jsonb_array_elements(a.questions) question_row(value) where not p_answers ? (question_row.value->>'id')) then raise exception 'Answer every question before submitting.';end if;
  insert into public.quiz_submissions(id,quiz_id,user_id,answers,snapshot) values(p_request,a.id,p_user,p_answers,to_jsonb(a));
 end if;
 update public.quiz_work set answers=p_answers,state=case when p_action='submit' then 'submitted' else w.state end,submission_id=case when p_action='submit' then p_request else w.submission_id end,version=version+1,updated_at=now() where quiz_id=a.id and user_id=p_user returning * into w;
 return to_jsonb(w);
end $function$
;
CREATE OR REPLACE FUNCTION public.lesson_xp_complete(b jsonb, r jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
DECLARE t text:=b->>'type'; q jsonb:=b->'question'; ids jsonb; row_value jsonb;
  cols integer; required_rows integer; valid_rows integer:=0; xi integer; yi integer; numeric_rows boolean; choice boolean;
BEGIN
 IF NOT public.lesson_xp_capture(b) THEN RETURN false; END IF;
 CASE t
 WHEN 'exit_ticket','transfer_prompt','sentence_frame' THEN RETURN public.lesson_xp_substantive(r,b);
 WHEN 'sketch' THEN RETURN public.lesson_xp_drawing(r->'strokes') OR public.lesson_xp_text(r->'text');
 WHEN 'lab_notebook' THEN
   IF b->'requireAllFields'='true'::jsonb THEN
     ids:=public.lesson_xp_array(b->'fields'); IF jsonb_array_length(ids)=0 THEN ids:='["What I did","What I observed","What it means"]'; END IF;
     RETURN NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(ids) field WHERE NOT public.lesson_xp_text(r->'fields'->field));
   END IF;
   RETURN public.lesson_xp_drawing(r->'strokes') OR EXISTS(SELECT 1 FROM jsonb_each(public.lesson_xp_object(r->'fields')) f WHERE public.lesson_xp_text(f.value));
 WHEN 'observation' THEN RETURN public.lesson_xp_substantive(jsonb_build_object('text',r->'pattern'),b) AND public.lesson_xp_substantive(jsonb_build_object('text',r->'interpret'),b);
 WHEN 'marzano' THEN RETURN public.lesson_xp_rating(r);
 WHEN 'self_assessment' THEN
   ids:=public.lesson_xp_array(b->'targetIds');
   RETURN jsonb_array_length(ids)>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(ids) id WHERE NOT public.lesson_xp_rating(r->id));
 WHEN 'equation_sandbox' THEN RETURN EXISTS(SELECT 1 FROM jsonb_array_elements(public.lesson_xp_array(r->'lines')) v WHERE public.lesson_xp_text(v));
 WHEN 'gewa' THEN
   IF r->>'format'='problem-workspace' THEN
     IF r ? 'responses' THEN
       IF jsonb_typeof(r->'responses') IS DISTINCT FROM 'object' THEN RETURN false; END IF;
       RETURN NOT EXISTS(SELECT 1 FROM unnest(ARRAY['model','plan','work','answer']) stage WHERE NOT public.problem_stage_valid(r->'responses'->stage,true));
     END IF;
     RETURN (public.lesson_xp_text(r->'given') OR public.lesson_xp_drawing(r->'modelStrokes'))
       AND public.lesson_xp_text(r->'equation') AND public.lesson_xp_text(r->'work') AND public.lesson_xp_text(r->'answer');
   END IF;
   IF NOT public.lesson_xp_text(r->'answer') OR NOT (public.lesson_xp_text(r->'equationId') OR public.lesson_xp_text(r->'equation')) THEN RETURN false; END IF;
   IF b->'requireCompleteWork'='true'::jsonb THEN RETURN public.lesson_xp_text(r->'given') AND regexp_replace(r->>'answer','[eE][+-]?\d+','','g') ~ '[a-zA-Z°%]' AND (public.lesson_xp_text(r->'work') OR public.lesson_xp_object(r->'substitutions')<>'{}'::jsonb); END IF;
   RETURN true;
 WHEN 'data_table' THEN
   cols:=jsonb_array_length(public.lesson_xp_array(b->'columns')); required_rows:=coalesce((b->>'minRows')::integer,1); xi:=coalesce((b->>'xCol')::integer,0); yi:=coalesce((b->>'yCol')::integer,1); numeric_rows:=coalesce((b->>'plot')::boolean,cols>=2);
   FOR row_value IN SELECT value FROM jsonb_array_elements(public.lesson_xp_array(r->'rows')) LOOP
     IF jsonb_typeof(row_value)='array' AND jsonb_array_length(row_value)>=cols AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(row_value) cell WHERE NOT public.lesson_xp_text(cell)) THEN
       IF NOT numeric_rows OR (btrim(row_value->>xi) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$' AND btrim(row_value->>yi) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$') THEN
         IF NOT numeric_rows OR (abs((row_value->>xi)::numeric)<=1.7976931348623157e308 AND abs((row_value->>yi)::numeric)<=1.7976931348623157e308) THEN valid_rows:=valid_rows+1; END IF;
       END IF;
     END IF;
   END LOOP;
   RETURN valid_rows>=required_rows AND (coalesce(b->>'analysisMode'='record',false) OR (public.lesson_xp_text(r->'pattern') AND public.lesson_xp_text(r->'interpret')));
 WHEN 'concept_exercise' THEN RETURN coalesce(r->'submitted'='true'::jsonb AND (r#>>'{summary,itemCount}')::numeric>0 AND r#>'{summary,answeredCount}'=r#>'{summary,itemCount}',false);
 WHEN 'question' THEN
   choice:=jsonb_array_length(public.lesson_xp_array(q->'options'))>0 OR r->>'mode'='choice' OR public.lesson_xp_text(r->'optionId');
   IF choice THEN
     IF NOT public.lesson_xp_text(r->'optionId') THEN RETURN false; END IF;
     IF jsonb_array_length(public.lesson_xp_array(q->'options'))>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(q->'options') o WHERE o->'id'=r->'optionId') THEN RETURN false; END IF;
     RETURN NOT public.lesson_xp_text(q->'explain') OR public.lesson_xp_substantive(jsonb_build_object('text',r->'explain'),b);
   END IF;
   RETURN public.lesson_xp_substantive(jsonb_build_object('text',r->'explain'),b);
 ELSE RETURN false;
 END CASE;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RETURN false;
END $function$
;
