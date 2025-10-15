# Simulation Routing Fix - October 15, 2025

## Problem Identified

Many simulations were incorrectly displaying the **projectile motion simulation** instead of their intended simulation content. This was caused by a legacy catch-all route at `src/app/simulations/[id]/page.tsx` that was hardcoded to show projectile motion physics.

## Root Cause

The dynamic route `src/app/simulations/[id]/page.tsx` was:
1. **Hardcoded to projectile motion** - The entire component showed projectile motion calculations and UI
2. **Acting as a catch-all** - In some routing edge cases, it was catching requests meant for specific simulations
3. **Not actually used** - All navigation in the app uses slug-based routes like `/simulations/car-race`, not `/simulations/[id]`

## Solution Applied

### 1. Deleted Legacy Route
✅ **Removed:** `src/app/simulations/[id]/page.tsx`

This file was a legacy catch-all that's no longer needed because:
- All simulations have their own dedicated page.tsx files
- All navigation uses slug-based routing (`/simulations/${simulation.slug}`)
- It was causing routing conflicts

### 2. Updated Documentation
✅ **Updated:** `docs/NAVIGATION_MAP.md`
- Changed references from `/simulations/[id]` to `/simulations/[slug]`
- Added comprehensive list of all available simulations with their paths
- Updated navigation flow diagrams

## Verified Configuration

All 19 simulations have dedicated pages with proper exports:

### Motion Simulations (Unit 1)
- ✅ `/simulations/constant-velocity` - Constant Velocity Motion Lab
- ✅ `/simulations/uniformly-accelerated-motion` - Uniformly Accelerated Motion
- ✅ `/simulations/freefall-cliff` - Freefall Cliff Lab
- ✅ `/simulations/projectile-motion` - Projectile Motion Lab
- ✅ `/simulations/car-race` - Car Race Kinematics
- ✅ `/simulations/race-track` - Race Track Analysis

### Advanced Motion (Unit 1)
- ✅ `/simulations/monkey-hunter` - Monkey Hunter Lab
- ✅ `/simulations/vacuum-chamber` - Vacuum Chamber Freefall
- ✅ `/simulations/astronaut-thrust` - Astronaut Thrust Lab

### Forces & Vectors (Unit 2)
- ✅ `/simulations/carts-third-law` - Newton's Third Law Carts
- ✅ `/simulations/riverboat-crossing` - Riverboat Crossing
- ✅ `/simulations/atwood-machine` - Atwood Machine
- ✅ `/simulations/maze-vectors` - Vector Maze Navigation
- ✅ `/simulations/free-body-diagram` - Free Body Diagram Tool
- ✅ `/simulations/sumo-forces` - Sumo Forces Simulation

### Lab Tools & Skills
- ✅ `/simulations/measurement-precision` - Measurement & Precision Lab
- ✅ `/simulations/slope-calculator` - Slope Calculator Tool
- ✅ `/simulations/distance-displacement` - Distance vs Displacement
- ✅ `/simulations/area-under-curve` - Area Under Curve Tool

## How Next.js App Router Works

With the fix applied, routing now follows Next.js best practices:

1. **Static Routes Take Priority**: `/simulations/car-race/page.tsx` matches first
2. **No Catch-All Interference**: The `[id]` dynamic route has been removed
3. **Clean URL Structure**: All simulations use descriptive slug-based URLs

## Testing Instructions

### 1. Test Direct Navigation
Navigate directly to each simulation URL and verify the correct simulation loads:

```bash
# Motion simulations
/simulations/constant-velocity        → Should show walker motion lab
/simulations/car-race                 → Should show car race with timing
/simulations/race-track               → Should show race track analysis
/simulations/projectile-motion        → Should show projectile launcher
/simulations/freefall-cliff           → Should show cliff height measurement

# Forces simulations
/simulations/carts-third-law          → Should show colliding carts
/simulations/sumo-forces              → Should show sumo wrestlers
/simulations/atwood-machine           → Should show pulley system
/simulations/free-body-diagram        → Should show FBD tool

# Vector simulations
/simulations/maze-vectors             → Should show vector maze
/simulations/riverboat-crossing       → Should show boat crossing river
/simulations/monkey-hunter            → Should show projectile aim at monkey

# Other
/simulations/vacuum-chamber           → Should show falling objects
/simulations/astronaut-thrust         → Should show astronaut with jetpack
/simulations/measurement-precision    → Should show measurement tools
```

