-- Phase 4: Disable Student AI Assistance for Simulations
-- This removes AI hints from student simulations
-- Teachers will still get AI help for creating questions (Phase 3)

-- Set all simulations to has_ai_guide = FALSE
UPDATE simulations 
SET has_ai_guide = FALSE
WHERE has_ai_guide = TRUE;

-- Verify the changes
SELECT title, slug, has_ai_guide 
FROM simulations 
ORDER BY created_at;

-- Expected result: All simulations should have has_ai_guide = false
