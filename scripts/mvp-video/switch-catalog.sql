-- Authorized curriculum change, 2026-09-28. Keep lesson/work IDs for recovery.
-- Both MVP Physics classes join the shared video catalog. Open ONLY videos 2 and 3.
begin;
do $$
begin
  if (select count(*) from courses where id in ('3397101f-e283-4e96-8527-c18632a18e50','7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1') and program in ('projects','physics')) <> 2 then raise exception 'MVP classes changed'; end if;
  if (select count(*) from lessons where unit_id in ('proj-1','proj-2','proj-3','proj-4')) <> 34 then raise exception 'Project lesson catalog changed'; end if;
  if (select count(*) from lessons where id::text in ('eaa95227-1bc7-41e8-af7c-192bdedc8303','fc67d63d-a011-426b-b9f3-fd8f1ea7f501') and published and unit_id='unit-1' and content_blocks->>'presentation'='physics-path') <> 2 then raise exception 'Video lessons missing'; end if;
end $$;
update courses set program='physics',updated_at=now()
where id in ('3397101f-e283-4e96-8527-c18632a18e50','7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1') and program='projects';
update lessons set published=false
where unit_id in ('proj-1','proj-2','proj-3','proj-4') and published;
update section_pacing set current_unit_id='unit-1',current_lesson_id='eaa95227-1bc7-41e8-af7c-192bdedc8303',unit_start_date=current_date,updated_at=now()
where course_id::text in ('3397101f-e283-4e96-8527-c18632a18e50','7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1') and current_unit_id in ('proj-1','proj-2','proj-3','proj-4');
-- Any other current video remains closed for these two classes.
update lesson_class_windows w set close_at=now()-interval '1 second',updated_at=now()
from lessons l
where w.lesson_id=l.id::text and w.course_id in ('3397101f-e283-4e96-8527-c18632a18e50','7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1')
  and l.content_blocks->>'presentation'='physics-path'
  and l.id::text not in ('eaa95227-1bc7-41e8-af7c-192bdedc8303','fc67d63d-a011-426b-b9f3-fd8f1ea7f501')
  and (w.close_at is null or w.close_at>=now());
insert into lesson_class_windows(course_id,lesson_id,open_at,close_at,set_by,updated_at)
select c.id::text,l.id::text,now(),null,c.teacher_email,now()
from courses c cross join lessons l
where c.id in ('3397101f-e283-4e96-8527-c18632a18e50','7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1')
  and l.id::text in ('eaa95227-1bc7-41e8-af7c-192bdedc8303','fc67d63d-a011-426b-b9f3-fd8f1ea7f501')
on conflict(course_id,lesson_id) do update set open_at=excluded.open_at,close_at=null,set_by=excluded.set_by,updated_at=excluded.updated_at;
commit;
