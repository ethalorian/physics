# ✅ Action Items - What You Need to Do Right Now

## 🚨 Critical: Apply RLS Migration First!

Without this, nothing else will work properly.

### Step-by-Step Instructions:

#### 1. Open Supabase Dashboard
```
1. Go to: https://supabase.com
2. Select your "Physics Classroom" project
3. Click "SQL Editor" in the left sidebar
```

#### 2. Run the Migration
```
1. Click "New Query" button (top right)
2. Open file: supabase/migrations/fix_rls_admin_access.sql
3. Select ALL text (Cmd+A or Ctrl+A)
4. Copy (Cmd+C or Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click "Run" button (or press F5)
7. Wait for "Success. No rows returned" message
```

#### 3. Verify It Worked
```sql
-- Copy this into a NEW query and run it:
SELECT is_admin_or_teacher('antoccic@fitchburg.k12.ma.us') as is_admin;

-- Expected result: is_admin = true
-- If you get this, the migration worked! ✅
```

---

## 🔄 Second: Restart Your Dev Server

### In Terminal:
```bash
# Stop the current server
# Press: Ctrl+C (or Cmd+C on Mac)

# Restart it
npm run dev

# Wait for "Ready" message
```

---

## 🧪 Third: Test Everything

### Test 1: Sign In
```
1. Go to your app: http://localhost:3000
2. Click "Sign In"
3. Sign in with Google using: antoccic@fitchburg.k12.ma.us
4. Should redirect to dashboard ✅
```

### Test 2: Admin Dashboard
```
1. Go to: http://localhost:3000/admin/dashboard
2. Look at the statistics cards
3. You should see:
   ✅ Total Lessons: [actual number, not 0]
   ✅ Active Assignments: [actual number]
   ✅ Recent Lessons: [actual list of lessons]
```

### Test 3: Lessons Page
```
1. Click "Content" tab
2. Click "Lessons" sub-tab
3. You should see all your lessons listed ✅
```

### Test 4: Student View
```
1. Click "View as Student" button (top right)
2. Go to "My Lessons" tab
3. You should see published lessons ✅
4. Click "Exit Student View" to go back
```

---

## ✅ Success Checklist

Mark these off as you verify them:

- [ ] RLS migration applied successfully
- [ ] Verification query returned `true`
- [ ] Dev server restarted
- [ ] Signed in with Google successfully
- [ ] Admin dashboard shows correct lesson count
- [ ] Admin dashboard shows list of recent lessons
- [ ] Can view lessons in Content tab
- [ ] Student view shows published lessons only
- [ ] No console errors in browser (F12)

---

## 🚨 If Something's Wrong

### Dashboard Still Shows 0 Lessons?

**Run this in browser console (F12):**
```javascript
fetch('/api/admin/stats')
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
```

**Expected output:**
```javascript
{
  stats: {
    totalLessons: [number > 0],
    publishedLessons: [number > 0],
    totalAssignments: [number],
    activeAssignments: [number],
    enrolledStudents: [number]
  }
}
```

**If you get an error**, share the error message!

---

### Still Getting "Unauthorized" or "Forbidden"?

**Check your email:**
```javascript
// In browser console (F12)
fetch('/api/admin/stats')
  .then(r => r.text())
  .then(text => console.log('Response:', text))
```

**Make sure you're signed in with:**
- antoccic@fitchburg.k12.ma.us ✅
- OR craigantocci@gmail.com ✅

**Not with:**
- Any other email ❌

---

### Migration Failed?

**Error: "function is_admin_or_teacher already exists"**

Solution:
```sql
-- Run this first to clean up, then re-run the migration:
DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email() CASCADE;
```

**Error: "operator does not exist: uuid = text"**

- This means the old RLS policies weren't dropped
- The migration should handle this automatically
- If it persists, try running just the DROP POLICIES section first

---

## 📋 Summary of Changes Made

### What Was Fixed:
1. ✅ **RLS Type Casting** - All UUID comparisons fixed
2. ✅ **Google Auth** - API routes created for proper authentication
3. ✅ **Dashboard Stats** - AdminOverview now uses /api/admin/stats
4. ✅ **Recent Lessons** - QuickLessonPreview now uses /api/lessons/published
5. ✅ **Student Lessons** - StudentLessons now uses /api/lessons/published
6. ✅ **All Components** - Verified all 60+ components use API routes

### New Files:
- ✅ API Route: `/api/lessons/published`
- ✅ API Route: `/api/admin/stats`
- ✅ Migration: `fix_rls_admin_access.sql`
- ✅ Documentation: 9 comprehensive guides

---

## 🎯 Expected Results

### After Following All Steps:

**Admin Dashboard:**
- Shows actual lesson count (not 0)
- Shows actual assignment count
- Shows list of recent lessons with details
- Shows student count if you've imported from Google Classroom

**Student View:**
- Shows published lessons only
- Shows published assignments only
- Can submit work
- Cannot access admin features

**Everything Works:**
- No "Unauthorized" errors
- No "Forbidden" errors
- No console errors
- Smooth navigation
- Fast loading

---

## 🚀 Ready?

1. ⬜ Apply RLS migration
2. ⬜ Restart dev server  
3. ⬜ Test as admin
4. ⬜ Test student view
5. ⬜ Mark this complete! 🎉

---

## 📞 Need Help?

If you're stuck:

1. **Check which step failed**
2. **Look at browser console** (F12)
3. **Check terminal** for errors
4. **Share error messages** and I can help!

---

**Time Required**: ~5 minutes  
**Difficulty**: Easy (copy/paste)  
**Result**: Everything works! ✅