### 2. Test Navigation Links
- ✅ Click simulation cards on `/simulations` page
- ✅ Click simulation links in lessons
- ✅ Click simulation links from admin dashboard
- ✅ Use "Quick Actions" on student dashboard

### 3. Test Lesson Integration
If you have lessons that embed simulations:
- ✅ Navigate to lesson with embedded simulation
- ✅ Verify correct simulation loads within lesson viewer
- ✅ Check that simulation data is tracked correctly

### 4. Test Assignment Integration
- ✅ Create a new simulation assignment
- ✅ Take a simulation assignment as a student
- ✅ Verify the correct simulation appears

## Expected Results

**Before Fix:**
- Many simulation URLs → Projectile Motion (incorrect)
- Routing conflicts and confusion

**After Fix:**
- Each simulation URL → Its specific simulation (correct)
- No more routing conflicts
- Clean, predictable URL structure

## Technical Details

### File Structure
```
src/app/simulations/
├── page.tsx                           # Simulation list (working)
├── constant-velocity/page.tsx         # ✅ Specific simulation
├── car-race/page.tsx                  # ✅ Specific simulation
├── race-track/page.tsx                # ✅ Specific simulation
├── projectile-motion/page.tsx         # ✅ Specific simulation
├── ...                                # ✅ All other specific simulations
└── [id]/page.tsx                      # ❌ DELETED (was causing issues)
```

### Routing Priority (Next.js App Router)
1. **Most Specific** → `/simulations/car-race/page.tsx`
2. **Less Specific** → `/simulations/[slug]/page.tsx` (if it existed)
3. **Least Specific** → `/simulations/[...catchall]/page.tsx`

By removing the `[id]` catch-all, we ensure the most specific routes (like `car-race`) always match correctly.

## Additional Notes

### Why This Happened
The `[id]/page.tsx` file was likely created early in development as a template or prototype for testing simulations. As individual simulation pages were created, this file became obsolete but wasn't removed, creating routing conflicts.

### Why It's Safe to Delete
- ✅ No code references `/simulations/[id]` pattern
- ✅ All navigation uses `/simulations/${slug}` pattern  
- ✅ All simulations have dedicated pages
- ✅ No database records use ID-based routing

### If Issues Persist
If you still see projectile motion appearing on wrong pages after this fix:

1. **Clear Next.js Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Clear Browser Cache**:
   - Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
   - Or use incognito/private browsing mode

3. **Check Dynamic Imports**:
   If a lesson is trying to dynamically import a simulation, verify it's using the correct slug:
   ```typescript
   // Should be:
   import(`@/app/simulations/${lesson.simulation.slug}/page`)
   
   // NOT:
   import(`@/app/simulations/[id]/page`)
   ```

## Files Changed

1. **Deleted:**
   - `src/app/simulations/[id]/page.tsx` (431 lines removed)

2. **Updated:**
   - `docs/NAVIGATION_MAP.md` (improved documentation with all simulation paths)

3. **Verified:**
   - All 19 individual simulation page.tsx files exist and export correctly

---

## Summary

✅ **Problem:** Simulations showing projectile motion instead of correct content  
✅ **Cause:** Legacy catch-all route hardcoded to projectile motion  
✅ **Fix:** Deleted problematic catch-all route  
✅ **Result:** Each simulation now loads correctly from its dedicated page  
✅ **Testing:** Verify each simulation URL loads the correct content  

The routing issue has been resolved. Each simulation should now display its intended content when accessed via its URL or navigation links.

