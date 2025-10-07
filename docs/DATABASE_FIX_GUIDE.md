# 🔧 Database Fix Guide - Resolve All 500 Errors

## Problem Summary
You're seeing `TypeError: fetch failed` errors for these endpoints:
- `/api/assignments/lessons` ❌
- `/api/student-activity/summary` ❌
- `/api/student-activity` ❌
- `/api/assignments/homework` ❌
- `/api/assignment-submissions` ❌
- `/api/question-bank` ⚠️ (fallback to empty)
- `/api/vocabulary` ⚠️ (fallback to localStorage)

**Root Cause**: Database tables don't exist yet!

## ✅ Solution: Run Complete Database Migration

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/lknifmjxelphrkwddnpw
2. Click **SQL Editor** in the left sidebar
3. Click **"New Query"**

### Step 2: Copy & Run the Migration

**Option A: Copy from File**
1. Open file: `supabase/migrations/00_complete_database_setup.sql`
2. Copy entire contents (Cmd/Ctrl + A, then Cmd/Ctrl + C)
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

**Option B: Direct SQL Copy**
See the full SQL in the file `00_complete_database_setup.sql` in the migrations folder.

### Step 3: Verify Tables Were Created

After running the migration, you should see this output in Supabase:

```
✓ update_updated_at_column() function created
✓ units table created
✓ lessons table created
✓ question_bank table created
✓ vocabulary_sets table created
✓ vocabulary_terms table created
✓ student_activity table created
✓ assignment_submissions table created
✓ lesson_progress table created
✓ courses table created
✓ students table created
✓ All indexes created
✓ All triggers created
Database setup completed successfully!
```

### Step 4: Verify in Your App

1. **Restart your dev server** (if needed):
   ```bash
   # Press Ctrl+C to stop the server
   npm run dev
   ```

2. **Refresh your browser**

3. **Check the terminal** - errors should be gone!

## 📋 What the Migration Creates

### Core Tables:
- ✅ `units` - Physics curriculum units
- ✅ `lessons` - Lesson content with videos
- ✅ `question_bank` - Question repository
- ✅ `vocabulary_sets` - Vocabulary collections
- ✅ `vocabulary_terms` - Individual terms
- ✅ `student_activity` - Activity tracking
- ✅ `assignment_submissions` - Assignment submissions
- ✅ `lesson_progress` - Lesson completion
- ✅ `courses` - Google Classroom courses
- ✅ `students` - Student roster

### Performance Features:
- ✅ Comprehensive indexes for fast queries
- ✅ Full-text search on questions
- ✅ Automatic timestamp updates
- ✅ Data validation functions

## 🎯 After Migration Success

Your app will now:
1. ✅ **No more 500 errors** in terminal
2. ✅ **Leaderboard shows data** (once you play games)
3. ✅ **User Progress sheet works** properly
4. ✅ **All database queries succeed**
5. ✅ **Ready for production use**

## 🧪 Test Your Setup

### Test 1: Check Database Connection
1. Open your app in browser
2. Open browser DevTools (F12)
3. Look for console errors - should be clean!

### Test 2: Play a Vocabulary Game
1. Go to `/vocabulary/hangman`
2. Complete a game
3. Open "My Progress" sheet
4. Your score should appear!

### Test 3: Verify Leaderboard
1. Open "My Progress" sheet
2. Leaderboard should show on left side
3. Your name should appear after playing games

## 🚨 Troubleshooting

### Error: "relation does not exist"
**Solution**: The migration didn't run completely. Run it again.

### Error: "permission denied"
**Solution**: Make sure you're logged into the correct Supabase project.

### Tables created but still seeing errors
**Solution**:
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Check `.env.local` has correct Supabase URL

### Migration runs but no output
**Solution**: Scroll down in Supabase SQL Editor - success message is at bottom.

## 📝 Additional Migrations (Optional)

If you need the student progress tracking features (for the gamification system), also run:

```bash
supabase/migrations/create_student_progress_tracking_clean.sql
```

This adds:
- `vocabulary_game_scores` - Game score tracking
- `video_question_responses` - Video Q&A responses
- `gradebook_entries` - Unified gradebook

## ✨ Next Steps

After database setup:
1. **Create sample lessons** (optional)
2. **Import vocabulary sets** (optional)
3. **Test with student accounts**
4. **Deploy to production** when ready

---

## Need Help?

If you still see errors after running the migration:
1. Check Supabase project URL matches `.env.local`
2. Verify migration ran without errors
3. Restart dev server
4. Clear browser cache
5. Check browser console for specific errors
