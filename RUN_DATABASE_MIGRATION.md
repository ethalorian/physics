# 🚨 ACTION REQUIRED: Database Migration Needed

## You're seeing 500 errors because database tables don't exist!

### Quick Fix (2 minutes):

1. **Open Supabase**: https://supabase.com/dashboard/project/lknifmjxelphrkwddnpw/sql

2. **Click "New Query"**

3. **Copy this file's contents**:
   ```
   supabase/migrations/00_complete_database_setup.sql
   ```

4. **Paste into SQL Editor**

5. **Click RUN** (or press Cmd+Enter)

6. **Wait for "Database setup completed successfully!"**

7. **Refresh your app** - all errors gone! ✅

---

### What's Happening?

Terminal shows these errors:
```
TypeError: fetch failed
- /api/assignments/lessons
- /api/student-activity
- /api/assignments/homework
- /api/assignment-submissions
```

**Why?** The database tables haven't been created yet.

**Fix?** Run the migration SQL file once.

---

### Full Guide

See detailed instructions: `docs/DATABASE_FIX_GUIDE.md`

---

**Status**: 
- ✅ Environment variables configured
- ✅ Supabase connection working
- ❌ **Database tables missing** ← Fix this now!
