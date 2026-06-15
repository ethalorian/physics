-- Honors curriculum gating.
--
-- A class is "typed" by curriculum track at import (cpa | honors | ap | pbl).
-- Content is then gated by track at two grains:
--   1. Whole lessons  -> public.lessons.visibility_track  (this file)
--   2. Individual blocks -> rides inside lessons.content_blocks jsonb as
--      BaseBlock.visibilityTrack (no column needed; see src/data/content-blocks.ts)
--
-- NULL = visible to ALL tracks. A set value (e.g. 'honors') restricts visibility
-- to classes whose courses.track matches.
--
-- This also closes a real gap: courses.track was already read in app code
-- (/api/teacher/courses, /admin/teacher) but was never added to the schema.

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS track TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS visibility_track TEXT;

CREATE INDEX IF NOT EXISTS idx_courses_track ON public.courses(track);
CREATE INDEX IF NOT EXISTS idx_lessons_visibility_track ON public.lessons(visibility_track);

COMMENT ON COLUMN public.courses.track IS
  'Curriculum track / class type, chosen at roster import: cpa | honors | ap | pbl. NULL = not yet typed (behaves as cpa for visibility).';
COMMENT ON COLUMN public.lessons.visibility_track IS
  'If set (e.g. honors), the WHOLE lesson is visible only to classes of that track. NULL = all tracks. Per-block gating lives in content_blocks (BaseBlock.visibilityTrack).';
