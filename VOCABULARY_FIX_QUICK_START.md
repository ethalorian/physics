# Vocabulary Games Fix - Quick Start

## The Problem
✅ Tables exist but missing `published` column  
❌ Publish/unpublish doesn't persist

## The Solution
Run this migration: `fix_vocabulary_tables_add_published.sql`

## How to Fix (2 minutes)

### Supabase Dashboard Method
1. Open Supabase Dashboard → **SQL Editor**
2. Copy **ALL** content from:
   ```
   supabase/migrations/fix_vocabulary_tables_add_published.sql
   ```
3. Paste into SQL Editor
4. Click **RUN**
5. ✅ Look for: "✅ Published column exists in vocabulary_sets"

### CLI Method
```bash
cd /Users/craigantocci/Desktop/Physics/physics-classroom
supabase db push
```

## Verify It Worked

Run this query in SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vocabulary_sets' 
  AND column_name = 'published';
```

Should return:
```
column_name | data_type
published   | boolean
```

## Test It Works

1. Go to your app → Admin → Vocabulary Management
2. Click "Publish" on any vocabulary set
3. **Refresh the page** (F5 or Cmd+R)
4. ✅ Vocabulary set should STILL be published

## What This Migration Does

✅ Adds `published` column to `vocabulary_sets`  
✅ Adds performance indexes  
✅ Sets up Row Level Security (RLS) policies  
✅ Adds auto-update triggers  
✅ Preserves all existing data

## If Something Goes Wrong

### Error: "column already exists"
**Good news!** The column is already there. Just verify it works by testing above.

### Still not persisting?
1. Check browser console for errors
2. Verify you're logged in as admin/teacher
3. Clear browser cache: `localStorage.clear()` in console
4. Check Supabase logs in dashboard

### Students can't see published sets?
Run this to check RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'vocabulary_sets';
```

Should return 2+ policies.

## Need More Help?

See detailed documentation:
- `VOCABULARY_FIX_SUMMARY.md` - Full explanation
- `docs/VOCABULARY_DATABASE_FIX.md` - Complete guide

## Quick Rollback (if needed)

If something goes wrong, rollback with:
```sql
ALTER TABLE vocabulary_sets DROP COLUMN IF EXISTS published;
```

Then try the migration again.

---

**That's it!** After running the migration, your vocabulary games will properly persist their published state. 🎉

