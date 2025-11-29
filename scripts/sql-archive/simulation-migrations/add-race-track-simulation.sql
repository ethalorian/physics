-- Add Race Track simulation to simulations table
-- Safe to run - uses ON CONFLICT DO UPDATE

INSERT INTO simulations (
  title, 
  slug, 
  description, 
  category, 
  unit, 
  difficulty,
  component_path, 
  estimated_time, 
  objectives, 
  key_concepts,
  prerequisite_knowledge,
  can_embed, 
  has_ai_guide, 
  published, 
  created_by,
  tags,
  supported_question_types
) VALUES (
  'Race Track: Distance vs. Displacement',
  'race-track',
  'Watch a race car go around a circular track and explore the fundamental difference between distance (scalar) and displacement (vector). Learn how "How Far," "How Fast," and "How Long" differ when dealing with scalars vs. vectors, and understand the critical "Which Way" component that makes vectors different.',
  'kinematics',
  'unit-1',
  'beginner',
  '/simulations/race-track',
  20,
  ARRAY[
    'Understand the difference between distance and displacement',
    'Recognize that distance is always increasing (scalar) while displacement can increase or decrease (vector)',
    'Learn that speed has no direction while velocity includes direction',
    'Calculate distance traveled around a circular path',
    'Measure displacement as straight-line distance from starting point',
    'Understand that after one complete lap, displacement returns to zero while distance equals the circumference',
    'Recognize the "Which Way" component that makes something a vector'
  ],
  ARRAY[
    'distance', 
    'displacement', 
    'speed', 
    'velocity', 
    'scalar', 
    'vector', 
    'kinematics',
    'circular motion',
    'position',
    'magnitude',
    'direction'
  ],
  ARRAY[
    'basic understanding of measurement',
    'concept of position and movement'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'kinematics', 
    'vectors', 
    'scalars',
    'circular-motion',
    '1d-motion',
    'distance-displacement',
    'speed-velocity'
  ],
  ARRAY['multiple-choice', 'numerical', 'open-response']
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  objectives = EXCLUDED.objectives,
  key_concepts = EXCLUDED.key_concepts,
  published = EXCLUDED.published,
  updated_at = NOW();

-- Verify it was added
SELECT 
  id, 
  title, 
  slug, 
  category,
  difficulty,
  published,
  estimated_time,
  array_length(objectives, 1) as num_objectives,
  array_length(key_concepts, 1) as num_concepts
FROM simulations 
WHERE slug = 'race-track';

-- Show summary of what was added
SELECT 
  '✓ Race Track simulation added successfully!' as status,
  title,
  component_path,
  difficulty,
  estimated_time || ' minutes' as duration,
  array_length(objectives, 1) || ' learning objectives' as objectives_count
FROM simulations 
WHERE slug = 'race-track';

