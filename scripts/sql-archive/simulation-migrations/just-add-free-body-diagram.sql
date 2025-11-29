-- Just add the Free Body Diagram simulation
-- This script ONLY adds/updates the free body diagram without touching other simulations

-- Add or update the Free Body Diagram simulation
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
    'Free Body Diagram Lab',
    'free-body-diagram',
    'Interactive free body diagram simulation where students can experiment with force vectors and see how they affect acceleration. Drag and drop force vectors to explore Newton''s Second Law (F = ma) with real-time calculations showing the relationship between force, mass, and acceleration.',
    'forces',
    'Unit 2: Forces',
    'intermediate',
    '/simulations/free-body-diagram',
    25,
    ARRAY[
        'Understand Newton''s Second Law (F = ma)',
        'Practice vector addition and decomposition',
        'Visualize how multiple forces affect an object',
        'Explore equilibrium conditions',
        'See the relationship between force, mass, and acceleration'
    ],
    ARRAY[
        'force',
        'mass', 
        'acceleration',
        'vectors',
        'Newton''s Second Law',
        'free body diagram',
        'equilibrium',
        'net force'
    ],
    ARRAY[
        'Basic understanding of force as a push or pull',
        'Knowledge of mass and its units',
        'Basic vector concepts (magnitude and direction)',
        'Simple algebra'
    ],
    ARRAY['interactive', 'drag-and-drop', 'vectors', 'forces', 'Newton'],
    true,  -- published
    'system',
    true,  -- has AI guide
    true,  -- can embed
    ARRAY['conceptual', 'calculation', 'analysis']  -- supported question types
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
    'Free Body Diagram Simulation Status:' as info,
    slug,
    title,
    category,
    unit,
    difficulty,
    component_path,
    published
FROM public.simulations
WHERE slug = 'free-body-diagram';
