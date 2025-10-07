# RLS Quick Reference Card

## 🚀 Quick Apply (Do This First!)

### Apply the Fix:
1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `supabase/migrations/fix_rls_admin_access.sql`
3. Click **Run**

### Verify It Worked:
1. SQL Editor → New Query
2. Paste: `SELECT is_admin_or_teacher('your-email@example.com');`
3. Should return `true` for admin emails

---

## 🔍 Quick Diagnostic Commands

### Check if you're recognized as admin:
```sql
SELECT 
  get_user_email() as my_email,
  is_admin_or_teacher() as am_i_admin;
```

### See what lessons you can access:
```sql
SELECT id, title, published, 
  CASE WHEN published THEN 'Public' ELSE 'Admin Only' END as visibility
FROM lessons 
LIMIT 5;
```

### Count your access:
```sql
SELECT 
  COUNT(*) as total_lessons,
  COUNT(*) FILTER (WHERE published = true) as published,
  COUNT(*) FILTER (WHERE published = false) as drafts
FROM lessons;
```
- **Admin should see:** Total > Published (has draft access)
- **Student should see:** Total = Published (only published)

### Check RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('lessons', 'assignments')
ORDER BY tablename;
```
All should show `true`.

---

## 👥 Admin Emails Currently Configured

Copy these to check:
- `antoccic@fitchburg.k12.ma.us`
- `craigantocci@gmail.com`
- `admin@test.com` (dev only)
- `teacher@test.com` (dev only)

---

## ➕ Add New Admin Email

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
    'NEW_EMAIL_HERE@example.com',  -- 👈 Add here
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

---

## 🐛 Common Problems & Fixes

### Problem: "I can't see any lessons/assignments"

**Check 1:** Are you logged in?
```sql
SELECT auth.uid(), get_user_email();
```
Both should return values.

**Check 2:** Are there any published items?
```sql
SELECT COUNT(*) FROM lessons WHERE published = true;
SELECT COUNT(*) FROM assignments WHERE published = true;
```

**Check 3:** Do you have a user record?
```sql
SELECT * FROM users WHERE id = auth.uid();
```

### Problem: "I'm an admin but can't create content"

**Fix:** Verify admin status:
```sql
SELECT 
  email,
  is_admin_or_teacher(email) as is_admin
FROM users 
WHERE id = auth.uid();
```
Should return `true`.

**If false:** Your email isn't in the admin list. Add it using the script above.

### Problem: "Students can see unpublished content"

**Fix:** Check published flags:
```sql
UPDATE lessons SET published = false WHERE id = 'LESSON_ID';
UPDATE assignments SET published = false WHERE id = 'ASSIGNMENT_ID';
```

---

## 📊 Access Matrix

| Action | Student | Admin |
|--------|---------|-------|
| View published lessons | ✅ | ✅ |
| View unpublished lessons | ❌ | ✅ |
| Create lessons | ❌ | ✅ |
| View published assignments | ✅ | ✅ |
| View unpublished assignments | ❌ | ✅ |
| Create assignments | ❌ | ✅ |
| Submit assignments | ✅ (own) | ✅ |
| Grade assignments | ❌ | ✅ |
| Play games | ✅ | ✅ |
| View question bank | ❌ | ✅ |
| View own progress | ✅ | ✅ |
| View all students | ❌ | ✅ |

---

## 🔐 Security Checklist

- ✅ RLS enabled on all tables
- ✅ Admin emails hardcoded in database function
- ✅ Students can only see their own data
- ✅ Published content visible to all
- ✅ Unpublished content admin-only
- ✅ Question bank admin-only
- ✅ Gradebook teachers can grade, students can view own

---

## 📝 One-Line Tests

```sql
-- Am I admin?
SELECT is_admin_or_teacher();

-- What's my email?
SELECT get_user_email();

-- How many lessons can I see?
SELECT COUNT(*) FROM lessons;

-- Can I see drafts?
SELECT COUNT(*) FROM lessons WHERE published = false;

-- Is RLS working?
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'lessons';
```

---

## 🆘 Emergency Reset

If everything is broken, re-run the migration:

1. Supabase Dashboard → SQL Editor
2. Paste entire `supabase/migrations/fix_rls_admin_access.sql`
3. Run
4. Migration is idempotent (safe to run multiple times)

---

## 📞 Still Having Issues?

1. Run the full test: `test_rls_access.sql`
2. Check Supabase logs: Dashboard → Logs → Postgres Logs
3. Verify user exists: `SELECT * FROM users WHERE email = 'your-email';`
4. Check your auth session: Application → Browser DevTools → Console → Check session object

---

**Created:** 2024
**Last Updated:** After RLS fix migration
**Migration File:** `supabase/migrations/fix_rls_admin_access.sql`
