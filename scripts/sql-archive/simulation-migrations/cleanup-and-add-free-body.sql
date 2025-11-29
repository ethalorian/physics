-- Clean up duplicates and add Free Body Diagram simulation
-- Run this in Supabase SQL Editor

-- Step 1: Show current simulations before cleanup
SELECT 'BEFORE CLEANUP:' as phase;
SELECT slug, title, category, unit FROM public.simulations ORDER BY slug;

-- Step 2: Remove any duplicates (keep the first one by creation date)
WITH duplicates AS (
    SELECT 
        id,
        slug,
        ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at ASC) as rn
    FROM public.simulations
)
DELETE FROM public.simulations
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Remove the incorrectly added force simulations that don't have components yet
-- (Only if they don't actually exist as real simulations)
DELETE FROM public.simulations 
WHERE slug IN ('newtons-laws', 'force-motion-basics', 'balanced-unbalanced-forces')
AND component_path NOT IN (
    '/simulations/newtons-laws', 
    '/simulations/force-motion-basics', 
    '/simulations/balanced-unbalanced-forces'
);

-- Step 4: Insert or update the Free Body Diagram simulation
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
    published,
    created_by,
    has_ai_guide,
    can_embed
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
        'Explore equilibrium conditions'
    ],
    ARRAY['force', 'mass', 'acceleration', 'vectors', 'Newton''s Second Law', 'free body diagram'],
    true,
    'system',
    true,
    true
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
    published = EXCLUDED.published,
    has_ai_guide = EXCLUDED.has_ai_guide,
    can_embed = EXCLUDED.can_embed,
    updated_at = CURRENT_TIMESTAMP;

-- Step 5: Show final results
SELECT 'AFTER CLEANUP:' as phase;
SELECT 
    slug,
    title,
    category,
    unit,
    difficulty,
    component_path,
    published
FROM public.simulations
ORDER BY unit, slug;

-- Step 6: Specifically verify the Free Body Diagram is there
SELECT 'FREE BODY DIAGRAM STATUS:' as check_type;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Free Body Diagram simulation successfully added!'
        ELSE '❌ Free Body Diagram simulation not found!'
    END as status,
    COUNT(*) as count
FROM public.simulations
WHERE slug = 'free-body-diagram' AND published = true;
