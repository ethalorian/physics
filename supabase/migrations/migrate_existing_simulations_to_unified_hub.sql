-- ============================================================================
-- MIGRATE EXISTING SIMULATION ASSIGNMENTS TO UNIFIED HUB
-- ============================================================================
-- This migration imports existing simulation assignments and student progress
-- into the new unified assignment hub system while preserving all data

-- ============================================================================
-- STEP 1: MIGRATE SIMULATION ASSIGNMENTS
-- ============================================================================

INSERT INTO unified_assignments (
  assignment_type,
  reference_id,
  title,
  description,
  instructions,
  course_id,
  assigned_students,
  assigned_at,
  due_date,
  max_attempts,
  time_limit,
  allow_late_submission,
  requires_completion,
  max_score,
  published,
  assigned_by,
  total_assigned,
  total_started,
  total_completed,
  total_submitted,
  created_at,
  updated_at
)
SELECT 
  -- Determine if it's embedded or standalone based on whether it has questions
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM simulation_embedded_assignments sea 
      WHERE sea.simulation_id = sa.simulation_id
    ) THEN 'simulation_embedded'::text
    ELSE 'simulation'::text
  END as assignment_type,
  
  sa.simulation_id::text as reference_id,
  COALESCE(sa.title, s.title) as title,
  s.description, -- Use simulation's description
  sa.instructions,
  sa.course_id,
  sa.assigned_students,
  sa.assigned_at,
  sa.due_date,
  
  -- Configuration
  1 as max_attempts, -- Default, can be adjusted
  sa.min_time_required as time_limit,
  true as allow_late_submission,
  sa.requires_data_export as requires_completion,
  
  -- Scoring
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM simulation_embedded_assignments sea 
      WHERE sea.simulation_id = sa.simulation_id
    ) THEN (
      SELECT total_points FROM simulation_embedded_assignments 
      WHERE simulation_id = sa.simulation_id 
      LIMIT 1
    )
    ELSE 100 -- Default score for simulations without embedded assignments
  END as max_score,
  
  sa.published,
  sa.assigned_by,
  
  -- Analytics (from existing data)
  sa.total_assigned,
  sa.total_started,
  sa.total_completed,
  sa.total_submitted,
  
  sa.created_at,
  sa.updated_at

FROM simulation_assignments sa
LEFT JOIN simulations s ON s.id = sa.simulation_id
WHERE sa.is_active = true
-- Skip if already exists (course assignment)
AND NOT EXISTS (
  SELECT 1 FROM unified_assignments ua
  WHERE ua.assignment_type IN ('simulation', 'simulation_embedded')
  AND ua.reference_id = sa.simulation_id::text
  AND ua.course_id = sa.course_id
  AND sa.course_id IS NOT NULL
);

-- ============================================================================
-- STEP 2: MIGRATE STUDENT PROGRESS RECORDS
-- ============================================================================

INSERT INTO student_assignment_progress (
  unified_assignment_id,
  student_id,
  student_email,
  status,
  progress_percentage,
  started_at,
  completed_at,
  submitted_at,
  first_viewed_at,
  last_accessed_at,
  time_spent,
  attempt_number,
  attempts_used,
  score,
  max_score,
  percentage,
  letter_grade,
  rubric_scores,
  feedback,
  graded_at,
  graded_by,
  submission_data,
  is_late,
  created_at,
  updated_at
)
SELECT 
  -- Find the corresponding unified assignment
  ua.id as unified_assignment_id,
  
  ssa.student_id,
  
  -- Get student email from students table
  COALESCE(
    (SELECT email FROM students WHERE id::text = ssa.student_id LIMIT 1),
    ssa.student_id || '@student.edu' -- Fallback if student not found
  ) as student_email,
  
  -- Map status
  CASE ssa.status
    WHEN 'assigned' THEN 'assigned'
    WHEN 'started' THEN 'started'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'completed' THEN 'completed'
    WHEN 'submitted' THEN 'submitted'
    WHEN 'graded' THEN 'graded'
    WHEN 'overdue' THEN 'overdue'
    ELSE 'assigned'
  END::text as status,
  
  -- Calculate progress percentage
  CASE 
    WHEN ssa.simulation_completed THEN 100
    WHEN ssa.status IN ('in_progress', 'started') THEN 50
    ELSE 0
  END as progress_percentage,
  
  ssa.started_at,
  ssa.completed_at,
  ssa.submitted_at,
  ssa.started_at as first_viewed_at,
  ssa.created_at as last_accessed_at,
  
  -- Time tracking
  COALESCE(ssa.time_spent_in_simulation, ssa.total_time_spent, 0) as time_spent,
  
  1 as attempt_number,
  1 as attempts_used,
  
  -- Grading
  ssa.score::decimal,
  ssa.max_score,
  
  -- Calculate percentage
  CASE 
    WHEN ssa.max_score > 0 THEN (ssa.score::decimal / ssa.max_score::decimal * 100)
    ELSE NULL
  END as percentage,
  
  ssa.letter_grade,
  ssa.rubric_scores,
  ssa.feedback,
  ssa.graded_at,
  ssa.graded_by,
  
  -- Store question responses in submission_data
  jsonb_build_object(
    'question_responses', ssa.question_responses,
    'simulation_data', jsonb_build_object(
      'completed', ssa.simulation_completed,
      'interactions_count', ssa.interactions_count,
      'data_exported', ssa.data_exported
    )
  ) as submission_data,
  
  -- Check if late
  CASE 
    WHEN ssa.submitted_at IS NOT NULL AND sa.due_date IS NOT NULL 
      THEN ssa.submitted_at > sa.due_date
    ELSE false
  END as is_late,
  
  ssa.created_at,
  ssa.updated_at

