-- Per-TEACHER daily XP goals (scoped to the teacher of record, never global):
-- a school-day goal that fills a progress ring, and special-day (weekend /
-- vacation / holiday) goals that pay a bonus XP award when hit.
CREATE TABLE IF NOT EXISTS teacher_xp_goals (
  teacher_email text PRIMARY KEY,
  school_day_goal integer NOT NULL DEFAULT 30 CHECK (school_day_goal BETWEEN 0 AND 500),
  special_day_goal integer NOT NULL DEFAULT 20 CHECK (special_day_goal BETWEEN 0 AND 500),
  special_day_bonus integer NOT NULL DEFAULT 15 CHECK (special_day_bonus BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Teacher-entered vacation/holiday ranges (weekends are automatic).
CREATE TABLE IF NOT EXISTS teacher_special_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email text NOT NULL,
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS teacher_special_days_teacher_idx ON teacher_special_days (teacher_email, start_date);

ALTER TABLE teacher_xp_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_special_days ENABLE ROW LEVEL SECURITY;
-- Service-role API routes only, like the rest of the teacher config tables.
