-- ============================================================================
-- 20260827_target_reviews_capped.sql
--
-- Per-target "cap" for generated skill reviews.
--
-- PROBLEM: /api/reviews/serve generates a fresh Claude review for every
-- student who lands on a target that has no APPROVED review yet. Thirty weak
-- students = thirty drafts in the admin queue and thirty generator calls.
--
-- FIX: a boolean on learning_targets. When true, the serve route hands the
-- student a random EXISTING review for that target (approved first, then any
-- pending draft) and only generates if the target has none at all. Off by
-- default (teacher's choice) — the admin flips it per target from the review
-- library as queues pile up. Column lives on learning_targets because the
-- seed scripts upsert on slug and leave unlisted columns alone.
-- ============================================================================
ALTER TABLE public.learning_targets
  ADD COLUMN IF NOT EXISTS reviews_capped boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.learning_targets.reviews_capped IS
  'When true, students are served an existing review (approved or pending) for this target instead of generating a new one.';
