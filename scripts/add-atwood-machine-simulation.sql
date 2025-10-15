-- Add Atwood Machine: Forces & Equilibrium simulation
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
  'Atwood Machine: Forces & Equilibrium',
  'atwood-machine',
  'Study the classic Atwood machine - two masses connected by a rope over a frictionless pulley. Explore static equilibrium (equal masses at rest), dynamic equilibrium (equal masses moving), and accelerated motion (unequal masses). Calculate system acceleration using Newton''s Second Law, predict time to fall a fixed distance, and understand tension forces. Beautiful, smooth animation with realistic rope physics and force vectors. Perfect for teaching balanced/unbalanced forces, tension, and applying F=ma to connected objects!',
  'forces',
  'unit-2',
  'intermediate',
  '/simulations/atwood-machine',
  20,
  ARRAY[
    'Understand static equilibrium (F_net = 0, v = 0)',
    'Understand dynamic equilibrium (F_net = 0, v = constant)',
    'Calculate acceleration for connected masses using a = g(m1-m2)/(m1+m2)',
    'Apply Newton''s Second Law to systems of objects',
    'Calculate rope tension in pulley systems',
    'Predict time to fall a given distance using kinematics',
    'Recognize that tension is same throughout massless rope',
    'Understand that heavier side accelerates down, lighter up',
    'Verify predictions using experimental data'
  ],
  ARRAY[
    'Atwood machine', 
    'equilibrium',
    'static equilibrium',
    'dynamic equilibrium',
    'tension force',
    'connected objects',
    'pulley system',
    'Newton''s Second Law',
    'F = ma',
    'net force',
    'acceleration',
    'kinematics',
    'free body diagrams'
  ],
  ARRAY[
    'Newton''s Second Law (F = ma)',
    'forces and weight (W = mg)',
    'basic kinematics',
    'understanding of equilibrium'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'forces',
    'equilibrium',
    'tension',
    'pulleys',
    'newtons-laws',
    'F=ma',
    'connected-objects',
    'atwood-machine'
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

-- Verify
SELECT 
  id, 
  title, 
  slug, 
  difficulty,
  published
FROM simulations 
WHERE slug = 'atwood-machine';

-- Summary
SELECT 
  '✓ Atwood Machine simulation added!' as status,
  title,
  component_path
FROM simulations 
WHERE slug = 'atwood-machine';

