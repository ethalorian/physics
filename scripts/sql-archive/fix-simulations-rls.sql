-- Fix Row Level Security for Simulations Table
-- Allows teachers/admins to update simulations

-- ============================================================================
-- ENABLE RLS (if not already enabled)
-- ============================================================================
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP OLD POLICIES (if they exist)
-- ============================================================================
DROP POLICY IF EXISTS "Public can view published simulations" ON simulations;
DROP POLICY IF EXISTS "Admins and teachers can manage simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can view published simulations" ON simulations;

-- ============================================================================
-- CREATE NEW POLICIES
-- ============================================================================

-- Policy 1: Anyone can view published simulations
CREATE POLICY "Anyone can view published simulations"
ON simulations
FOR SELECT
USING (published = TRUE);

-- Policy 2: Admins and teachers can view all simulations
CREATE POLICY "Admins and teachers can view all simulations"
ON simulations
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Policy 3: Admins and teachers can insert simulations
CREATE POLICY "Admins and teachers can insert simulations"
ON simulations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Policy 4: Admins and teachers can update simulations
CREATE POLICY "Admins and teachers can update simulations"
ON simulations
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Policy 5: Admins can delete simulations
CREATE POLICY "Admins can delete simulations"
ON simulations
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'simulations'
ORDER BY policyname;

-- Expected: 5 policies (SELECT, SELECT, INSERT, UPDATE, DELETE)

SELECT 'RLS Policies for simulations table updated successfully!' as status;
