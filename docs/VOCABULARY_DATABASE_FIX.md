# Vocabulary Games Database Fix

## Problem

Vocabulary games were not persisting their published state to the database. When you published a vocabulary set and refreshed the page, it would revert to being unpublished.

## Root Cause

The `vocabulary_sets` and `vocabulary_terms` tables were never created in the Supabase database. The application code was trying to write to these tables, but when the database operations failed, it fell back to localStorage. 

When the page refreshed, the flow was:
1. Try to fetch from database → fails (tables don't exist)
2. Return empty array from API
3. Fall back to localStorage
4. Load old data from localStorage without the published state changes

## Solution

Created a new database migration to add the missing tables: `create_vocabulary_tables.sql`

### What the Migration Creates

#### Tables

**vocabulary_sets**
- Stores collections of vocabulary terms
- Fields: `id`, `name`, `description`, `unit_id`, `lesson_id`, `published`, `created_by`, `created_at`, `updated_at`

**vocabulary_terms**
- Individual vocabulary terms within sets
- Fields: `id`, `vocabulary_set_id`, `term`, `definition`, `category`, `difficulty`, `order_index`, `created_at`, `updated_at`

#### Features

- **Indexes** for optimized queries on common fields
- **Foreign key constraints** with CASCADE delete
- **Auto-updating timestamps** via triggers
- **Row Level Security (RLS)** policies:
  - Admin/Teachers: Full CRUD access
  - Students: Read-only access to published sets

## How to Apply the Fix

### Step 1: Run the Migration

You have several options:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/create_vocabulary_tables.sql`
4. Paste and run the SQL

#### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or run the specific migration
supabase migration up
```

#### Option C: Manual SQL Execution
1. Connect to your Supabase database using your preferred SQL client
2. Execute the migration file: `supabase/migrations/create_vocabulary_tables.sql`

### Step 2: Verify the Migration

Run the verification script to ensure tables were created correctly:

```bash
# In Supabase SQL Editor, run:
supabase/scripts/migrate-vocabulary-to-database.sql
```

This will show you:
- ✅ Tables exist with correct columns
- ✅ RLS policies are in place
- ✅ Current vocabulary set count

### Step 3: Migrate Existing Data (If Any)

If you have vocabulary sets stored in localStorage that you want to preserve:

#### Option A: Manual Migration
1. Open your browser's Developer Tools (F12)
2. Go to Console tab
3. Run this code to export localStorage data:

```javascript
// Export vocabulary sets from localStorage
const sets = JSON.parse(localStorage.getItem('physics-vocabulary-sets') || '[]');
console.log(JSON.stringify(sets, null, 2));
```

4. Copy the output
5. Use the admin interface to recreate the vocabulary sets

#### Option B: Automatic Migration (Recommended)
The application will automatically handle this:
1. When you first load the app after the migration, if the database is empty but localStorage has data
2. The VocabularyContext will detect this and offer to migrate
3. Or you can manually trigger re-creation of sets through the admin interface

### Step 4: Test the Fix

1. **Publish a vocabulary set**:
   - Go to Admin → Vocabulary Management
   - Toggle a vocabulary set to "Published"
   - ✅ Should see success confirmation

2. **Verify persistence**:
   - Refresh the page (F5 or Cmd+R)
   - ✅ Vocabulary set should still be published

3. **Check student view**:
   - Log in as a student (or use student view mode)
   - ✅ Should only see published vocabulary sets
   - ✅ Should NOT see unpublished sets

## Technical Details

### API Route Changes
No changes needed! The API route (`src/app/api/vocabulary/route.ts`) was already correctly trying to write to the database. It was just missing the tables.

### Context Behavior
The `VocabularyContext.tsx` has fallback logic:
- **Primary**: Fetch from database via API
- **Fallback**: Use localStorage if API fails
- **Now**: Database will work, so localStorage is only for offline support

### Row Level Security
The RLS policies ensure:
- **Admin/Teachers** (your emails): Full CRUD on all vocabulary sets
- **Students**: Can only SELECT published vocabulary sets
- **Anonymous**: No access

### Database Schema

```sql
-- Simplified schema overview
vocabulary_sets (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  unit_id TEXT,
  lesson_id TEXT,
  published BOOLEAN DEFAULT FALSE, -- ← This is the key field!
  created_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

vocabulary_terms (
  id UUID PRIMARY KEY,
  vocabulary_set_id UUID REFERENCES vocabulary_sets(id) ON DELETE CASCADE,
  term TEXT,
  definition TEXT,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Common Issues and Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Tables might already exist. Check by running:
```sql
SELECT * FROM vocabulary_sets LIMIT 1;
```

If tables exist but published field is missing:
```sql
ALTER TABLE vocabulary_sets ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;
```

### Issue: Published state still not persisting
**Possible causes**:
1. Check browser console for API errors
2. Verify RLS policies with: `SELECT * FROM pg_policies WHERE tablename = 'vocabulary_sets'`
3. Check if your email is in the admin list in the RLS policy
4. Clear browser cache and localStorage: `localStorage.clear()`

### Issue: Students can't see published vocabulary sets
**Solution**: Check RLS policy for students:
```sql
-- This should return the student read policy
SELECT * FROM pg_policies 
WHERE tablename = 'vocabulary_sets' 
  AND policyname LIKE '%student%';
```

If missing, the migration didn't complete. Re-run the RLS section.

### Issue: Can't create new vocabulary sets
**Possible causes**:
1. Check authentication: Are you logged in?
2. Check permissions: Is your email in the admin/teacher list?
3. Check browser console for detailed error messages

## Verification Checklist

After applying the fix, verify:

- [ ] Tables exist in database
  ```sql
  \dt vocabulary*
  ```

- [ ] Published field exists and has correct type
  ```sql
  \d vocabulary_sets
  ```

- [ ] RLS policies are active
  ```sql
  SELECT * FROM pg_policies WHERE tablename IN ('vocabulary_sets', 'vocabulary_terms');
  ```

- [ ] Can publish/unpublish sets (admin/teacher)
- [ ] Published state persists after page refresh
- [ ] Students see only published sets
- [ ] Students don't see unpublished sets

## Future Enhancements

With the database now properly set up, you can add:

1. **Version history**: Track changes to vocabulary sets over time
2. **Sharing**: Allow teachers to share vocabulary sets with each other
3. **Analytics**: Track which terms students struggle with most
4. **Bulk operations**: Import/export vocabulary sets more reliably
5. **Real-time updates**: Use Supabase real-time to sync changes across users

## Related Files

- **Migration**: `supabase/migrations/create_vocabulary_tables.sql`
- **Verification**: `scripts/migrate-vocabulary-to-database.sql`
- **API Routes**: `src/app/api/vocabulary/route.ts`
- **Context**: `src/contexts/VocabularyContext.tsx`
- **Management UI**: `src/components/vocabulary/VocabularySetManager.tsx`

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Check Supabase logs in the dashboard
3. Run the verification SQL script
4. Check that your authentication is working
5. Verify your email is in the admin list in the RLS policies

