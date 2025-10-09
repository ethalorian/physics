# Quick Fix: Apply Function Security Updates

## What This Fixes
✅ Resolves 13 Supabase security warnings about mutable search paths in database functions

## Key Features of This Migration

🔍 **Smart Function Discovery**: Automatically finds all versions of each function, regardless of signature  
🗑️ **Safe Dropping**: Uses dynamic SQL to drop all overloaded function versions  
🔒 **Security Hardening**: Adds `SET search_path = public` to all functions  
♻️ **Idempotent**: Safe to run multiple times without errors

## How to Apply (Choose One Method)

### Method 1: Via Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project at https://app.supabase.com
   - Navigate to **SQL Editor**

2. **Create New Query**
   - Click **New query**

3. **Copy Migration Content**
   - Open: `supabase/migrations/fix_function_search_paths.sql`
   - Copy the entire file content

4. **Paste and Run**
   - Paste into the SQL editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Check the verification messages at the end

### Method 2: Via Supabase CLI

```bash
# Make sure you're in the project directory
cd /Users/craigantocci/Desktop/Physics/physics-classroom

# Apply the migration
supabase db push

# Or run the specific file
supabase db execute -f supabase/migrations/fix_function_search_paths.sql
```

### Method 3: Via Command Line (psql)

```bash
# Get your database connection string from Supabase dashboard
# Go to Settings → Database → Connection string (URI)

# Then run:
psql "YOUR_CONNECTION_STRING_HERE" -f supabase/migrations/fix_function_search_paths.sql
```

## What Gets Fixed

The migration updates these 13 functions with secure `search_path` settings:

### Google Classroom Functions
- ✅ `sync_course` - Course import from Google Classroom
- ✅ `sync_student` - Student import from Google Classroom  
- ✅ `get_course_students` - Fetch students in a course
- ✅ `update_course_student_counts` - Update course statistics

### Assignment Functions
- ✅ `record_assignment_submission` - Record student submissions
- ✅ `calculate_assignment_stats` - Calculate assignment statistics
- ✅ `get_assignment_with_stats` - Get assignment with stats
- ✅ `create_student_assignment_assignments` - Create homework assignments

### Lesson Functions
- ✅ `record_lesson_view` - Track lesson views
- ✅ `validate_lesson_videos` - Validate video data
- ✅ `create_student_lesson_assignments` - Create lesson assignments

### Other Functions
- ✅ `get_student_activity_summary` - Student dashboard data
- ✅ `increment_question_usage` - Question bank analytics
- ✅ `update_updated_at_column` - Auto-update timestamps (trigger function)

## Error Handling

### If You See "function already exists" or "function name is not unique" Errors
The migration includes comprehensive `DROP FUNCTION IF EXISTS` statements with all possible signatures, so this should not happen. The migration now handles:

- ✅ Multiple overloaded function versions
- ✅ Functions with different parameter signatures
- ✅ CASCADE drops to handle dependencies

If you still encounter issues, the migration will show which function caused the problem, and you can manually drop it first.

### If You See Permission Errors
Make sure you're using the database owner credentials (usually the service_role key).

## Verification

After applying, verify the fix worked:

```sql
-- Check functions now have search_path set
SELECT 
  p.proname as function_name,
  p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'sync_course',
  'sync_student',
  'record_assignment_submission',
  'calculate_assignment_stats'
)
ORDER BY function_name;
```

You should see `{search_path=public}` in the config column.

### Run Supabase Linter
```bash
# Via CLI
supabase db lint

# Or via dashboard: Database → Linter
```

Expected result:
- ✅ 13 function search path warnings should be gone
- ⚠️ 1 Postgres version warning will remain (requires database upgrade)

## Testing

After applying the migration, test these features:

### Quick Smoke Test
1. ✅ Log in as a student
2. ✅ View a lesson
3. ✅ Submit an assignment
4. ✅ Log in as a teacher
5. ✅ Import a course from Google Classroom
6. ✅ View the gradebook

### API Endpoints to Test
- `/api/roster/import` - Google Classroom sync
- `/api/assignment-submissions` - Submit assignments
- `/api/assignments` - List assignments with stats
- `/api/student-activity/summary` - Student dashboard
- `/api/question-bank/usage` - Question usage tracking

## Rollback (If Needed)

If you need to rollback for any reason:

```sql
-- The original functions (without SET search_path) can be found in:
-- supabase/migrations/enable_rls_security.sql
-- supabase/migrations/fix_rls_admin_access.sql

-- Simply re-run those migrations to restore the original state
```

## No Breaking Changes

✅ All function signatures remain the same  
✅ All existing code continues to work  
✅ Only adds security improvements  
✅ No application code changes needed

## Timeline

- **Creation**: October 7, 2025
- **Apply**: ASAP (no breaking changes)
- **Testing**: 15 minutes
- **Verification**: 5 minutes

## Questions?

- See full details: `SUPABASE_SECURITY_FIX.md`
- Supabase docs: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- PostgreSQL docs: https://www.postgresql.org/docs/current/sql-createfunction.html

---

**Status**: ✅ Ready to apply  
**Risk Level**: Low (no breaking changes)  
**Estimated Time**: 5 minutes
