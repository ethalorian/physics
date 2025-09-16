-- Create vocabulary tables for storing vocabulary sets and terms

-- Vocabulary sets table
CREATE TABLE vocabulary_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit_id TEXT, -- Optional physics unit association
  lesson_id TEXT, -- Optional lesson association
  created_by TEXT, -- user_id of creator
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary terms table
CREATE TABLE vocabulary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_set_id UUID NOT NULL REFERENCES vocabulary_sets(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT, -- Optional categorization
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER DEFAULT 0, -- For ordering within a set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary usage tracking (optional - tracks which assignments use which vocabulary sets)
CREATE TABLE vocabulary_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_set_id UUID NOT NULL REFERENCES vocabulary_sets(id) ON DELETE CASCADE,
  assignment_id TEXT, -- Reference to assignment (stored in localStorage)
  question_id TEXT, -- Reference to specific question
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_vocabulary_sets_unit ON vocabulary_sets(unit_id);
CREATE INDEX idx_vocabulary_sets_lesson ON vocabulary_sets(lesson_id);
CREATE INDEX idx_vocabulary_sets_created_by ON vocabulary_sets(created_by);
CREATE INDEX idx_vocabulary_terms_set_id ON vocabulary_terms(vocabulary_set_id);
CREATE INDEX idx_vocabulary_terms_difficulty ON vocabulary_terms(difficulty);
CREATE INDEX idx_vocabulary_usage_set_id ON vocabulary_usage(vocabulary_set_id);
CREATE INDEX idx_vocabulary_usage_assignment ON vocabulary_usage(assignment_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vocabulary_sets_updated_at BEFORE UPDATE ON vocabulary_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vocabulary_terms_updated_at BEFORE UPDATE ON vocabulary_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE vocabulary_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all vocabulary sets (for now - can be restricted later)
CREATE POLICY "Allow read access to vocabulary sets" ON vocabulary_sets FOR SELECT USING (true);

-- Policy: Only authenticated users can create vocabulary sets
CREATE POLICY "Allow authenticated users to insert vocabulary sets" ON vocabulary_sets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can only update their own vocabulary sets
CREATE POLICY "Allow users to update own vocabulary sets" ON vocabulary_sets FOR UPDATE USING (created_by = auth.uid()::text);

-- Policy: Users can only delete their own vocabulary sets
CREATE POLICY "Allow users to delete own vocabulary sets" ON vocabulary_sets FOR DELETE USING (created_by = auth.uid()::text);

-- Similar policies for vocabulary terms (inherit from parent set permissions)
CREATE POLICY "Allow read access to vocabulary terms" ON vocabulary_terms FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert vocabulary terms" ON vocabulary_terms FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM vocabulary_sets WHERE id = vocabulary_terms.vocabulary_set_id AND created_by = auth.uid()::text)
);

CREATE POLICY "Allow users to update vocabulary terms in own sets" ON vocabulary_terms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vocabulary_sets WHERE id = vocabulary_terms.vocabulary_set_id AND created_by = auth.uid()::text)
);

CREATE POLICY "Allow users to delete vocabulary terms from own sets" ON vocabulary_terms FOR DELETE USING (
  EXISTS (SELECT 1 FROM vocabulary_sets WHERE id = vocabulary_terms.vocabulary_set_id AND created_by = auth.uid()::text)
);

-- Usage tracking policies (more permissive for analytics)
CREATE POLICY "Allow read access to vocabulary usage" ON vocabulary_usage FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to track vocabulary usage" ON vocabulary_usage FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Insert some sample vocabulary sets for physics
INSERT INTO vocabulary_sets (name, description, unit_id, lesson_id) VALUES
  ('Motion and Kinematics Terms', 'Basic vocabulary for motion and kinematics', 'unit-1', 'lesson-1-1'),
  ('Forces and Newton''s Laws', 'Key terms related to forces and Newton''s laws', 'unit-2', 'lesson-2-1'),
  ('Energy and Work Vocabulary', 'Essential energy and work terminology', 'unit-3', 'lesson-3-1');

-- Insert sample terms for the first vocabulary set
INSERT INTO vocabulary_terms (vocabulary_set_id, term, definition, difficulty, order_index) 
SELECT 
  vs.id,
  term_data.term,
  term_data.definition,
  term_data.difficulty,
  term_data.order_index
FROM vocabulary_sets vs,
(VALUES 
  ('Velocity', 'The rate of change of displacement with respect to time; a vector quantity', 'medium', 1),
  ('Acceleration', 'The rate of change of velocity with respect to time; a vector quantity', 'medium', 2),
  ('Displacement', 'The change in position of an object; a vector quantity', 'easy', 3),
  ('Speed', 'The rate of change of distance with respect to time; a scalar quantity', 'easy', 4),
  ('Kinematics', 'The branch of mechanics that describes motion without considering forces', 'hard', 5)
) AS term_data(term, definition, difficulty, order_index)
WHERE vs.name = 'Motion and Kinematics Terms';

-- Insert sample terms for forces vocabulary set
INSERT INTO vocabulary_terms (vocabulary_set_id, term, definition, difficulty, order_index) 
SELECT 
  vs.id,
  term_data.term,
  term_data.definition,
  term_data.difficulty,
  term_data.order_index
FROM vocabulary_sets vs,
(VALUES 
  ('Force', 'A push or pull that can cause an object to accelerate; a vector quantity', 'easy', 1),
  ('Inertia', 'The tendency of an object to resist changes in its motion', 'medium', 2),
  ('Friction', 'A force that opposes motion between surfaces in contact', 'easy', 3),
  ('Normal Force', 'The perpendicular contact force between surfaces', 'medium', 4),
  ('Net Force', 'The vector sum of all forces acting on an object', 'medium', 5)
) AS term_data(term, definition, difficulty, order_index)
WHERE vs.name = 'Forces and Newton''s Laws';

-- Insert sample terms for energy vocabulary set
INSERT INTO vocabulary_terms (vocabulary_set_id, term, definition, difficulty, order_index) 
SELECT 
  vs.id,
  term_data.term,
  term_data.definition,
  term_data.difficulty,
  term_data.order_index
FROM vocabulary_sets vs,
(VALUES 
  ('Kinetic Energy', 'Energy possessed by an object due to its motion', 'medium', 1),
  ('Potential Energy', 'Stored energy due to position or configuration', 'medium', 2),
  ('Work', 'Energy transferred to or from an object via the application of force', 'medium', 3),
  ('Power', 'The rate at which work is done or energy is transferred', 'hard', 4),
  ('Conservation of Energy', 'Energy cannot be created or destroyed, only transformed', 'hard', 5)
) AS term_data(term, definition, difficulty, order_index)
WHERE vs.name = 'Energy and Work Vocabulary';
