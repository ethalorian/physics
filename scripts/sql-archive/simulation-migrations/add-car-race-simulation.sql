-- Add Car Race: Systems of Equations simulation
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
  'Car Race: Relative Motion & Kinematics',
  'car-race',
  'Analyze relative motion between two cars traveling at constant velocities with different start times. Use kinematics equations to predict when and where one car overtakes the other. Learn to interpret position-time graphs, understand relative velocity, apply reference frames, and solve multi-object motion problems. See how mathematical tools (systems of equations) help solve physics problems!',
  'kinematics',
  'unit-1',
  'intermediate',
  '/simulations/car-race',
  25,
  ARRAY[
    'Set up position equations for objects with constant velocity',
    'Create a system of two linear equations from a word problem',
    'Solve systems of equations algebraically to find intersection',
    'Interpret intersection point as the time and place where cars meet',
    'Graph position vs. time for multiple objects on same axes',
    'Identify intersection point visually on a graph',
    'Understand that intersection = solution to system of equations',
    'Apply systems of equations to relative motion problems',
    'Verify algebraic solutions using graphical methods',
    'Predict race outcomes using mathematical models'
  ],
  ARRAY[
    'systems of equations', 
    'linear equations',
    'intersection point',
    'relative motion',
    'position-time graphs',
    'constant velocity',
    'kinematics',
    'algebraic solution',
    'graphical solution',
    'mathematical modeling',
    'word problems',
    'simultaneous equations'
  ],
  ARRAY[
    'linear equations (y = mx + b)',
    'basic algebra',
    'graphing on coordinate plane',
    'constant velocity motion',
    'position and time'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'kinematics',
    'algebra',
    'systems-of-equations',
    'graphing',
    'linear-equations',
    'relative-motion',
    'intersections',
    'word-problems'
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
WHERE slug = 'car-race';

-- Show summary
SELECT 
  '✓ Car Race simulation added successfully!' as status,
  title,
  component_path,
  difficulty,
  estimated_time || ' minutes' as duration,
  array_length(objectives, 1) || ' learning objectives' as objectives_count
FROM simulations 
WHERE slug = 'car-race';

