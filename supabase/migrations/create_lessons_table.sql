-- ============================================================================
-- CREATE LESSONS TABLE
-- ============================================================================
-- This migration creates the lessons table that other tables reference

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lesson identifiers
  slug TEXT UNIQUE NOT NULL, -- e.g., 'lesson-1-1', 'lesson-1-2'
  
  -- Basic information
  title TEXT NOT NULL,
  description TEXT,
  
  -- Unit association
  unit_id TEXT NOT NULL, -- e.g., 'unit-1', 'unit-2'
  unit_name TEXT,
  
  -- Content
  content TEXT, -- Main lesson content (Markdown with KaTeX support)
  objectives TEXT[], -- Learning objectives
  prerequisites TEXT[], -- Required prior knowledge
  vocabulary JSONB DEFAULT '[]', -- Key terms and definitions
  
  -- Media
  video_url TEXT, -- YouTube or other video URL
  video_questions JSONB DEFAULT '[]', -- Interactive video questions
  
  -- Organization
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Settings
  published BOOLEAN DEFAULT FALSE,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  estimated_time INTEGER DEFAULT 30, -- Minutes
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT -- Teacher/admin email
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON public.lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id ON public.lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON public.lessons(published);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON public.lessons(unit_id, order_index);

-- ============================================================================
-- INSERT INITIAL LESSON DATA
-- ============================================================================
-- Populate lessons from the physics-units.ts structure

