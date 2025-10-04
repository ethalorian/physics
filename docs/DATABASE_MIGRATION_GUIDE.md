# 📦 Database Migration Guide: localStorage → Supabase

## Overview

This guide walks you through migrating your assignments system from browser localStorage to Supabase PostgreSQL database.

**Benefits of migration:**
- ✅ Data persists across devices
- ✅ No storage quota limits
- ✅ Better data integrity
- ✅ Multi-user support
- ✅ Real-time capabilities
- ✅ Backup and recovery

---

## ⚠️ Before You Start

### Prerequisites

1. **Supabase Project** - You should already have a Supabase project set up
2. **Environment Variables** - Verify these are in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Backup Your Data** - Save your localStorage before migrating

### Backup localStorage (Important!)

Open browser console and run:
```javascript
// Backup assignments
const assignments = localStorage.getItem('physics-assignments')
console.log('Assignments backup:', assignments)
// Copy this output and save it

// Backup submissions  
const submissions = localStorage.getItem('physics-submissions')
console.log('Submissions backup:', submissions)
// Copy this output and save it
```

---

## 📋 Migration Steps

### Step 1: Run Database Migration

Create the database tables in Supabase.

**Option A: Using Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of:
   ```
   supabase/migrations/create_assignments_tables.sql
   ```
5. Paste into the SQL Editor
6. Click **Run**
7. Verify tables created (check "Table Editor" section)

**Option B: Using Supabase CLI**

```bash
cd physics-classroom

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push

# Or run specific migration
psql $DATABASE_URL -f supabase/migrations/create_assignments_tables.sql
```

**Verify Tables Created:**

Check that these tables exist:
- ✅ `assignments`
- ✅ `submissions`

And these indexes:
- ✅ `idx_assignments_created_by`
- ✅ `idx_submissions_assignment_id`
- ✅ ... (see migration file for full list)

---

### Step 2: Update Application Code

Replace the old context with the new Supabase-powered one.

**A. Backup old context (just in case):**
```bash
cp src/contexts/AssignmentContext.tsx src/contexts/AssignmentContext-old.tsx
```

**B. Replace with new context:**
```bash
cp src/contexts/AssignmentContext-new.tsx src/contexts/AssignmentContext.tsx
```

**C. Verify imports still work:**

The new context maintains the same interface, so existing code should work without changes:
```typescript
const {
  assignments,
  submissions,
  createAssignment,
  saveSubmission,
  // ... all the same functions
} = useAssignments()
```

---

### Step 3: Migrate Existing Data

Transfer your localStorage data to Supabase.

**Option A: Using Browser Console (Recommended for Development)**

1. Open your app in the browser
2. Log in as admin/teacher
3. Open browser console (F12)
4. Import the migration script:
   ```html
   <script type="module" src="/scripts/migrate-to-database.ts"></script>
   ```
5. Run migration:
   ```javascript
   // Replace with your email
   await window.migrateToDatabase('your-email@example.com')
   ```
6. Check the console output for results

**Option B: Manual Migration (For Small Datasets)**

1. Export from localStorage:
   ```javascript
   const assignments = JSON.parse(localStorage.getItem('physics-assignments') || '[]')
   const submissions = JSON.parse(localStorage.getItem('physics-submissions') || '[]')
   ```

2. For each assignment, use the API:
   ```javascript
   for (const assignment of assignments) {
     await fetch('/api/assignments', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(assignment)
     })
   }
   ```

3. For each submission:
   ```javascript
   for (const submission of submissions) {
     await fetch('/api/submissions', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(submission)
     })
   }
   ```

---

### Step 4: Verify Migration

**A. Check Supabase Dashboard**

1. Go to **Table Editor** → `assignments`
2. Verify all your assignments are there
3. Check **Table Editor** → `submissions`
4. Verify all submissions are present

**B. Test in Application**

1. Restart your development server
2. Log in to the application
3. Navigate to **Admin → Assignments**
4. Verify assignments are visible
5. Try creating a new assignment
6. Try editing an existing assignment
7. As a student, take an assignment
8. Submit and verify submission is saved

**C. Verify API Endpoints**

Test each endpoint:

```bash
# Get assignments (replace with your auth token)
curl http://localhost:3000/api/assignments \
  -H "Cookie: your-session-cookie"

# Get submissions
curl http://localhost:3000/api/submissions \
  -H "Cookie: your-session-cookie"
```

---

### Step 5: Clean Up (Optional)

Once you've verified everything works:

**A. Clear localStorage (Optional)**

```javascript
// Only do this after verifying data in database!
localStorage.removeItem('physics-assignments')
localStorage.removeItem('physics-submissions')
```

**B. Remove old context file**

```bash
rm src/contexts/AssignmentContext-old.tsx
```

**C. Remove migration script (keep for reference)**

```bash
# Optional - you might want to keep this for future migrations
# rm scripts/migrate-to-database.ts
```

---

## 🔍 Troubleshooting

### Migration Script Errors

**Error: "Failed to migrate assignment: duplicate key"**

This means the assignment already exists in the database.

Solution:
```javascript
// Skip already migrated items
const { data: existing } = await supabase
  .from('assignments')
  .select('id')
  .eq('id', assignment.id)
  .single()

if (!existing) {
  // Only insert if doesn't exist
  await supabase.from('assignments').insert(assignment)
}
```

### API Errors

**Error: "Unauthorized"**