FROM student_simulation_assignments ssa
JOIN simulation_assignments sa ON sa.id = ssa.simulation_assignment_id
JOIN unified_assignments ua ON (
  ua.assignment_type IN ('simulation', 'simulation_embedded')
  AND ua.reference_id = sa.simulation_id::text
  AND (
    (ua.course_id = sa.course_id AND ua.course_id IS NOT NULL)
    OR 
    (ua.assigned_students @> ARRAY[ssa.student_id]::text[])
  )
)
WHERE sa.is_active = true
ON CONFLICT (unified_assignment_id, student_id, attempt_number) DO NOTHING;

-- ============================================================================
-- STEP 3: MIGRATE SIMULATION EMBEDDED ASSIGNMENTS
-- ============================================================================

INSERT INTO unified_assignments (
  assignment_type,
  reference_id,
  title,
  description,
  instructions,
  course_id,
  assigned_students,
  due_date,
  max_attempts,
  time_limit,
  allow_late_submission,
  max_score,
  published,
  assigned_by,
  created_at,
  updated_at
)
SELECT 
  'simulation_embedded'::text as assignment_type,
  sea.id::text as reference_id,
  sea.title,
  sea.description,
  sea.instructions,
  
  -- For embedded assignments without course_id, we'll need to handle separately
  NULL as course_id,
  NULL as assigned_students,
  
  NULL as due_date,
  COALESCE(sea.max_attempts, 1) as max_attempts,
  sea.time_limit,
  COALESCE(sea.allow_late_submission, true) as allow_late_submission,
  sea.total_points as max_score,
  sea.published,
  sea.created_by as assigned_by,
  sea.created_at,
  sea.updated_at

FROM simulation_embedded_assignments sea
WHERE sea.published = true
AND NOT EXISTS (
  -- Don't duplicate if already migrated via simulation_assignments
  SELECT 1 FROM unified_assignments ua
  WHERE ua.assignment_type = 'simulation_embedded'
  AND ua.reference_id = sea.id::text
);

-- ============================================================================
-- STEP 4: MIGRATE EMBEDDED ASSIGNMENT SUBMISSIONS
-- ============================================================================

INSERT INTO student_assignment_progress (
  unified_assignment_id,
  student_id,
  student_email,
  status,
  progress_percentage,
  started_at,
  submitted_at,
  last_accessed_at,
  time_spent,
  attempt_number,
  score,
  max_score,
  percentage,
  feedback,
  submission_data,
  created_at,
  updated_at
)
SELECT 
  ua.id as unified_assignment_id,
  sas.student_id,
  sas.student_email,
  
  CASE sas.status
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'submitted' THEN 'submitted'
    WHEN 'graded' THEN 'graded'
    WHEN 'returned' THEN 'graded'
    ELSE 'in_progress'
  END::text as status,
  
  -- Calculate progress based on answers
  CASE 
    WHEN sas.status IN ('submitted', 'graded', 'returned') THEN 100
    ELSE 50
  END as progress_percentage,
  
  sas.started_at,
  sas.submitted_at,
  COALESCE(sas.updated_at, sas.created_at) as last_accessed_at,
  COALESCE(sas.time_spent, 0) as time_spent,
  sas.attempt_number,
  
  sas.score::decimal,
  sas.max_score,
  sas.percentage,
  
  -- Convert JSONB feedback to text
  CASE 
    WHEN sas.feedback IS NOT NULL THEN sas.feedback::text
    ELSE NULL
  END as feedback,
  
  -- Store answers and simulation data
  jsonb_build_object(
    'answers', sas.answers,
    'simulation_data', sas.simulation_data,
    'simulation_completed', sas.simulation_completed,
    'is_latest_attempt', sas.is_latest_attempt
  ) as submission_data,
  
  sas.created_at,
  sas.updated_at

