-- Isolated local schema fixture only. All fictional records are rolled back.
begin;
do $$
declare
  c uuid := gen_random_uuid(); other_course uuid := gen_random_uuid(); a uuid := '10000000-0000-4000-8000-000000000001';
  b uuid := '10000000-0000-4000-8000-000000000002'; later uuid := '10000000-0000-4000-8000-000000000003';
  d date := (now() at time zone 'America/New_York')::date-10; preview jsonb; one jsonb; initial jsonb;
  quiz uuid := gen_random_uuid();
begin
  insert into courses(id) values(c),(other_course);
  insert into students(id,is_active) values(a,true),(b,true),(later,true);
  insert into course_students(course_id,student_id,enrollment_state,enrolled_at) values(c,a,'ACTIVE',d-2),(c,b,'ACTIVE',d-2),(c,later,'ACTIVE',d+1);
  insert into course_grading_settings(course_id,terms) values(c,jsonb_build_array(
    jsonb_build_object('id','t1','start',d-2,'end',d+2),
    jsonb_build_object('id','t2','start',d+3,'end',d+30)));
  one:=jsonb_build_object('id',a,'revision',0,'mark','absent','made_up',false);
  initial:=jsonb_build_array(one,jsonb_build_object('id',b,'revision',0,'mark','excused','made_up',false));
  perform public.save_attendance_meeting(c,'t1',d,initial,'teacher');
  perform public.save_attendance_meeting(c,'t1',d,initial,'teacher');
  if (select count(*) from attendance_marks where course_id=c)<>2 or exists(select from attendance_term_grades where course_id=c) then raise exception 'Draft/confirmation released or duplicated a grade';end if;
  begin
    perform public.save_attendance_meeting(c,'t1',d,jsonb_build_array(one||jsonb_build_object('id',later)),'teacher');
    raise exception 'Allowed pre-enrollment mark' using errcode='XX000';
  exception when raise_exception then null; end;
  begin
    perform public.save_attendance_meeting(c,'t1',d,jsonb_build_array(one||jsonb_build_object('revision',1,'mark','participated'),one||jsonb_build_object('id',b,'mark','present')),'teacher');
    raise exception 'Did not reject stale batch' using errcode='XX000';
  exception when raise_exception then null; end;
  if (select mark from attendance_marks where course_id=c and user_id=a)<>'absent' then raise exception 'Partial write on stale batch';end if;
  preview:=jsonb_build_array(jsonb_build_object('id',a,'earned',0,'eligible',1),jsonb_build_object('id',b,'earned',0,'eligible',0),jsonb_build_object('id',later,'earned',0,'eligible',0));
  begin
    perform public.post_attendance_term(c,'t2',preview,'teacher');
    raise exception 'Posted open term' using errcode='XX000';
  exception when raise_exception then null; end;
  perform public.post_attendance_term(c,'t1',preview,'teacher');
  if (select earned from attendance_term_grades where course_id=c and user_id=a)<>0 then raise exception 'Valid zero lost';end if;
  perform public.save_attendance_meeting(c,'t1',d,jsonb_build_array(one||jsonb_build_object('revision',1,'made_up',true)),'teacher');
  if (select earned from attendance_term_grades where course_id=c and user_id=a)<>0 then raise exception 'Make-up changed posted grade';end if;
  begin
    perform public.post_attendance_term(c,'t1',preview,'teacher');
    raise exception 'Accepted stale grade preview' using errcode='XX000';
  exception when raise_exception then null; end;
  preview:=jsonb_set(preview,'{0,earned}','1'::jsonb);
  perform public.post_attendance_term(c,'t1',preview,'teacher');
  perform public.post_attendance_term(c,'t1',preview,'teacher');
  if (select count(*) from attendance_term_grades where course_id=c)<>3 or (select earned from attendance_term_grades where course_id=c and user_id=a)<>1 then raise exception 'Repost did not update in place';end if;
  begin
    update course_grading_settings set terms='[]' where course_id=c;
    raise exception 'Deleted posted term' using errcode='XX000';
  exception when foreign_key_violation then null; end;
  insert into quiz_assignments(id,course_id,title) values(quiz,other_course,'Foreign class response');
  insert into quiz_submissions(quiz_id,user_id,answers,submitted_at) values(quiz,a,'{"q":1}',(d+time '12:00') at time zone 'America/New_York');
  if exists(select from attendance_evidence(c,d)) then raise exception 'Another class produced an attendance suggestion';end if;
  update quiz_assignments set course_id=c where id=quiz;
  if not exists(select from attendance_evidence(c,d) where user_id=a) then raise exception 'Missing same-day suggestion';end if;
  if has_table_privilege('authenticated','attendance_marks','SELECT') or has_function_privilege('anon','post_attendance_term(uuid,text,jsonb,text)','EXECUTE') then raise exception 'Unexpected browser data access';end if;
end $$;
rollback;