INSERT INTO public.lessons (slug, title, description, unit_id, unit_name, objectives, order_index, published)
VALUES
  -- Unit 1: Motion and Kinematics
  ('lesson-1-1', 'Introduction to Motion', 'Position, distance, and displacement', 'unit-1', 'Motion and Kinematics', 
   ARRAY['Distinguish between distance and displacement', 'Calculate average speed and velocity', 'Interpret position-time graphs'], 1, true),
  
  ('lesson-1-2', 'Velocity and Speed', 'Understanding velocity as a vector quantity', 'unit-1', 'Motion and Kinematics',
   ARRAY['Differentiate between speed and velocity', 'Calculate instantaneous and average velocity', 'Analyze velocity-time graphs'], 2, true),
  
  ('lesson-1-3', 'Acceleration', 'Rate of change of velocity', 'unit-1', 'Motion and Kinematics',
   ARRAY['Define and calculate acceleration', 'Solve problems using kinematic equations', 'Understand uniform acceleration'], 3, true),
  
  ('lesson-1-4', 'Free Fall', 'Motion under gravity', 'unit-1', 'Motion and Kinematics',
   ARRAY['Apply kinematic equations to free fall', 'Understand acceleration due to gravity', 'Solve vertical motion problems'], 4, true),
  
  ('lesson-1-5', 'Projectile Motion', '2D motion under gravity', 'unit-1', 'Motion and Kinematics',
   ARRAY['Analyze horizontal and vertical components', 'Calculate range and maximum height', 'Solve projectile motion problems'], 5, true),
  
  -- Unit 2: Forces and Newton's Laws
  ('lesson-2-1', 'Introduction to Forces', 'Understanding forces and their effects', 'unit-2', 'Forces and Newton''s Laws',
   ARRAY['Identify different types of forces', 'Draw and interpret free body diagrams', 'Understand force as a vector'], 1, true),
  
  ('lesson-2-2', 'Newton''s First Law', 'The law of inertia', 'unit-2', 'Forces and Newton''s Laws',
   ARRAY['Explain the concept of inertia', 'Apply Newton''s first law to real situations', 'Understand equilibrium conditions'], 2, true),
  
  ('lesson-2-3', 'Newton''s Second Law', 'Force, mass, and acceleration', 'unit-2', 'Forces and Newton''s Laws',
   ARRAY['Apply F = ma to solve problems', 'Understand the relationship between force and acceleration', 'Calculate net force'], 3, true),
  
  ('lesson-2-4', 'Newton''s Third Law', 'Action-reaction pairs', 'unit-2', 'Forces and Newton''s Laws',
   ARRAY['Identify action-reaction force pairs', 'Apply Newton''s third law to interactions', 'Understand forces in systems'], 4, true),
  
  ('lesson-2-5', 'Friction', 'Static and kinetic friction', 'unit-2', 'Forces and Newton''s Laws',
   ARRAY['Distinguish between static and kinetic friction', 'Calculate frictional forces', 'Solve problems with friction'], 5, true),
  
  -- Unit 3: Energy and Work
  ('lesson-3-1', 'Work and Energy', 'Introduction to work and energy concepts', 'unit-3', 'Energy and Work',
   ARRAY['Define work in physics terms', 'Calculate work done by forces', 'Understand the work-energy theorem'], 1, true),
  
  ('lesson-3-2', 'Kinetic Energy', 'Energy of motion', 'unit-3', 'Energy and Work',
   ARRAY['Calculate kinetic energy', 'Apply the work-energy theorem', 'Solve problems involving kinetic energy'], 2, true),
  
  ('lesson-3-3', 'Potential Energy', 'Stored energy', 'unit-3', 'Energy and Work',
   ARRAY['Calculate gravitational potential energy', 'Understand elastic potential energy', 'Convert between energy forms'], 3, true),
  
  ('lesson-3-4', 'Conservation of Energy', 'Energy conservation principle', 'unit-3', 'Energy and Work',
   ARRAY['Apply conservation of mechanical energy', 'Solve energy conservation problems', 'Understand energy transformations'], 4, true),
  
  ('lesson-3-5', 'Power', 'Rate of energy transfer', 'unit-3', 'Energy and Work',
   ARRAY['Define and calculate power', 'Understand the relationship between work and power', 'Solve power-related problems'], 5, true),
  
  -- Unit 4: Momentum and Collisions
  ('lesson-4-1', 'Linear Momentum', 'Introduction to momentum', 'unit-4', 'Momentum and Collisions',
   ARRAY['Define and calculate momentum', 'Understand impulse and momentum change', 'Apply the impulse-momentum theorem'], 1, true),
  
  ('lesson-4-2', 'Conservation of Momentum', 'Momentum in isolated systems', 'unit-4', 'Momentum and Collisions',
   ARRAY['Apply conservation of momentum', 'Solve momentum conservation problems', 'Analyze systems of particles'], 2, true),
  
  ('lesson-4-3', 'Elastic Collisions', 'Collisions conserving kinetic energy', 'unit-4', 'Momentum and Collisions',
   ARRAY['Analyze elastic collisions', 'Apply conservation laws to collisions', 'Calculate velocities after collision'], 3, true),
  
  ('lesson-4-4', 'Inelastic Collisions', 'Collisions with energy loss', 'unit-4', 'Momentum and Collisions',
   ARRAY['Analyze inelastic collisions', 'Calculate energy loss in collisions', 'Solve real-world collision problems'], 4, true),
  
  -- Unit 5: Waves and Sound
  ('lesson-5-1', 'Wave Properties', 'Introduction to waves', 'unit-5', 'Waves and Sound',
   ARRAY['Identify wave characteristics', 'Calculate wavelength, frequency, and speed', 'Distinguish wave types'], 1, true),
  
  ('lesson-5-2', 'Sound Waves', 'Properties of sound', 'unit-5', 'Waves and Sound',
   ARRAY['Understand sound as a mechanical wave', 'Calculate sound wave properties', 'Explain sound propagation'], 2, true),
  
  ('lesson-5-3', 'Wave Interference', 'Constructive and destructive interference', 'unit-5', 'Waves and Sound',
   ARRAY['Analyze wave superposition', 'Predict interference patterns', 'Understand standing waves'], 3, true),
  
  ('lesson-5-4', 'Doppler Effect', 'Frequency shifts in waves', 'unit-5', 'Waves and Sound',
   ARRAY['Explain the Doppler effect', 'Calculate frequency shifts', 'Apply to real-world scenarios'], 4, true),
  
  -- Unit 6: Electricity and Magnetism
  ('lesson-6-1', 'Electric Charge', 'Introduction to electricity', 'unit-6', 'Electricity and Magnetism',
   ARRAY['Understand charge and its properties', 'Apply Coulomb''s law', 'Calculate electrostatic forces'], 1, true),
  
  ('lesson-6-2', 'Electric Circuits', 'Current, voltage, and resistance', 'unit-6', 'Electricity and Magnetism',
   ARRAY['Apply Ohm''s law', 'Analyze series and parallel circuits', 'Calculate power in circuits'], 2, true),
  
  ('lesson-6-3', 'Magnetic Fields', 'Introduction to magnetism', 'unit-6', 'Electricity and Magnetism',
   ARRAY['Understand magnetic fields', 'Calculate magnetic forces', 'Apply right-hand rules'], 3, true),
  
  ('lesson-6-4', 'Electromagnetic Induction', 'Changing magnetic fields', 'unit-6', 'Electricity and Magnetism',
   ARRAY['Understand Faraday''s law', 'Calculate induced EMF', 'Apply Lenz''s law'], 4, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Public read access for published lessons
CREATE POLICY "Anyone can view published lessons"
  ON public.lessons
  FOR SELECT
  USING (published = true);

-- Admin/Teacher full access
CREATE POLICY "Admins and teachers can manage lessons"
  ON public.lessons
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.admin_emails
      UNION
      SELECT email FROM public.teacher_emails
    )
  );

-- ============================================================================
-- UPDATE EXISTING FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- The assignments table already has a foreign key to lessons(id)
-- but it was created before the lessons table existed
-- No action needed as the constraint will now work properly
