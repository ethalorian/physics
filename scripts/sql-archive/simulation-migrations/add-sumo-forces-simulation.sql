-- Add Sumo Forces simulation to the database
-- This adds the interactive sumo wrestling force simulation

INSERT INTO public.simulations (
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
    tags,
    published,
    created_by,
    has_ai_guide,
    can_embed,
    supported_question_types
)
VALUES (
    'Sumo Wrestling Forces',
    'sumo-forces',
    'Experience Newton''s Second Law through an exciting sumo wrestling simulation! Control the force and mass of two wrestlers to see how unbalanced forces lead to motion. Watch real-time kinematics tracking as wrestlers battle for victory. When forces are balanced, neither wrestler moves; when unbalanced, the battle begins!',
    'forces',
    'Unit 2: Forces',
    'beginner',
    '/simulations/sumo-forces',
    15,
    ARRAY[
        'Understand how unbalanced forces cause acceleration',
        'See the relationship between force, mass, and acceleration (F=ma)',
        'Track kinematics: position, velocity, and acceleration over time',
        'Explore how mass affects the outcome when forces are applied',
        'Visualize equilibrium when forces are balanced'
    ]::text[],
    ARRAY[
        'force',
        'mass',
        'acceleration',
        'Newton''s Second Law',
        'balanced forces',
        'unbalanced forces',
        'net force',
        'kinematics',
        'position',
        'velocity'
    ]::text[],
    ARRAY[
        'Basic understanding of force as a push or pull',
        'Concept of mass',
        'Understanding of motion'
    ]::text[],
    ARRAY['interactive', 'game-based', 'kinematics', 'forces', 'Newton', 'competition']::text[],
    true,
    'system',
    true,
    true,
    ARRAY['conceptual', 'analysis', 'graphical']::text[]
)
ON CONFLICT (slug) 
DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    difficulty = EXCLUDED.difficulty,
    component_path = EXCLUDED.component_path,
    estimated_time = EXCLUDED.estimated_time,
    objectives = EXCLUDED.objectives,
    key_concepts = EXCLUDED.key_concepts,
    prerequisite_knowledge = EXCLUDED.prerequisite_knowledge,
    tags = EXCLUDED.tags,
    published = EXCLUDED.published,
    has_ai_guide = EXCLUDED.has_ai_guide,
    can_embed = EXCLUDED.can_embed,
    supported_question_types = EXCLUDED.supported_question_types,
    updated_at = CURRENT_TIMESTAMP;

-- Verify it was added
SELECT 
    'Sumo Forces Simulation Status:' as info,
    slug,
    title,
    category,
    unit,
    difficulty,
    component_path,
    published
FROM public.simulations
WHERE slug = 'sumo-forces';

-- Show all force simulations
SELECT 
    'All Force Simulations:' as info;
    
SELECT 
    slug,
    title,
    difficulty,
    component_path,
    estimated_time,
    published
FROM public.simulations
WHERE category = 'forces' OR unit LIKE '%Force%'
ORDER BY 
    CASE difficulty 
        WHEN 'beginner' THEN 1 
        WHEN 'intermediate' THEN 2 
        WHEN 'advanced' THEN 3 
        ELSE 4 
    END,
    title;
