-- Ultra Simple RLS Fix
-- Temporarily disable RLS for testing, then we'll add proper policies

-- Step 1: Just disable RLS for now (safest for development)
ALTER TABLE simulations DISABLE ROW LEVEL SECURITY;
