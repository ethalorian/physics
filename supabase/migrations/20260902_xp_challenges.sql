-- Teacher-set daily XP challenges: a target in a game source, live over a
-- date range with the target resetting each day; hitting it pays a one-time
-- bonus per day (deduped in economy_point_grants). Assigned to whole classes
-- and/or individual students ("slices").
CREATE TABLE IF NOT EXISTS xp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  kind text NOT NULL CHECK (kind IN ('arcade-any', 'arcade-game', 'vocab-games', 'math')),
  game_slug text,
  metric text NOT NULL CHECK (metric IN ('xp', 'plays')),
  target integer NOT NULL CHECK (target BETWEEN 1 AND 1000),
  bonus_xp integer NOT NULL DEFAULT 10 CHECK (bonus_xp BETWEEN 0 AND 100),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on),
  CHECK (kind <> 'arcade-game' OR game_slug IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS xp_challenges_teacher_idx ON xp_challenges (teacher_email, active, starts_on);

CREATE TABLE IF NOT EXISTS xp_challenge_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES xp_challenges(id) ON DELETE CASCADE,
  course_id uuid,
  student_id text,
  CHECK ((course_id IS NULL) <> (student_id IS NULL))
);
CREATE INDEX IF NOT EXISTS xp_challenge_assign_ch_idx ON xp_challenge_assignments (challenge_id);
CREATE INDEX IF NOT EXISTS xp_challenge_assign_student_idx ON xp_challenge_assignments (student_id);
CREATE INDEX IF NOT EXISTS xp_challenge_assign_course_idx ON xp_challenge_assignments (course_id);

ALTER TABLE xp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_challenge_assignments ENABLE ROW LEVEL SECURITY;

-- Admin-created global challenges apply to every student automatically.
ALTER TABLE xp_challenges ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;