FROM simulation_assignment_submissions sas
JOIN simulation_embedded_assignments sea ON sea.id = sas.assignment_id
JOIN unified_assignments ua ON (
  ua.assignment_type = 'simulation_embedded'
  AND ua.reference_id = sea.id::text
)
WHERE sas.is_latest_attempt = true
ON CONFLICT (unified_assignment_id, student_id, attempt_number) DO NOTHING;

-- ============================================================================
-- STEP 5: UPDATE ANALYTICS
-- ============================================================================

-- Force analytics recalculation for migrated assignments
UPDATE unified_assignments ua
SET 
  total_assigned = (
    SELECT COUNT(DISTINCT student_id) 
    FROM student_assignment_progress 
    WHERE unified_assignment_id = ua.id
  ),
  total_started = (
    SELECT COUNT(DISTINCT student_id) 
    FROM student_assignment_progress 
    WHERE unified_assignment_id = ua.id 
    AND status IN ('started', 'in_progress', 'completed', 'submitted', 'graded')
  ),
  total_completed = (
    SELECT COUNT(DISTINCT student_id) 
    FROM student_assignment_progress 
    WHERE unified_assignment_id = ua.id 
    AND status IN ('completed', 'submitted', 'graded')
  ),
  total_submitted = (
    SELECT COUNT(DISTINCT student_id) 
    FROM student_assignment_progress 
    WHERE unified_assignment_id = ua.id 
    AND status IN ('submitted', 'graded')
  ),
  average_score = (
    SELECT AVG(percentage) 
    FROM student_assignment_progress 
    WHERE unified_assignment_id = ua.id 
    AND percentage IS NOT NULL
  ),
  average_time_spent = (
    SELECT AVG(time_spent) 
    FROM student_assignment_progress 
    WHERE unified_assignment_id = ua.id 
    AND time_spent > 0
  )
WHERE ua.assignment_type IN ('simulation', 'simulation_embedded');

-- ============================================================================
-- STEP 6: CREATE VIEW FOR BACKWARD COMPATIBILITY (OPTIONAL)
-- ============================================================================

-- Create a view that makes unified assignments look like old simulation_assignments
-- This ensures any existing code continues to work

CREATE OR REPLACE VIEW simulation_assignments_unified AS
SELECT 
  ua.id,
  ua.reference_id::uuid as simulation_id,
  ua.course_id,
  ua.assigned_students,
  ua.assigned_by,
  ua.assigned_at,
  ua.due_date,
  ua.title,
  ua.instructions,
  ua.time_limit as min_time_required,
  false as requires_data_export, -- Default
  NULL::uuid as rubric_id,
  true as is_active,
  ua.published,
  ua.total_assigned,
  ua.total_started,
  ua.total_completed,
  ua.total_submitted,
  ua.created_at,
  ua.updated_at
FROM unified_assignments ua
WHERE ua.assignment_type IN ('simulation', 'simulation_embedded');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count migrated records
DO $$
DECLARE
  simulation_count integer;
  embedded_count integer;
  progress_count integer;
BEGIN
  SELECT COUNT(*) INTO simulation_count 
  FROM unified_assignments 
  WHERE assignment_type = 'simulation';
  
  SELECT COUNT(*) INTO embedded_count 
  FROM unified_assignments 
  WHERE assignment_type = 'simulation_embedded';
  
  SELECT COUNT(*) INTO progress_count 
  FROM student_assignment_progress sap
  JOIN unified_assignments ua ON ua.id = sap.unified_assignment_id
  WHERE ua.assignment_type IN ('simulation', 'simulation_embedded');
  
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE '  - Migrated % simulation assignments', simulation_count;
  RAISE NOTICE '  - Migrated % simulation embedded assignments', embedded_count;
  RAISE NOTICE '  - Migrated % student progress records', progress_count;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW simulation_assignments_unified IS 'Backward compatibility view - makes unified assignments appear as simulation_assignments';

-- Migration complete!
SELECT 'Simulation assignments successfully migrated to Unified Assignment Hub!' as status;

