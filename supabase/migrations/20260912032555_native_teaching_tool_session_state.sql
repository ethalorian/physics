ALTER TABLE public.present_sessions
  ADD COLUMN IF NOT EXISTS teaching_tool_state jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.present_sessions.teaching_tool_state IS
  'Versioned, block-keyed teacher demonstration state only. Never student responses or mastery. Uses existing command revision and broadcast triggers.';
