# Fix for Lessons Table UUID Error

## Issue
The error "invalid input syntax for type uuid: 'lesson-1-2'" occurs because:
1. The `lessons` table was never created in the database
2. The `assignments` table has a foreign key reference to `lessons(id)` expecting a UUID
3. The frontend was sending hardcoded lesson IDs like "lesson-1-2" instead of UUIDs

## Solution Overview
1. Created `supabase/migrations/create_lessons_table.sql` to define the lessons table
2. Updated the API to handle lesson_id mapping properly
3. Modified the assignment creation page to fetch real lesson UUIDs from the database

## How to Apply the Fix

### Step 1: Run the Database Migration

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to the **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/migrations/create_lessons_table.sql`
6. Click **Run** to execute the migration

This will:
- Create the `lessons` table with proper UUID primary keys
- Populate it with all physics lessons from the curriculum
- Set up proper RLS (Row Level Security) policies
- Create indexes for performance

### Step 2: Verify the Migration

Run this query in the SQL Editor to verify lessons were created:

```sql
SELECT id, slug, title, unit_id 
FROM lessons 
ORDER BY unit_id, order_index 
LIMIT 10;
```

You should see lessons with UUID IDs and their corresponding slugs (like "lesson-1-2").

### Step 3: Test the Fix

1. Go to `/admin/assignments/create` in your application
2. Create a new assignment:
   - Select a unit from the dropdown
   - Select a lesson (it will now use the proper UUID)
   - Add questions
   - Save the assignment

The error should no longer occur!

## What Changed in the Code

### 1. Database Schema (`supabase/migrations/create_lessons_table.sql`)
- Created the missing `lessons` table
- Populated it with all physics curriculum lessons
- Each lesson has a UUID `id` and a text `slug` (like "lesson-1-2")

### 2. API Route (`src/app/api/lessons/route.ts`)
- New endpoint to fetch lessons from the database
- Returns lessons with their UUIDs

### 3. Assignment API (`src/app/api/assignments/route.ts`)
- Now properly handles empty lesson_id values
- Converts empty strings to NULL for the database

### 4. Assignment Creation Page (`src/app/admin/assignments/create/page.tsx`)
- Fetches real lesson UUIDs from the database
- Maps lesson slugs to their database UUIDs
- Uses the UUID when creating assignments

## Rollback (if needed)

If you need to rollback this change:

1. Drop the lessons table (in SQL Editor):
```sql
DROP TABLE IF EXISTS lessons CASCADE;
```

2. Revert the code changes:
```bash
git checkout src/app/admin/assignments/create/page.tsx
git checkout src/app/api/assignments/route.ts
rm src/app/api/lessons/route.ts
rm supabase/migrations/create_lessons_table.sql
```

## Future Improvements

Consider these enhancements:
1. Add a UI for managing lessons (create/edit/delete)
2. Sync lesson content with actual lesson pages
3. Add more metadata to lessons (difficulty, prerequisites, etc.)
4. Create a proper lesson-assignment relationship table for better tracking
