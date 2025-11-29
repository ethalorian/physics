-- Add Carts & Springs: Newton's Third Law simulation
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
  'Carts & Springs: Newton''s Third Law',
  'carts-third-law',
  'Watch two carts push apart when a compressed spring is released between them. Observe Newton''s Third Law (action-reaction pairs), see how equal forces cause different accelerations for different masses, and verify conservation of momentum. The classic physics demonstration that proves forces come in pairs!',
  'forces',
  'unit-2',
  'intermediate',
  '/simulations/carts-third-law',
  20,
  ARRAY[
    'Understand Newton''s Third Law (action-reaction pairs)',
    'Recognize that forces always come in pairs',
    'Observe that action and reaction forces are equal in magnitude and opposite in direction',
    'Understand that same force on different masses produces different accelerations',
    'Apply F = ma to predict motion of each cart',
    'Verify conservation of momentum (total momentum = 0)',
    'Calculate velocities using momentum conservation',
    'Analyze kinematics data for both objects simultaneously'
  ],
  ARRAY[
    'Newton''s Third Law', 
    'action-reaction pairs',
    'equal and opposite forces',
    'momentum',
    'conservation of momentum',
    'F = ma with different masses',
    'kinematics',
    'internal forces',
    'isolated system',
    'center of mass'
  ],
  ARRAY[
    'Newton''s Second Law (F = ma)',
    'understanding of force and acceleration',
    'basic kinematics',
    'vectors'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'forces', 
    'newtons-laws',
    'third-law',
    'action-reaction',
    'momentum',
    'conservation-laws',
    'carts',
    'collisions'
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
WHERE slug = 'carts-third-law';

-- Show summary
SELECT 
  '✓ Carts & Springs simulation added successfully!' as status,
  title,
  component_path,
  difficulty,
  estimated_time || ' minutes' as duration,
  array_length(objectives, 1) || ' learning objectives' as objectives_count
FROM simulations 
WHERE slug = 'carts-third-law';

