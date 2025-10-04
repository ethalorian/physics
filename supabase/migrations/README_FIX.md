# Migration Error Fixes

## You Have Two Options:

### Option 1: Fix Existing Tables (Recommended if you have data)

**Run this file:** `fix_assignments_tables.sql`

This adds the missing columns to your existing tables:
- Adds `created_by` to `assignments`
- Adds `rubric_grades` to `submissions`
- Adds `feedback` to `submissions` (if missing)

**When to use:** If you already ran the migration and have some data, but got errors about missing columns.

---

### Option 2: Fresh Start (Recommended if tables are empty)

**Run this file:** `create_assignments_tables_clean.sql`

This creates clean tables from scratch with all columns included.

**When to use:** If you haven't added any data yet, or you're okay dropping and recreating the tables.

**⚠️ WARNING:** This will delete existing data if you uncomment the DROP statements!

---

## How to Run:

### In Supabase Dashboard:

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy contents of your chosen file
4. Click **Run**
5. Check output for success messages

### Expected Success Output:

```
✓ All columns fixed successfully!
```

Or:

```
Tables created successfully!
```

---

## Verify It Worked:

Run this query to check columns exist:

```sql
-- Check assignments table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'assignments'
ORDER BY ordinal_position;

-- Check submissions table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'submissions'
ORDER BY ordinal_position;
```

You should see:
- ✅ `created_by` in assignments
- ✅ `rubric_grades` in submissions
- ✅ `feedback` in submissions

---

## Still Getting Errors?

If you still see errors after running the fix, try:

1. **Check if tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('assignments', 'submissions');
   ```

2. **Drop and recreate (fresh start):**
   ```sql
   DROP TABLE IF EXISTS submissions CASCADE;
   DROP TABLE IF EXISTS assignments CASCADE;
   ```
   Then run `create_assignments_tables_clean.sql`

3. **Check for typos in your original migration**

---

## Next Steps After Fix:

1. ✅ Verify tables have all columns
2. ✅ Test creating an assignment via API
3. ✅ Update your AssignmentContext
4. ✅ Migrate your data

