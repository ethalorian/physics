begin;
do $qa$
declare c uuid:=gen_random_uuid();s uuid:=gen_random_uuid();outsider uuid:=gen_random_uuid();aid uuid:=gen_random_uuid();q1 uuid:=gen_random_uuid();q2 uuid:=gen_random_uuid();q3 uuid:=gen_random_uuid();sub1 uuid:=gen_random_uuid();sub2 uuid:=gen_random_uuid();rev1 uuid:=gen_random_uuid();rev2 uuid:=gen_random_uuid();t uuid;t2 uuid;a jsonb;answers jsonb;draft jsonb;result jsonb;rejected boolean;mode text;newaid uuid;newsub uuid;newrev uuid;
begin
 select id into t from learning_targets where slug='u1.vocab-position-distance-displacement' and program='physics';
 select id into t2 from learning_targets where program='physics' and id<>t and not exclude_from_growth order by id limit 1;
 if t is null or t2 is null then raise exception 'QA needs physics targets';end if;
 insert into courses(id,google_course_id,name,teacher_email,program,track) values(c,'qa-quiz-'||c,'QA quiz — rollback','qa.quiz@example.invalid','physics','cpa');
 insert into students(id,email,name) values(s,'qa-'||s||'@example.invalid','QA student'),(outsider,'qa-'||outsider||'@example.invalid','QA excluded student');
 insert into course_students(course_id,student_id,enrollment_state) values(c,s,'ACTIVE'),(c,outsider,'ACTIVE');
 a:=jsonb_build_object('id',aid,'course_id',c,'title','QA quiz','kind','mixed','instructions','Explain your reasoning.','grade_mode','numeric','due_at',null,'status','published','version',0,'source_quiz_id',null,'student_ids',jsonb_build_array(s),'questions',jsonb_build_array(
 jsonb_build_object('id',q1,'kind','choice','prompt','Which is a vector?','points',2,'target_id',t,'options',jsonb_build_array('Distance','Displacement'),'correct_index',1,'guide','Displacement includes direction.'),
 jsonb_build_object('id',q2,'kind','written','prompt','Explain zero displacement after a trip.','points',4,'target_id',t,'guide','Endpoints coincide; distance includes the path.'),
 jsonb_build_object('id',q3,'kind','problem','prompt','Find the change from +6 m to -2 m.','points',4,'target_id',t2,'guide','Final minus initial is -8 m.')));
 rejected:=false;begin perform save_quiz_assignment(a,'other@example.invalid','other@example.invalid');exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA owner bypass';end if;
 rejected:=false;begin perform save_quiz_assignment(jsonb_set(a,'{questions,0,target_id}',to_jsonb(gen_random_uuid())),'qa.quiz@example.invalid','qa.quiz@example.invalid');exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA target bypass';end if;
 perform save_quiz_assignment(a,'qa.quiz@example.invalid','qa.quiz@example.invalid');perform save_quiz_assignment(a,'qa.quiz@example.invalid','qa.quiz@example.invalid');
 if (select count(*) from quiz_assignments where id=aid)<>1 then raise exception 'QA duplicate assignment';end if;
 rejected:=false;begin perform save_quiz_assignment(a||jsonb_build_object('version',1,'title','Changed after publishing'),'qa.quiz@example.invalid','qa.quiz@example.invalid');exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA published questions changed';end if;
 answers:=jsonb_build_object(q1,'1',q2,'A trip can end where it started after covering distance.',q3,jsonb_build_object('model','Right is positive; initial +6 m, final -2 m.','plan','Final minus initial.','work','-2 - 6 = -8 m','answer','8 m to the left.'));
 rejected:=false;begin perform quiz_student_action(aid,outsider,'save',answers,0,gen_random_uuid());exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA individual audience bypass';end if;
 rejected:=false;begin perform quiz_student_action(aid,s,'submit','{}',0,sub1);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA incomplete submission';end if;
 rejected:=false;begin perform quiz_student_action(aid,s,'save',jsonb_build_object(q1,'9'),0,gen_random_uuid());exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA invalid choice';end if;
 perform quiz_student_action(aid,s,'save',jsonb_build_object(q1,'1'),0,gen_random_uuid());
 rejected:=false;begin perform quiz_student_action(aid,s,'save',answers,0,gen_random_uuid());exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA stale draft';end if;
 perform quiz_student_action(aid,s,'submit',answers,1,sub1);perform quiz_student_action(aid,s,'submit',answers,1,sub1);
 if (select count(*) from quiz_submissions where quiz_id=aid)<>1 or exists(select 1 from mastery_records where user_id=s) then raise exception 'QA submit duplicate or mastery write';end if;
 rejected:=false;begin perform quiz_student_action(aid,s,'save',answers,2,gen_random_uuid());exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA submitted answers editable';end if;
 draft:=jsonb_build_object('scores',jsonb_build_object(q2,3.5),'ratings','{}'::jsonb,'question_notes','{}'::jsonb,'note','Draft feedback','grade_value',null);
 perform save_quiz_review_draft(sub1,'qa.quiz@example.invalid','qa.quiz@example.invalid',draft,0);perform save_quiz_review_draft(sub1,'qa.quiz@example.invalid','qa.quiz@example.invalid',draft,0);
 if (select version from quiz_review_drafts where submission_id=sub1)<>1 or exists(select 1 from mastery_records where user_id=s) or exists(select 1 from quiz_reviews where submission_id=sub1) then raise exception 'QA review draft released evidence';end if;
 rejected:=false;begin perform save_quiz_review_draft(sub1,'qa.quiz@example.invalid','qa.quiz@example.invalid',draft||'{"note":"Changed"}',0);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA stale teacher draft';end if;
 rejected:=false;begin perform review_quiz_submission(sub1,rev1,'qa.quiz@example.invalid','qa.quiz@example.invalid','returned','{}','{}','Revise.','{}',null,0);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA final review ignored draft conflict';end if;
 rejected:=false;begin perform review_quiz_submission(sub1,rev1,'other@example.invalid','other@example.invalid','returned','{}','{}','Revise.','{}',null,1);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA teacher review scope';end if;
 rejected:=false;begin perform review_quiz_submission(sub1,rev1,'qa.quiz@example.invalid','qa.quiz@example.invalid','returned','{}','{}','','{}',null,1);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA missing feedback';end if;
 perform review_quiz_submission(sub1,rev1,'qa.quiz@example.invalid','qa.quiz@example.invalid','returned','{}','{}','Add a numerical out-and-back example.','{}',null,1);
 if exists(select 1 from mastery_records where user_id=s) then raise exception 'QA revision awarded mastery';end if;
 perform quiz_student_action(aid,s,'submit',answers||jsonb_build_object(q2,'3 m east and 3 m west gives distance 6 m, displacement 0 m.'),3,sub2);
 if (select qs.answers->>q2::text from quiz_submissions qs where qs.id=sub1)<>answers->>q2::text then raise exception 'QA old attempt overwritten';end if;
 rejected:=false;begin perform review_quiz_submission(sub2,rev2,'qa.quiz@example.invalid','qa.quiz@example.invalid','graded',jsonb_build_object(q2,3,q3,4),'{}','Clear work.','{}',null,0);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA implicit mastery decision';end if;
 result:=review_quiz_submission(sub2,rev2,'qa.quiz@example.invalid','qa.quiz@example.invalid','graded',jsonb_build_object(q2,3,q3,4),jsonb_build_object(t,3,t2,null),'Clear distinction; collect more evidence on the second target.','{}',null,0);
 perform review_quiz_submission(sub2,rev2,'qa.quiz@example.invalid','qa.quiz@example.invalid','graded',jsonb_build_object(q2,3,q3,4),jsonb_build_object(t,3,t2,null),'Clear distinction; collect more evidence on the second target.','{}',null,0);
 if (result->>'earned')::numeric<>9 or (result->>'possible')::numeric<>10 or (select count(*) from mastery_records where user_id=s)<>1 then raise exception 'QA grade/mastery independence or retry failure';end if;
 if (select count(*) from quiz_reviews where submission_id in(sub1,sub2))<>2 then raise exception 'QA review history';end if;
 foreach mode in array array['letter','credit'] loop
  newaid:=gen_random_uuid();newsub:=gen_random_uuid();newrev:=gen_random_uuid();
  perform save_quiz_assignment(a||jsonb_build_object('id',newaid,'grade_mode',mode),'qa.quiz@example.invalid','qa.quiz@example.invalid');
  perform quiz_student_action(newaid,s,'submit',answers,0,newsub);
  result:=review_quiz_submission(newsub,newrev,'qa.quiz@example.invalid','qa.quiz@example.invalid','graded',jsonb_build_object(q2,2,q3,1),jsonb_build_object(t,null,t2,null),'A separate teacher-selected grade.','{}',case when mode='letter' then 'B+' else 'credit' end,0);
  if result->>'grade_mode'<>mode or result->>'grade_value' is null then raise exception 'QA conventional grade missing';end if;
 end loop;
 if (select count(*) from mastery_records where user_id=s)<>1 then raise exception 'QA null decisions wrote mastery';end if;
 if has_table_privilege('anon','public.quiz_assignments','SELECT') or has_table_privilege('authenticated','public.quiz_reviews','INSERT') or has_table_privilege('service_role','public.quiz_submissions','UPDATE') or has_function_privilege('authenticated','public.quiz_student_action(uuid,uuid,text,jsonb,integer,uuid)','EXECUTE') then raise exception 'QA direct access exposed';end if;
end $qa$;
rollback;
select 'PASS: ownership, audience, target validation, drafts, submit retries, immutable attempts, teacher draft conflicts, revision, numeric/letter/credit grades, explicit mastery and unchanged history; all synthetic records rolled back' as result,(select count(*) from mastery_records) as mastery_record_count;
