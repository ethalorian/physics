# Fixing Row Level Security (RLS) Issues

## The Problem

The newly created `simulation_embedded_assignments` tables have RLS policies that use hardcoded email addresses directly in the policy definitions. This is inconsistent with the established pattern in the system and can cause several issues:

1. **Maintenance nightmare**: Changing admin emails requires updating multiple policies
2. **Security risk**: Hardcoded values in policies are harder to audit
3. **Inconsistency**: Different patterns across the database make it harder to maintain
4. **Performance**: Multiple policies checking the same conditions repeatedly

## The Solution

The system already has an established pattern using helper functions:
- `is_admin_or_teacher()` - Centralized function to check admin/teacher status
- `get_user_email()` - Helper to get current user's email from JWT or users table

## How to Fix

### 1. Run the Fix Migration

```bash
# Run the new migration to fix RLS policies
npx supabase migration up

# Or if using Supabase CLI directly
supabase db push
```

The migration file `20240102000001_fix_simulation_assignments_rls.sql` will:
- Drop the incorrectly configured policies
- Create/update helper functions
- Recreate policies using the proper pattern
- Add necessary grants

### 2. Verify the Fix

Run the diagnostic script to check all RLS policies:

```bash
# Connect to your database
npx supabase db remote

# Then run the check script
\i scripts/check-rls-policies.sql
```

Look for:
- ✅ All tables should show "RLS Enabled"
- ✅ No policies should contain hardcoded emails (@ symbols)
- ✅ Helper functions should exist and contain the correct admin emails

### 3. Test the Policies

Test as different user types to ensure policies work correctly:

```sql
-- Test as admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"email": "antoccic@fitchburg.k12.ma.us"}';
SELECT COUNT(*) FROM simulation_embedded_assignments; -- Should see all

-- Test as student
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"email": "student@example.com"}';
SELECT COUNT(*) FROM simulation_embedded_assignments WHERE published = true; -- Should only see published

-- Reset
RESET ROLE;
```

## Correct RLS Pattern

### ❌ Incorrect (Hardcoded emails in policies):
```sql
CREATE POLICY "Admins can manage"
ON table_name
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);
```

### ✅ Correct (Using helper function):
```sql
CREATE POLICY "Admins can manage"
ON table_name
FOR ALL
TO authenticated
USING (
  is_admin_or_teacher(get_user_email())
);
```

## Adding New Admin Users

To add new admin users, update the `is_admin_or_teacher` function:

```sql
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com',
    'newadmin@example.com'  -- Add new admin here
  ];
BEGIN
  RETURN user_email = ANY(admin_emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Best Practices for RLS

1. **Always use helper functions** for repeated permission checks
2. **Set proper search paths** in functions: `SET search_path = public`
3. **Use SECURITY DEFINER** for helper functions
4. **Test policies** with different user roles
5. **Document admin emails** in a central location
6. **Use consistent naming** for policies
7. **Grant appropriate permissions** to the `authenticated` role

## Common RLS Issues and Solutions

### Issue 1: "Permission denied" errors
**Solution**: Check if RLS is enabled and proper policies exist
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Users can't see their own data
**Solution**: Ensure policies use proper user identification
```sql
USING (student_email = get_user_email())
```

### Issue 3: Admins can't see all data
**Solution**: Add OR condition for admin check
```sql
USING (
  user_id = auth.uid() 
  OR is_admin_or_teacher(get_user_email())
)
```

### Issue 4: INSERT operations fail
**Solution**: Use WITH CHECK for INSERT policies
```sql
CREATE POLICY "Users can insert own data"
ON table_name
FOR INSERT
TO authenticated
WITH CHECK (user_email = get_user_email());
```

## Monitoring RLS

Regularly check your RLS setup:

1. Run the diagnostic script monthly
2. Test after adding new tables
3. Verify after migrations
4. Document any custom patterns

## Need Help?

If you encounter issues:
1. Check the diagnostic script output
2. Review the pg_policies table
3. Test with different user roles
4. Check Supabase logs for detailed errors
5. Ensure all migrations have run successfully
