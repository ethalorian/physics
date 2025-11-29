-- Check current simulations in the database
-- Run this first to see what's there before cleanup

-- Show all simulations with key details
SELECT 
    ROW_NUMBER() OVER (ORDER BY unit, slug) as "#",
    slug,
    title,
    category,
    unit,
    difficulty,
    component_path,
    published,
    created_at::date as created_date
FROM public.simulations
ORDER BY unit, slug;

-- Check for duplicates
SELECT 
    'DUPLICATES CHECK:' as section;
    
SELECT 
    slug,
    COUNT(*) as duplicate_count
FROM public.simulations
GROUP BY slug
HAVING COUNT(*) > 1;

-- Check specifically for free-body-diagram
SELECT 
    'FREE BODY DIAGRAM CHECK:' as section;
    
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ Free Body Diagram NOT found'
        WHEN COUNT(*) = 1 THEN '✅ Free Body Diagram exists (1 entry)'
        ELSE '⚠️ Free Body Diagram has ' || COUNT(*) || ' entries (duplicates!)'
    END as status
FROM public.simulations
WHERE slug = 'free-body-diagram';

-- Count by unit
SELECT 
    'SIMULATIONS BY UNIT:' as section;
    
SELECT 
    unit,
    COUNT(*) as count
FROM public.simulations
GROUP BY unit
ORDER BY unit;
