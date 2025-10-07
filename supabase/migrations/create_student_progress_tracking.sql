-- Student Progress Tracking Tables
-- Tracks vocabulary game scores, lesson completion, and assignment progress

-- Vocabulary Game Scores
CREATE TABLE IF NOT EXISTS vocabulary_game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  vocabulary_set_id UUID NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('hangman', 'crossword', 'matching', 'concentration', 'quiz-bowl', 'word-shoot', 'equation-visualizer')),
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL,
  accuracy DECIMAL(5,2), -- Percentage 0-100
  time_spent INTEGER, -- Seconds
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  terms_completed INTEGER DEFAULT 0,
  terms_total INTEGER DEFAULT 0,
  perfect_game BOOLEAN DEFAULT false,
  hints_used INTEGER DEFAULT 0,
  mistakes INTEGER DEFAULT 0,
  game_data JSONB, -- Additional game-specific data
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vocabulary game scores
CREATE INDEX IF NOT EXISTS idx_vocab_scores_user ON vocabulary_game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_scores_email ON vocabulary_game_scores(user_email);
CREATE INDEX IF NOT EXISTS idx_vocab_scores_set ON vocabulary_game_scores(vocabulary_set_id);
CREATE INDEX IF NOT EXISTS idx_vocab_scores_game_type ON vocabulary_game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_vocab_scores_completed ON vocabulary_game_scores(completed_at DESC);

-- Lesson Progress Tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  lesson_id UUID NOT NULL,
  lesson_slug TEXT,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  objectives_completed INTEGER DEFAULT 0,
  objectives_total INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  videos_total INTEGER DEFAULT 0,
  video_questions_answered INTEGER DEFAULT 0,
  video_questions_correct INTEGER DEFAULT 0,
  video_questions_total INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- Seconds
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes for lesson progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_email ON lesson_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed_at DESC);

-- Video Question Responses (for interactive video questions)
CREATE TABLE IF NOT EXISTS video_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  lesson_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer JSONB NOT NULL,
  is_correct BOOLEAN,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  feedback TEXT,
  attempt_number INTEGER DEFAULT 1,
  time_to_answer INTEGER, -- Seconds
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for video question responses
CREATE INDEX IF NOT EXISTS idx_video_responses_user ON video_question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_lesson ON video_question_responses(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_video ON video_question_responses(video_id);
CREATE INDEX IF NOT EXISTS idx_video_responses_question ON video_question_responses(question_id);

-- Gradebook View (combines assignments and lessons)
CREATE TABLE IF NOT EXISTS gradebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  student_name TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('assignment', 'lesson', 'vocabulary_game')),
  item_id TEXT NOT NULL,
  item_title TEXT NOT NULL,
  course_id TEXT, -- For Google Classroom sync
  score DECIMAL(10,2),
  max_score DECIMAL(10,2),
  percentage DECIMAL(5,2),
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'submitted', 'graded', 'completed')),
  due_date TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  synced_to_classroom BOOLEAN DEFAULT false,
  classroom_grade_id TEXT, -- Google Classroom grade ID
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for gradebook
CREATE INDEX IF NOT EXISTS idx_gradebook_user ON gradebook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_email ON gradebook_entries(user_email);
CREATE INDEX IF NOT EXISTS idx_gradebook_course ON gradebook_entries(course_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_type ON gradebook_entries(item_type);
CREATE INDEX IF NOT EXISTS idx_gradebook_status ON gradebook_entries(status);
CREATE INDEX IF NOT EXISTS idx_gradebook_due_date ON gradebook_entries(due_date);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gradebook_updated_at BEFORE UPDATE ON gradebook_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE vocabulary_game_scores IS 'Stores scores from all vocabulary games with detailed metrics';
COMMENT ON TABLE lesson_progress IS 'Tracks student progress through lessons including videos and objectives';
COMMENT ON TABLE video_question_responses IS 'Records student responses to interactive video questions';
COMMENT ON TABLE gradebook_entries IS 'Unified gradebook view for all graded items, syncs to Google Classroom';

COMMENT ON COLUMN lesson_progress.progress_percentage IS 'Overall completion percentage (0-100)';
COMMENT ON COLUMN lesson_progress.objectives_completed IS 'Number of learning objectives checked off';
COMMENT ON COLUMN lesson_progress.video_questions_answered IS 'Number of interactive video questions answered';
COMMENT ON COLUMN gradebook_entries.synced_to_classroom IS 'Whether this grade has been synced to Google Classroom';
COMMENT ON COLUMN gradebook_entries.classroom_grade_id IS 'Google Classroom grade resource ID for sync tracking';
