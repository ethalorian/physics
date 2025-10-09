# Quick Fix for Roster Import - Missing Column Error

## Errors You're Seeing

### Error 1:
```
ERROR: 42703: column "teacher_email" does not exist
```

### Error 2 (after fixing error 1):
```
ERROR: 23502: null value in column "owner_id" violates not-null constraint
```

### Error 3 (students not saving):
```
ERROR: 42P01: relation "public.course_students" does not exist
```

### Error 4 (after fixing error 3):
```
ERROR: 23502: null value in column "course_id" of relation "students" violates not-null constraint
```

### Error 5 (after fixing error 4 - final error):
```
ERROR: 42702: column reference "student_id" is ambiguous
```

## The Problem
Your database has multiple issues that need to be fixed in sequence:
1. **Missing `teacher_email` column** in `courses` table
2. **`courses.owner_id` requires a value** but our function doesn't provide one
3. **Missing `course_students` junction table** - Links students to courses (many-to-many)
4. **`students.course_id` requires a value** - But students should be linked via the junction table!
5. **Ambiguous column reference in `sync_student` function** - Variable name conflicts with table column

## The Solution
Run this migration in Supabase to add the missing columns:

### Step 1: Run ALL FIVE Migrations (IN ORDER)

Go to your **Supabase Dashboard** → **SQL Editor** and run these in order:

#### 1️⃣ Add Missing Columns:
- Copy and paste: `supabase/migrations/fix_courses_table_columns.sql`
- Click **Run**
- Should see: `✅ All required columns exist!`

#### 2️⃣ Fix courses.owner_id Constraint:
- Copy and paste: `supabase/migrations/fix_owner_id_column.sql`
- Click **Run**
- Should see: `✅ owner_id is now nullable`

#### 3️⃣ Create course_students Junction Table:
- Copy and paste: `supabase/migrations/create_course_students_table.sql`
- Click **Run**
- Should see: `✅ course_students table created successfully`

#### 4️⃣ Fix students.course_id Constraint:
- Copy and paste: `supabase/migrations/fix_students_course_id.sql`
- Click **Run**
- Should see: `✅ students.course_id is now nullable`

#### 5️⃣ Fix sync_student Function:
- Copy and paste: `supabase/migrations/fix_sync_student_function.sql`
- Click **Run**
- Should see: `✅ sync_student function updated successfully`

### Step 2: Verify the Fix

**After Migration 1** (fix_courses_table_columns.sql):
```
Added teacher_email column to courses table
✅ All required columns exist!
```

**After Migration 2** (fix_owner_id_column.sql):
```
✅ Removed NOT NULL constraint from owner_id column
✅ owner_id is now nullable
```

**After Migration 3** (create_course_students_table.sql):
```
✅ course_students table created successfully
(Shows table structure with columns and indexes)
```

**After Migration 4** (fix_students_course_id.sql):
```
✅ Removed NOT NULL constraint from students.course_id column
✅ students.course_id is now nullable
```

**After Migration 5** (fix_sync_student_function.sql):
```
✅ sync_student function updated successfully
(Shows function signature)
```

### Step 3: Test Roster Import
1. Go back to your admin dashboard
2. Try importing your roster again
3. Select "Antocci Physics (CPA)" course
4. Click "Import Roster"

## What These Migrations Do

### Migration 1: fix_courses_table_columns.sql
Adds missing columns to existing tables:

**Courses Table:**
- ✅ `teacher_email` (TEXT)
- ✅ `student_count` (INTEGER, default 0)
- ✅ `section`, `description`, `room` (TEXT)

**Students Table:**
- ✅ `photo_url` (TEXT)

**Plus:** Creates index on `teacher_email` for faster queries

### Migration 2: fix_owner_id_column.sql
Fixes the `owner_id` constraint:
- ✅ Makes `owner_id` nullable (we use `teacher_email` instead)
- ✅ Verifies the change

### Migration 3: create_course_students_table.sql ⭐ CRITICAL
Creates the missing junction table:

**course_students Table:**
- ✅ `course_id` (UUID, references courses)
- ✅ `student_id` (UUID, references students)
- ✅ `enrollment_state` (TEXT, default 'ACTIVE')
- ✅ Unique constraint on (course_id, student_id)
- ✅ Indexes for fast lookups
- ✅ RLS policies for security

**This table is ESSENTIAL - it's what links students to courses!**

## Why This Happened

The `courses` and `students` tables were created by an earlier migration but didn't include all the columns that the `sync_course` function expects. This migration adds the missing columns without losing any existing data.

## Alternative: Start Fresh (If You Have No Data)

If you have no important data in the `courses` and `students` tables, you can drop and recreate them:

```sql
-- ⚠️ WARNING: This deletes all course and student data!
DROP TABLE IF EXISTS public.course_students CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- Then run: create_google_classroom_tables.sql
```

But the `fix_courses_table_columns.sql` migration is safer because it preserves existing data.

## Files Created
1. ✅ `fix_courses_table_columns.sql` - Adds missing columns **(RUN 1st)**
2. ✅ `fix_owner_id_column.sql` - Fixes courses.owner_id constraint **(RUN 2nd)**
3. ✅ `create_course_students_table.sql` - Creates junction table **(RUN 3rd)** ⭐
4. ✅ `fix_students_course_id.sql` - Fixes students.course_id constraint **(RUN 4th)** ⭐
5. ✅ `fix_sync_student_function.sql` - Fixes function ambiguity **(RUN 5th)** ⭐
6. ✅ `test_student_sync.sql` - Diagnostic tool to verify everything works
7. ✅ `verify_roster_setup.sql` - Checks if tables and functions exist

## After All Five Migrations

Once you run **ALL FIVE** migrations, your roster import will finally work! Here's the complete flow:

1. ✅ API calls `sync_course` with correct parameters (fixed earlier)
2. ✅ `sync_course` inserts course with `teacher_email` (Migration 1)
3. ✅ `courses.owner_id` is nullable - no constraint violation (Migration 2)
4. ✅ API calls `sync_student` for each student
5. ✅ `sync_student` function works without ambiguity (Migration 5)
6. ✅ Students saved to `students` table (Migration 4 - course_id nullable)
7. ✅ Students linked to course via `course_students` junction table (Migration 3)
8. ✅ Your roster is fully synced! 🎉

**Key fixes:**
- **Migration 3** creates the `course_students` junction table for many-to-many relationships
- **Migration 4** makes `students.course_id` nullable (students are linked via junction table, not direct FK)
- **Migration 5** fixes variable naming conflict in `sync_student` function (uses `v_student_id` instead of `student_id`)
