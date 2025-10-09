# Multiple Permissive Policies Fix

## Problem Summary

The Supabase linter detected **19 instances** of multiple permissive RLS policies evaluating for the same role and action, causing performance degradation.

## Root Cause

Using `FOR ALL` policies alongside specific action policies creates duplicates:

```sql
-- ❌ PROBLEM: Both policies evaluate for SELECT operations
CREATE POLICY "View own data" 
  ON table_name FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all"
  ON table_name FOR ALL  -- Includes SELECT!
  USING (is_admin(...));
```

When a SELECT query runs, **both policies are evaluated**, even though `FOR ALL` already covers the SELECT permission.

## Solution

Replace all `FOR ALL` policies with specific action policies:

```sql
-- ✅ SOLUTION: Only one SELECT policy
CREATE POLICY "View own data" 
  ON table_name FOR SELECT 
  USING (
    user_id = (select auth.uid()) OR
    is_admin(...)
  );

-- Separate policies for other actions
CREATE POLICY "Insert data"
  ON table_name FOR INSERT 
  WITH CHECK (is_admin(...));

CREATE POLICY "Update data"
  ON table_name FOR UPDATE 
  USING (is_admin(...));

CREATE POLICY "Delete data"
  ON table_name FOR DELETE 
  USING (is_admin(...));
```

## Tables Fixed

All 19 affected tables have been updated in `optimize_rls_performance.sql`:

1. **accounts** - Separated SELECT from ALL
2. **courses** - Separated SELECT from ALL
3. **gradebook_entries** - Separated SELECT from ALL
4. **lesson_progress** - Separated INSERT, SELECT, UPDATE from ALL
5. **question_bank** - Separated SELECT from ALL
6. **question_usage_log** - Separated SELECT from ALL
7. **sessions** - Separated SELECT from ALL
8. **student_activity** - Separated INSERT, SELECT from ALL
9. **students** - Separated SELECT from ALL
10. **submissions** - Separated SELECT from ALL
11. **units** - Separated SELECT from ALL
12. **video_question_responses** - Separated INSERT, SELECT, UPDATE from ALL
13. **vocabulary_game_scores** - Separated INSERT, SELECT from ALL
14. **assignment_analytics** - Replaced ALL with specific actions
15. **assignment_reminders** - Replaced ALL with specific actions
16. **lesson_progress** - Replaced admin ALL with specific actions
17. **student_activity** - Replaced admin ALL with specific actions
18. **vocabulary_game_scores** - Replaced admin ALL with specific actions
19. **video_question_responses** - Replaced admin ALL with specific actions

## Policy Pattern Changes

### Before (Inefficient)

```sql
-- Pattern 1: Student + Admin separate policies
CREATE POLICY "Students view own" 
  ON table FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all"
  ON table FOR ALL
  USING (is_admin(...));
-- ❌ Two SELECT policies evaluated!

-- Pattern 2: Separate view + manage
CREATE POLICY "View data"
  ON table FOR SELECT
  USING (...);

CREATE POLICY "Manage data"  
  ON table FOR ALL
  USING (...);
-- ❌ Two SELECT policies evaluated!
```

### After (Optimized)

```sql
-- Pattern 1: Combined student + admin in single SELECT
CREATE POLICY "View own or all data"
  ON table FOR SELECT
  USING (
    user_id = (select auth.uid()) OR
    is_admin(...)
  );

CREATE POLICY "Insert data"
  ON table FOR INSERT
  WITH CHECK (is_admin(...));

CREATE POLICY "Update data"
  ON table FOR UPDATE
  USING (is_admin(...));

CREATE POLICY "Delete data"
  ON table FOR DELETE
  USING (is_admin(...));
-- ✅ Only one policy per action!
```

## Performance Impact

### Before
- **SELECT query**: 2+ policies evaluated
- **INSERT query**: 2+ policies evaluated  
- **UPDATE query**: 2+ policies evaluated
- **DELETE query**: 2+ policies evaluated

### After
- **SELECT query**: 1 policy evaluated (50%+ reduction)
- **INSERT query**: 1 policy evaluated (50%+ reduction)
- **UPDATE query**: 1 policy evaluated (50%+ reduction)
- **DELETE query**: 1 policy evaluated (50%+ reduction)

## Verification

After applying the migration, verify the fix:

```sql
-- Check policy counts per table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd  -- Command: SELECT, INSERT, UPDATE, DELETE, ALL
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

You should see:
- ✅ **NO policies** with `cmd = 'ALL'` (except verification_tokens)
- ✅ **ONE policy** per action (SELECT, INSERT, UPDATE, DELETE) per table
- ✅ **No duplicate** (role, action) combinations

## Migration Application

### Quick Apply

```bash
# Via Supabase Dashboard SQL Editor
# Copy and paste: supabase/migrations/optimize_rls_performance.sql

# OR via CLI
supabase db push
```

### Rollback if Needed

```sql
-- Restore previous state
\i supabase/migrations/enable_rls_security.sql
```

## Key Takeaways

1. **Never use `FOR ALL` alongside specific action policies** - it creates duplicates
2. **Use specific action policies** (SELECT, INSERT, UPDATE, DELETE) instead
3. **Combine logic with OR** rather than creating multiple policies
4. **Wrap auth.uid() in subqueries**: `(select auth.uid())` for performance

## References

- [Supabase Multiple Permissive Policies Docs](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Full optimization guide: [RLS_PERFORMANCE_OPTIMIZATION.md](./RLS_PERFORMANCE_OPTIMIZATION.md)
