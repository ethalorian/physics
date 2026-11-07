begin;
do $$
declare
  course uuid := gen_random_uuid(); pupil uuid := gen_random_uuid(); late_join uuid := gen_random_uuid();
  today date := (now() at time zone 'America/New_York')::date;
  days date[]; totals record;
begin
  select array_agg(today-n order by n desc) into days from generate_series(0,7) n;
  insert into courses(id,program) values(course,'physics');
  insert into students(id,is_active) values(pupil,true),(late_join,true);
  insert into course_students(course_id,student_id,enrollment_state,enrolled_at)
  values(course,pupil,'ACTIVE',today-10),(course,late_join,'ACTIVE',(today::timestamp at time zone 'America/New_York'));
  insert into attendance_work_days(course_id,user_id,meeting_day,at_time,source)
  values(course,pupil,days[2],now(),'Saved response'),(course,pupil,days[5],now(),'Saved response');
  select count(*) as held, count(*) filter(where mark='participated') as credited,
         count(*) filter(where mark='no_credit' and revision=0) as unmarked into totals
    from attendance_elapsed_marks(course,days||array[today+1,today],today-10,today+10,pupil);
  if (totals.held,totals.credited,totals.unmarked)<>(8,2,6) then raise exception 'Expected 2 credits for 8 unique elapsed days'; end if;
  if (select count(*) from attendance_elapsed_marks(course,days,today-10,today,late_join))<>1 then
    raise exception 'A pre-enrollment day counted'; end if;
  if exists(select from attendance_marks where course_id=course) then raise exception 'An implicit zero wrote an absence'; end if;
  insert into attendance_marks(course_id,user_id,meeting_day,mark,made_up,confirmed_by)
  values(course,pupil,days[2],'excused',false,'teacher'),(course,pupil,days[3],'absent',true,'teacher');
  select count(*) filter(where mark<>'excused') as counted,
         count(*) filter(where mark='participated' or made_up) as credited into totals
    from attendance_elapsed_marks(course,days,today-10,today,pupil);
  if (totals.counted,totals.credited)<>(7,2) then raise exception 'Excusal or makeup ignored'; end if;
  if has_function_privilege('authenticated','attendance_elapsed_marks(uuid,date[],date,date,uuid)','execute') then raise exception 'Unexpected direct access'; end if;
end $$;
rollback;
