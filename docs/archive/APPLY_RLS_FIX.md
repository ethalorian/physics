# How to Apply the RLS Fix (Step-by-Step)

## ✅ The type casting error has been fixed!

Follow these steps to apply the fix to your database:

---

## Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Select your Physics Classroom project
3. Click on **SQL Editor** in the left sidebar

---

## Step 2: Run the Migration

### Option A: Copy/Paste (Recommended)
1. Click **New Query** button
2. Open the file: `supabase/migrations/fix_rls_admin_access.sql`
3. Copy ALL the contents (Cmd+A, Cmd+C)
4. Paste into the SQL Editor (Cmd+V)
5. Click **Run** button (or press F5)
6. Wait for "Success. No rows returned" message

### Option B: Upload File
1. In SQL Editor, click the **...** menu
2. Choose **Import SQL file**
3. Select `supabase/migrations/fix_rls_admin_access.sql`
4. Click **Run**

---

## Step 3: Verify the Fix

### 3A: Test Admin Function
In SQL Editor, run:
```sql
-- Test with your admin email
SELECT is_admin_or_teacher('antoccic@fitchburg.k12.ma.us') as is_admin;

-- Should return: is_admin = true
```

### 3B: Test Data Access
```sql
-- This should work now without errors
SELECT id, title, published FROM lessons LIMIT 5;
SELECT id, title, published FROM assignments LIMIT 5;
```

### 3C: Run Full Verification Script
1. Click **New Query**
2. Open `test_rls_access.sql`
3. Copy and paste contents
4. Click **Run**
5. Review results to confirm everything is working

---

## Step 4: Test in Your Application

### As Admin (your email):
- ✅ Navigate to `/admin` - should work
- ✅ View all lessons (published and unpublished)
- ✅ Create/edit assignments
- ✅ Access question bank
- ✅ View gradebook

### As Student:
- ✅ View published lessons only
- ✅ View published assignments only
- ✅ Submit assignments
- ✅ Play vocabulary games
- ❌ Cannot access `/admin`
- ❌ Cannot create/edit content

---

## Expected Results

### ✅ Success Indicators:
- No SQL errors when running migration
- `is_admin_or_teacher()` returns `true` for admin emails
- Can view lessons and assignments in SQL Editor
- Application loads without RLS errors
- Admin can access all features
- Students can only access published content

### ❌ If Still Having Issues:

**Check 1: Verify your user exists**
```sql
SELECT id, email, name FROM users 
WHERE email = 'your-email@example.com';
```

**Check 2: Verify RLS is enabled**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'lessons';
-- Should show rowsecurity = true
```

**Check 3: Check for specific error**
- Look in browser console (F12)
- Look in Supabase logs (Logs & Monitoring section)
- Share the error message for help

---

## What This Fix Does

### 🔧 Fixed Type Errors
- Changed `user_id::text = auth.uid()::text` to `user_id::uuid = auth.uid()`
- Fixed all UUID/TEXT type mismatches in policies

### 🔐 Establishes Clear Permissions

**Students Can:**
- View published lessons & assignments
- Submit their own work
- Track their own progress
- Play games

**Admins/Teachers Can:**
- Everything students can do PLUS:
- Create, edit, delete all content
- Publish/unpublish content
- View all student work
- Manage grades and analytics

---

## Admin Email List

Current admin emails (can access everything):
- `antoccic@fitchburg.k12.ma.us`
- `craigantocci@gmail.com`
- `admin@test.com` (test only)
- `teacher@test.com` (test only)

To add more admins, see `RLS_FIX_GUIDE.md`

---

## Files Reference

- **Migration**: `supabase/migrations/fix_rls_admin_access.sql`
- **Test Script**: `test_rls_access.sql`
- **Full Guide**: `RLS_FIX_GUIDE.md`
- **Type Fix Details**: `TYPE_CASTING_FIX.md`

---

## Need Help?

1. Review error messages in Supabase logs
2. Check browser console for client-side errors
3. Verify your email is in the admin list
4. Make sure you're logged in with the correct account
