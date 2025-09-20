-- Create lessons table
-- This migration creates the lessons table that was referenced but never created

-- Create the lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  unit TEXT NOT NULL,
  lesson_number INTEGER NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  
  -- Video support (added from add_lesson_videos_support.sql)
  videos JSONB DEFAULT '[]'::jsonb,
  estimated_time INTEGER, -- in minutes
  objectives TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_number ON lessons(lesson_number);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons(published);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_videos ON lessons USING GIN (videos);
CREATE INDEX IF NOT EXISTS idx_lessons_objectives ON lessons USING GIN (objectives);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at 
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments explaining the columns
COMMENT ON TABLE lessons IS 'Stores physics lessons with content, videos, and learning objectives';
COMMENT ON COLUMN lessons.videos IS 'Array of video objects: [{"id": "string", "title": "string", "youtubeId": "string", "duration": "string", "description": "string", "timestamp": number}]';
COMMENT ON COLUMN lessons.objectives IS 'Array of learning objectives as strings';
COMMENT ON COLUMN lessons.estimated_time IS 'Estimated time to complete lesson in minutes';
COMMENT ON COLUMN lessons.slug IS 'URL-friendly identifier for the lesson';
COMMENT ON COLUMN lessons.lesson_number IS 'Sequential number within the unit';

-- Function to validate video JSON structure
CREATE OR REPLACE FUNCTION validate_lesson_videos(videos_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(videos_json) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each video object has required fields
  FOR i IN 0..jsonb_array_length(videos_json) - 1 LOOP
    IF NOT (
      videos_json->i ? 'id' AND
      videos_json->i ? 'title' AND
      videos_json->i ? 'youtubeId' AND
      jsonb_typeof(videos_json->i->'id') = 'string' AND
      jsonb_typeof(videos_json->i->'title') = 'string' AND
      jsonb_typeof(videos_json->i->'youtubeId') = 'string'
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (optional, can be configured later)
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Verify table was created successfully
SELECT 'Lessons table created successfully' AS status;
