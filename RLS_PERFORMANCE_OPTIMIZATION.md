# RLS Performance Optimization

## Overview

This document explains the performance optimizations made to address Supabase database linter warnings related to Row Level Security (RLS) policies.

## Issues Identified

The Supabase linter identified two critical performance issues affecting 18+ tables:

### 1. Auth RLS Initialization Plan (`auth_rls_initplan`)

**Problem**: RLS policies were calling `auth.uid()` directly, causing the function to be re-evaluated for **every single row** during queries.

**Impact**: On a table with 1,000 rows, `auth.uid()` would be called 1,000 times instead of once.

**Solution**: Wrap all `auth.<function>()` calls in subqueries:
```sql
-- ❌ Before (inefficient - evaluated per row)
WHERE user_id::uuid = auth.uid()

-- ✅ After (efficient - evaluated once per query)
WHERE user_id::uuid = (select auth.uid())
```

**Affected Tables**:
- assignment_submissions
- student_lesson_assignments
- student_assignment_assignments
- vocabulary_game_scores
- lesson_progress
- video_question_responses
- gradebook_entries
- students
- student_activity
- submissions
- users
- accounts
- sessions

### 2. Multiple Permissive Policies (`multiple_permissive_policies`)

**Problem**: Multiple permissive RLS policies for the same role and action meant **each policy** was evaluated for every relevant query.

**Impact**: Having 2 SELECT policies means both are evaluated, even if the first one passes.

**Solution**: Combine multiple policies into single policies with OR conditions:
```sql
-- ❌ Before (inefficient - 2 policies evaluated)
CREATE POLICY "View own submissions"
  ON assignment_submissions FOR SELECT
  USING (user_id::uuid = auth.uid());

CREATE POLICY "Teachers view all"
  ON assignment_submissions FOR SELECT
  USING (is_admin_or_teacher(...));

-- ✅ After (efficient - 1 policy evaluated)
CREATE POLICY "View own or all submissions"
  ON assignment_submissions FOR SELECT
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM users WHERE id = (select auth.uid())))
  );
```

**Affected Tables**:
- accounts (SELECT)
- courses (SELECT)
- gradebook_entries (SELECT)
- lesson_progress (INSERT, SELECT, UPDATE)
- question_bank (SELECT)
- sessions (SELECT)
- student_activity (INSERT, SELECT)
- students (SELECT)
- submissions (SELECT)
- units (SELECT)
- video_question_responses (INSERT, SELECT, UPDATE)
- vocabulary_game_scores (INSERT, SELECT)

## Changes Made

### Migration File: `optimize_rls_performance.sql`

The migration performs the following optimizations:

1. **Drops all existing RLS policies** (ensures clean slate)

2. **Recreates policies with optimizations**:
   - All `auth.uid()` calls wrapped in `(select auth.uid())`
   - **Eliminated all `FOR ALL` policies** - replaced with specific action policies (SELECT, INSERT, UPDATE, DELETE)
   - Combined multiple policies per action where appropriate
   - Maintains same security guarantees

3. **Key structural change**: Replaced admin `FOR ALL` policies with separate policies per action
   - Before: "Admins can manage X" FOR ALL (conflicts with SELECT policies)
   - After: Separate INSERT, UPDATE, DELETE policies for admins

4. **Preserves all security rules**:
   - Students can only access their own data
   - Teachers/admins can access all data
   - Published content visible to all
   - Unpublished content only visible to admins/teachers

## How to Apply

### Option 1: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy contents of `supabase/migrations/optimize_rls_performance.sql`
4. Paste and run the migration
5. Verify no errors in the output

### Option 2: Supabase CLI

```bash
# Run the migration
supabase db push

# Or run specific migration
supabase migration up
```

### Option 3: Manual Application

```bash
# Connect to your database
psql "postgresql://[your-connection-string]"

# Run the migration file
\i supabase/migrations/optimize_rls_performance.sql
```

## Verification

After applying the migration, verify the optimizations:

### 1. Check RLS is Still Enabled

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

### 2. Check Policy Count

```sql
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

You should see **fewer policies per table** than before.

### 3. Test Database Performance

Run some typical queries and verify they still work:

```sql
-- Test as a student user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub": "[student-uuid]"}';

-- Test viewing assignments
SELECT * FROM assignments WHERE published = true;

-- Test viewing own submissions
SELECT * FROM assignment_submissions WHERE user_id::uuid = '[student-uuid]';
```

### 4. Run Supabase Linter

In the Supabase Dashboard:
1. Go to **Database** → **Linter**
2. Check for any remaining warnings
3. The `auth_rls_initplan` and `multiple_permissive_policies` warnings should be **resolved**

## Performance Impact

### Expected Improvements

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| Query 1,000 rows | 1,000 auth checks | 1 auth check | **99.9% reduction** |
| Multiple policies (2) | 2 evaluations | 1 evaluation | **50% reduction** |
| Combined effect | Very slow | Fast | **Significant speedup** |

### Real-World Benefits

- **Faster query execution**: Especially noticeable with large result sets
- **Reduced database load**: Fewer function calls per query
- **Better scalability**: Performance doesn't degrade as data grows
- **Lower latency**: Improved user experience

## Rollback Plan

If you need to rollback these changes:

```sql
-- Restore from the previous enable_rls_security.sql migration
\i supabase/migrations/enable_rls_security.sql
```

The original policies are preserved in `enable_rls_security.sql`.

## Testing Checklist

Before deploying to production:

- [ ] Run migration on development database
- [ ] Verify all tests pass
- [ ] Test as student user (read own data)
- [ ] Test as teacher user (read all data)
- [ ] Test as admin user (write data)
- [ ] Check Supabase linter shows no warnings
- [ ] Verify application functionality:
  - [ ] Students can view assignments
  - [ ] Students can submit assignments
  - [ ] Teachers can grade submissions
  - [ ] Admin can manage lessons
  - [ ] Vocabulary games work
  - [ ] Lesson progress tracking works

## Security Notes

### No Security Changes

This optimization **does not change any security rules**. It only improves performance by:
- Reducing redundant function calls
- Consolidating policy evaluations

### Maintained Security Guarantees

All original security rules are preserved:
- ✅ Students can only view their own data
- ✅ Teachers/admins can view all student data
- ✅ Only admins/teachers can create/edit lessons
- ✅ Only admins/teachers can create assignments
- ✅ Published content is visible to all
- ✅ Unpublished content is admin/teacher only

## Additional Notes

### Why Use `(select auth.uid())`?

PostgreSQL's query planner is smart enough to recognize that `(select auth.uid())` is a **stable expression** that returns the same value for all rows in a query. This allows it to:

1. Evaluate the subquery **once** at query start
2. Cache the result
3. Reuse the cached value for every row
4. Avoid repeated function calls

### Function Call Overhead

Each call to `auth.uid()` involves:
1. Extracting JWT from request
2. Parsing JWT claims
3. Looking up user ID
4. Returning the value

By wrapping in a subquery, steps 1-3 happen **once** instead of per-row.

### Policy Combining Strategy

Policies were combined following these rules:
1. Same action + same table → single policy with OR
2. Different actions → keep separate policies
3. Admin "FOR ALL" policies → kept separate for clarity

## References

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Linter Rules](https://supabase.com/docs/guides/database/database-linter)

## Support

If you encounter any issues after applying this migration:

1. Check the error messages in Supabase logs
2. Verify the migration completed successfully
3. Test with different user roles
4. Review the rollback plan above
5. Contact the development team with:
   - Error messages
   - User role when error occurred
   - Query that failed
   - Steps to reproduce
