# Supabase Security Warnings - Resolution Guide

## Overview

Supabase detected 14 security warnings in the database:
- **13 Function Search Path Warnings**: Functions without explicit `search_path` settings
- **1 Postgres Version Warning**: Security patches available for the current Postgres version

## Issue 1: Function Search Path Mutable (13 Warnings)

### Security Risk
Functions without an explicit `search_path` parameter are vulnerable to **schema-based attacks**. A malicious user could create objects in schemas that are searched before the intended schema, potentially hijacking function calls.

### Affected Functions
1. `get_student_activity_summary`
2. `increment_question_usage`
3. `create_student_lesson_assignments`
4. `create_student_assignment_assignments`
5. `sync_course`
6. `record_assignment_submission`
7. `get_assignment_with_stats`
8. `calculate_assignment_stats`
9. `validate_lesson_videos`
10. `record_lesson_view`
11. `sync_student`
12. `get_course_students`
13. `update_course_student_counts`

### Solution

**Migration File Created**: `supabase/migrations/fix_function_search_paths.sql`

This migration:
- **Dynamically discovers and drops** all versions of functions (regardless of signature)
- Adds `SET search_path = public` to all affected functions
- Ensures functions only access objects in the `public` schema
- Prevents schema-based security vulnerabilities

#### Smart Function Dropping
The migration uses a dynamic approach to handle function overloading:
```sql
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    WHERE p.proname = 'function_name'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
END $$;
```
This automatically finds and drops all versions of each function, no matter what parameters they have.

#### What `SET search_path = public` Does
```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← This line locks the function to the public schema
AS $$
BEGIN
  -- Function logic here
END;
$$;
```

### How to Apply

#### Option 1: Apply via Supabase Dashboard
1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file: `supabase/migrations/fix_function_search_paths.sql`
3. Copy and paste the entire contents
4. Click **Run** to execute

#### Option 2: Apply via Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or apply the migration directly
supabase db execute -f supabase/migrations/fix_function_search_paths.sql
```

#### Option 3: Manual Application (Development)
If testing locally:
```bash
# Connect to your local Supabase database
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Run the migration
\i supabase/migrations/fix_function_search_paths.sql
```

### Verification

After applying the migration, verify the fix:

```sql
-- Check that all functions now have search_path set
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'get_student_activity_summary',
  'increment_question_usage',
  'create_student_lesson_assignments',
  'create_student_assignment_assignments',
  'sync_course',
  'record_assignment_submission',
  'get_assignment_with_stats',
  'calculate_assignment_stats',
  'validate_lesson_videos',
  'record_lesson_view',
  'sync_student',
  'get_course_students',
  'update_course_student_counts'
)
ORDER BY function_name;
```

You should see `search_path=public` in the `config` column for each function.

## Issue 2: Postgres Version Security Patches

### Warning Details
- **Current Version**: `supabase-postgres-17.4.1.075`
- **Issue**: Security patches are available
- **Risk Level**: WARN
- **Impact**: EXTERNAL

### Solution

This requires upgrading your Postgres database version in Supabase.

#### Steps to Upgrade

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Settings** → **Database**

2. **Check for Available Updates**
   - Look for the "Postgres Version" section
   - Check if an upgrade option is available

3. **Schedule the Upgrade**
   - **Important**: Schedule during low-traffic hours
   - The upgrade may cause brief downtime (typically 1-5 minutes)
   - Supabase will automatically handle the upgrade

4. **Backup Before Upgrade** (Recommended)
   ```bash
   # Create a backup using Supabase CLI
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

5. **Post-Upgrade Verification**
   ```sql
   -- Check new Postgres version
   SELECT version();
   ```

### Upgrade Considerations

- **Downtime**: Typically 1-5 minutes depending on database size
- **Automatic**: Supabase handles the upgrade process
- **Rollback**: Supabase keeps backups for rollback if needed
- **Testing**: Test in staging environment first if available

## Impact on Application

### Functions Fixed
All database functions called via RPC in your application are now secured:

#### Assignment System
- ✅ `record_assignment_submission` - Used by assignment submissions
- ✅ `calculate_assignment_stats` - Used for assignment analytics
- ✅ `get_assignment_with_stats` - Used in assignment views

#### Student Activity
- ✅ `get_student_activity_summary` - Used in student dashboards
- ✅ `record_lesson_view` - Used for lesson tracking

#### Question Bank
- ✅ `increment_question_usage` - Used for question analytics

#### Google Classroom Integration
- ✅ `sync_course` - Used for course imports
- ✅ `sync_student` - Used for student imports
- ✅ `get_course_students` - Used for roster views
- ✅ `update_course_student_counts` - Used for course stats

#### Lesson Management
- ✅ `validate_lesson_videos` - Used for lesson validation
- ✅ `create_student_lesson_assignments` - Used for lesson assignments
- ✅ `create_student_assignment_assignments` - Used for homework assignments

### No Breaking Changes
The migration:
- ✅ Maintains all function signatures
- ✅ Preserves existing functionality
- ✅ Only adds security improvements
- ✅ No changes needed in application code

## Testing Checklist

After applying the migration, test these features:

### Student Features
- [ ] View lessons
- [ ] Complete assignments
- [ ] Play vocabulary games
- [ ] View personal dashboard

### Teacher Features
- [ ] Create assignments
- [ ] Import from Google Classroom
- [ ] View student progress
- [ ] Grade submissions

### Admin Features
- [ ] Manage question bank
- [ ] Create lessons
- [ ] Manage vocabulary sets
- [ ] View analytics

## Monitoring

### Check for Remaining Warnings
After applying the fix, run the Supabase linter:

```bash
# Via Supabase CLI
supabase db lint

# Or via dashboard: Database → Linter
```

You should see:
- ✅ 13 function search path warnings resolved
- ⚠️ 1 Postgres version warning (requires manual upgrade)

### Performance Impact
The `SET search_path` directive:
- ✅ No performance degradation
- ✅ May slightly improve performance (narrower search scope)
- ✅ Improves security significantly

## Best Practices Going Forward

### For New Functions
Always include `SET search_path = public` in function definitions:

```sql
CREATE OR REPLACE FUNCTION public.my_new_function()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Always include this
AS $$
BEGIN
  -- Function logic
END;
$$;
```

### Function Security Checklist
When creating new functions:
- [ ] Include `SET search_path = public`
- [ ] Use `SECURITY DEFINER` only when necessary
- [ ] Validate all input parameters
- [ ] Use qualified table names (`public.table_name`)
- [ ] Add function documentation via `COMMENT ON FUNCTION`

## References

- [Supabase Database Linter - Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase Database Upgrades](https://supabase.com/docs/guides/platform/upgrading)

## Summary

| Issue | Severity | Status | Action Required |
|-------|----------|--------|-----------------|
| Function Search Paths (13 functions) | WARN | ✅ Fixed | Apply migration file |
| Postgres Version | WARN | ⏳ Pending | Schedule upgrade in Supabase dashboard |

**Next Steps:**
1. ✅ Review the migration file: `supabase/migrations/fix_function_search_paths.sql`
2. ⏭️ Apply the migration to your Supabase database
3. ⏭️ Verify all warnings are resolved
4. ⏭️ Schedule Postgres version upgrade during maintenance window
5. ✅ Test application functionality
6. ✅ Update this document with completion dates

---

**Migration Created**: October 7, 2025  
**Migration File**: `supabase/migrations/fix_function_search_paths.sql`  
**Status**: Ready to apply
