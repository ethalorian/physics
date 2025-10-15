# Global Assignment Hub - Quick Start Guide

## What Is This?

The **Global Assignment Hub** is your new unified control center for managing ALL assignments in your Physics Classroom:

- ✅ **Lessons** - Reading and video assignments
- ✅ **Homework** - Question-based assignments
- ✅ **Vocabulary** - Vocabulary sets and games
- ✅ **Simulations** - Interactive physics simulations

**One place. All assignments. Complete tracking.**

---

## Quick Setup (5 Minutes)

### Step 1: Run the Database Migration

```bash
# From your project root, run:
npm run supabase migration up create_unified_assignment_hub
```

Or manually in Supabase SQL Editor:
```sql
-- Copy and run the contents of:
-- supabase/migrations/create_unified_assignment_hub.sql
```

### Step 2: Access the Hub

Navigate to: **`/admin/assignment-hub`**

(Only visible to teachers and administrators)

### Step 3: Create Your First Assignment

1. Click **"Create Assignment"** button
2. **Step 1**: Choose assignment type and select content
3. **Step 2**: Choose target (course or specific students)
4. **Step 3**: Set due date and configuration
5. Click **"Create Assignment"** - Done!

---

## Your New Dashboard

### 📊 Overview Tab
- See total assignments, grading queue, overdue count
- Quick-create buttons for each assignment type
- Upcoming due dates and recent activity
- Course performance at a glance

### 📝 All Assignments Tab
- Complete list of all assignments
- Search and filter by type
- Sort by due date, created date, or title
- Quick actions: view, edit, delete

### ⚠️ Needs Attention Tab
- Submissions waiting for grading
- Overdue assignments
- Flagged students

### 📈 Analytics Tab
- Assignment type distribution (pie chart)
- Course completion rates (bar chart)
- Action items summary
- Recent activity metrics

---

## Key Features at a Glance

### Unified Creation
✨ **One Wizard for All Types**
- Select content from any type
- Consistent interface
- Auto-populated titles
- Custom instructions

### Flexible Targeting
🎯 **Assign Your Way**
- Entire Google Classroom courses
- Individual students
- Mix and match as needed

### Smart Tracking
📊 **Auto-Calculate Everything**
- Completion rates
- Average scores
- Time spent
- Overdue detection

### Rich Analytics
📈 **Data-Driven Insights**
- Visual charts and graphs
- Course comparisons
- Student engagement metrics
- Action item alerts

---

## Common Tasks

### Assign a Lesson to a Course

1. Click **"Create Assignment"**
2. Select **"Lesson"** type
3. Choose your lesson from dropdown
4. Select target course
5. Set due date
6. Click **"Create Assignment"**

⏱️ Takes: ~30 seconds

### Grade Submissions

1. Go to **"Needs Attention"** tab
2. Click assignment with submissions
3. View student work
4. Enter scores and feedback
5. Save grades

### Monitor Progress

- **Overview tab** shows key metrics
- **All Assignments** shows completion bars
- **Analytics tab** shows detailed charts
- Click any assignment to see student-by-student breakdown

### Track Overdue Students

1. Go to **"Needs Attention"** tab
2. See overdue assignments highlighted in red
3. Click to view which students are behind
4. Contact students or provide extensions

---

## Database Tables Created

The migration creates these tables:

1. **`unified_assignments`** - Main assignment records
2. **`student_assignment_progress`** - Individual student tracking
3. **`assignment_tags`** - Organization/filtering
4. **`assignment_comments`** - Teacher-student communication

Plus automatic triggers for:
- Creating student records when assignments are published
- Calculating analytics automatically
- Detecting overdue assignments

---

## API Endpoints Available

### Main Assignment API
- `GET /api/unified-assignments` - List with filters
- `POST /api/unified-assignments` - Create new
- `PUT /api/unified-assignments` - Update existing
- `DELETE /api/unified-assignments` - Remove

