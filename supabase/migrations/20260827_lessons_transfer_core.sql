-- ============================================================================
-- 20260827_lessons_transfer_core.sql
--
-- Tag the lessons each unit's TRANSFER TASK depends on, plus every Vernier/Newton's-cannon investigation (the
-- "uncertainty explained, not just stated" rubric dimension is learned there).
-- Untagged lessons are the flex days — the first to cut when a section is
-- behind its unit window. Pacing reads this column to suggest cuts.
--
-- Decided with Craig 2026-08-27. 87 core / 44 flex of 131 physics lessons.
-- (No MCAS for these sections, so the tag follows each unit's transfer task,
-- not standards coverage.)
-- ============================================================================
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS transfer_core boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.lessons.transfer_core IS
  'True when a unit transfer task (this unit or a later one) depends on this lesson, or it is a lab. False = flex day, cut first when behind.';

UPDATE public.lessons SET transfer_core = false WHERE unit_id LIKE 'unit-%';

UPDATE public.lessons SET transfer_core = true WHERE
     -- Unit 1 is tagged to ITS OWN task only (kinematics + the inertia idea
     -- behind the constant-velocity model). Forces D10–D18 are first USED in
     -- Units 2–4 and can be picked up there if Unit 1 runs long.
     (unit_id = 'unit-1' AND lesson_number IN (1,2,3,5,6,7,9,21,22))
  OR (unit_id = 'unit-2' AND lesson_number IN (2,3,4,5,8,9,10,11,12,13,14,16))
  OR (unit_id = 'unit-3' AND lesson_number IN (2,3,5,6,7,8,10,11,14))
  OR (unit_id = 'unit-4' AND lesson_number IN (2,3,4,5,6,7,9,10,12,13,14,15,16,19,20,22))
  OR (unit_id = 'unit-5' AND lesson_number IN (1,2,4,5,8,9,10,12))
  OR (unit_id = 'unit-6' AND lesson_number IN (1,2,3,4,5,10,11,12,13,15,17,18))
  OR (unit_id = 'unit-7' AND lesson_number IN (1,2,4,5,6,7,8,9,10,11,12,13,15,18))
  OR (unit_id = 'unit-8' AND lesson_number IN (1,3,4,5,6,7,9));
