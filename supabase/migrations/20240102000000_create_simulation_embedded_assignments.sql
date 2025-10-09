-- Create table for simulation-embedded assignments
CREATE TABLE IF NOT EXISTS simulation_embedded_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_slug TEXT NOT NULL,
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  total_points INTEGER DEFAULT 0,
  
  -- Assignment settings
  show_on_start BOOLEAN DEFAULT false, -- Show assignment when simulation starts
  show_on_complete BOOLEAN DEFAULT false, -- Show assignment when simulation is completed
  allow_skip BOOLEAN DEFAULT true, -- Allow students to skip the assignment
  required_for_progress BOOLEAN DEFAULT false, -- Must complete to mark simulation as complete
  
  -- Timing settings
  time_limit INTEGER, -- Time limit in minutes (null = no limit)
  available_after INTEGER DEFAULT 0, -- Show after X seconds in simulation
  
  -- Attempt settings
  max_attempts INTEGER DEFAULT 1,
  allow_late_submission BOOLEAN DEFAULT true,
  
  -- Status
  published BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(simulation_slug, title)
);

-- Create table for student submissions to simulation assignments
CREATE TABLE IF NOT EXISTS simulation_assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES simulation_embedded_assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_email TEXT NOT NULL,
  
  -- Submission data
  answers JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(5,2),
  max_score INTEGER,
  percentage DECIMAL(5,2),
  
  -- Timing data
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0, -- in seconds
  
  -- Attempt tracking
  attempt_number INTEGER DEFAULT 1,
  is_latest_attempt BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT CHECK (status IN ('in_progress', 'submitted', 'graded', 'returned')) DEFAULT 'in_progress',
  feedback JSONB, -- Teacher feedback or AI feedback per question
  
  -- Simulation context
  simulation_data JSONB, -- Data from the simulation at time of submission
  simulation_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(assignment_id, student_id, attempt_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sim_assignments_slug ON simulation_embedded_assignments(simulation_slug);
CREATE INDEX IF NOT EXISTS idx_sim_assignments_published ON simulation_embedded_assignments(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_sim_submissions_student ON simulation_assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_sim_submissions_assignment ON simulation_assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_sim_submissions_status ON simulation_assignment_submissions(status);

-- Enable RLS
ALTER TABLE simulation_embedded_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for simulation_embedded_assignments
-- Admins and teachers can do everything
CREATE POLICY "Admins and teachers can manage simulation assignments"
ON simulation_embedded_assignments
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Students can view published assignments
CREATE POLICY "Students can view published simulation assignments"
ON simulation_embedded_assignments
FOR SELECT
TO authenticated
USING (published = true);

-- Policies for simulation_assignment_submissions
-- Admins and teachers can view all submissions
CREATE POLICY "Admins and teachers can view all simulation submissions"
ON simulation_assignment_submissions
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Admins and teachers can update submissions (for grading)
CREATE POLICY "Admins and teachers can update simulation submissions"
ON simulation_assignment_submissions
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Students can view their own submissions
CREATE POLICY "Students can view own simulation submissions"
ON simulation_assignment_submissions
FOR SELECT
TO authenticated
USING (student_email = auth.jwt() ->> 'email');

-- Students can insert their own submissions
CREATE POLICY "Students can create simulation submissions"
ON simulation_assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (student_email = auth.jwt() ->> 'email');

-- Students can update their own in-progress submissions
CREATE POLICY "Students can update own in-progress simulation submissions"
ON simulation_assignment_submissions
FOR UPDATE
TO authenticated
USING (
  student_email = auth.jwt() ->> 'email' 
  AND status = 'in_progress'
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_simulation_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_simulation_embedded_assignments_timestamp
  BEFORE UPDATE ON simulation_embedded_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_assignment_timestamp();

CREATE TRIGGER update_simulation_assignment_submissions_timestamp
  BEFORE UPDATE ON simulation_assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_assignment_timestamp();
