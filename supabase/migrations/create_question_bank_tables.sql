-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Note: lessons table already exists with uuid id, so we'll skip creating it
-- CREATE TABLE IF NOT EXISTS lessons (
--   id TEXT PRIMARY KEY,
--   unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
--   name TEXT NOT NULL,
--   description TEXT,
--   order_index INTEGER NOT NULL,
--   objectives TEXT[], -- Array of learning objectives
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
-- );

-- Create question_bank table
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  question_data JSONB NOT NULL, -- Stores the full question object
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE, -- Changed to UUID to match existing lessons table
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL, -- Extracted for easier searching
  points INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topics TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  cognitive_level TEXT CHECK (cognitive_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  estimated_time INTEGER, -- in minutes
  usage_count INTEGER DEFAULT 0,
  created_by TEXT, -- user_id of creator
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create question_usage_log table for tracking usage
CREATE TABLE IF NOT EXISTS question_usage_log (
  id SERIAL PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  assignment_id TEXT,
  user_id TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_question_bank_unit_id ON question_bank(unit_id);
CREATE INDEX idx_question_bank_lesson_id ON question_bank(lesson_id);
CREATE INDEX idx_question_bank_question_type ON question_bank(question_type);
CREATE INDEX idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX idx_question_bank_created_by ON question_bank(created_by);
CREATE INDEX idx_question_bank_question_text ON question_bank USING gin(to_tsvector('english', question_text));
CREATE INDEX idx_question_bank_topics ON question_bank USING gin(topics);
CREATE INDEX idx_question_bank_tags ON question_bank USING gin(tags);

-- Note: RLS is disabled since we're using NextAuth.js for authentication
-- and handling authorization in the application layer
-- ALTER TABLE units ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE question_usage_log ENABLE ROW LEVEL SECURITY;

-- Since we're using NextAuth.js (not Supabase Auth), we'll handle 
-- authorization in the API routes rather than database policies
-- The API routes already check user roles via session.user.email

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: lessons table already has its own updated_at trigger, so we'll skip creating it
-- CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_bank_updated_at BEFORE UPDATE ON question_bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_question_usage(question_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE question_bank 
  SET usage_count = usage_count + 1 
  WHERE id = question_id;
END;
$$ language 'plpgsql';
