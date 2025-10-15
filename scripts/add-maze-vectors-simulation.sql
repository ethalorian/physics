-- Add Maze Navigator: Vector Addition simulation to simulations table
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
  'Maze Navigator: Vector Addition',
  'maze-vectors',
  'Guide a mouse through a maze to find cheese while learning how position vectors are composed of x and y components. Visualize vector addition in real-time as component vectors combine to form resultant vectors using the Pythagorean theorem.',
  'kinematics',
  'unit-1',
  'beginner',
  '/simulations/maze-vectors',
  15,
  ARRAY[
    'Understand that position vectors have x and y components',
    'Recognize that vectors can be broken down into perpendicular components',
    'Learn how to add vectors by adding their components',
    'Apply the Pythagorean theorem to find vector magnitude',
    'Visualize vector addition geometrically',
    'Calculate resultant vectors from component vectors',
    'Understand the relationship between components and magnitude'
  ],
  ARRAY[
    'vectors', 
    'vector addition', 
    'vector components', 
    'position vectors',
    'x-component',
    'y-component',
    'resultant vector',
    'magnitude',
    'Pythagorean theorem',
    'kinematics',
    'coordinate system'
  ],
  ARRAY[
    'basic coordinate system',
    'understanding of x and y axes',
    'basic algebra',
    'Pythagorean theorem'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'vectors', 
    'vector-addition',
    'components',
    'kinematics',
    'position',
    'pythagorean-theorem',
    'coordinate-geometry'
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
WHERE slug = 'maze-vectors';

-- Show summary of what was added
SELECT 
  '✓ Maze Navigator: Vector Addition simulation added successfully!' as status,
  title,
  component_path,
  difficulty,
  estimated_time || ' minutes' as duration,
  array_length(objectives, 1) || ' learning objectives' as objectives_count
FROM simulations 
WHERE slug = 'maze-vectors';

