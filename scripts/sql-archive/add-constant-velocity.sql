-- Add Constant Velocity Motion Lab to simulations table
-- Safe to run - uses ON CONFLICT DO NOTHING

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
  'Constant Velocity Motion Lab',
  'constant-velocity',
  'Control a walker''s motion and collect position data. Observe constant velocity in 1D motion and analyze position-time graphs to find velocity from slope.',
  'kinematics',
  'unit-1',
  'beginner',
  '/simulations/constant-velocity',
  15,
  ARRAY['Understand constant velocity motion', 'Collect and analyze position-time data', 'Calculate velocity from graph slope'],
  ARRAY['velocity', 'kinematics', 'graphs', 'data collection'],
  ARRAY['basic algebra', 'understanding of position'],
  TRUE,
  TRUE,
  TRUE,
  'system',
  ARRAY['kinematics', '1d-motion', 'graphing'],
  ARRAY['multiple-choice', 'numerical', 'open-response']
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  published = EXCLUDED.published,
  updated_at = NOW();

-- Verify it was added
SELECT id, title, slug, published FROM simulations WHERE slug = 'constant-velocity';
