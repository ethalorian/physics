-- Run after the language-level migration. All synthetic records are rolled back.
begin;
do $qa$
declare c uuid:=gen_random_uuid(); h uuid:=gen_random_uuid(); t uuid; q jsonb; a jsonb; b jsonb; saved jsonb; denied boolean;
begin
 select id into t from public.learning_targets where program='physics' and not exclude_from_growth limit 1;
 if t is null then raise exception 'Need a physics target';end if;
 -- This fixture uses only columns common to the local harness and production.
 insert into public.courses(id,name,google_course_id,teacher_email,program,track) values(c,'QA CPA','qa-'||c,'qa.language@example.invalid','physics','cpa'),(h,'QA Honors','qa-'||h,'qa.language@example.invalid','physics','honors');
 q:=jsonb_build_object('id',gen_random_uuid(),'course_id',c,'title','Language test','kind','understanding','instructions','Explain.','grade_mode','numeric','questions',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'kind','written','prompt','Explain displacement.','guide','Compare final and initial positions.','points',3,'target_id',t)),'student_ids',null,'due_at',null,'status','draft','version',0,'source_quiz_id',null,'language_level','cpa','sei_supports',true);
 a:=public.save_quiz_assignment(q,'qa.language@example.invalid','qa.language@example.invalid');
 if a->>'language_level'<>'cpa' or a->>'sei_supports'<>'true' then raise exception 'Metadata not saved';end if;
 b:=public.save_quiz_assignment(q,'qa.language@example.invalid','qa.language@example.invalid');
 if a<>b then raise exception 'Retry changed data';end if;
 -- A reused CPA draft remains CPA even in the Honors course.
 b:=public.save_quiz_assignment(q||jsonb_build_object('id',gen_random_uuid(),'course_id',h),'qa.language@example.invalid','qa.language@example.invalid');
 if b->>'language_level'<>'cpa' or b->>'sei_supports'<>'true' then raise exception 'Cross-track copy lost labels';end if;
 -- The current questions can be honestly relabeled by a teacher while still a draft.
 a:=public.save_quiz_assignment(a||jsonb_build_object('language_level','honors','sei_supports',false),'qa.language@example.invalid','qa.language@example.invalid');
 if a->>'language_level'<>'honors' or a->>'sei_supports'<>'false' then raise exception 'Draft labels not updated';end if;
 -- Existing open browser versions may omit new metadata; labels must survive.
 saved:=public.save_quiz_assignment((a-'language_level'-'sei_supports')||jsonb_build_object('status','published'),'qa.language@example.invalid','qa.language@example.invalid');
 if saved->>'language_level'<>'honors' or saved->>'sei_supports'<>'false' then raise exception 'Older client erased metadata';end if;
 denied:=false;begin perform public.save_quiz_assignment(saved||'{"language_level":"cpa"}','qa.language@example.invalid','qa.language@example.invalid');exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'Published metadata changed';end if;
 denied:=false;begin perform public.save_quiz_assignment(q||jsonb_build_object('id',gen_random_uuid(),'language_level','college'),'qa.language@example.invalid','qa.language@example.invalid');exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'Invalid language accepted';end if;
 denied:=false;begin perform public.save_quiz_assignment(q||jsonb_build_object('id',gen_random_uuid(),'sei_supports','yes'),'qa.language@example.invalid','qa.language@example.invalid');exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'Invalid support type accepted';end if;
 denied:=false;begin perform public.save_quiz_assignment(q||jsonb_build_object('id',gen_random_uuid()),'other@example.invalid','other@example.invalid');exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'Ownership bypass';end if;
 a:=public.save_quiz_assignment((q-'language_level'-'sei_supports')||jsonb_build_object('id',gen_random_uuid()),'qa.language@example.invalid','qa.language@example.invalid');
 if a->>'language_level' is not null or a->>'sei_supports' is not null then raise exception 'Legacy quiz mislabelled';end if;
 if has_function_privilege('authenticated','public.save_quiz_assignment(jsonb,text,text)','EXECUTE') or has_table_privilege('anon','public.quiz_assignments','SELECT') then raise exception 'Public access expanded';end if;
end $qa$;
rollback;
select 'PASS: persistence, retries, cross-track labels, draft edits, old-client compatibility, published immutability, legacy nulls, ownership, invalid inputs and private access' as result;
