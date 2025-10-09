# Simulation Visibility Issue - Diagnosis & Fix

## Problem
Constant Velocity Lab (and other simulations) are not showing on `/simulations` page even though:
- ✅ The simulation page exists at `/simulations/constant-velocity`
- ✅ The migration file includes seed data for it
- ✅ The mock data includes it
- ✅ The SimulationProvider is in the layout
- ✅ The SimulationWrapper is properly implemented

## Root Cause
The database migration `create_simulation_tool_system.sql` has **not been run** in Supabase, so:
- The `simulations` table doesn't exist
- The seed data (including Constant Velocity) hasn't been inserted
- The API returns empty results
- The UI falls back to mock data BUT there might be an issue with how it's displayed

## Solution

### Option 1: Run the Full Migration (Recommended)

1. **Check Current Status**
   - Visit: http://localhost:3000/admin/migrations/check
   - This will show if tables exist and if seed data is present

2. **Run the Migration**
   ```bash
   # Open Supabase SQL Editor
   # Navigate to your project → SQL Editor
   # Or use this URL pattern:
   # https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
   ```

3. **Copy and Execute Migration**
   - Open the full migration file: `supabase/migrations/create_simulation_tool_system.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click "Run"

4. **Verify**
   - Refresh `/admin/migrations/check`
   - Should see "Migration Successful" status
   - Check `/simulations` - Constant Velocity should appear

### Option 2: Quick Seed Fix (If Tables Exist)

If tables already exist but data is missing:

```sql
-- Run this in Supabase SQL Editor
INSERT INTO simulations (
  title, slug, description, category, unit, difficulty,
  component_path, estimated_time, objectives, key_concepts,
  can_embed, has_ai_guide, published, created_by
) VALUES (
  'Constant Velocity Motion Lab',
  'constant-velocity',
  'Control a walker''s motion and collect position data. Observe constant velocity in 1D motion and analyze position-time graphs to find velocity from slope.',
  'kinematics',
  'unit-1',
  'beginner',
  '/simulations/constant-velocity',
  15,
  ARRAY['Understand constant velocity motion', 'Collect and analyze position-time data', 'Calculate velocity from graph slope'],
  ARRAY['velocity', 'kinematics', 'graphs', 'data collection'],
  TRUE,
  TRUE,
  TRUE,
  'system'
) ON CONFLICT (slug) DO NOTHING;
```

### Option 3: API Seeding Endpoint

Use the built-in API endpoint to seed missing simulations:

```bash
# This will insert any simulations that are missing
curl -X POST http://localhost:3000/api/admin/seed-missing-simulations
```

Or visit in browser:
- http://localhost:3000/admin/simulations
- Look for "Seed Missing Simulations" button

## Verification Steps

After running any solution:

1. **Check API Response**
   ```bash
   curl http://localhost:3000/api/simulations?published=true
   ```
   Should return an array with your simulations

2. **Check Database**
   ```sql
   SELECT title, slug, published FROM simulations;
   ```
   Should see "Constant Velocity Motion Lab"

3. **Check UI**
   - Visit: http://localhost:3000/simulations
   - Should see the simulation card in the "Featured" or "All Simulations" section
   - Badge should show "Database Active" (green), not "Mock Data" (yellow)

## Debug Checklist

If still not showing:

- [ ] Check browser console for errors
- [ ] Verify `published = true` in database
- [ ] Check RLS (Row Level Security) policies aren't blocking
- [ ] Verify API route returns data: `/api/simulations?published=true`
- [ ] Check if filtering is hiding it (try clearing search)
- [ ] Verify mock data isn't being used (check for yellow "Mock Data" badge)

## Additional Notes

The simulations page has two sections:
1. **Featured** - Shows simulations with `isFeatured: true`
2. **All Simulations** - Shows non-featured simulations

Constant Velocity is marked as featured, so it should appear in the "Featured" section at the top of the page.
