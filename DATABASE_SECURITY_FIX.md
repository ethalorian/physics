# Database Security Fixes - RLS Implementation

## Overview

This document addresses the **23 critical security warnings** from Supabase about Row Level Security (RLS) not being enabled on database tables.

## Security Issues Fixed

### 1. Row Level Security (RLS) Enabled

**Issue**: 23 tables were publicly accessible without RLS protection.

**Fix**: Migration file `supabase/migrations/enable_rls_security.sql` enables RLS on all tables and implements comprehensive security policies.

### 2. Function Search Path Security

**Issue**: 16 database functions had mutable search_path, making them vulnerable to SQL injection.

**Fix**: All functions now use `SET search_path = public` to prevent path manipulation attacks.

## Tables Protected

### Authentication & User Management (8 tables)
- ✅ `users` - Users can view/update their own data
- ✅ `accounts` - Users manage their own OAuth accounts
- ✅ `sessions` - Users manage their own sessions
- ✅ `verification_tokens` - Protected verification tokens
- ✅ `students` - Students view own data, teachers view all
- ✅ `courses` - Teachers manage, enrolled students view
- ✅ `student_activity` - Students track own activity, teachers view all

### Assignment System (11 tables)
- ✅ `assignments` - Teachers manage, students view published
- ✅ `assignment_submissions` - Students submit own, teachers grade all
- ✅ `submissions` - Legacy submissions table
- ✅ `assignment_analytics` - Teachers only
- ✅ `lesson_assignments` - Teachers assign, students view theirs
- ✅ `student_lesson_assignments` - Students update own progress
- ✅ `assignment_assignments` - Homework assignments
- ✅ `student_assignment_assignments` - Homework progress
- ✅ `assignment_reminders` - Teachers manage reminders

### Question Bank & Content (3 tables)
- ✅ `units` - All read, teachers write
- ✅ `question_bank` - Teachers manage, controlled student access
- ✅ `question_usage_log` - Teachers only

### Progress Tracking (4 tables)
- ✅ `lesson_progress` - Students track own, teachers view all
- ✅ `vocabulary_game_scores` - Students record own, teachers view all
- ✅ `video_question_responses` - Students answer, teachers grade
- ✅ `gradebook_entries` - Students view own, teachers manage all

## Security Model

### Role-Based Access Control

The migration implements a three-tier permission system:

```sql
-- Helper function to identify admins/teachers
is_admin_or_teacher(user_email)
-- Returns true for: antoccic@fitchburg.k12.ma.us, craigantocci@gmail.com
```

### Permission Levels

1. **Admin/Teacher** (`is_admin_or_teacher = true`)
   - Full CRUD access to all tables
   - Can view all student data
   - Can manage assignments and grades
   - Can manage question bank and content

2. **Student** (authenticated users)
   - View published content
   - Submit their own work
   - View their own progress and grades
   - Cannot access other students' data

3. **Public** (unauthenticated)
   - No direct database access
   - All access via API with authentication

## Applying the Migration

### Option 1: Via Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/enable_rls_security.sql`
5. Paste and click **Run**
6. Verify no errors in the output

### Option 2: Via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Manual Migration

```bash
# Using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/enable_rls_security.sql
```

## Verification

After applying the migration, verify RLS is enabled:

```sql
-- Check RLS status on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

## Important Notes

### Admin Email Configuration

⚠️ **CRITICAL**: Update the admin emails in the helper function:

```sql
-- In the migration file, line ~143
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- UPDATE THIS ARRAY WITH YOUR ADMIN/TEACHER EMAILS
  admin_emails TEXT[] := ARRAY[
    'antoccic@fitchburg.k12.ma.us', 
    'craigantocci@gmail.com'
    -- Add more admin emails here
  ];
BEGIN
  RETURN user_email = ANY(admin_emails);
