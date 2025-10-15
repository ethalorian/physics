-- Add Astronaut Thrust: Newton's Laws simulation
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
  'Astronaut Thrust: Newton''s Laws in Space',
  'astronaut-thrust',
  'Apply thrust vectors to an astronaut floating in space and observe Newton''s First and Second Laws in action. Explore mechanical equilibrium, vector forces, and how acceleration relates to force. Collect kinematics data including position, velocity, and acceleration over time in a frictionless environment.',
  'forces',
  'unit-2',
  'intermediate',
  '/simulations/astronaut-thrust',
  20,
  ARRAY[
    'Understand Newton''s First Law (inertia and equilibrium)',
    'Apply Newton''s Second Law (F = ma) with vector forces',
    'Recognize mechanical equilibrium (F_net = 0)',
    'Observe that constant force produces constant acceleration',
    'Analyze velocity changes under applied forces',
    'Understand vector nature of forces and accelerations',
    'Collect and analyze kinematics data (position, velocity, acceleration)',
    'Recognize that in space, no friction means forces cause permanent changes'
  ],
  ARRAY[
    'Newton''s First Law', 
    'Newton''s Second Law', 
    'mechanical equilibrium',
    'net force',
    'acceleration',
    'velocity',
    'inertia',
    'vector forces',
    'kinematics',
    'F = ma',
    'thrust',
    'frictionless motion',
    'constant acceleration'
  ],
  ARRAY[
    'understanding of velocity and acceleration',
    'basic vectors',
    'concept of force'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'forces', 
    'newtons-laws',
    'acceleration',
    'vectors',
    'kinematics',
    'equilibrium',
    'space-physics',
    'F=ma'
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
WHERE slug = 'astronaut-thrust';

-- Show summary
SELECT 
  '✓ Astronaut Thrust simulation added successfully!' as status,
  title,
  component_path,
  difficulty,
  estimated_time || ' minutes' as duration,
  array_length(objectives, 1) || ' learning objectives' as objectives_count
FROM simulations 
WHERE slug = 'astronaut-thrust';

