-- Create Simulation and Tool System Tables
-- This migration creates the infrastructure for interactive simulations and tools

-- ============================================================================
-- SIMULATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'kinematics', 'forces', 'energy', 'momentum', 'waves',
    'electricity', 'magnetism', 'optics', 'thermodynamics',
    'modern-physics', 'lab-skills'
  )),
  unit TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  
  -- Technical Details
  component_path TEXT NOT NULL, -- Path to the component (e.g., '/simulations/freefall-cliff')
  estimated_time INTEGER, -- Estimated time in minutes
  
  -- Learning Objectives
  objectives TEXT[] DEFAULT '{}',
  key_concepts TEXT[] DEFAULT '{}',
  prerequisite_knowledge TEXT[] DEFAULT '{}',
  
  -- Integration
  can_embed BOOLEAN DEFAULT TRUE,
  has_ai_guide BOOLEAN DEFAULT FALSE,
  supported_question_types TEXT[] DEFAULT '{}',
  
  -- Metadata
  published BOOLEAN DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  embed_count INTEGER DEFAULT 0
);

-- Indexes for simulations
CREATE INDEX idx_simulations_category ON simulations(category);
CREATE INDEX idx_simulations_unit ON simulations(unit);
CREATE INDEX idx_simulations_published ON simulations(published);
CREATE INDEX idx_simulations_tags ON simulations USING GIN(tags);
CREATE INDEX idx_simulations_slug ON simulations(slug);

-- ============================================================================
-- TOOLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT, -- Lucide icon name for UI
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'measurement', 'calculator', 'data-analysis', 
    'visualization', 'conversion'
  )),
  tool_type TEXT NOT NULL, -- Specific type: 'ruler', 'stopwatch', 'grapher', etc.
  tags TEXT[] DEFAULT '{}',
  
  -- Technical Details
  component_path TEXT NOT NULL,
  can_embed BOOLEAN DEFAULT TRUE,
  
  -- Integration
  compatible_simulations TEXT[] DEFAULT '{}', -- Array of simulation slugs
  data_input_schema JSONB, -- Schema for input data
  data_output_schema JSONB, -- Schema for output data
  
  -- Metadata
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0
);

-- Indexes for tools
CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_type ON tools(tool_type);
CREATE INDEX idx_tools_published ON tools(published);
CREATE INDEX idx_tools_slug ON tools(slug);

-- ============================================================================
-- INTERACTIVE LESSONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS interactive_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links to existing lesson
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  -- Lesson Structure (ordered steps stored as JSONB array)
  steps JSONB NOT NULL DEFAULT '[]',
  
  -- AI Configuration
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_scaffolding_level TEXT DEFAULT 'adaptive' CHECK (
    ai_scaffolding_level IN ('none', 'minimal', 'adaptive', 'full')
  ),
  ai_system_prompt TEXT,
  
  -- Progress Tracking
  requires_sequential BOOLEAN DEFAULT TRUE,
  passing_score INTEGER CHECK (passing_score >= 0 AND passing_score <= 100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lesson_id) -- One interactive lesson per regular lesson
);

-- Index for interactive lessons
CREATE INDEX idx_interactive_lessons_lesson_id ON interactive_lessons(lesson_id);

-- ============================================================================
-- SIMULATION ACTIVITY TABLE (Student Progress)
-- ============================================================================
CREATE TABLE IF NOT EXISTS simulation_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  
  -- Session tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0, -- Time in seconds
  
  -- Interaction data
  interactions JSONB DEFAULT '[]', -- Array of student actions/data
  final_state JSONB, -- Final simulation state
  
  -- AI interactions
  ai_hints_used INTEGER DEFAULT 0,
  ai_messages JSONB DEFAULT '[]', -- Conversation history
  
  -- Scoring
  score INTEGER,
  passed BOOLEAN,
  
  -- Context (what lesson/step this was part of)
  lesson_id UUID,
  step_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for simulation activity
CREATE INDEX idx_simulation_activity_student ON simulation_activity(student_id);
CREATE INDEX idx_simulation_activity_simulation ON simulation_activity(simulation_id);
CREATE INDEX idx_simulation_activity_lesson ON simulation_activity(lesson_id);
CREATE INDEX idx_simulation_activity_created ON simulation_activity(created_at DESC);

-- ============================================================================
-- INTERACTIVE LESSON PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS interactive_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  interactive_lesson_id UUID REFERENCES interactive_lessons(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_step_id TEXT,
  completed_steps TEXT[] DEFAULT '{}',
  step_scores JSONB DEFAULT '{}', -- { "step-id": score_value }
  
  -- Status
  status TEXT DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'completed')
  ),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Overall score
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  percentage DECIMAL(5,2),
  
  -- AI interaction summary
  total_ai_interactions INTEGER DEFAULT 0,
  ai_conversation_history JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, lesson_id)
);

-- Indexes for interactive lesson progress
CREATE INDEX idx_interactive_progress_student ON interactive_lesson_progress(student_id);
CREATE INDEX idx_interactive_progress_lesson ON interactive_lesson_progress(lesson_id);
CREATE INDEX idx_interactive_progress_status ON interactive_lesson_progress(status);
CREATE INDEX idx_interactive_progress_updated ON interactive_lesson_progress(updated_at DESC);

-- ============================================================================
-- RLS (Row Level Security) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Simulations: Public can view published, admins can do everything
CREATE POLICY "Anyone can view published simulations"
  ON simulations FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage simulations"
  ON simulations FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
  ));

-- Tools: Public can view published, admins can manage
CREATE POLICY "Anyone can view published tools"
  ON tools FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage tools"
  ON tools FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
  ));

