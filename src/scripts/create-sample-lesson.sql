-- Sample lesson with videos for demonstration
-- This creates a lesson about "Introduction to Motion" with YouTube videos
-- 
-- NOTE: This script requires the lessons table to exist first.
-- Run the create_lessons_table.sql migration before running this script.

-- First, check if lesson exists and delete if it does (for development)
DELETE FROM lessons WHERE slug = 'intro-to-motion-demo';

-- Insert sample lesson with videos
INSERT INTO lessons (
  title, 
  slug, 
  description, 
  content, 
  unit, 
  lesson_number, 
  published,
  videos,
  objectives,
  estimated_time
) VALUES (
  'Introduction to Motion (Demo)',
  'intro-to-motion-demo',
  'Learn the fundamental concepts of motion in physics with interactive videos and clear objectives.',
  '# Introduction to Motion

Motion is one of the most fundamental concepts in physics. In this lesson, we''ll explore:

## What is Motion?

Motion is the change in position of an object with respect to time. To understand motion, we need to understand several key concepts:

### Position
Position tells us **where** an object is located. We usually describe position relative to a reference point or coordinate system.

### Displacement  
Displacement is the change in position. It''s a **vector quantity**, which means it has both magnitude and direction.

\[ \vec{d} = \vec{r}_f - \vec{r}_i \]

Where:
- \( \vec{d} \) is displacement
- \( \vec{r}_f \) is final position  
- \( \vec{r}_i \) is initial position

### Distance vs Displacement

**Distance** is the total path traveled (scalar), while **displacement** is the straight-line change in position (vector).

## Key Equations

The fundamental equation relating position, velocity, and time is:

\[ x = x_0 + v_0 t + \frac{1}{2}at^2 \]

Where:
- \( x \) = final position
- \( x_0 \) = initial position  
- \( v_0 \) = initial velocity
- \( a \) = acceleration
- \( t \) = time

## Practice Problems

Try these problems to test your understanding:

1. A car travels 50 meters north, then 30 meters south. What is the total distance? What is the displacement?

2. If a ball is thrown upward with an initial velocity of 20 m/s, how high will it go? (Hint: use \( g = 9.8 \text{ m/s}^2 \))

## Summary

Understanding motion requires mastering the concepts of position, displacement, velocity, and acceleration. These form the foundation for all of kinematics!',
  'Unit 1: Motion and Kinematics',
  1,
  true,
  '[
    {
      "id": "video-1",
      "title": "What is Motion? - Physics Fundamentals",
      "youtubeId": "ZM8ECpBuQYE",
      "duration": "8:42",
      "description": "An introduction to the basic concepts of motion, position, and reference frames",
      "timestamp": 0
    },
    {
      "id": "video-2", 
      "title": "Distance vs Displacement",
      "youtubeId": "S4U8bGgfnGY",
      "duration": "6:15",
      "description": "Understanding the important difference between distance and displacement with examples",
      "timestamp": 0
    },
    {
      "id": "video-3",
      "title": "Position-Time Graphs",
      "youtubeId": "rjp4eZuCz_s",
      "duration": "12:30", 
      "description": "How to read and interpret position-time graphs to understand motion",
      "timestamp": 45
    }
  ]'::jsonb,
  ARRAY[
    'Define motion, position, and displacement',
    'Distinguish between distance and displacement', 
    'Interpret position-time graphs',
    'Calculate displacement from position data',
    'Understand reference frames and coordinate systems'
  ],
  25
);

-- Verify the lesson was created
SELECT 
  id,
  title, 
  slug,
  videos,
  objectives,
  estimated_time,
  created_at
FROM lessons 
WHERE slug = 'intro-to-motion-demo';
