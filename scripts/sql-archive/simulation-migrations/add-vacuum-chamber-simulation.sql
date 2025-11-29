-- Add Vacuum Chamber: Feather vs. Bowling Ball simulation
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
  'Vacuum Chamber: Feather vs. Bowling Ball',
  'vacuum-chamber',
  'Drop a feather and bowling ball side-by-side in a vacuum chamber with adjustable air pressure. Discover that without air resistance, all objects fall at the same rate regardless of mass! Observe how air resistance affects light objects much more than heavy objects, and explore the concept of terminal velocity. This is the famous experiment demonstrated by Apollo 15 astronauts on the Moon!',
  'forces',
  'unit-2',
  'beginner',
  '/simulations/vacuum-chamber',
  15,
  ARRAY[
    'Understand that all objects fall at the same rate in a vacuum',
    'Recognize that gravity pulls on all objects equally (a = g = 9.8 m/s²)',
    'Observe how air resistance affects objects differently',
    'Understand that air resistance depends on speed, area, and shape',
    'Explain why feathers fall slowly on Earth but quickly on the Moon',
    'Recognize the concept of terminal velocity',
    'Compare kinematics with and without air resistance',
    'Understand that mass does not affect falling rate in vacuum'
  ],
  ARRAY[
    'gravity', 
    'air resistance',
    'drag force',
    'terminal velocity',
    'free fall',
    'acceleration due to gravity',
    'g = 9.8 m/s²',
    'vacuum',
    'mass independence',
    'kinematics',
    'Galileo',
    'Apollo 15 experiment'
  ],
  ARRAY[
    'basic understanding of gravity',
    'concept of acceleration',
    'kinematics basics'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'forces',
    'gravity',
    'air-resistance',
    'drag',
    'terminal-velocity',
    'free-fall',
    'galileo',
    'moon',
    'vacuum'
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
WHERE slug = 'vacuum-chamber';

-- Show summary
SELECT 
  '✓ Vacuum Chamber simulation added successfully!' as status,
  title,
  component_path,
  difficulty,
  estimated_time || ' minutes' as duration,
  array_length(objectives, 1) || ' learning objectives' as objectives_count
FROM simulations 
WHERE slug = 'vacuum-chamber';

