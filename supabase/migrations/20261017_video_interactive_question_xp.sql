CREATE OR REPLACE FUNCTION public.lesson_xp_capture(b jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 SELECT coalesce(b->>'type' IN ('interactive_question','exit_ticket','transfer_prompt','sketch','lab_notebook','observation','marzano','self_assessment','equation_sandbox','gewa','data_table','concept_exercise','question') OR (b->>'type'='sentence_frame' AND b->'capture'='true'::jsonb),false);
$function$;

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
 WHEN 'interactive_question' THEN
   ids:=public.lesson_xp_array(b->'task'->'parts');
   IF r->'version' IS DISTINCT FROM '1'::jsonb OR jsonb_typeof(r->'answers') IS DISTINCT FROM 'object' OR jsonb_array_length(ids)=0 THEN RETURN false; END IF;
   FOR row_value IN SELECT value FROM jsonb_array_elements(ids) LOOP
     CASE row_value->>'kind'
     WHEN 'choice' THEN
       IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.lesson_xp_array(row_value->'options')) o WHERE o->'id'=r->'answers'->(row_value->>'id')) THEN RETURN false; END IF;
     WHEN 'number' THEN
       IF jsonb_typeof(r->'answers'->(row_value->>'id')) IS DISTINCT FROM 'string' OR NOT coalesce(btrim(r->'answers'->>(row_value->>'id')) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$',false) THEN RETURN false; END IF;
       IF abs((r->'answers'->>(row_value->>'id'))::numeric)>1.7976931348623157e308 THEN RETURN false; END IF;
     WHEN 'reasoning' THEN
       IF NOT public.problem_stage_valid(r->'answers'->(row_value->>'id'),true) THEN RETURN false; END IF;
     ELSE RETURN false;
     END CASE;
   END LOOP;
   RETURN true;
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
END $function$;