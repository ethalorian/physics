# Quick Fix - Lesson Browser UI Not Showing

## The Problem

The database is missing new columns that the lesson browser UI needs:
- `lesson_type` (video, simulation, or markdown)
- `simulation_id` (links to simulations)
- `embedded_questions` (questions for the lesson)
- `unit` column (uses `unit_id` currently)
- `lesson_number` column (needs to exist)

**Error**: `column lessons.order_index does not exist` (actually it exists, but other columns are missing)

---

## Solution - 2 Steps

### Step 1: Run Database Migration

**Option A: Via Supabase Dashboard** (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**
5. **Copy and paste** the entire contents of: `scripts/run-lesson-migration.sql`
6. Click **"Run"**
7. You should see: ✓ Lesson browser columns added successfully!

**Option B: Via Terminal** (if you have Supabase CLI set up)
```bash
# Navigate to project
cd /Users/craigantocci/Desktop/Physics/physics-classroom

# Run migration
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f scripts/run-lesson-migration.sql
```

### Step 2: Hard Refresh Your Browser

**Mac**: Press `Cmd + Shift + R`
**Windows/Linux**: Press `Ctrl + Shift + R`

This clears the cache and reloads the page.

---

## What You Should See After Fixing

### Admin Dashboard → Content Tab → Lessons Subtab

```
┌──────────────────────────────────────────────────────────┐
│ Lesson Management                   [+ New Lesson]       │
│ Create and manage physics lessons                        │
├──────────────────────────────────────────────────────────┤
│ Statistics Dashboard (6 Cards):                          │
│ [Total: 24]  [Published: 20]  [Drafts: 4]              │
│ [Videos: 3]  [Simulations: 0]  [Reading: 21]           │
├──────────────────────────────────────────────────────────┤
│ Filters:                                                 │
│ [Search...] [Unit ▼] [Type ▼] [Difficulty ▼] [Status ▼]│
├──────────────────────────────────────────────────────────┤
│ Unit 1: Kinematics                        6 lessons      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ Lesson 1 │ │ Lesson 2 │ │ Lesson 3 │                 │
│ │ 📖       │ │ 📖       │ │ 📖       │                 │
│ │ Published│ │ Published│ │ Draft    │                 │
│ │ [Edit]   │ │ [Edit]   │ │ [Edit]   │                 │
│ │ [View]   │ │ [View]   │ │ [View]   │                 │
│ │ [Preview]│ │ [Preview]│ │ [Preview]│                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
└──────────────────────────────────────────────────────────┘
```

### If No Lessons Exist Yet

You'll see an empty state with a button to create your first lesson.

---

## Verify the Fix Worked

Run this query in Supabase SQL Editor to check:

```sql
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lessons'
  AND table_schema = 'public'
  AND column_name IN ('lesson_type', 'simulation_id', 'embedded_questions', 'unit', 'lesson_number')
ORDER BY column_name;
```

You should see all 5 columns listed.

---

## Troubleshooting

### Still seeing errors?

1. **Check your terminal** (where `npm run dev` is running)
   - Look for detailed error messages
   - Share them with me if errors persist

2. **Clear all browser data**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Restart dev server**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Database connection issues?

If you can't connect to Supabase:
- Check your `.env.local` file has correct credentials
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure your Supabase project is running

---

## What Columns Are Required

Your `lessons` table needs these columns for the new UI to work:

**Required (exist already)**:
- `id`, `slug`, `title`, `description`
- `unit_id`, `published`, `created_at`
- `order_index` or `lesson_number`
- `content`, `video_url`

**New (need to be added by migration)**:
- `lesson_type` ('video', 'simulation', 'markdown')
- `simulation_id` (UUID reference to simulations table)
- `embedded_questions` (JSONB array)
- `question_timing` ('before', 'after', 'mixed')
- `unit` (TEXT - copy of unit_id for consistency)
- `lesson_number` (INTEGER - if not already present)
- `videos` (JSONB - for video lessons)

---

## After Migration Runs Successfully

Your lesson browser will:
- ✅ Show all existing lessons
- ✅ Display statistics (total, published, drafts by type)
- ✅ Allow filtering by unit, type, difficulty, status
- ✅ Show color-coded cards (red=video, purple=simulation, blue=reading)
- ✅ Provide Edit/View/Preview actions for each lesson
- ✅ Support search across titles and descriptions

---

## Next Step

**Run the migration now:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste contents of `scripts/run-lesson-migration.sql`
4. Click "Run"
5. Hard refresh browser (`Cmd+Shift+R`)

Then the beautiful new UI will appear! 🎉


