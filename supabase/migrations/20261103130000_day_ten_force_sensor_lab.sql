-- Adopt the Claude force-sensor lab before this foundation is assigned.
do $$
begin
  if exists (select 1 from public.interactive_assignments where slug='day-10-foundation-forces') then
    raise exception 'Day 10 is already assigned. Preserve that cohort before converting the template.';
  end if;
  update public.interactive_assignment_templates set is_lab=true,title='Day 10 · Foundation lab: Forces'
  where slug='day-10-foundation-forces' and day=10;
  if not found then raise exception 'Day 10 template missing'; end if;
  update public.daily_lesson_templates set foundation_questions=array['f10-source','f10-bag','f10-ramp','f10-weight','f10-contact','f10-sign']
  where key='unit-1-day-10' and foundation_slug='day-10-foundation-forces';
  if not found then raise exception 'Day 10 sequence missing'; end if;
end $$;
