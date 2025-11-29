-- Fix duplicate simulations and properly add Free Body Diagram
-- Run this in Supabase SQL Editor

-- Step 1: Show what we have before cleanup
SELECT 'CURRENT SIMULATIONS (BEFORE CLEANUP):' as status;
SELECT slug, title, category, component_path, created_at 
FROM public.simulations 
ORDER BY slug, created_at;

-- Step 2: Remove duplicates (keep the oldest/first one)
DELETE FROM public.simulations
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            slug,
            ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at ASC) as rn
        FROM public.simulations
    ) duplicates
    WHERE rn > 1
);

-- Step 3: Delete the improperly added force simulations that don't have real components
-- These were added by mistake and don't have actual simulation pages
DELETE FROM public.simulations 
WHERE slug IN ('newtons-laws', 'force-motion-basics', 'balanced-unbalanced-forces')
AND slug NOT IN (
    SELECT slug FROM public.simulations 
    WHERE component_path LIKE '/simulations/%' 
    AND component_path != '/simulations/' || slug
);

-- Step 4: Now properly add/update the Free Body Diagram simulation
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
    ]::text[],
    ARRAY[
        'force',
        'mass', 
        'acceleration',
        'vectors',
        'Newton''s Second Law',
        'free body diagram',
        'equilibrium',
        'net force'
    ]::text[],
    ARRAY[
        'Basic understanding of force as a push or pull',
        'Knowledge of mass and its units',
        'Basic vector concepts (magnitude and direction)',
        'Simple algebra'
    ]::text[],
    ARRAY['interactive', 'drag-and-drop', 'vectors', 'forces', 'Newton']::text[],
    true,
    'system',
    true,
    true,
    ARRAY['conceptual', 'calculation', 'analysis']::text[]
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

-- Step 5: Clean up the incorrectly added "Free Body Diagram Lab" that's showing as intermediate
-- (This might be the duplicate without proper category)
DELETE FROM public.simulations 
WHERE title = 'Free Body Diagram Lab' 
AND slug != 'free-body-diagram';

-- Step 6: Show final results
SELECT 'FINAL SIMULATIONS (AFTER CLEANUP):' as status;
SELECT 
    slug,
    title,
    category,
    unit,
    difficulty,
    component_path,
    published
FROM public.simulations
ORDER BY 
    CASE 
        WHEN unit LIKE '%Force%' THEN 1
        WHEN unit LIKE '%Motion%' THEN 2
        ELSE 3
    END,
    slug;

-- Step 7: Verify Free Body Diagram is properly added
SELECT 'FREE BODY DIAGRAM VERIFICATION:' as status;
SELECT 
    id,
    slug,
    title,
    category,
    unit,
    component_path,
    published,
    has_ai_guide
FROM public.simulations
WHERE slug = 'free-body-diagram';

-- Step 8: Count check
SELECT 'SIMULATION COUNT:' as status;
SELECT 
    COUNT(*) as total_simulations,
    COUNT(CASE WHEN published = true THEN 1 END) as published_simulations,
    COUNT(CASE WHEN category = 'forces' THEN 1 END) as force_simulations
FROM public.simulations;
