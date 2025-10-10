# Vocabulary Student Access - Debug Steps

## Current Situation
- ✅ Admin/Teacher can see vocabulary sets
- ✅ Admin/Teacher's "Student View" shows vocabulary sets  
- ❌ **Actual students can't see vocabulary sets**

This suggests the API is working, but there's likely a caching or data issue.

## Step 1: Verify Database Has Published Sets

Run this in **Supabase SQL Editor**:

```sql
-- Check if any sets are actually published
SELECT 
  id,
  name,
  published,
  created_at,
  (SELECT COUNT(*) FROM vocabulary_terms WHERE vocabulary_set_id = vocabulary_sets.id) as term_count
FROM vocabulary_sets
ORDER BY created_at DESC;
```

**What to look for:**
- ✅ `published` column should show `true` for at least one set
- ✅ That set should have `term_count > 0`

**If all show `published = false` or `null`:**
```sql
-- Publish all vocabulary sets with terms
UPDATE vocabulary_sets 
SET published = true 
WHERE id IN (
  SELECT DISTINCT vocabulary_set_id 
  FROM vocabulary_terms
);

-- Verify it worked
SELECT name, published FROM vocabulary_sets;
```

## Step 2: Check What API Returns for Students

### Have a Student Test (or use Incognito Mode):

1. **Student logs in** to the app
2. **Open Browser Console** (F12)
3. **Run this code:**

```javascript
// Check what the API returns
fetch('/api/vocabulary')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('=== API Response ===');
    console.log('Total sets returned:', data.length);
    console.log('Sets:', data);
    
    if (data.length === 0) {
      console.error('❌ No vocabulary sets returned!');
    } else {
      console.log('✅ Returned', data.length, 'vocabulary sets');
      data.forEach(set => {
        console.log(`  - ${set.name}: published=${set.published}, terms=${set.terms.length}`);
      });
    }
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });
```

**Expected Output:**
```
Status: 200
Total sets returned: 1 (or more)
✅ Returned 1 vocabulary sets
  - Your Set Name: published=true, terms=5
```

**If you see:**
- ❌ `Total sets returned: 0` → Sets aren't published in database
- ❌ `Status: 401` → Student isn't logged in properly
- ❌ `Status: 500` → Database/API error (check Supabase logs)

## Step 3: Clear Student Cache

Students might have old cached data. Have them:

### Option A: Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### Option B: Clear Storage (More thorough)
1. Open Browser Console (F12)
2. Go to **Application** or **Storage** tab
3. Find **Local Storage** → Your domain
4. Click **Clear All**
5. Refresh the page

### Option C: Clear via Console
```javascript
// Clear localStorage
localStorage.clear();
console.log('✅ Cleared localStorage');

// Reload page
location.reload();
```

## Step 4: Check VocabularyContext Loading

Have student run this **AFTER logging in and going to /vocabulary page**:

```javascript
// Check if vocabulary context is loading
console.log('Current path:', window.location.pathname);
console.log('Should load vocab?', 
  window.location.pathname.includes('/vocabulary') || 
  window.location.pathname.includes('/admin/vocabulary')
);
```

**Expected:** Should print `Should load vocab? true`

## Step 5: Test Student Session

```javascript
// Check if student is logged in
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('=== Session Info ===');
    console.log('Logged in:', !!session?.user);
    console.log('User email:', session?.user?.email);
    console.log('User ID:', session?.user?.id);
  });
```

**Expected:**
```
Logged in: true
User email: student@example.com
User ID: some-uuid
```

## Step 6: Force Refresh in App

If students still can't see sets, try forcing a data refresh:

1. Student goes to `/vocabulary` page
2. Open console, run:
```javascript
// Force reload vocabulary data
window.location.reload(true);
```

## Step 7: Manual Database Publish

If nothing works, manually publish ALL vocabulary sets:

```sql
-- Publish all vocabulary sets
UPDATE vocabulary_sets 
SET published = true;

-- Verify
SELECT name, published, 
  (SELECT COUNT(*) FROM vocabulary_terms WHERE vocabulary_set_id = vocabulary_sets.id) as terms
FROM vocabulary_sets;
```

## Troubleshooting Results

### Scenario A: Database Shows `published = false`
**Problem**: Vocabulary sets aren't actually published  
**Solution**: Run the UPDATE query in Step 1

### Scenario B: API Returns Empty Array
**Problem**: RLS policies or API filtering issue  
**Solution**: 
```sql
-- Temporarily disable RLS to test
ALTER TABLE vocabulary_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_terms DISABLE ROW LEVEL SECURITY;

-- Test, then re-enable
ALTER TABLE vocabulary_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_terms ENABLE ROW LEVEL SECURITY;
```

### Scenario C: Students Get 401 Unauthorized
**Problem**: Students not properly authenticated  
**Solution**: Have students log out and log back in

### Scenario D: Works in Incognito, Not in Regular Browser
**Problem**: Cached localStorage data  
**Solution**: Clear localStorage (Step 3, Option B)

## Quick Fix Command

If you just want to make it work NOW, have students run:

```javascript
// Clear cache and force reload
localStorage.clear();
sessionStorage.clear();
window.location.href = '/vocabulary?nocache=' + Date.now();
```

## What's Different: Student View vs Real Students?

When YOU test in "student view":
- ✅ Your session is active and fresh
- ✅ No cached localStorage data
- ✅ Browser cache is up to date with code changes

When STUDENTS access:
- ❌ May have old localStorage data from before migration
- ❌ May have old API responses cached
- ❌ May need to log out/in to refresh session

## Nuclear Option (If Nothing Else Works)

**Temporarily bypass caching to diagnose:**

Edit `src/contexts/VocabularyContext.tsx` line ~57 to add cache busting:

```typescript
const response = await fetch('/api/vocabulary?t=' + Date.now())
```

This forces a fresh API call every time. Remove after diagnosing.

## Report Back

After trying these steps, report back with:
1. What does the SQL query show? (published = true/false?)
2. What does the student's console show when running the API test?
3. Did clearing cache help?
4. Any errors in browser console?

