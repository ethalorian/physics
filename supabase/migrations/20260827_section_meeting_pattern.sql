-- ============================================================================
-- 20260827_section_meeting_pattern.sql
--
-- A section's schedule is a MEETING PATTERN, not one block letter.
--   * MVP sections meet in TWO blocks (B and C) inside the rotation — 0, 1 or 2
--     meetings a day depending on cycle day — and only on ALTERNATING weeks
--     (the vocational schedule; the off-week is shop).
--   * The alternation is school-wide, so it is anchored ONCE on the rotation
--     calendar; a section only says whether it follows it.
-- Pacing counts meetings, so an MVP on-week yields the 8–9 blocks the ETF
-- charter describes and an off-week yields none.
-- ============================================================================
ALTER TABLE public.section_schedules
  ADD COLUMN IF NOT EXISTS blocks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS week_pattern text NOT NULL DEFAULT 'every';
ALTER TABLE public.section_schedules DROP CONSTRAINT IF EXISTS section_schedules_week_pattern_check;
ALTER TABLE public.section_schedules
  ADD CONSTRAINT section_schedules_week_pattern_check CHECK (week_pattern IN ('every', 'alternate'));

-- Carry the old single block forward.
UPDATE public.section_schedules SET blocks = ARRAY[block] WHERE block IS NOT NULL AND blocks = '{}';

-- School-wide: any date inside an MVP "on" (academic) week. Weeks alternate
-- from that Monday by the calendar, regardless of vacations.
ALTER TABLE public.rotation_calendar
  ADD COLUMN IF NOT EXISTS alt_week_anchor date;
COMMENT ON COLUMN public.rotation_calendar.alt_week_anchor IS 'Any date inside an MVP on-week; alternate-week sections meet on weeks with the same parity.';

-- ---------------------------------------------------------------------------
-- Amendment (same day): the two MVP sections are on OPPOSITE weeks (one is in
-- shop while the other is in academics), so the on-week anchor is PER SECTION,
-- not school-wide. rotation_calendar.alt_week_anchor stays as an unused column.
-- ---------------------------------------------------------------------------
ALTER TABLE public.section_schedules
  ADD COLUMN IF NOT EXISTS on_week_anchor date;
COMMENT ON COLUMN public.section_schedules.on_week_anchor IS 'Alternating-week sections: any date inside one of THIS section''s academic (on) weeks.';
