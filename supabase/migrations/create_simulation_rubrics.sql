-- Create Simulation Rubrics System for Standards-Based Grading
-- Supports A, B, C, Fail grading with detailed criteria

-- ============================================================================
-- SIMULATION RUBRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS simulation_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Grade Thresholds (percentage-based)
  grade_a_min INTEGER DEFAULT 85 CHECK (grade_a_min >= 0 AND grade_a_min <= 100),
  grade_b_min INTEGER DEFAULT 70 CHECK (grade_b_min >= 0 AND grade_b_min <= 100),
  grade_c_min INTEGER DEFAULT 50 CHECK (grade_c_min >= 0 AND grade_c_min <= 100),
  -- Below grade_c_min = Fail
  
  -- Criteria Definitions (JSONB for flexibility)
  criteria JSONB NOT NULL DEFAULT '{
    "data_collection": {
      "name": "Data Collection",
      "weight": 25,
      "levels": {
        "A": "Accurately collects all required data with proper precision",
        "B": "Collects most data accurately with minor errors",
        "C": "Collects some data but with significant gaps or errors",
        "Fail": "Does not collect required data or data is unusable"
      }
    },
    "analysis": {
      "name": "Analysis & Interpretation",
      "weight": 25,
      "levels": {
        "A": "Correctly analyzes data and draws accurate conclusions",
        "B": "Generally correct analysis with minor misconceptions",
        "C": "Partial analysis with some correct elements",
        "Fail": "Analysis is incorrect or missing"
      }
    },
    "calculations": {
      "name": "Calculations & Math",
      "weight": 25,
      "levels": {
        "A": "All calculations correct with proper units and significant figures",
        "B": "Most calculations correct with minor errors",
        "C": "Some calculations correct but with notable mistakes",
        "Fail": "Calculations are incorrect or missing"
      }
    },
    "understanding": {
      "name": "Conceptual Understanding",
      "weight": 25,
      "levels": {
        "A": "Demonstrates deep understanding of physics concepts",
        "B": "Shows solid understanding with minor gaps",
        "C": "Basic understanding but missing key concepts",
        "Fail": "Does not demonstrate understanding of concepts"
      }
    }
  }'::jsonb,
  
  -- Overall Grade Descriptions
  grade_descriptions JSONB DEFAULT '{
    "A": {
      "name": "Advanced / Exceeds Standards",
      "description": "Demonstrates exceptional understanding and skill in all areas"
    },
    "B": {
      "name": "Proficient / Meets Standards", 
      "description": "Demonstrates solid understanding with minor areas for improvement"
    },
    "C": {
      "name": "Basic / Approaching Standards",
      "description": "Demonstrates basic understanding but needs significant improvement"
    },
    "Fail": {
      "name": "Below Standards",
      "description": "Does not meet minimum requirements for understanding"
    }
  }'::jsonb,
  
  -- Settings
  is_default BOOLEAN DEFAULT FALSE, -- Default rubric for this simulation type
  published BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_simulation_rubrics_simulation ON simulation_rubrics(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_rubrics_default ON simulation_rubrics(simulation_id, is_default) WHERE is_default = TRUE;

-- ============================================================================
-- RUBRIC ASSESSMENTS TABLE (stores actual student grades)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rubric_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  rubric_id UUID REFERENCES simulation_rubrics(id) ON DELETE CASCADE,
  student_simulation_assignment_id UUID NOT NULL, -- From assignment system
  student_id TEXT NOT NULL,
  
  -- Scores for each criterion (0-100 for each)
  criterion_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {"data_collection": 85, "analysis": 90, "calculations": 80, "understanding": 95}
  
  -- Overall Results
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100),
  letter_grade TEXT CHECK (letter_grade IN ('A', 'B', 'C', 'Fail')),
  
  -- Feedback
  feedback TEXT,
  strengths TEXT[], -- Array of strength observations
  improvements TEXT[], -- Array of areas to improve
  
  -- Grading Info
  graded_by TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auto-grading
  auto_graded BOOLEAN DEFAULT FALSE,
  manual_override BOOLEAN DEFAULT FALSE, -- Teacher overrode auto-grade
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rubric_assessments_student ON rubric_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_rubric_assessments_rubric ON rubric_assessments(rubric_id);
CREATE INDEX IF NOT EXISTS idx_rubric_assessments_assignment ON rubric_assessments(student_simulation_assignment_id);

-- ============================================================================
-- FUNCTIONS FOR GRADE CALCULATION
-- ============================================================================

