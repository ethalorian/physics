-- Add Riverboat Crossing: Vector Addition simulation
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
  'Riverboat Crossing: Vector Addition',
  'riverboat-crossing',
  'Navigate a boat across a river with flowing current and discover how velocities add as vectors! See three velocity vectors simultaneously: boat velocity (relative to water), current velocity (water flow), and resultant velocity (actual path over ground). Learn to calculate drift distance, find the angle needed to go straight across, and understand relative motion. Perfect for teaching vector addition, components, and real-world applications of 2D motion!',
  'kinematics',
  'unit-1',
  'intermediate',
  '/simulations/riverboat-crossing',
  20,
  ARRAY[
    'Understand that velocities add as vectors',
    'Recognize boat velocity is relative to the water, not ground',
    'Calculate resultant velocity from vector addition',
    'Predict drift distance caused by current',
    'Determine the angle needed to travel straight across',
    'Apply Pythagorean theorem to find resultant velocity magnitude',
    'Understand relative motion between boat, water, and ground',
    'Solve real-world navigation problems using vector addition',
    'Interpret velocity vectors visually and mathematically'
  ],
  ARRAY[
    'vector addition', 
    'relative velocity',
    'resultant vector',
    'velocity components',
    'drift',
    'navigation',
    'reference frames',
    'ground velocity vs water velocity',
    'current',
    'vector sum',
    'Pythagorean theorem',
    '2D motion'
  ],
  ARRAY[
    'vectors and vector addition',
    'velocity concept',
    'basic trigonometry',
    'coordinate systems'
  ],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY[
    'kinematics',
    'vectors',
    'vector-addition',
    'relative-velocity',
    'navigation',
    'river-crossing',
    '2d-motion'
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
  category,
  difficulty,
  published
FROM simulations 
WHERE slug = 'riverboat-crossing';

-- Summary
SELECT 
  '✓ Riverboat Crossing simulation added!' as status,
  title,
  array_length(objectives, 1) || ' objectives' as objectives_count
FROM simulations 
WHERE slug = 'riverboat-crossing';

