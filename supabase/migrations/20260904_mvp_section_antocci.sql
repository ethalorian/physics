-- ============================================================================
-- 20260904_mvp_section_antocci.sql
--
-- Project Physics now has TWO sections (Craig 2026-09-04):
--   * 26-27 MVP Physics  — martind@fitchburg.k12.ma.us  (already configured)
--   * MVP Physics        — antoccic@fitchburg.k12.ma.us (this file)
--
-- The 2026-09-02/03 section setup landed only on the first row, so Craig's own
-- section had no schedule and no pacing at all: no B+C alternation, no on-week
-- dates, no current unit. This gives it the same configuration — B and C blocks,
-- alternating, first academic week 2026-08-31, all 21 academic-week Mondays,
-- Phase 1 from 2026-08-31, current lesson pp-w00.
--
-- Both sections read the same twenty week-lessons (pp-w00 … pp-w19). That is
-- deliberate: one curriculum per program. Publishing is Craig's call as site
-- admin — see claude/Physics-Classroom-App-Decisions.md (2026-09-04).
--
-- 2027-02-15 is deliberately absent from on_week_dates: the year map records
-- that on-week as lost entirely to winter vacation, and there is no lesson for
-- it (pp-w11 is 2027-02-01, pp-w12 is 2027-03-01). See
-- 20260904_projects_drop_feb15_onweek.sql, which removed it from the section
-- that already had it.
--
-- Idempotent: guarded insert + unconditional update, so re-running is a no-op
-- that re-asserts the intended values.
-- ============================================================================

-- ---------------------------------------------------------------- schedule
insert into public.section_schedules (course_id, block, blocks, week_pattern, on_week_anchor, on_week_dates, meeting_days, no_school_dates)
select '7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1'::uuid, 'B', array['B','C']::text[], 'alternate', '2026-08-31'::date,
       array['2026-08-31','2026-09-14','2026-09-28','2026-10-12','2026-10-26','2026-11-09','2026-11-23','2026-12-07','2026-12-21',
             '2027-01-04','2027-01-18','2027-02-01','2027-03-01','2027-03-15','2027-03-29','2027-04-12','2027-04-26',
             '2027-05-10','2027-05-24','2027-06-07']::date[],
       array[1,2,3,4,5]::integer[], array[]::date[]
where not exists (select 1 from public.section_schedules where course_id = '7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1'::uuid);

update public.section_schedules set
  block = 'B',
  blocks = array['B','C']::text[],
  week_pattern = 'alternate',
  on_week_anchor = '2026-08-31'::date,
  on_week_dates = array['2026-08-31','2026-09-14','2026-09-28','2026-10-12','2026-10-26','2026-11-09','2026-11-23','2026-12-07','2026-12-21',
                        '2027-01-04','2027-01-18','2027-02-01','2027-03-01','2027-03-15','2027-03-29','2027-04-12','2027-04-26',
                        '2027-05-10','2027-05-24','2027-06-07']::date[],
  meeting_days = array[1,2,3,4,5]::integer[],
  updated_at = now()
where course_id = '7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1'::uuid;

-- ---------------------------------------------------------------- pacing
-- Phase 1 opened with the section on 2026-08-31 (the year map's date, not the
-- date the row happened to be written). Current lesson is Week 0, the only
-- published Project Physics week today.
insert into public.section_pacing (course_id, current_unit_id, current_lesson_id, unit_start_date, source, confirmed_by)
select '7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1'::uuid, 'proj-1',
       (select id from public.lessons where slug = 'pp-w00'), '2026-08-31'::date, 'confirmed', 'antoccic@fitchburg.k12.ma.us'
where not exists (select 1 from public.section_pacing where course_id = '7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1'::uuid);

update public.section_pacing set
  current_unit_id = 'proj-1',
  current_lesson_id = (select id from public.lessons where slug = 'pp-w00'),
  unit_start_date = '2026-08-31'::date,
  source = 'confirmed',
  confirmed_by = 'antoccic@fitchburg.k12.ma.us',
  updated_at = now()
where course_id = '7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1'::uuid;