-- Calculate letter grade based on total score and rubric thresholds
CREATE OR REPLACE FUNCTION calculate_letter_grade(
  p_total_score INTEGER,
  p_rubric_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_grade_a_min INTEGER;
  v_grade_b_min INTEGER;
  v_grade_c_min INTEGER;
BEGIN
  -- Get thresholds from rubric
  SELECT grade_a_min, grade_b_min, grade_c_min
  INTO v_grade_a_min, v_grade_b_min, v_grade_c_min
  FROM simulation_rubrics
  WHERE id = p_rubric_id;
  
  -- Determine letter grade
  IF p_total_score >= v_grade_a_min THEN
    RETURN 'A';
  ELSIF p_total_score >= v_grade_b_min THEN
    RETURN 'B';
  ELSIF p_total_score >= v_grade_c_min THEN
    RETURN 'C';
  ELSE
    RETURN 'Fail';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate total score from criterion scores and weights
CREATE OR REPLACE FUNCTION calculate_total_score(
  p_criterion_scores JSONB,
  p_rubric_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_criteria JSONB;
  v_criterion_key TEXT;
  v_criterion_weight INTEGER;
  v_criterion_score INTEGER;
  v_weighted_sum NUMERIC := 0;
  v_total_weight INTEGER := 0;
BEGIN
  -- Get criteria weights from rubric
  SELECT criteria INTO v_criteria
  FROM simulation_rubrics
  WHERE id = p_rubric_id;
  
  -- Calculate weighted average
  FOR v_criterion_key IN SELECT jsonb_object_keys(v_criteria)
  LOOP
    v_criterion_weight := (v_criteria->v_criterion_key->>'weight')::INTEGER;
    v_criterion_score := (p_criterion_scores->>v_criterion_key)::INTEGER;
    
    v_weighted_sum := v_weighted_sum + (v_criterion_score * v_criterion_weight);
    v_total_weight := v_total_weight + v_criterion_weight;
  END LOOP;
  
  -- Return weighted average
  IF v_total_weight > 0 THEN
    RETURN ROUND(v_weighted_sum / v_total_weight);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_rubric_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_simulation_rubrics_timestamp
  BEFORE UPDATE ON simulation_rubrics
  FOR EACH ROW
  EXECUTE FUNCTION update_rubric_updated_at();

CREATE TRIGGER trigger_update_rubric_assessments_timestamp
  BEFORE UPDATE ON rubric_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_rubric_updated_at();

-- ============================================================================
-- SEED DEFAULT RUBRICS FOR EXISTING SIMULATIONS
-- ============================================================================

-- Default rubric for Measurement & Precision simulation
INSERT INTO simulation_rubrics (
  simulation_id,
  name,
  description,
  grade_a_min,
  grade_b_min,
  grade_c_min,
  is_default,
  created_by
)
SELECT 
  id,
  'Measurement Skills Rubric',
  'Standards-based grading for measurement precision and accuracy',
  85,
  70,
  50,
  TRUE,
  'system'
FROM simulations
WHERE slug = 'measurement-precision'
ON CONFLICT DO NOTHING;

-- Default rubric for Constant Velocity Lab
INSERT INTO simulation_rubrics (
  simulation_id,
  name,
  description,
  grade_a_min,
  grade_b_min,
  grade_c_min,
  criteria,
  is_default,
  created_by
)
SELECT 
  id,
  'Constant Velocity Lab Rubric',
  'Standards-based grading for constant velocity motion analysis',
  85,
  70,
  50,
  '{
    "data_collection": {
      "name": "Data Collection",
      "weight": 20,
      "levels": {
        "A": "Collects position data at regular time intervals with proper precision",
        "B": "Collects most data points accurately",
        "C": "Collects some data but with gaps or timing issues",
        "Fail": "Does not collect sufficient data"
      }
    },
    "graph_creation": {
      "name": "Position-Time Graph",
      "weight": 25,
      "levels": {
        "A": "Creates accurate graph with proper labels, scale, and units",
        "B": "Graph is generally correct with minor labeling issues",
        "C": "Graph has significant scale or labeling problems",
        "Fail": "Graph is missing or unusable"
      }
    },
    "slope_calculation": {
      "name": "Velocity Calculation (Slope)",
      "weight": 30,
      "levels": {
        "A": "Correctly calculates velocity from slope with proper units and sig figs",
        "B": "Velocity calculation is mostly correct with minor errors",
        "C": "Attempts velocity calculation but with notable mistakes",
        "Fail": "Does not calculate velocity or calculation is incorrect"
      }
    },
    "understanding": {
      "name": "Understanding Constant Velocity",
      "weight": 25,
      "levels": {
        "A": "Clearly explains constant velocity and relates slope to velocity",
        "B": "Demonstrates solid understanding with minor gaps",
        "C": "Shows basic understanding but missing key connections",
        "Fail": "Does not demonstrate understanding of constant velocity"
      }
    }
  }'::jsonb,
  TRUE,
  'system'
FROM simulations
WHERE slug = 'constant-velocity'
ON CONFLICT DO NOTHING;

-- Default rubric for Freefall Cliff Lab
INSERT INTO simulation_rubrics (
  simulation_id,
  name,
  description,
  grade_a_min,
  grade_b_min,
  grade_c_min,
  criteria,
  is_default,
  created_by
)
SELECT 
  id,
  'Freefall Analysis Rubric',
  'Standards-based grading for freefall equation application',
  85,
  70,
  50,
  '{
    "data_collection": {
      "name": "Time Measurement",
      "weight": 20,
      "levels": {
        "A": "Accurately measures fall time using position traces",
        "B": "Time measurement is mostly accurate",
        "C": "Time measurement has notable errors",
        "Fail": "Does not measure time correctly"
      }
    },
    "equation_application": {
      "name": "Using h = ½gt²",
      "weight": 35,
      "levels": {
        "A": "Correctly applies freefall equation with proper substitution",
        "B": "Equation applied correctly with minor algebraic errors",
        "C": "Attempts to use equation but with significant mistakes",
        "Fail": "Does not use correct equation or application is wrong"
      }
    },
    "calculation": {
      "name": "Height Calculation",
      "weight": 25,
      "levels": {
        "A": "Calculates height accurately with correct units and sig figs",
        "B": "Calculation is correct with minor rounding/unit issues",
        "C": "Calculation attempted but with notable errors",
        "Fail": "Calculation is incorrect or missing"
      }
    },
    "understanding": {
      "name": "Freefall Concepts",
      "weight": 20,
      "levels": {
        "A": "Clearly understands freefall acceleration and how it relates to motion",
        "B": "Demonstrates solid understanding with minor gaps",
        "C": "Basic understanding but missing key concepts",
        "Fail": "Does not demonstrate understanding of freefall"
      }
    }
  }'::jsonb,
  TRUE,
  'system'