- Check that you're logged in
- Verify session is valid
- Check auth configuration in `/api/auth/[...nextauth]/route.ts`

**Error: "Forbidden: Only teachers/admins can create"**

- Verify your email is in the admin/teacher list
- Check `src/lib/permissions.ts`

**Error: "Failed to fetch assignments"**

- Check Supabase URL and keys in `.env.local`
- Verify tables exist in Supabase
- Check browser console for CORS errors

### Database Errors

**Error: "relation 'assignments' does not exist"**

- Run the migration SQL again
- Check Supabase dashboard → SQL Editor for errors

**Error: "column 'lesson_id' references nonexistent table"**

- Make sure lessons table exists (from lessons migration)
- Or modify the migration to make lesson_id not a foreign key

### Application Errors

**Error: "Assignment not showing up"**

- Check `published` is true
- Verify user permissions
- Check browser console for errors
- Refresh the page

**Error: "Can't save submission"**

- Check user is logged in
- Verify assignment exists
- Check browser console for API errors

---

## 🔄 Rolling Back

If something goes wrong, you can rollback:

### Option 1: Restore from localStorage Backup

```javascript
// Restore assignments
localStorage.setItem('physics-assignments', yourBackupString)

// Restore submissions
localStorage.setItem('physics-submissions', yourBackupString)

// Revert to old context
cp src/contexts/AssignmentContext-old.tsx src/contexts/AssignmentContext.tsx
```

### Option 2: Drop and Recreate Tables

```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;

-- Then run the migration again
```

### Option 3: Keep Both Systems

You can temporarily keep both localStorage AND database:

1. Don't delete localStorage data
2. Use new database context
3. Old data remains as backup
4. Verify for a week, then clean up

---

## 📊 Migration Checklist

Use this checklist to track your progress:

### Pre-Migration
- [ ] Supabase project created
- [ ] Environment variables set
- [ ] localStorage data backed up
- [ ] Database migration file reviewed

### Migration
- [ ] Database tables created
- [ ] Tables verified in Supabase dashboard
- [ ] Application code updated
- [ ] Data migration script prepared

### Data Transfer
- [ ] Assignments migrated (X/X successful)
- [ ] Submissions migrated (X/X successful)
- [ ] Migration errors resolved

### Verification
- [ ] Assignments visible in app
- [ ] Can create new assignment
- [ ] Can edit existing assignment
- [ ] Can delete assignment
- [ ] Student can take assignment
- [ ] Student can submit assignment
- [ ] Submissions visible to teacher
- [ ] API endpoints working

### Post-Migration
- [ ] Data verified in Supabase
- [ ] Application tested thoroughly
- [ ] localStorage cleared (optional)
- [ ] Old files removed
- [ ] Team notified of change

---

## 📈 What Changed

### New Database Schema

**assignments table:**
- Stores assignment metadata and questions JSONB
- Foreign key to lessons (optional)
- Indexes for fast queries
- Auto-updating timestamps

**submissions table:**
- Stores student answers as JSONB
- Foreign key to assignments (cascade delete)
- Unique constraint: one submission per student per assignment
- Tracks grading status

### New API Routes

**GET /api/assignments**
- Fetch all assignments
- Filter by published, lesson
- Include statistics (optional)

**POST /api/assignments**
- Create new assignment
- Auto-calculates total_points

**PUT /api/assignments**
- Update assignment
- Recalculates points if questions changed

**DELETE /api/assignments**
- Delete assignment
- Cascade deletes submissions

**GET/POST/PUT/DELETE /api/submissions**
- Full CRUD for submissions
- Upsert support (POST creates or updates)

### Updated Context

**AssignmentContext now:**
- Fetches from API instead of localStorage
- Returns Promises for all mutations
- Includes error state
- Auto-refreshes on mount
- Maintains same interface for compatibility

---

## 💡 Best Practices Post-Migration

### 1. Regular Backups

Set up automatic backups in Supabase:
- Go to **Settings** → **Backups**
- Enable daily backups
- Keep at least 7 days

### 2. Monitor Database Size

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Optimize Queries

Use the statistics endpoint for dashboards:
```typescript
// Instead of fetching all assignments
const response = await fetch('/api/assignments?include_stats=true')
```

### 4. Index Optimization

Monitor slow queries in Supabase dashboard and add indexes as needed.

### 5. Clean Up Old Data

Periodically remove old submissions:
```sql
-- Remove submissions older than 1 year
DELETE FROM submissions 
WHERE created_at < NOW() - INTERVAL '1 year'
AND status != 'graded';
```

---

## 🚀 Next Steps

After successful migration:

1. **Enable Row Level Security (RLS)** - For production
2. **Set up replication** - For high availability
3. **Add database triggers** - For audit logs
4. **Implement caching** - Using React Query or SWR
5. **Add real-time features** - Using Supabase subscriptions

See `ASSIGNMENTS_SYSTEM_GUIDE.md` for more enhancement ideas.

---

## 📞 Getting Help

If you encounter issues:

1. **Check Supabase Logs**
   - Dashboard → Logs → API Logs
   - Look for errors related to assignments/submissions

2. **Check Application Logs**
   - Browser console
   - Next.js server logs

3. **Verify Permissions**
   - Check your user role in permissions.ts
   - Verify API auth is working

4. **Review Documentation**
   - ASSIGNMENTS_SYSTEM_GUIDE.md
   - Supabase documentation

---

**Last Updated:** January 2025
**Migration Version:** 1.0

