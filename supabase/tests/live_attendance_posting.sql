begin;
do $$
declare course uuid:=gen_random_uuid(); today date:=(now() at time zone 'America/New_York')::date;
begin
  insert into courses(id,program) values(course,'physics');
  insert into course_grading_settings(course_id,terms) values(course,jsonb_build_array(
    jsonb_build_object('id','current','start',today-3,'end',today+6),
    jsonb_build_object('id','future','start',today+7,'end',today+20)));
  begin
    perform publish_live_attendance_term(course,'future','fixture');
    raise exception 'future term accepted' using errcode='XX000';
  exception when raise_exception then null; end;
  perform publish_live_attendance_term(course,'current','fixture');
  perform publish_live_attendance_term(course,'current','fixture');
  if (select count(*) from attendance_live_terms where course_id=course)<>1 then raise exception 'duplicate or missing live term';end if;
  begin
    update course_grading_settings set terms='[]' where course_id=course;
    raise exception 'published term deletion accepted' using errcode='XX000';
  exception when foreign_key_violation then null; end;
  if has_function_privilege('authenticated','publish_live_attendance_term(uuid,text,text)','execute') then raise exception 'unexpected client permission';end if;
end $$;
rollback;
