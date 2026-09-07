-- A-2, M-1: additive non-rating outcomes. Existing acknowledgments remain valid.
ALTER TABLE public.math_warmup_revisions
  ADD COLUMN IF NOT EXISTS next_step text
  CHECK (next_step IN ('fresh-check', 'practice', 'help'));
COMMENT ON COLUMN public.math_warmup_revisions.next_step IS
  'Teacher-selected learning action, never a mastery rating. A fresh check is queued for a future issued warm-up.';
