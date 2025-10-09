# UUID Type Casting Fix

## Problem
You were getting this error:
```
ERROR: 42883: operator does not exist: uuid = text
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.
```

## Root Cause
The RLS policies were incorrectly casting UUID columns to TEXT for comparison:
```sql
-- ❌ WRONG - was causing the error
user_id::text = auth.uid()::text

-- ❌ WRONG - mixing types
user_id = auth.uid()::text
```

## Solution Applied
Changed all UUID comparisons to use proper UUID types:
```sql
-- ✅ CORRECT - both sides are UUID
user_id::uuid = auth.uid()

-- ✅ CORRECT - id column is already UUID
id = auth.uid()
```

## What Was Fixed
Updated all RLS policies in `fix_rls_admin_access.sql` to use correct type casting:

1. **Assignment Submissions**: `user_id::uuid = auth.uid()`
2. **Student Lesson Assignments**: `student_id::uuid = auth.uid()`
3. **Student Assignment Assignments**: `student_id::uuid = auth.uid()`
4. **Vocabulary Game Scores**: `user_id::uuid = auth.uid()`
5. **Lesson Progress**: `user_id::uuid = auth.uid()`
6. **Video Question Responses**: `user_id::uuid = auth.uid()`
7. **Gradebook Entries**: `user_id::uuid = auth.uid()`
8. **Students Table**: `id::uuid = auth.uid()`
9. **Student Activity**: `user_id::uuid = auth.uid()`
10. **Submissions (legacy)**: `user_id::uuid = auth.uid()`
11. **Accounts**: `user_id::uuid = auth.uid()`
12. **Sessions**: `user_id::uuid = auth.uid()`

## Why This Works
- `auth.uid()` returns a **UUID** type by default in Supabase
- Database columns for user IDs are **UUID** type
- Comparing UUID to UUID works natively in PostgreSQL
- No type casting needed (or cast both to UUID if column type is ambiguous)

## Next Steps
Now you can run the migration:

1. Go to Supabase SQL Editor
2. Paste the contents of `supabase/migrations/fix_rls_admin_access.sql`
3. Click **Run**
4. Should execute without errors ✅

## Verification
After running the migration, test with:
```sql
-- Should return TRUE for admin emails
SELECT is_admin_or_teacher('antoccic@fitchburg.k12.ma.us');

-- Should work without errors
SELECT * FROM lessons LIMIT 1;
SELECT * FROM assignments LIMIT 1;
```
