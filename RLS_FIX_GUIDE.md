# RLS Access Fix - Admin vs Student Permissions

## Problem Summary
The Row Level Security (RLS) policies were preventing proper access to the database. The issue was with how admin/teacher roles were being checked and enforced.

## What Was Fixed

### 1. **Improved Role Detection Functions**
Created robust helper functions:
- `get_user_email()` - Reliably gets current user's email from auth context
- `is_admin_or_teacher(email)` - Checks if user is admin/teacher (can pass email or use current user)
- `is_student()` - Checks if current user is a student

### 2. **Clear Permission Structure**

#### **Students Can:**
- ✅ View published lessons
- ✅ View published assignments  
- ✅ Submit their own assignment responses
- ✅ Play vocabulary games and track scores
- ✅ View their own progress and grades
- ✅ Answer video questions
- ✅ View their own activity

#### **Admins/Teachers Can:**
- ✅ All student capabilities PLUS:
- ✅ Create, edit, delete lessons
- ✅ Publish/unpublish lessons
- ✅ Create, edit, delete assignments
- ✅ Publish/unpublish assignments
- ✅ Assign lessons and homework to courses/students
- ✅ View all student submissions
- ✅ Grade assignments and provide feedback
- ✅ Manage question bank
- ✅ View all student progress and analytics
- ✅ Manage courses and student rosters
- ✅ View gradebook for all students

### 3. **Admin Email Configuration**
The following emails have admin/teacher access:
- `antoccic@fitchburg.k12.ma.us`
- `craigantocci@gmail.com`
- `admin@test.com` (test account)
- `teacher@test.com` (test account)

## How to Apply the Fix

### Step 1: Run the Migration in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/fix_rls_admin_access.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press F5)
7. Wait for success message (should see "Success. No rows returned")

### Step 2: Verify the Fix

1. In the same SQL Editor, click **New Query**
2. Copy the contents of `test_rls_access.sql`
3. Paste and click **Run**
4. Review the results:

**Expected Results as Admin:**
```
✅ All tables show "Enabled" for RLS
✅ is_admin_or_teacher returns TRUE for your email
✅ You can see ALL lessons (published and unpublished)
✅ You can see ALL assignments (published and unpublished)
✅ Role shows "ADMIN/TEACHER - Full Access"
```

**Expected Results as Student:**
```
✅ All tables show "Enabled" for RLS
❌ is_admin_or_teacher returns FALSE
👁️  You can see ONLY published lessons
👁️  You can see ONLY published assignments
👁️  Role shows "STUDENT - Limited Access"
```

### Step 3: Test in Your Application

1. **As Admin** (logged in with admin email):
   - Navigate to `/admin` - Should work
   - Try creating a lesson - Should work
   - Try creating an assignment - Should work
   - View question bank - Should work
   
2. **As Student** (logged in with student email):
   - Navigate to `/lessons` - Should see published lessons only
   - Navigate to `/assignments` - Should see published assignments only
   - Navigate to `/admin` - Should be blocked
   - Try vocabulary games - Should work
   - View your own progress - Should work

## Troubleshooting

### Problem: Still can't access data as admin

**Solution 1: Verify your email**
```sql
-- Run in Supabase SQL Editor
SELECT email FROM public.users WHERE id = auth.uid();
```
Make sure the email matches one of the admin emails.

**Solution 2: Check if user exists**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM public.users WHERE email = 'your-email@example.com';
```
If no user found, you need to sign in through the application first.

**Solution 3: Manually test the function**
```sql
-- Run in Supabase SQL Editor
SELECT is_admin_or_teacher('your-email@example.com');
```
Should return `true` for admin emails.

### Problem: Students can see unpublished content

**Solution: Check the published flag**
```sql
-- Run in Supabase SQL Editor
SELECT id, title, published FROM public.lessons WHERE published = false;
```
Make sure unpublished lessons have `published = false`.

### Problem: Can't insert/update data

**Solution: Check grants**
```sql
-- Run in Supabase SQL Editor to re-grant permissions
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
```

## Adding More Admins

To add more admin/teacher emails:

1. Open `supabase/migrations/fix_rls_admin_access.sql`
2. Find the `is_admin_or_teacher` function (around line 77)
3. Update the `admin_emails` array:
```sql
DECLARE
  admin_emails TEXT[] := ARRAY[
    'antoccic@fitchburg.k12.ma.us', 
    'craigantocci@gmail.com',
    'newteacher@school.edu',  -- Add here
    'admin@test.com',
    'teacher@test.com'
  ];
```
4. Re-run the migration

**OR** update just the function:
```sql
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(check_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'antoccic@fitchburg.k12.ma.us', 
    'craigantocci@gmail.com',
    'newteacher@school.edu',  -- Add new email here
    'admin@test.com',
    'teacher@test.com'
  ];
  email_to_check TEXT;
BEGIN
  IF check_email IS NULL THEN
    email_to_check := public.get_user_email();
  ELSE
    email_to_check := check_email;
  END IF;
  
  RETURN email_to_check = ANY(admin_emails);
END;
$$;
```

## Security Notes

1. **RLS is now enabled on all tables** - This prevents unauthorized access
2. **Policies control who can do what** - Each table has specific policies
3. **Auth context is checked** - Uses Supabase auth.uid() to verify users
4. **Admin emails are server-side** - Defined in the database, not client code
5. **Students are isolated** - Can only see their own data and published content

## Policy Summary by Table

| Table | Students Read | Students Write | Admin Full Access |
|-------|---------------|----------------|-------------------|
| `lessons` | Published only | ❌ | ✅ |
| `assignments` | Published only | ❌ | ✅ |
| `assignment_submissions` | Own only | Own only | ✅ |
| `lesson_assignments` | Published only | ❌ | ✅ |
| `vocabulary_game_scores` | Own only | Own only | ✅ |
| `lesson_progress` | Own only | Own only | ✅ |
| `video_question_responses` | Own only | Own only | ✅ |
| `gradebook_entries` | Own only | ❌ | ✅ |
| `question_bank` | ❌ | ❌ | ✅ |
| `students` | Own record | ❌ | ✅ |
| `courses` | All | ❌ | ✅ |

## Next Steps

1. ✅ Apply the migration
2. ✅ Test with the verification script
3. ✅ Test in the application as both admin and student
4. ✅ Add more admin emails if needed
5. ✅ Monitor for any access issues

## Support

If you continue to have issues:
1. Check the Supabase logs for RLS policy errors
2. Run the test script and share results
3. Verify your user's email in the database
4. Make sure you&apos;re logged in with the correct account

## Files Created/Modified

- ✅ `supabase/migrations/fix_rls_admin_access.sql` - Main migration file
- ✅ `test_rls_access.sql` - Verification script
- ✅ `RLS_FIX_GUIDE.md` - This guide (you are here)

---

**Remember:** The migration is idempotent (can be run multiple times safely). If something goes wrong, you can re-run it without issues.
