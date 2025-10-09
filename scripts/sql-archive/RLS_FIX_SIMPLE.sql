-- Simple RLS Fix for Simulations Table
-- Copy this entire script and paste into Supabase SQL Editor

-- Enable RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view published simulations" ON simulations;
DROP POLICY IF EXISTS "Admins and teachers can view all simulations" ON simulations;
DROP POLICY IF EXISTS "Admins and teachers can insert simulations" ON simulations;
DROP POLICY IF EXISTS "Admins and teachers can update simulations" ON simulations;
DROP POLICY IF EXISTS "Admins can delete simulations" ON simulations;

-- Create new policies
CREATE POLICY "Anyone can view published simulations"
ON simulations FOR SELECT
USING (published = TRUE);

CREATE POLICY "Admins and teachers can view all"
ON simulations FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com')
);

CREATE POLICY "Admins and teachers can insert"
ON simulations FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt() ->> 'email' IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com')
);

CREATE POLICY "Admins and teachers can update"
ON simulations FOR UPDATE TO authenticated
USING (auth.jwt() ->> 'email' IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com'));

CREATE POLICY "Admins can delete"
ON simulations FOR DELETE TO authenticated
USING (auth.jwt() ->> 'email' IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com'));
