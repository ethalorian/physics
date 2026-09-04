-- ============================================================================
-- 20260904_projects_drop_feb15_onweek.sql
--
-- Project Physics: 2027-02-15 is not an on-week.
--
-- Both Project Physics sections listed 21 academic-week Mondays in
-- section_schedules.on_week_dates, including 2027-02-15. There are only TWENTY
-- week-lessons (pp-w00 … pp-w19), and scripts/gen-projects-curriculum.py
-- deliberately skips that Monday — pp-w11 is 2027-02-01 and pp-w12 is
-- 2027-03-01 — because the year map records the week of Feb 15 as winter
-- vacation, an on-week lost entirely:
--
--     | Feb 15 | **0** | 0 | Winter vacation — this on-week is lost entirely |
--     (claude/MVP-CPA-Physics-Project-Year-Map.md)
--
-- Left in place, the pacing calendar calls that week an on-week with no lesson
-- behind it. Dropping it makes the schedule agree with the curriculum: the week
-- of Feb 15 and the week of Feb 22 are both off, and the section returns Mar 1
-- on pp-w12.
--
-- Applies to every section of the program, because it is a fact about the
-- calendar, not about a cohort. Idempotent: array_remove is a no-op when the
-- date is already gone.
--
-- STILL TO CHECK, and not decided here: whether FHS re-anchors the B/C
-- alternation after February vacation. The March-onward Mondays below are the
-- strict-parity ones. If the school shifts the alternation, edit on_week_dates
-- on the pacing card — that list is the override and it wins over parity.
-- ============================================================================

update public.section_schedules ss
set on_week_dates = array_remove(ss.on_week_dates, '2027-02-15'::date),
    updated_at = now()
from public.courses c
where c.id = ss.course_id
  and c.program = 'projects'
  and '2027-02-15'::date = any (ss.on_week_dates);
