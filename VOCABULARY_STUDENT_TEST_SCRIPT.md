# Vocabulary Student Test Script

## Copy and Paste This Into Student's Browser Console

Have a student:
1. Log in as a student
2. Go to `/vocabulary` page
3. Open browser console (F12)
4. Paste this entire script and press Enter:

```javascript
// ============================================
// VOCABULARY GAMES DIAGNOSTIC SCRIPT
// ============================================

console.clear();
console.log('🔬 Starting Vocabulary Games Diagnostic...\n');

async function runDiagnostics() {
  try {
    // Test 1: Check Session
    console.log('📝 Test 1: Checking Authentication...');
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    console.log('  ✓ Logged in:', !!session?.user);
    console.log('  ✓ Email:', session?.user?.email);
    console.log('  ✓ User ID:', session?.user?.id);
    
    if (!session?.user) {
      console.error('  ❌ Not logged in! Please log in first.');
      return;
    }
    
    // Test 2: Check API Response
    console.log('\n📡 Test 2: Checking API Response...');
    const vocabRes = await fetch('/api/vocabulary');
    console.log('  ✓ Status:', vocabRes.status);
    
    if (!vocabRes.ok) {
      console.error('  ❌ API returned error:', vocabRes.status);
      const error = await vocabRes.text();
      console.error('  Error details:', error);
      return;
    }
    
    const vocabularySets = await vocabRes.json();
    console.log('  ✓ Total sets returned:', vocabularySets.length);
    
    // Test 3: Check Set Details
    console.log('\n📚 Test 3: Vocabulary Set Details...');
    if (vocabularySets.length === 0) {
      console.error('  ❌ No vocabulary sets returned from API!');
      console.log('  Expected: 3 sets (Motion, Forces, Energy)');
    } else {
      console.log('  ✓ Found', vocabularySets.length, 'vocabulary sets:');
      vocabularySets.forEach((set, i) => {
        console.log(`    ${i + 1}. ${set.name}`);
        console.log(`       - Published: ${set.published}`);
        console.log(`       - Terms: ${set.terms?.length || 0}`);
        console.log(`       - ID: ${set.id}`);
      });
      
      // Check for unpublished sets
      const unpublished = vocabularySets.filter(s => !s.published);
      if (unpublished.length > 0) {
        console.warn('  ⚠️  Found', unpublished.length, 'unpublished sets (students should not see these):');
        unpublished.forEach(s => console.warn('    -', s.name));
      }
    }
    
    // Test 4: Check localStorage
    console.log('\n💾 Test 4: Checking localStorage...');
    const stored = localStorage.getItem('physics-vocabulary-sets');
    const version = localStorage.getItem('physics-vocabulary-version');
    console.log('  ✓ Cache version:', version || 'none');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('  ⚠️  Old cached data found:', parsed.length, 'sets');
      console.log('  Note: This should be cleared automatically');
    } else {
      console.log('  ✓ No cached data (good for students)');
    }
    
    // Test 5: Final Summary
    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Expected: 3 published vocabulary sets');
    console.log('Actually received:', vocabularySets.length, 'sets');
    
    if (vocabularySets.length === 3) {
      const allPublished = vocabularySets.every(s => s.published);
      const allHaveTerms = vocabularySets.every(s => s.terms && s.terms.length > 0);
      
      if (allPublished && allHaveTerms) {
        console.log('✅ SUCCESS! Everything looks correct!');
        console.log('   Students should see vocabulary games.');
      } else if (!allPublished) {
        console.error('❌ PROBLEM: Some sets are not marked as published');
      } else if (!allHaveTerms) {
        console.error('❌ PROBLEM: Some sets have no terms');
      }
    } else {
      console.error('❌ PROBLEM: Wrong number of vocabulary sets');
      console.error('   API is not returning the correct data');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Return data for further inspection
    return {
      session,
      vocabularySets,
      cachedData: stored ? JSON.parse(stored) : null
    };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run the diagnostics
const results = await runDiagnostics();
console.log('\n💡 Tip: Results saved to "results" variable');
console.log('   Type "results" to inspect the data');
results;
```

## What to Look For in the Output

The script will show one of these results:

### ✅ SUCCESS Case:
```
Expected: 3 published vocabulary sets
Actually received: 3 sets
✅ SUCCESS! Everything looks correct!
```
→ **If this shows**, the problem is something else (maybe UI issue)

### ❌ PROBLEM Case 1:
```
Expected: 3 published vocabulary sets
Actually received: 0 sets
❌ PROBLEM: Wrong number of vocabulary sets
```
→ **This means the API is not returning data** (API filtering issue or code not deployed)

### ❌ PROBLEM Case 2:
```
Expected: 3 published vocabulary sets
Actually received: 3 sets
❌ PROBLEM: Some sets are not marked as published
```
→ **This means API returning unpublished sets** (API not filtering correctly)

## Quick Fixes Based on Results

### If "Actually received: 0 sets"
**Problem**: API not returning data to students

**Fix**: You need to **restart your development server** or **redeploy** the code changes we made:
```bash
# Stop the server (Ctrl+C) then:
npm run dev
```

### If "Some sets are not marked as published"
**Problem**: API not filtering correctly

**Check**: Did you save and deploy the API route changes to `src/app/api/vocabulary/route.ts`?

### If "SUCCESS" but students still can't see games
**Problem**: UI/React issue

**Fix**: Have student run:
```javascript
localStorage.clear();
location.reload();
```

---

Run this script with a student and **copy/paste the entire console output** here so I can see exactly what's happening!

