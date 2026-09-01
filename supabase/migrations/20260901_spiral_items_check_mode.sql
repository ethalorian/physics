-- How the instant self-check should treat each item:
--   numeric      → parse and compare quantities (the default)
--   short-answer → exact-ish word compare can fire; a miss is 'unknown', never ✗
--   teacher-only → prose/explain prompts: the machine never judges; the UI says
--                  "your teacher reads this one" up front (expected, not an error)
-- Data classification (31 short-answer key rewrites, 13 teacher-only flags)
-- applied directly to the live DB 2026-09-01; see session notes.
ALTER TABLE math_spiral_items ADD COLUMN IF NOT EXISTS check_mode text NOT NULL DEFAULT 'numeric'
  CHECK (check_mode IN ('numeric', 'short-answer', 'teacher-only'));
