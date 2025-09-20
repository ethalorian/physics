-- Add video support to lessons table
-- This migration adds columns to support embedded YouTube videos in lessons

-- Add video-related columns to the lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS estimated_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS objectives TEXT[] DEFAULT '{}';

-- Create index for video searches
CREATE INDEX IF NOT EXISTS idx_lessons_videos ON lessons USING GIN (videos);

-- Create index for objectives
CREATE INDEX IF NOT EXISTS idx_lessons_objectives ON lessons USING GIN (objectives);

-- Add comment explaining the videos JSONB structure
COMMENT ON COLUMN lessons.videos IS 'Array of video objects: [{"id": "string", "title": "string", "youtubeId": "string", "duration": "string", "description": "string", "timestamp": number}]';

-- Add comment explaining objectives
COMMENT ON COLUMN lessons.objectives IS 'Array of learning objectives as strings';

-- Add comment explaining estimated time
COMMENT ON COLUMN lessons.estimated_time IS 'Estimated time to complete lesson in minutes';

-- Function to validate video JSON structure (optional but recommended)
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

-- Add constraint to ensure videos JSON is valid (optional)
-- ALTER TABLE lessons ADD CONSTRAINT check_videos_format 
-- CHECK (videos = '[]'::jsonb OR validate_lesson_videos(videos));

-- Sample data insert for testing (commented out)
/*
-- Example of inserting a lesson with videos
INSERT INTO lessons (title, slug, description, content, unit, lesson_number, published, videos, objectives, estimated_time) 
VALUES (
  'Introduction to Motion',
  'intro-to-motion',
  'Learn the basics of motion in physics',
  '# Introduction to Motion\n\nMotion is fundamental to physics...',
  'Unit 1',
  1,
  true,
  '[
    {
      "id": "video-1",
      "title": "What is Motion?",
      "youtubeId": "dQw4w9WgXcQ",
      "duration": "5:30",
      "description": "Basic introduction to the concept of motion",
      "timestamp": 0
    },
    {
      "id": "video-2", 
      "title": "Position vs Displacement",
      "youtubeId": "dQw4w9WgXcQ",
      "duration": "8:45",
      "description": "Understanding the difference between position and displacement",
      "timestamp": 30
    }
  ]'::jsonb,
  ARRAY[
    'Distinguish between distance and displacement',
    'Calculate average speed and velocity', 
    'Interpret position-time graphs'
  ],
  15
);
*/
