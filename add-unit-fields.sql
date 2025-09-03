-- Add unit and lesson_number fields to the lessons table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'General',
ADD COLUMN IF NOT EXISTS lesson_number INTEGER NOT NULL DEFAULT 1;

-- Remove the old order_index column if it exists
ALTER TABLE lessons DROP COLUMN IF EXISTS order_index;

-- Create an index for better performance when querying by unit and lesson number
CREATE INDEX IF NOT EXISTS idx_lessons_unit_lesson_number ON lessons(unit, lesson_number);

-- Example data to show the structure (optional - remove if you don't want sample data)
-- INSERT INTO lessons (title, slug, content, description, unit, lesson_number, published) VALUES
-- ('Introduction to Motion', 'introduction-to-motion', '# Introduction to Motion\n\nMotion is everywhere...', 'Learn the basics of motion and displacement', 'Mechanics', 1, true),
-- ('Velocity and Acceleration', 'velocity-and-acceleration', '# Velocity and Acceleration\n\nVelocity is...', 'Understanding the relationship between velocity and acceleration', 'Mechanics', 2, true),
-- ('Electric Fields', 'electric-fields', '# Electric Fields\n\nElectric fields are...', 'Explore the concept of electric fields', 'Electricity', 1, true);
