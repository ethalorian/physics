begin;
do $qa$
declare
  c uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid();
  aid uuid:=gen_random_uuid(); q1 uuid:=gen_random_uuid(); q2 uuid:=gen_random_uuid();
  sub1 uuid:=gen_random_uuid(); sub2 uuid:=gen_random_uuid(); rev1 uuid:=gen_random_uuid(); rev2 uuid:=gen_random_uuid();
  t uuid; l uuid; a jsonb; answers jsonb; result jsonb; rejected boolean;
begin
  select id into t from learning_targets where slug='u1.vocab-position-distance-displacement' and program='physics';
  select id into l from lessons where slug='position-and-displacement';
  if t is null or l is null then raise exception 'QA fixture needs existing lesson and target'; end if;
  insert into courses(id,google_course_id,name,teacher_email,program,track) values(c,'qa-rollback-'||c,'QA ONLY — rollback','qa.teacher@example.invalid','physics','cpa');
  insert into students(id,email,name) values(s,'qa-'||s||'@example.invalid','QA ONLY — rollback'),(outsider,'qa-'||outsider||'@example.invalid','QA outsider — rollback');
  insert into course_students(course_id,student_id,enrollment_state) values(c,s,'ACTIVE');
  a:=jsonb_build_object('id',aid,'course_id',c,'origin_key','lesson:'||l||':position-reading','title','QA rollback reading','chapter',5,'reading','Section 5.1, p. 69','section_ids',jsonb_build_array('5.1'),'instructions','Explain the distinction.','questions',jsonb_build_array(jsonb_build_object('id',q1,'reference','QA 1','prompt','Explain scalar and vector.','target_id',t),jsonb_build_object('id',q2,'reference','QA 2','prompt','Explain an out-and-back trip.','target_id',t)),'due_at',null,'status','published','version',0);
  rejected:=false;begin perform save_textbook_assignment(a,'qa.other@example.invalid','qa.other@example.invalid');exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA ownership bypass';end if;
  rejected:=false;begin perform save_textbook_assignment(a||jsonb_build_object('origin_key','lesson:'||l||':missing-block'),'qa.teacher@example.invalid','qa.teacher@example.invalid');exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA invalid link accepted';end if;
  perform save_textbook_assignment(a,'qa.teacher@example.invalid','qa.teacher@example.invalid');
  perform save_textbook_assignment(a,'qa.teacher@example.invalid','qa.teacher@example.invalid');
  if (select count(*) from textbook_assignments where id=aid)<>1 then raise exception 'QA assignment retry duplicated';end if;
  answers:=jsonb_build_object(q1,'A scalar gives magnitude; a vector includes direction.',q2,'Walking out and back adds distance but gives zero displacement.');
  rejected:=false;begin perform textbook_student_action(aid,outsider,'submit',answers,0,sub1);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA enrollment bypass';end if;
  rejected:=false;begin perform textbook_student_action(aid,s,'submit','{}',0,sub1);exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA incomplete submission allowed';end if;
  perform textbook_student_action(aid,s,'save',jsonb_build_object(q1,answers->q1::text),0,gen_random_uuid());
  rejected:=false;begin perform textbook_student_action(aid,s,'save',answers,0,gen_random_uuid());exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA stale save allowed';end if;
  perform textbook_student_action(aid,s,'submit',answers,1,sub1);
  perform textbook_student_action(aid,s,'submit',answers,1,sub1);
  if (select count(*) from textbook_submissions where assignment_id=aid)<>1 then raise exception 'QA double submission';end if;
  if exists(select 1 from mastery_records where user_id=s) then raise exception 'QA submit wrote mastery';end if;
  rejected:=false;begin perform textbook_student_action(aid,s,'save',answers,2,gen_random_uuid());exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA submitted work editable';end if;
  rejected:=false;begin perform review_textbook_submission(sub1,rev1,'qa.other@example.invalid','qa.other@example.invalid','rated',jsonb_build_object(t,3),'QA');exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA teacher roster bypass';end if;
  rejected:=false;begin perform review_textbook_submission(sub1,rev1,'qa.teacher@example.invalid','qa.teacher@example.invalid','returned','{}','');exception when raise_exception then rejected:=true;end;if not rejected then raise exception 'QA feedback missing';end if;
  perform review_textbook_submission(sub1,rev1,'qa.teacher@example.invalid','qa.teacher@example.invalid','returned','{}','Add a numerical example to support your out-and-back explanation.');
  if exists(select 1 from mastery_records where user_id=s) then raise exception 'QA return wrote mastery';end if;
  perform textbook_student_action(aid,s,'submit',answers||jsonb_build_object(q2,'Walking 3 m east and 3 m west covers 6 m. Displacement is 0 m because the endpoints match.'),3,sub2);
  if (select ts.answers->>q2::text from textbook_submissions ts where ts.id=sub1)<>answers->>q2::text then raise exception 'QA previous snapshot changed';end if;
  perform review_textbook_submission(sub2,rev2,'qa.teacher@example.invalid','qa.teacher@example.invalid','rated',jsonb_build_object(t,3),'Clear distinction and numerical evidence.');
  perform review_textbook_submission(sub2,rev2,'qa.teacher@example.invalid','qa.teacher@example.invalid','rated',jsonb_build_object(t,3),'Clear distinction and numerical evidence.');
  if (select count(*) from mastery_records where user_id=s)<>1 then raise exception 'QA duplicate target rating';end if;
  if (select state from textbook_work where assignment_id=aid and user_id=s)<>'rated' then raise exception 'QA not rated';end if;
  if (select count(*) from textbook_reviews where submission_id in(sub1,sub2))<>2 then raise exception 'QA feedback history missing';end if;
end $qa$;
rollback;
select 'PASS: real database save, resume, submit, teacher return, revision, resubmit, mastery review, feedback history; all QA records rolled back' as result,
(select count(*) from mastery_records) as unchanged_mastery_count;
