-- Run in the isolated attendance fixture. All data below is fictional.
begin;
do $$
declare
  c uuid:=gen_random_uuid(); other_class uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
  q uuid:=gen_random_uuid(); reading_id uuid:=gen_random_uuid(); d date:=(now() at time zone 'America/New_York')::date-10;
  today date:=(now() at time zone 'America/New_York')::date; draft jsonb; stamp timestamptz; snapshot jsonb;
begin
  insert into courses(id,program) values(c,'physics'),(other_class,'physics');
  insert into students(id,is_active) values(a,true),(b,true);
  insert into course_students(course_id,student_id,enrollment_state,enrolled_at) values(c,a,'ACTIVE',d-1),(c,b,'ACTIVE',d-1);
  insert into course_grading_settings(course_id,terms) values(c,jsonb_build_array(jsonb_build_object('id','fall','start',d,'end',d+4)));
  insert into quiz_assignments(id,course_id,title) values(q,c,'Quiz');
  insert into textbook_assignments(id,course_id,title) values(reading_id,c,'Reading');
  stamp:=(d+time '23:59') at time zone 'America/New_York';
  draft:=jsonb_build_object('quiz_id',q,'user_id',a,'answers','{"q":{"model":{"mode":"drawing","text":"  ","strokes":[]}}}'::jsonb);
  perform public.remember_attendance_work('quiz_work',draft,null,stamp);
  if exists(select from attendance_work_days where user_id=a) then raise exception 'Empty structured answer got credit';end if;
  if public.attendance_clean_answer('{"strokes":[{"color":"blue","points":[]}]}') is not null
    or public.attendance_clean_answer('{"strokes":[{"points":[{"x":0,"y":0}]}]}') is null
    then raise exception 'Drawing tool state must be distinct from a real stroke'; end if;
  draft:=jsonb_set(draft,'{answers,q}',to_jsonb('0'::text));
  perform public.remember_attendance_work('quiz_work',draft,null,stamp);
  perform public.remember_attendance_work('quiz_work',draft,draft,stamp+interval '1 day');
  if (select count(*) from attendance_work_days where user_id=a)<>1 then raise exception 'Repeat save got extra credit';end if;
  perform public.remember_attendance_work('quiz_work',jsonb_set(draft,'{answers,q}',to_jsonb('2'::text)),draft,stamp+interval '1 day');
  insert into quiz_submissions(quiz_id,user_id,submitted_at,answers) values(q,a,stamp,'{"q":"0"}'),(q,a,stamp+interval '2 days','{"q":"2"}');
  insert into quiz_submissions(quiz_id,user_id,submitted_at,answers) values(q,b,stamp,'{"q":{"text":" ","strokes":[],"mode":"drawing"}}');
  if (select count(*) from public.attendance_effective_marks(c,array[d,d+1],d,d+4,a) where mark='participated' and revision=0)<>2
    or exists(select from public.attendance_effective_marks(c,array[d,d+1],d,d+4,b))
    or exists(select from public.attendance_effective_marks(other_class,array[d,d+1],d,d+4,a))
    then raise exception 'Incorrect auto-credit scope, deduplication, or loss of prior draft day';end if;
  perform public.save_attendance_meeting(c,'fall',d,jsonb_build_array(jsonb_build_object('id',a,'revision',0,'mark','excused','made_up',false)),'teacher');
  if (select mark from public.attendance_effective_marks(c,array[d,d+1],d,d+4,a) where meeting_day=d)<>'excused' then raise exception 'Teacher override lost';end if;
  select jsonb_agg(to_jsonb(s) order by id) into snapshot from (values(a,1,1),(b,0,2)) s(id,earned,eligible);
  if exists(select from attendance_term_grades where course_id=c) then raise exception 'Attendance posted without teacher';end if;
  perform public.post_automatic_attendance_term(c,'fall',array[d,d+1],snapshot,'teacher');
  if not exists(select from attendance_term_grades where course_id=c and user_id=a and full_credit_at=80 and earned=1 and eligible=1) then raise exception 'Bad posted snapshot';end if;
  perform public.save_attendance_meeting(c,'fall',d+1,jsonb_build_array(jsonb_build_object('id',a,'revision',0,'mark','absent','made_up',false)),'teacher');
  begin
    perform public.post_automatic_attendance_term(c,'fall',array[d,d+1],snapshot,'teacher');
    raise exception 'Accepted stale preview' using errcode='XX000';
  exception when raise_exception then null;end;
  if (select earned from attendance_term_grades where course_id=c and user_id=a)<>1 then raise exception 'Changed posted grade';end if;
  insert into textbook_work(assignment_id,user_id,answers,state,updated_at) values(reading_id,b,'{"q":"  "}','in_progress',now());
  update textbook_work set answers='{"q":"my attempt"}' where assignment_id=reading_id and user_id=b;
  delete from textbook_work where assignment_id=reading_id and user_id=b;
  if not exists(select from public.attendance_work_days where course_id=c and user_id=b and meeting_day=today and source='Saved reading response') then raise exception 'Draft credit disappeared on cleanup';end if;
  if has_table_privilege('authenticated','attendance_work_days','SELECT') or has_function_privilege('authenticated','post_automatic_attendance_term(uuid,text,date[],jsonb,text)','EXECUTE') then raise exception 'Unexpected direct access';end if;
end $$;
rollback;
