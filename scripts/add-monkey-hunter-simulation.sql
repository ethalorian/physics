-- Add Monkey Hunter: Projectile Motion simulation
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
  'Monkey Hunter: Projectile Motion',
  'monkey-hunter',
  'The classic physics demonstration! A monkey hangs from a tree branch. You aim a dart gun directly at it and fire. At that exact moment, the monkey drops (lets go of the branch). Will the dart hit the monkey? Discover why aiming directly at the target works even when it falls! Learn about projectile motion, independence of x and y components, and how gravity affects all objects equally. Perfect for understanding 2D kinematics and the counterintuitive results of simultaneous motion.',
  'kinematics',
  'unit-1',
  'intermediate',
  '/simulations/monkey-hunter',
  20,
  ARRAY[
    'Understand that horizontal and vertical motion are independent',
    'Recognize that gravity affects all objects equally (dart and monkey)',
    'Apply projectile motion equations to predict trajectory',
    'Understand why aiming directly at a dropping target still hits it',
    'Analyze motion in two dimensions (x and y components)',
    'Calculate time of flight from horizontal motion',
    'Predict where projectile and falling object meet',
    'Understand that both objects fall ½gt² regardless of horizontal motion',
    'Recognize the principle behind "aim at the target" strategy'
  ],
  ARRAY[
    'projectile motion', 
    '2D kinematics',
    'independence of motion',
    'horizontal and vertical components',
    'gravity',
    'free fall',
    'simultaneous equations',
    'trajectory',
    'parabolic path',
    'aim and drop',
    'monkey hunter problem'
  ],
  ARRAY[
    'constant velocity motion (horizontal)',
    'free fall motion (vertical)',
    'basic trigonometry',
    'understanding of gravity'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'kinematics',
    'projectile-motion',
    '2d-motion',
    'gravity',
    'free-fall',
    'trajectory',
    'monkey-hunter'
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
WHERE slug = 'monkey-hunter';

-- Show summary
SELECT 
  '✓ Monkey Hunter simulation added successfully!' as status,
  title,
  component_path,
  difficulty,
  estimated_time || ' minutes' as duration,
  array_length(objectives, 1) || ' learning objectives' as objectives_count
FROM simulations 
WHERE slug = 'monkey-hunter';

