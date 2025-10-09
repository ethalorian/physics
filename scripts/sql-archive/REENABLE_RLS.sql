-- Re-enable RLS with proper policies for simulations table

-- Step 1: Enable RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies (using service role bypass for admins)

-- Anyone can view published simulations
CREATE POLICY "public_read_published"
ON simulations FOR SELECT
USING (published = TRUE);

-- Authenticated users with admin/teacher emails can do everything
CREATE POLICY "admin_teacher_all"
ON simulations FOR ALL
TO authenticated
USING (
  current_setting('request.jwt.claims', true)::json->>'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Verify policies were created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'simulations';
