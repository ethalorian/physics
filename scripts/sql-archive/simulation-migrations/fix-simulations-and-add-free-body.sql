-- Fix duplicate simulations and add Free Body Diagram
-- This script cleans up duplicates and ensures the free body diagram is added

-- First, let's see what we have
SELECT 
    slug,
    title,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM public.simulations
GROUP BY slug, title
HAVING COUNT(*) > 1;

-- Delete duplicate simulations, keeping only the oldest one
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

-- Now check if free-body-diagram exists
SELECT 
    'Free Body Diagram exists:' as status,
    EXISTS(SELECT 1 FROM public.simulations WHERE slug = 'free-body-diagram') as exists;

-- Add or update the Free Body Diagram simulation with correct structure
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
        'Explore equilibrium conditions',
        'See the relationship between force, mass, and acceleration'
    ],
    ARRAY['force', 'mass', 'acceleration', 'vectors', 'Newton''s Second Law', 'free body diagram', 'equilibrium'],
    true,
    'system',
    true,  -- has AI guide
    true   -- can embed
)
ON CONFLICT (slug) DO UPDATE SET
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

-- Let's see all simulations now, ordered by unit and difficulty
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
    unit,
    CASE difficulty 
        WHEN 'beginner' THEN 1 
        WHEN 'intermediate' THEN 2 
        WHEN 'advanced' THEN 3 
        ELSE 4 
    END,
    title;

-- Specifically check our free body diagram simulation
SELECT 
    '=== FREE BODY DIAGRAM SIMULATION ===' as section,
    id,
    title,
    slug,
    category,
    unit,
    difficulty,
    component_path,
    published,
    has_ai_guide,
    can_embed
FROM public.simulations
WHERE slug = 'free-body-diagram';

-- Count total simulations
SELECT 
    'Total simulations in database:' as metric,
    COUNT(*) as count
FROM public.simulations;
