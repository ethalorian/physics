-- One-way written feedback from teacher to student, composed in the grading
-- drawers. Anchored to a learning target (mastery) or a math competency
-- (fluency) when sent in context; both nullable for a general note.
-- Students read it via the notification bell and their Growth page.
CREATE TABLE IF NOT EXISTS teacher_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  teacher_email text NOT NULL,
  target_id uuid REFERENCES learning_targets(id) ON DELETE SET NULL,
  competency_id uuid REFERENCES math_competencies(id) ON DELETE SET NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_feedback_user_idx ON teacher_feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS teacher_feedback_teacher_idx ON teacher_feedback (teacher_email, created_at DESC);

ALTER TABLE teacher_feedback ENABLE ROW LEVEL SECURITY;
-- All access goes through the service-role API routes (same pattern as
-- mastery_records); no anon/authenticated policies.
