# Vocabulary Student Access Fix

## Problem Found

Students couldn't see published vocabulary sets because:

1. ❌ The API route used `supabaseAdmin` which bypasses RLS policies
2. ❌ The API didn't filter vocabulary sets by `published` status for students
3. ❌ Students were getting ALL vocabulary sets (or none if RLS blocked them)

## Solution Applied

Fixed `src/app/api/vocabulary/route.ts` to:

✅ Check user role (student vs admin/teacher)  
✅ Filter query: Students only get `published = true` sets  
✅ Admin/Teachers get all vocabulary sets  
✅ Block students from accessing unpublished sets by ID

## How to Test

### Step 1: Verify Vocabulary Sets Are Published

**In Supabase SQL Editor**, run:
```sql
SELECT id, name, published, unit_id 
FROM vocabulary_sets 
ORDER BY created_at DESC;
```

**Expected**: You should see your vocabulary sets with `published = true` or `false`

**If all show `false`**: You need to manually publish them:
```sql
-- Replace 'YOUR_SET_ID' with actual set ID from above query
UPDATE vocabulary_sets 
SET published = true 
WHERE id = 'YOUR_SET_ID';
```

Or use the admin UI to publish them.

### Step 2: Test as Admin/Teacher

1. Log in as admin/teacher (your email: `antoccic@fitchburg.k12.ma.us`)
2. Go to **Admin → Vocabulary Management**
3. You should see **ALL** vocabulary sets (published and unpublished)
4. Click "Publish" on at least one vocabulary set
5. Verify it shows as published

### Step 3: Test as Student

**Option A: Using Student Account**
1. Log in as a student
2. Go to `/vocabulary` (Vocabulary Games page)
3. ✅ You should ONLY see published vocabulary sets
4. ❌ You should NOT see unpublished vocabulary sets

**Option B: Using Browser Console (Quick Test)**
1. While logged in as student, open browser console (F12)
2. Run:
```javascript
fetch('/api/vocabulary')
  .then(r => r.json())
  .then(data => {
    console.log('Vocabulary Sets:', data);
    console.log('Count:', data.length);
    console.log('All published?', data.every(s => s.published));
  });
```
3. ✅ All returned sets should have `published: true`
4. ✅ Count should match number of published sets

### Step 4: Test Student View Mode (If Available)

If your app has a "Student View" mode for teachers:
1. Log in as admin/teacher
2. Enable "Student View" mode
3. Navigate to `/vocabulary`
4. ✅ Should only see published vocabulary sets

## Diagnostic Queries

### Check Published Status
```sql
-- Count vocabulary sets by published status
SELECT 
  published,
  COUNT(*) as count
FROM vocabulary_sets
GROUP BY published;
```

### See Which Sets Students Can Access
```sql
-- Show only published vocabulary sets (what students see)
SELECT 
  vs.id,
  vs.name,
  vs.published,
  vs.unit_id,
  COUNT(vt.id) as term_count
FROM vocabulary_sets vs
LEFT JOIN vocabulary_terms vt ON vt.vocabulary_set_id = vs.id
WHERE vs.published = true
GROUP BY vs.id, vs.name, vs.published, vs.unit_id
ORDER BY vs.created_at DESC;
```

### Check RLS Policies (Should exist but not being used by API)
```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'vocabulary_sets';
```

## Common Issues

### Issue 1: Students Still Can't See Any Sets

**Possible Causes**:
- No vocabulary sets are published
- Student is not logged in
- Student doesn't have proper session

**Solution**:
1. Verify at least one set is published (see Step 1 above)
2. Check student is logged in: Check Network tab → `/api/vocabulary` → should return 200, not 401
3. Try logging out and back in

### Issue 2: Students See Unpublished Sets

**Cause**: Code changes not deployed

**Solution**:
1. Restart your development server: `npm run dev`
2. Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`
3. Clear browser cache

### Issue 3: No Vocabulary Sets Exist

**Solution**:
Create a test vocabulary set:
1. Go to Admin → Vocabulary Management
2. Click "Create New Set"
3. Add name, description, and at least one term
4. Save
5. Click "Publish"

Or run this SQL:
```sql
-- Create a test vocabulary set
INSERT INTO vocabulary_sets (name, description, unit_id, published, created_by)
VALUES (
  'Test Vocabulary Set',
  'Sample vocabulary for testing',
  'unit-1',
  true,
  'antoccic@fitchburg.k12.ma.us'
)
RETURNING id;

-- Add a sample term (replace YOUR_SET_ID with ID from above)
INSERT INTO vocabulary_terms (vocabulary_set_id, term, definition, difficulty)
VALUES (
  'YOUR_SET_ID_HERE',
  'Velocity',
  'The rate of change of position with respect to time',
  'easy'
);
```

## Verification Checklist

After applying the fix, verify:

- [ ] Vocabulary sets exist in database
- [ ] At least one vocabulary set has `published = true`
- [ ] Admin/Teacher can see all vocabulary sets
- [ ] Student can ONLY see published vocabulary sets
- [ ] Student cannot see unpublished vocabulary sets
- [ ] API returns proper data: `GET /api/vocabulary`

## What Changed in the Code

### Before (Broken)
```typescript
// API returned ALL vocabulary sets to everyone
const { data: vocabularySets } = await supabaseAdmin
  .from('vocabulary_sets')
  .select('*')
```

### After (Fixed)
```typescript
// API filters based on user role
const userRole = getUserRole(session.user?.email)
const isStudent = userRole === 'student'

let query = supabaseAdmin.from('vocabulary_sets').select('*')

// Students only see published sets
if (isStudent) {
  query = query.eq('published', true)
}

const { data: vocabularySets } = await query
```

## Need More Help?

1. **Check browser console** for errors
2. **Check Network tab** in DevTools:
   - Look for `/api/vocabulary` request
   - Check response body
   - Verify status code is 200
3. **Check Supabase logs** in dashboard for database errors
4. **Run diagnostic queries** above to verify data state

## Summary

The fix ensures:
- ✅ Students only see vocabulary sets where `published = true`
- ✅ Admin/Teachers see all vocabulary sets
- ✅ Proper separation of concerns
- ✅ Security through role-based filtering
- ✅ No changes needed to RLS policies (API handles filtering)

