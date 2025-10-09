# Database Fix Guide - Physics Classroom

## Current Issues Identified

Your database is experiencing several issues:

1. **RLS (Row Level Security) conflicts** - Complex policies causing access problems
2. **Missing or inconsistent tables** - Some tables referenced by the API don't exist
3. **Hardcoded emails in functions** - Poor scalability for role management
4. **Performance issues** - Missing indexes and inefficient policies
5. **Function security issues** - Functions without proper search_path settings

## Solution Options

I've created two SQL scripts to fix your database issues:

### Option 1: Quick Fix (Minimal Changes)
**File:** `/scripts/database-quick-fix.sql`

This script makes minimal changes to get your site working:
- Creates missing tables (assignments, lessons, students, etc.)
- Adds a proper user_roles table for role management
- Fixes the broken `is_admin_or_teacher` function
- Simplifies RLS policies to reduce conflicts
- Ensures all necessary permissions are granted

**Use this if:**
- You want to preserve as much existing data as possible
- You need a quick fix to get the site working
- You prefer incremental changes

### Option 2: Complete Refactor (Recommended)
**File:** `/scripts/database-refactor.sql`

This script does a comprehensive refactoring:
- Drops all problematic policies and starts fresh
- Creates all tables with proper structure and indexes
- Implements a cleaner role management system
- Sets up optimized RLS policies
- Adds utility functions for common operations
- Includes performance optimizations

**Use this if:**
- You're okay with a more significant change
- You want the best long-term solution
- Performance and maintainability are priorities

## How to Apply the Fix

### Step 1: Backup Your Database
**IMPORTANT:** Always backup before making database changes!

In Supabase Dashboard:
1. Go to Settings → Backups
2. Click "Create backup"
3. Wait for backup to complete

### Step 2: Choose Your Script

**For Quick Fix:**
```bash
# The file is at:
/scripts/database-quick-fix.sql
```

**For Complete Refactor:**
```bash
# The file is at:
/scripts/database-refactor.sql
```

### Step 3: Run the Script

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New query**
4. Copy the entire contents of your chosen script
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 4: Verify the Fix

After running the script, verify everything works:

```sql
-- Check tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('assignments', 'lessons', 'students', 'courses');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- Test admin access
SELECT is_admin_or_teacher('antoccic@fitchburg.k12.ma.us'); -- Should return true
```

### Step 5: Test Your Application

1. **Test as Admin:**
   - Sign in with `antoccic@fitchburg.k12.ma.us` or `craigantocci@gmail.com`
   - Verify you can create/edit assignments
   - Check that all admin features work

2. **Test as Student:**
   - Sign in with a student account
   - Verify you can view published assignments
   - Check that you can submit assignments
   - Ensure you can't access admin features

3. **Test Key Features:**
   - ✅ Assignment creation and editing
   - ✅ Student submissions
   - ✅ Lesson viewing
   - ✅ Student roster management
   - ✅ Question bank access (teachers only)

## Post-Fix Tasks

### Add More Teachers/Admins

To add more teachers or admins after the fix:

```sql
-- Add a teacher
INSERT INTO public.user_roles (email, role) 
VALUES ('teacher@school.edu', 'teacher');

-- Add an admin
INSERT INTO public.user_roles (email, role) 
VALUES ('admin@school.edu', 'admin');

-- Update existing user's role
UPDATE public.user_roles 
SET role = 'teacher' 
WHERE email = 'user@school.edu';
```

### Monitor Performance

After applying the fix, monitor for:
- Slow queries (check Supabase Dashboard → Database → Query Performance)
- Failed API calls (check browser console for 403/500 errors)
- RLS policy violations (will show as permission denied errors)

## Troubleshooting

### If the script fails:

1. **Check for error messages** - The script will show what went wrong
2. **Rollback if needed** - The scripts use transactions, so they'll rollback on error
3. **Try the quick fix first** - It's less aggressive and more likely to succeed

### Common issues:

**"Permission denied" errors:**
- Make sure the user's email is in the `user_roles` table
- Verify RLS policies are correctly applied

**"Table already exists" errors:**
- This is okay - the scripts use `CREATE TABLE IF NOT EXISTS`
- The script will continue and fix other issues

**"Function does not exist" errors:**
- Run the complete refactor script, which recreates all functions

## What Changes After the Fix

### Improved Features:
- ✅ Consistent authentication across all features
- ✅ Better performance with proper indexes
- ✅ Cleaner role management system
- ✅ Simplified RLS policies that actually work
- ✅ All necessary tables for your application

### Role System:
- **Admin**: Full access to everything
- **Teacher**: Can create/edit content, view all student data
- **Student**: Can view published content, submit assignments

### Database Structure:
All tables properly created with relationships:
- Core tables: assignments, lessons, students, courses
- Submission tables: assignment_submissions
- Role management: user_roles
- Activity tracking: student_activity
- Question bank: question_bank
- Simulations: simulation tables

## Need Help?

If you encounter issues:

1. **Check the error messages** - They usually indicate what's wrong
2. **Verify your Supabase credentials** - Ensure you're connected to the right project
3. **Review the verification queries** - Run them to see what's working
4. **Check browser console** - Look for API errors when using the app

## Next Steps

After successfully fixing the database:

1. **Test thoroughly** - Ensure all features work as expected
2. **Add your users** - Populate the `user_roles` table with teachers
3. **Review security** - Ensure only authorized users have admin/teacher roles
4. **Monitor performance** - Watch for slow queries or errors

The refactored database should be much more stable and performant than before!