FROM simulations
WHERE slug = 'freefall-cliff'
ON CONFLICT DO NOTHING;

-- Default rubric for Uniformly Accelerated Motion
INSERT INTO simulation_rubrics (
  simulation_id,
  name,
  description,
  grade_a_min,
  grade_b_min,
  grade_c_min,
  criteria,
  is_default,
  created_by
)
SELECT 
  id,
  'Accelerated Motion Rubric',
  'Standards-based grading for kinematic equations and acceleration analysis',
  85,
  70,
  50,
  '{
    "pattern_recognition": {
      "name": "Identifying Acceleration Pattern",
      "weight": 20,
      "levels": {
        "A": "Correctly identifies increasing spacing pattern indicates acceleration",
        "B": "Recognizes pattern with minor interpretation errors",
        "C": "Partial recognition of acceleration pattern",
        "Fail": "Does not identify acceleration pattern"
      }
    },
    "equation_selection": {
      "name": "Choosing Correct Kinematic Equation",
      "weight": 25,
      "levels": {
        "A": "Selects appropriate kinematic equation for each scenario",
        "B": "Generally correct equation selection with minor errors",
        "C": "Some correct selections but inconsistent",
        "Fail": "Does not select correct equations"
      }
    },
    "calculations": {
      "name": "Solving Kinematic Problems",
      "weight": 30,
      "levels": {
        "A": "Correctly solves all problems with proper algebra and units",
        "B": "Most calculations correct with minor errors",
        "C": "Some calculations correct but with notable mistakes",
        "Fail": "Calculations are incorrect or missing"
      }
    },
    "understanding": {
      "name": "Acceleration Concepts",
      "weight": 25,
      "levels": {
        "A": "Deep understanding of acceleration, velocity, and displacement relationships",
        "B": "Solid understanding with minor conceptual gaps",
        "C": "Basic understanding but missing key relationships",
        "Fail": "Does not demonstrate understanding of acceleration"
      }
    }
  }'::jsonb,
  TRUE,
  'system'
FROM simulations
WHERE slug = 'uniformly-accelerated-motion'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE simulation_rubrics IS 'Standards-based rubrics for grading simulation assignments with A/B/C/Fail levels';
COMMENT ON TABLE rubric_assessments IS 'Individual student grades based on simulation rubrics';
COMMENT ON COLUMN simulation_rubrics.criteria IS 'JSONB object defining grading criteria with weights and level descriptions';
COMMENT ON COLUMN rubric_assessments.criterion_scores IS 'JSONB object with score (0-100) for each criterion';
COMMENT ON FUNCTION calculate_letter_grade IS 'Converts numeric score to letter grade based on rubric thresholds';
COMMENT ON FUNCTION calculate_total_score IS 'Calculates weighted total score from individual criterion scores';

-- Migration complete!
SELECT 'Simulation Rubrics System Created Successfully!' as status;
