-- Add "The Measure of All Things" — immersive metric-system quest
-- Safe to run repeatedly: uses ON CONFLICT DO UPDATE

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
  'The Measure of All Things: A Metric System Quest',
  'measure-of-all-things',
  'An immersive, self-paced journey through the invention of the metric system. Students begin as a cloth merchant in 1789 France getting cheated by inconsistent local units, help the Academy of Sciences derive the meter from the Earth itself, master the prefix ladder by walking conversions rung by rung, build the liter and kilogram from a cube of water, discover why decimal time failed while the meter conquered the world, and finish as a citizen-inspector in a scored mastery mission. Progress saves automatically so students can stop and resume. Scoring 80% or higher on the final mission earns the Master Inspector badge (recorded as mastery in the activity final_state).',
  'lab-skills',
  'unit-1',
  'beginner',
  '/simulations/measure-of-all-things',
  45,
  ARRAY[
    'Explain why the metric system was created and what problem it solved',
    'Describe how the meter was originally defined from the Earth''s meridian',
    'Use metric prefixes (kilo through milli) and explain their base-ten structure',
    'Convert between metric units of length by shifting the decimal point',
    'Relate length, volume, and mass through water: 1 cm³ = 1 mL = 1 g',
    'Estimate which metric unit is appropriate for everyday objects',
    'Explain why decimal time failed while metric length and mass succeeded',
    'Convert compound quantities into base SI units (km/h to m/s)',
    'Identify the meter, kilogram, and second as the SI base units of mechanics'
  ],
  ARRAY[
    'metric system',
    'SI units',
    'unit conversion',
    'metric prefixes',
    'base ten',
    'powers of ten',
    'meter',
    'kilogram',
    'liter',
    'second',
    'derived units',
    'scale estimation',
    'history of measurement'
  ],
  ARRAY[
    'basic arithmetic (multiplication and division by powers of ten)',
    'reading decimal numbers'
  ],
  TRUE,
  FALSE,
  TRUE,
  'system',
  ARRAY[
    'metric-system',
    'si-units',
    'unit-conversion',
    'lab-skills',
    'measurement',
    'history-of-science',
    'narrative',
    'self-paced'
  ],
  ARRAY['multiple-choice', 'numerical']
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  objectives = EXCLUDED.objectives,
  key_concepts = EXCLUDED.key_concepts,
  estimated_time = EXCLUDED.estimated_time,
  published = EXCLUDED.published,
  updated_at = NOW();

-- Verify
SELECT id, title, slug, category, difficulty, published, estimated_time
FROM simulations
WHERE slug = 'measure-of-all-things';
