-- ============================================================================
-- CHECK VOCABULARY PUBLISHED STATUS
-- ============================================================================
-- Run this to see if vocabulary sets are actually marked as published

-- Check vocabulary sets and their published status
SELECT 
  id,
  name,
  published,
  unit_id,
  created_by,
  created_at
FROM vocabulary_sets
ORDER BY created_at DESC;

-- Count by published status
SELECT 
  published,
  COUNT(*) as count
FROM vocabulary_sets
GROUP BY published;

-- Show vocabulary sets with term counts
SELECT 
  vs.id,
  vs.name,
  vs.published,
  COUNT(vt.id) as term_count
FROM vocabulary_sets vs
LEFT JOIN vocabulary_terms vt ON vt.vocabulary_set_id = vs.id
GROUP BY vs.id, vs.name, vs.published
ORDER BY vs.created_at DESC;

