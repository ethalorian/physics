-- Prepare drafts in the existing reading system; publish only chosen readings
-- and their linked quizzes atomically with their menu. Vocabulary stays separate.
-- A draft is planning data only. First publication prepares native assignments
-- and publishes the choice menu in the same transaction, preserving existing work.
create or replace function public.publish_choice_sequence(p_section uuid,p_course uuid,p_actor text,p_version integer)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare sec choice_sections; opt jsonb; step jsonb; new_options jsonb := '[]'; steps jsonb; sid uuid; native_id uuid; deadline date; window_row lesson_class_windows;
begin
  -- Match save_choice_section's lock order; serialize menus within one class.
  perform 1 from courses where id=p_course and teacher_email=p_actor and archived_at is null and coalesce(program,'physics')='physics' for update;
  if not found then raise exception 'Choose one of your Physics classes.'; end if;
  select * into sec from choice_sections where id=p_section and course_id=p_course for update;
  if not found or sec.version<>p_version then raise exception 'This sequence changed. Refresh before publishing.'; end if;
  if sec.published_at is not null then
    return public.mutate_choice_calendar(p_section,null,p_actor,true,'publish','{"published":true}'::jsonb);
  end if;
  deadline := (sec.due_at at time zone 'America/New_York')::date;
  for opt in select value from jsonb_array_elements(sec.options) loop
    steps := '[]';
    for step in select value from jsonb_array_elements(opt->'steps') loop
      sid := (step->>'sourceId')::uuid;
      if step->>'kind'='interactive' then
        if coalesce(step->>'assignmentSlug','')='' or not exists(select 1 from learning_targets where id=(step->>'targetId')::uuid and coalesce(program,'physics')='physics') then raise exception 'Re-add this interactive activity before publishing.'; end if;
        insert into interactive_assignments(id,course_id,slug,target_id,due_on)
        values(sid,p_course,step->>'assignmentSlug',(step->>'targetId')::uuid,deadline)
        on conflict(course_id,slug) do update set due_on=coalesce(interactive_assignments.due_on,excluded.due_on)
        returning id into native_id;
        step := step || jsonb_build_object('sourceId',native_id::text,'id','interactive:'||native_id::text,'href','/interactive-assignments/'||native_id::text);
      elsif step->>'kind'='lesson' then
        perform 1 from lessons where id=sid and published;
        if not found then raise exception 'A lesson is no longer published. Update this sequence.'; end if;
        select * into window_row from lesson_class_windows where course_id=p_course::text and lesson_id=sid::text for update;
        if found and ((window_row.open_at is not null and window_row.open_at>sec.opens_at) or (window_row.close_at is not null and window_row.close_at<sec.due_at)) then raise exception 'A lesson access window does not cover this menu. Adjust its class availability or the menu dates before publishing.'; end if;
        insert into lesson_class_windows(course_id,lesson_id,open_at,close_at,due_at,set_by)
        values(p_course::text,sid::text,sec.opens_at,null,sec.due_at,p_actor)
        on conflict(course_id,lesson_id) do update set due_at=coalesce(lesson_class_windows.due_at,excluded.due_at);
      elsif step->>'kind'='reading' then
        update textbook_assignments r set status='published',due_at=coalesce(due_at,sec.due_at),
          opens_at=case when status='draft' then sec.opens_at else opens_at end,
          version=version+case when status='draft' then 1 else 0 end
        where id=sid and course_id=p_course and (status='published' or status='draft' and exists(select 1 from reading_syllabus_bundles b where b.reading_id=r.id and b.course_id=p_course))
          and jsonb_array_length(questions)>0 and (status='draft' or opens_at is null or opens_at<=sec.opens_at);
        if not found then raise exception 'A reading is unavailable during this menu. Check its publication and opening time.'; end if;
      elsif step->>'kind'='quiz' then
        update quiz_assignments q set due_at=coalesce(due_at,sec.due_at),status='published',version=version+case when status='draft' then 1 else 0 end
        where id=sid and course_id=p_course and (status='published' or status='draft' and exists(
          select 1 from reading_syllabus_bundles b cross join lateral jsonb_array_elements(sec.options) o cross join lateral jsonb_array_elements(o->'steps') st
          where b.reading_quiz_id=q.id and b.course_id=p_course and st->>'kind'='reading' and st->>'sourceId'=b.reading_id::text)) and jsonb_array_length(questions)>0 and deleted_at is null and (student_ids is null or not exists(select 1 from course_students c where c.course_id=p_course and c.enrollment_state='ACTIVE' and not(c.student_id=any(q.student_ids))));
        if not found then raise exception 'A quiz is no longer published for the whole class.'; end if;
      elsif step->>'kind'='vocabulary' then
        update vocab_tasks v set due_on=coalesce(due_on,deadline) where id=sid and course_id=p_course and active and not syllabus_draft and not exists(select 1 from course_students c where c.course_id=p_course and c.enrollment_state='ACTIVE' and not(c.student_id=any(v.student_ids)));
        if not found then raise exception 'A vocabulary task is no longer available for the whole class.'; end if;
      else
        raise exception 'This activity needs class setup before it can be a choice.';
      end if;
      steps := steps || jsonb_build_array(step);
    end loop;
    new_options := new_options || jsonb_build_array(jsonb_set(opt,'{steps}',steps));
  end loop;
  if exists(select 1 from choice_sections s cross join lateral jsonb_array_elements(s.options) o cross join lateral jsonb_array_elements(o->'steps') st cross join lateral jsonb_array_elements(new_options) n cross join lateral jsonb_array_elements(n->'steps') ns where s.course_id=p_course and s.id<>p_section and st->>'kind'=ns->>'kind' and (st->>'sourceId'=ns->>'sourceId' or (st->>'kind'='interactive' and st->>'assignmentSlug'=ns->>'assignmentSlug'))) then raise exception 'An activity already belongs to another choice menu.'; end if;
  update choice_sections set options=new_options where id=p_section;
  return public.mutate_choice_calendar(p_section,null,p_actor,true,'publish','{"published":true}'::jsonb);
end $$;
revoke all on function public.publish_choice_sequence(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.publish_choice_sequence(uuid,uuid,text,integer) to service_role;