### Progress Tracking API
- `GET /api/unified-assignments/progress` - Get progress records
- `PUT /api/unified-assignments/progress` - Update progress
- `POST /api/unified-assignments/progress` - Manual creation

### Analytics API
- `GET /api/unified-assignments/analytics?type=teacher_dashboard`
- `GET /api/unified-assignments/analytics?type=student_dashboard`
- `GET /api/unified-assignments/analytics?type=assignment&assignment_id={id}`

---

## What Each Status Means

| Status | Description |
|--------|-------------|
| **Assigned** | Given to student, not yet opened |
| **Started** | Student has opened it |
| **In Progress** | Student is actively working |
| **Completed** | Student finished (no grading needed) |
| **Submitted** | Waiting for teacher grading |
| **Graded** | Teacher has provided score/feedback |
| **Overdue** | Past due date without completion |
| **Late Submitted** | Submitted after due date |

---

## Tips for Success

### 🎯 Best Practices

1. **Set Clear Due Dates** - Give students adequate time
2. **Use Descriptive Titles** - Make assignments easy to identify
3. **Add Instructions** - Explain what students should do
4. **Check "Needs Attention" Daily** - Stay on top of grading
5. **Review Analytics Weekly** - Identify trends early

### 📊 Monitoring Strategy

**Daily:**
- Check "Needs Attention" tab
- Grade new submissions
- Follow up on overdue students

**Weekly:**
- Review Analytics tab
- Compare course performance
- Adjust upcoming assignments based on data

**Monthly:**
- Export grades
- Review assignment effectiveness
- Plan next unit's assignments

---

## Troubleshooting

### Students Can't See Assignment
✅ Check it's published (not draft)  
✅ Verify due date hasn't passed "closes_at"  
✅ Confirm student is in target course

### Analytics Not Showing
✅ Wait a few seconds after changes  
✅ Refresh the page  
✅ Check that students have progress records

### Can't Create Assignment
✅ Ensure content exists and is published  
✅ Select either course OR specific students  
✅ Check you're logged in as teacher/admin

---

## Next Steps

### For Full Details
📖 Read the complete guide: `docs/GLOBAL_ASSIGNMENT_HUB_GUIDE.md`

### Customize Your Experience
- Add assignment tags for organization
- Use comments for student communication
- Flag students needing extra attention
- Export data for external analysis

### Integration Ideas
- Sync with Google Classroom (coming soon)
- Export to gradebook systems
- Generate progress reports
- Send automated reminders

---

## Support

### Files to Reference
- **Migration**: `supabase/migrations/create_unified_assignment_hub.sql`
- **Types**: `src/types/unified-assignment.ts`
- **Main Component**: `src/components/admin/GlobalAssignmentHub.tsx`
- **API Routes**: `src/app/api/unified-assignments/`

### Your Data Structure

```
unified_assignments (what you assign)
  ├── assignment_type: 'lesson' | 'homework' | 'vocabulary' | 'simulation'
  ├── reference_id: ID of actual content
  ├── course_id: Google Classroom course
  └── Configuration (due date, attempts, scoring, etc.)

student_assignment_progress (student tracking)
  ├── student_id: Who
  ├── status: Where they are
  ├── progress_percentage: How far
  ├── time_spent: How long
  └── scores: How well
```

---

## Summary

You now have a **complete, unified assignment management system** that:

✅ Works with ALL your content types  
✅ Tracks everything automatically  
✅ Provides rich analytics  
✅ Streamlines your grading workflow  
✅ Gives students clear visibility  

**Go to `/admin/assignment-hub` to start using it!**

---

## Key Shortcuts

- **Create Assignment**: Main "Create Assignment" button
- **Quick Create**: Click type-specific buttons in Overview
- **View Progress**: Click assignment → "View Progress"
- **Grade Submissions**: Go to "Needs Attention" tab
- **See Analytics**: Switch to "Analytics" tab

**You're ready to go! 🚀**

