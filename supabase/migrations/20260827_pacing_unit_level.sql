-- ============================================================================
-- 20260827_pacing_unit_level.sql
--
-- Pacing: one model (unit-level), scoped by program, seeded from the FPS
-- 2026–27 calendar.
--
-- PROBLEMS (observed 2026-08-27):
--   1. Nothing linked a course to a program. `units` carries physics AND trades
--      rows that share order_index 1–6, and pacing keyed units by that integer,
--      so a CPA Physics section's unit picker showed trades units and editing
--      "Unit 3" touched both programs.
--   2. section_pacing.current_unit_order was that ambiguous integer.
--   3. rotation_calendar.no_school_dates was empty — the 6-day cycle would
--      drift on the first PD day (9/1).
--   4. units.allotted_days equalled the lesson count (131 days total) while
--      the school year is 180 days; every section would read "behind" the
--      first time a lab ran long. Unit windows from the calendar doc carry the
--      buffer implicitly.
--   5. section_schedules.start_date (the course-level model) had no writer.
-- ============================================================================

-- 1. Courses carry a program. Existing/imported classes are physics.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS program text NOT NULL DEFAULT 'physics';
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_program_check;
ALTER TABLE public.courses
  ADD CONSTRAINT courses_program_check CHECK (program IN ('physics', 'trades'));

-- 2. Pacing keys the current unit by id, not order. (Table was empty; nothing
--    to migrate.)
ALTER TABLE public.section_pacing
  ADD COLUMN IF NOT EXISTS current_unit_id text REFERENCES public.units(id) ON DELETE SET NULL;
ALTER TABLE public.section_pacing DROP COLUMN IF EXISTS current_unit_order;

-- 3. Default unit start dates from the FPS 2026–27 unit windows, so a teacher
--    picking a unit gets the planned start pre-filled.
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS default_start_date date;

-- 4. Physics unit windows (days in window, per FPS 2026–27 calendar doc).
UPDATE public.units SET allotted_days = 34, default_start_date = '2026-08-25' WHERE id = 'unit-1';
UPDATE public.units SET allotted_days = 25, default_start_date = '2026-10-15' WHERE id = 'unit-2';
UPDATE public.units SET allotted_days = 21, default_start_date = '2026-11-23' WHERE id = 'unit-3';
UPDATE public.units SET allotted_days = 24, default_start_date = '2027-01-08' WHERE id = 'unit-4';
UPDATE public.units SET allotted_days = 16, default_start_date = '2027-02-22' WHERE id = 'unit-5';
UPDATE public.units SET allotted_days = 23, default_start_date = '2027-03-16' WHERE id = 'unit-6';
UPDATE public.units SET allotted_days = 22, default_start_date = '2027-04-26' WHERE id = 'unit-7';
UPDATE public.units SET allotted_days = 11, default_start_date = '2027-05-26' WHERE id = 'unit-8';

-- 5. School-wide no-school weekdays, FPS 2026–27 (approved 2026-04-06).
UPDATE public.rotation_calendar SET no_school_dates = ARRAY[
  '2026-09-01','2026-09-07',
  '2026-10-12',
  '2026-11-03','2026-11-11','2026-11-26','2026-11-27',
  '2026-12-24','2026-12-25','2026-12-28','2026-12-29','2026-12-30','2026-12-31',
  '2027-01-01','2027-01-18','2027-01-19',
  '2027-02-15','2027-02-16','2027-02-17','2027-02-18','2027-02-19',
  '2027-03-26',
  '2027-04-19','2027-04-20','2027-04-21','2027-04-22','2027-04-23',
  '2027-05-31'
]::date[], updated_at = now()
WHERE id = 'default';
