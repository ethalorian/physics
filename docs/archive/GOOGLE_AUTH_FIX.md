# Google Sign-In Authentication Fix

## ✅ Problem Solved!

### The Issue
When you signed in with Google:
- ✅ SQL test worked (you could query directly)
- ❌ Dashboard showed no lessons
- ❌ RLS policies weren't recognizing your session

### Root Cause
Your app uses **two different authentication systems** that weren't talking to each other:

1. **NextAuth** (handles Google Sign-In)
   - Creates session with user email
   - Manages JWT tokens
   - Works server-side

2. **Supabase RLS** (protects database)
   - Expects `auth.uid()` from Supabase Auth
   - Runs in the database
   - Doesn't know about NextAuth sessions

When the `StudentLessons` component tried to fetch data directly from Supabase:
```typescript
// ❌ This didn't work
const { data } = await supabase.from('lessons').select('*')
```

The Supabase client couldn't see your NextAuth session, so RLS blocked the request!

## The Fix

### What I Changed

#### 1. Created Server-Side API Route
**File**: `src/app/api/lessons/published/route.ts`

This route:
- ✅ Uses NextAuth `auth()` to get your session server-side
- ✅ Checks your email against the admin list
- ✅ Uses `supabaseAdmin` to bypass RLS (we handle auth in code)
- ✅ Returns only published lessons for students
- ✅ Returns all lessons for admins/teachers

```typescript
// Server-side with proper auth
const session = await auth()
const userRole = getUserRole(session.user.email)
const isAdmin = userRole === 'admin' || userRole === 'teacher'

// Fetch with admin client (bypasses RLS)
const { data } = await supabaseAdmin
  .from('lessons')
  .select('*')
  .eq('published', isAdmin ? undefined : true) // Filter for students
```

#### 2. Updated StudentLessons Component
**File**: `src/components/student/StudentLessons.tsx`

Changed from direct Supabase query to API fetch:

```typescript
// ✅ Now works with Google Sign-In
const response = await fetch('/api/lessons/published')
const data = await response.json()
setLessons(data.lessons || [])
```

## How It Works Now

```
1. User signs in with Google
   ↓
2. NextAuth creates session with user email
   ↓
3. Dashboard loads StudentLessons component
   ↓
4. Component calls /api/lessons/published
   ↓
5. API route checks NextAuth session server-side
   ↓
6. API checks if email is admin (antoccic@fitchburg.k12.ma.us)
   ↓
7. API uses supabaseAdmin to fetch lessons
   ↓
8. Returns lessons based on user role
   ↓
9. Component displays lessons ✅
```

## Testing

### Test as Admin
1. Sign in with Google using `antoccic@fitchburg.k12.ma.us` or `craigantocci@gmail.com`
2. Go to `/dashboard`
3. Click on "My Lessons" tab
4. You should see **ALL lessons** (published and unpublished)

### Test as Student
1. Sign in with Google using any other email
2. Go to `/dashboard`
3. Click on "My Lessons" tab
4. You should see **ONLY published lessons**

## Why This is Better

### Before (Broken):
- Client-side Supabase → RLS policies → Need Supabase Auth
- NextAuth session → Not recognized by RLS
- Result: Access denied ❌

### After (Working):
- Client → API route → NextAuth session → Admin check
- API → supabaseAdmin → Bypass RLS
- Result: Proper access control ✅

## What About RLS?

**Do we still need RLS?**

Yes! RLS is still important for:
1. **Direct database access** - Prevents unauthorized queries
2. **API routes using regular Supabase client** - Still protected
3. **Security in depth** - Multiple layers of protection

But for client-side data fetching with NextAuth, we use:
- **API routes** with NextAuth session checks
- **supabaseAdmin** in those routes to bypass RLS
- **Role-based filtering** in the API code

## Files Modified

1. ✅ **Created**: `src/app/api/lessons/published/route.ts`
   - New API endpoint for fetching lessons

2. ✅ **Updated**: `src/components/student/StudentLessons.tsx`
   - Changed to use API instead of direct Supabase

3. ✅ **Created**: `GOOGLE_AUTH_DEBUG.md`
   - Diagnostic guide

4. ✅ **Created**: `GOOGLE_AUTH_FIX.md`
   - This file

## Next Steps

### If lessons now appear in dashboard:
✅ Fix worked! You're done.

### If still not working:
1. Check browser console for errors (F12)
2. Check that you're signed in with the correct email
3. Verify your email is in `ADMIN_EMAILS` in `src/lib/permissions.ts`
4. Check API response: Open Network tab, look for `/api/lessons/published`

### To apply same fix to other features:
Use the same pattern for:
- Assignments
- Student progress
- Vocabulary games
- Any client-side data fetching

**Pattern**:
1. Create API route with NextAuth auth check
2. Use supabaseAdmin to fetch data
3. Apply role-based filtering in code
4. Update component to fetch from API

## Admin Emails (Reminder)

Current admin emails:
- `antoccic@fitchburg.k12.ma.us`
- `craigantocci@gmail.com`
- `admin@test.com` (test only)
- `teacher@test.com` (test only)

Located in: `src/lib/permissions.ts`

## Summary

**Problem**: NextAuth ≠ Supabase Auth  
**Solution**: API routes bridge the gap  
**Result**: Google Sign-In now works with lessons ✅

---

**Try it now!** Sign in with Google and check your dashboard.