-- Interactive Lessons: Students can view their assigned lessons
CREATE POLICY "Students can view interactive lessons"
  ON interactive_lessons FOR SELECT
  USING (true); -- Will be refined with lesson assignments

CREATE POLICY "Admins can manage interactive lessons"
  ON interactive_lessons FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
  ));

-- Simulation Activity: Students own their activity
CREATE POLICY "Students can view their own simulation activity"
  ON simulation_activity FOR SELECT
  USING (student_id::text = auth.uid()::text);

CREATE POLICY "Students can create their own simulation activity"
  ON simulation_activity FOR INSERT
  WITH CHECK (student_id::text = auth.uid()::text);

CREATE POLICY "Students can update their own simulation activity"
  ON simulation_activity FOR UPDATE
  USING (student_id::text = auth.uid()::text);

CREATE POLICY "Teachers can view all simulation activity"
  ON simulation_activity FOR SELECT
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- Interactive Lesson Progress: Similar to simulation activity
CREATE POLICY "Students can view their own progress"
  ON interactive_lesson_progress FOR SELECT
  USING (student_id::text = auth.uid()::text);

CREATE POLICY "Students can manage their own progress"
  ON interactive_lesson_progress FOR ALL
  USING (student_id::text = auth.uid()::text);

CREATE POLICY "Teachers can view all progress"
  ON interactive_lesson_progress FOR SELECT
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update simulation view count
CREATE OR REPLACE FUNCTION increment_simulation_views(simulation_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE simulations
  SET view_count = view_count + 1
  WHERE slug = simulation_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tool use count
CREATE OR REPLACE FUNCTION increment_tool_uses(tool_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE tools
  SET use_count = use_count + 1
  WHERE slug = tool_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update interactive lesson progress percentage
CREATE OR REPLACE FUNCTION update_lesson_progress_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.max_possible_score > 0 THEN
    NEW.percentage = (NEW.total_score::DECIMAL / NEW.max_possible_score::DECIMAL) * 100;
  ELSE
    NEW.percentage = 0;
  END IF;
  
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate percentage
CREATE TRIGGER calculate_progress_percentage
  BEFORE INSERT OR UPDATE ON interactive_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_progress_percentage();

-- ============================================================================
-- SEED DATA - Insert existing simulations
-- ============================================================================

INSERT INTO simulations (
  title, slug, description, category, unit, difficulty,
  component_path, estimated_time, objectives, key_concepts,
  can_embed, has_ai_guide, published, created_by
) VALUES
(
  'Measurement, Precision & Accuracy',
  'measurement-precision',
  'Learn to measure with proper precision and understand the difference between accuracy and precision. Practice reading measurements from various instruments.',
  'lab-skills',
  'lab-skills',
  'beginner',
  '/simulations/measurement-precision',
  20,
  ARRAY['Measure to the precision of a measuring device', 'Understand accuracy vs precision', 'Identify systematic and random errors'],
  ARRAY['precision', 'accuracy', 'measurement', 'error analysis'],
  TRUE,
  FALSE,
  TRUE,
  'system'
),
(
  'Freefall Cliff Lab',
  'freefall-cliff',
  'Help a traveler measure cliff height by dropping a stone! Watch position traces every 0.25 seconds and use the freefall equation h = ½gt² to calculate the height.',
  'kinematics',
  'unit-1',
  'intermediate',
  '/simulations/freefall-cliff',
  20,
  ARRAY['Apply freefall equations to real problems', 'Use experimental data to calculate height', 'Understand acceleration due to gravity'],
  ARRAY['freefall', 'kinematics', 'gravity', 'experimental methods'],
  TRUE,
  TRUE,
  TRUE,
  'system'
),
(
  'Uniformly Accelerated Motion',
  'uniformly-accelerated-motion',
  'Watch a car drop oil spots every second to visualize constant acceleration. Explore all four kinematic equations and see how spacing patterns reveal acceleration.',
  'kinematics',
  'unit-1',
  'intermediate',
  '/simulations/uniformly-accelerated-motion',
  25,
  ARRAY['Visualize constant acceleration', 'Understand all four kinematic equations', 'Connect math to physical motion patterns'],
  ARRAY['acceleration', 'kinematics', 'velocity', 'displacement'],
  TRUE,
  TRUE,
  TRUE,
  'system'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE simulations IS 'Interactive physics simulations that can be embedded in lessons';
COMMENT ON TABLE tools IS 'Utility tools (rulers, calculators, etc.) that can be embedded or used standalone';
COMMENT ON TABLE interactive_lessons IS 'Multi-step interactive lessons that combine simulations, tools, questions, and AI guidance';
COMMENT ON TABLE simulation_activity IS 'Tracks student interactions with simulations including AI assistance';
COMMENT ON TABLE interactive_lesson_progress IS 'Tracks student progress through interactive lessons';

COMMENT ON COLUMN simulations.component_path IS 'URL path to the simulation component';
COMMENT ON COLUMN simulations.has_ai_guide IS 'Whether this simulation has AI-powered hints and guidance';
COMMENT ON COLUMN interactive_lessons.steps IS 'JSONB array of step objects defining the lesson flow';
COMMENT ON COLUMN interactive_lessons.ai_scaffolding_level IS 'How much AI assistance: none, minimal, adaptive, or full';
COMMENT ON COLUMN simulation_activity.interactions IS 'JSONB array of student actions and data throughout the session';
COMMENT ON COLUMN interactive_lesson_progress.step_scores IS 'JSONB object mapping step IDs to scores';

-- Migration complete!