END;
$$;
```

### Testing After Migration

1. **Test as Admin/Teacher**:
   ```bash
   # Should succeed
   - Create assignments
   - View all student data
   - Manage question bank
   ```

2. **Test as Student**:
   ```bash
   # Should succeed
   - View published assignments
   - Submit own work
   - View own progress
   
   # Should fail (403 Forbidden)
   - View other students' submissions
   - Modify assignments
   - Access question bank management
   ```

3. **Test as Unauthenticated**:
   ```bash
   # Should fail (401 Unauthorized)
   - All direct database access
   ```

## Troubleshooting

### Issue: "insufficient_privilege" errors

**Cause**: RLS policies too restrictive

**Solution**: Check if user's email is correctly set in `users` table and matches admin list

```sql
-- Check current user's email
SELECT email FROM public.users WHERE id = auth.uid();

-- Verify admin function works
SELECT is_admin_or_teacher('your-email@example.com');
```

### Issue: Students can't submit assignments

**Cause**: Missing INSERT policy or user_id mismatch

**Solution**: Verify the student's `auth.uid()` matches their `user_id` in submissions:

```sql
-- Check user ID
SELECT auth.uid();

-- Verify submission insert policy
SELECT * FROM pg_policies 
WHERE tablename = 'assignment_submissions' 
AND cmd = 'INSERT';
```

### Issue: API routes returning 401 Unauthorized

**Cause**: API routes bypass RLS but still need authentication

**Solution**: Ensure API routes use service role key (server-side) or authenticated user (client-side):

```typescript
// Server-side: Use service role (bypasses RLS)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, SERVICE_ROLE_KEY)

// Client-side: Use anon key with RLS
const supabase = createClient(url, ANON_KEY)
```

## Performance Considerations

### Indexed Columns for RLS

The migration assumes these columns are indexed:
- `user_id` on all user-related tables
- `student_id` on student assignment tables
- `published` on assignment tables

Verify indexes exist:

```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%user_id%';
```

### Query Performance

RLS policies add a `WHERE` clause to every query. Monitor slow queries:

```sql
-- Enable query logging
ALTER DATABASE postgres SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Rollback (Emergency Only)

⚠️ **Only use in emergency** - This disables security protections:

```sql
-- Disable RLS on all tables (NOT RECOMMENDED)
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;
```

## Additional Security Measures

### 1. Use Environment-Specific Keys

```env
# Development
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key

# Production
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
```

### 2. Enable Postgres Logs

Monitor for unauthorized access attempts in Supabase Dashboard → Logs

### 3. Regular Security Audits

```sql
-- List all policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for tables without RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

### 4. Update Postgres Version

Address the version warning by upgrading in Supabase Dashboard:
- Settings → Database → Version
- Upgrade to latest patch version

## Impact on Existing Code

### API Routes (No Changes Needed)

API routes use the service role key server-side, which bypasses RLS:

```typescript
// These continue to work as-is
const { data } = await supabase
  .from('assignments')
  .select('*')
```

### Client-Side Queries (Automatically Protected)

Client-side queries now enforce RLS automatically:

```typescript
// This now only returns user's own submissions
const { data } = await supabase
  .from('assignment_submissions')
  .select('*')
  .eq('user_id', userId)
```

## Success Criteria

After applying this migration:

- ✅ All 23 RLS warnings resolved
- ✅ 16 function search_path warnings resolved  
- ✅ Students can only access their own data
- ✅ Teachers/admins have full access
- ✅ Unauthenticated users have no direct database access
- ✅ API functionality unchanged
- ✅ Application performance unaffected

## Next Steps

1. **Apply the migration** to your Supabase project
2. **Update admin emails** in the `is_admin_or_teacher` function
3. **Test thoroughly** with different user roles
4. **Monitor** for any 401/403 errors in production
5. **Upgrade Postgres version** in Supabase settings

## Support

For issues with this migration:
1. Check Supabase logs for specific RLS violations
2. Verify user email matches admin list
3. Ensure `auth.uid()` is set for authenticated users
4. Review [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Migration File**: `supabase/migrations/enable_rls_security.sql`  
**Status**: Ready to apply  
**Risk Level**: Low (only adds security, doesn't modify data)  
**Rollback Available**: Yes (emergency only)
