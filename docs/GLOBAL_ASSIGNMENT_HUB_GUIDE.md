# Global Assignment Hub - Complete Guide

## Overview

The **Global Assignment Hub** is a unified system for managing ALL types of assignments in your Physics Classroom:

- **Lessons** - Reading assignments and video lessons
- **Homework** - Traditional question-based assignments
- **Vocabulary** - Vocabulary sets and games
- **Simulations** - Interactive physics simulations
- **Simulation Embedded Assignments** - Simulations with embedded questions

This system provides a single interface to create, assign, track, and grade all content types with comprehensive analytics and progress tracking.

---

## Key Features

### 🎯 Unified Assignment Management
- **One place** for all assignment types
- **Consistent interface** across different content
- **Bulk operations** - assign multiple items at once
- **Course and individual student** targeting

### 📊 Comprehensive Tracking
- **Real-time progress** monitoring
- **Automatic analytics** calculation
- **Overdue detection** and alerts
- **Grading workflow** integration

### 📈 Rich Analytics
- **Dashboard overview** with key metrics
- **Course performance** comparisons
- **Assignment type** distribution
- **Student engagement** metrics
- **Completion rates** and trends

### 🎓 Student Experience
- **Unified dashboard** for all assignments
- **Clear status** indicators
- **Due date** management
- **Progress tracking** with percentages

---

## Getting Started

### 1. Database Setup

Run the migration to create the unified assignment tables:

```bash
# Connect to your Supabase project and run:
psql -d your_database -f supabase/migrations/create_unified_assignment_hub.sql
```

This creates the following tables:
- `unified_assignments` - Central assignment records
- `student_assignment_progress` - Individual student progress
- `assignment_tags` - Organization and filtering
- `assignment_comments` - Teacher-student communication

### 2. Access the Hub

Navigate to: **`/admin/assignment-hub`**

Only teachers and administrators can access this interface.

### 3. Create Your First Assignment

Click **"Create Assignment"** and follow the 3-step wizard:

1. **Select Content** - Choose what to assign (lesson, homework, vocabulary, simulation)
2. **Choose Target** - Assign to entire course or specific students  
3. **Configure Settings** - Set due date, attempts, time limits, grading options

---

## Feature Deep Dive

### Assignment Creation Wizard

#### Step 1: Select Content

**Assignment Type Options:**
- **Lesson** - Assign reading material and videos
- **Homework Assignment** - Traditional question sets
- **Vocabulary Set** - Word games and practice
- **Simulation** - Interactive physics tools
- **Simulation (with questions)** - Embedded assessments

**Content Selection:**
- Browse available content of selected type
- Only published content appears
- Auto-populate title and description
- Add custom instructions

#### Step 2: Choose Target

**Course Assignment:**
- Select from your Google Classroom courses
- Automatically creates records for all enrolled students
- Updates automatically when students join/leave course

**Individual Student Assignment:**
- Select specific students from dropdown
- Perfect for differentiation and remediation
- Students only see their own assignments

#### Step 3: Configure Settings

**Scheduling:**
- **Due Date** - When assignment should be completed
- **Available From** - When students can start (default: immediately)
- **Closes At** - Hard deadline (no submissions after)

**Attempt Configuration:**
- **Max Attempts** - How many tries students get (1 = one chance)
- **Allow Late Submission** - Accept work after due date

**Time Management:**
- **Time Limit** - Minutes allowed per attempt (optional)
- Auto-submits when time expires

**Grading:**
- **Max Score** - Points possible (optional, defaults to content value)
- **Weight** - Importance for grade calculation (0-10, default 1.0)

**Publishing:**
- **Draft** - Prepare assignment without showing students
- **Published** - Make immediately visible to assigned students

---

## Teacher Dashboard

### Overview Tab

**Key Metrics Cards:**
- Total Assignments
- Needs Grading Count
- Overdue Assignments
- Recent Activity (24 hours)

**Quick Create:**
- Fast access to assignment creation by type
- Shows active count for each type

**Upcoming Due Dates:**
- Assignments due soon
- Completion progress
- Quick links to view details

**Recent Assignments:**
- Latest created assignments
- Publication status
- Target audience

**Course Performance:**
- Completion rates by course
- Visual progress bars
- Active assignment counts

### All Assignments Tab

**List View Features:**
- **Search** - Find assignments by title or description
- **Filter by Type** - View specific content types
- **Sort Options** - By due date, created date, or title

**Assignment Details:**
- Assignment type icon
- Target course/students
- Due date with status badges
- Progress visualization
- Published/draft status

**Quick Actions:**
- View Details
- View Progress
- Edit Assignment
- Delete Assignment

**Status Badges:**
- **Due Today** - Red badge
- **Due Soon** (3 days) - Orange badge
- **Overdue** - Red destructive badge
- **No due date** - Gray outline

### Needs Attention Tab

Automatically filters to show:
- **Submissions waiting for grading**
- **Overdue assignments** with incomplete students
- **Flagged students** needing follow-up

Perfect for staying on top of what requires your immediate action.

### Analytics Tab

**Visual Analytics:**

1. **Assignment Type Distribution** (Pie Chart)
   - Breakdown by content type
   - Percentage of each type
   - Color-coded visualization

2. **Course Completion Rates** (Bar Chart)
   - Average completion per course
   - Easy comparison across classes
   - Identify struggling courses

**Action Items Card:**
- Grouped by urgency
- Submission count for grading
- Overdue student count
- Flagged students requiring attention

**Recent Activity Summary:**
- Last 24 hours submissions
- Last 24 hours completions
- Engagement tracking

**Course Details:**
- Individual course breakdowns
- Active assignments per course
- Average completion rates
- Progress bars

---

## API Endpoints Reference

### Unified Assignments API

**GET `/api/unified-assignments`**
Query Parameters:
- `assignment_type` - Filter by type
- `course_id` - Filter by course
- `student_id` - Filter by student
- `status` - Filter by status
- `due_before` / `due_after` - Date range
- `search` - Text search
- `include_drafts` - Show unpublished
- `overdue_only` - Only overdue
- `needs_grading` - Only submitted

**POST `/api/unified-assignments`**
Create new unified assignment
Body: `CreateUnifiedAssignmentRequest`

**PUT `/api/unified-assignments`**
Update existing assignment
Body: `{ id, ...updates }`

**DELETE `/api/unified-assignments?id={id}`**
Delete assignment (cascade deletes progress records)

### Progress Tracking API

**GET `/api/unified-assignments/progress`**
Query Parameters:
- `assignment_id` - Specific assignment
- `student_id` - Specific student
- `status` - Filter by status
- `needs_grading` - Only submitted
- `needs_attention` - Flagged students

**PUT `/api/unified-assignments/progress`**
Update student progress
Body: `{ progress_id, ...updates }`

- Students can update: status, progress_percentage, time_spent, submission_data
- Teachers can update: everything including scores, grades, feedback

**POST `/api/unified-assignments/progress`**
Manually create progress record (usually automatic)

### Analytics API

**GET `/api/unified-assignments/analytics`**
Query Parameters:
- `type=assignment` - Specific assignment analytics (requires `assignment_id`)
- `type=teacher_dashboard` - Overall teacher dashboard summary
- `type=student_dashboard` - Student's personal summary

---

## Database Schema

### `unified_assignments` Table

Core assignment record:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `assignment_type` | TEXT | lesson, homework, vocabulary, simulation |
| `reference_id` | TEXT | ID of actual content |
| `title` | TEXT | Assignment title |
| `description` | TEXT | Description (optional) |
| `instructions` | TEXT | Special instructions (optional) |
| `course_id` | TEXT | Google Classroom course ID |
| `assigned_students` | TEXT[] | Array of student IDs |
| `due_date` | TIMESTAMPTZ | When due |
| `closes_at` | TIMESTAMPTZ | Hard deadline |
| `max_attempts` | INTEGER | Attempt limit |
| `time_limit` | INTEGER | Minutes per attempt |
| `allow_late_submission` | BOOLEAN | Accept late work |
| `max_score` | INTEGER | Points possible |
| `weight` | DECIMAL | Grade calculation weight |
| `published` | BOOLEAN | Visible to students |
| `assigned_by` | TEXT | Teacher email |
| `total_assigned` | INTEGER | Auto-calculated |
| `total_started` | INTEGER | Auto-calculated |
| `total_completed` | INTEGER | Auto-calculated |
| `total_submitted` | INTEGER | Auto-calculated |
| `average_score` | DECIMAL | Auto-calculated |
| `average_time_spent` | INTEGER | Auto-calculated |

### `student_assignment_progress` Table

Individual student tracking:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `unified_assignment_id` | UUID | Foreign key |
| `student_id` | TEXT | Student identifier |
| `student_email` | TEXT | Student email |
| `status` | TEXT | assigned, started, in_progress, completed, submitted, graded, overdue, late_submitted |
| `progress_percentage` | INTEGER | 0-100 |
| `started_at` | TIMESTAMPTZ | When first opened |
| `completed_at` | TIMESTAMPTZ | When finished |
| `submitted_at` | TIMESTAMPTZ | When submitted for grading |
| `last_accessed_at` | TIMESTAMPTZ | Most recent access |
| `time_spent` | INTEGER | Total seconds |
| `attempt_number` | INTEGER | Current attempt |
| `attempts_used` | INTEGER | How many attempts taken |
| `score` | DECIMAL | Points earned |
| `max_score` | INTEGER | Points possible |
| `percentage` | DECIMAL | Score percentage |
| `letter_grade` | TEXT | A, B, C, etc. |
| `rubric_scores` | JSONB | Detailed rubric scores |
| `feedback` | TEXT | Teacher comments |
| `submission_data` | JSONB | Flexible data storage |
| `is_late` | BOOLEAN | Submitted after due date |
| `is_excused` | BOOLEAN | Excused from assignment |
| `needs_attention` | BOOLEAN | Flagged by teacher |

### Automatic Triggers

**Student Record Creation:**
When a new assignment is published, the system automatically creates `student_assignment_progress` records for:
- All students in the course (if `course_id` is set)
- Specific students (if `assigned_students` is set)

**Analytics Updates:**
When student progress changes, analytics are automatically recalculated:
- `total_started`, `total_completed`, `total_submitted`
- `average_score`, `average_time_spent`

**Overdue Detection:**
Call `mark_overdue_assignments()` function to update status of assignments past due date.

---

## TypeScript Types

### Core Types

```typescript
// Assignment types that can be assigned
type AssignmentType = 'lesson' | 'homework' | 'vocabulary' | 'simulation' | 'simulation_embedded'

// Student progress statuses
type AssignmentStatus = 
  | 'assigned'       // Initial state
  | 'started'        // Opened by student
  | 'in_progress'    // Actively working
  | 'completed'      // Finished (lessons)
  | 'submitted'      // Submitted for grading
  | 'graded'         // Teacher has graded
  | 'overdue'        // Past due without completion
  | 'late_submitted' // Submitted after due date
```

### Key Interfaces

See `/src/types/unified-assignment.ts` for complete type definitions:

- `UnifiedAssignment` - Main assignment record
- `StudentAssignmentProgress` - Progress tracking
- `CreateUnifiedAssignmentRequest` - Assignment creation
- `UpdateStudentProgressRequest` - Progress updates
- `AssignmentFilters` - Query filtering
- `AssignmentAnalytics` - Analytics data
- `TeacherDashboardSummary` - Dashboard overview
- `StudentDashboardSummary` - Student view

---

## Usage Examples

### Example 1: Assign a Lesson to Entire Course

```typescript
const assignment = await fetch('/api/unified-assignments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assignment_type: 'lesson',
    reference_id: 'lesson-uuid-here',
    title: 'Newton\'s Laws of Motion',
    description: 'Read chapter 2 and watch the video',
    course_id: 'google-classroom-course-id',
    due_date: '2025-01-20T23:59:59Z',
    published: true
  })
})
```

### Example 2: Assign Homework to Specific Students

```typescript
const assignment = await fetch('/api/unified-assignments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assignment_type: 'homework',
    reference_id: 'assignment-uuid-here',
    title: 'Kinematics Problem Set',
    assigned_students: ['student-1-id', 'student-2-id', 'student-3-id'],
    due_date: '2025-01-25T23:59:59Z',
    max_attempts: 2,
    time_limit: 45,
    max_score: 100,
    published: true
  })
})
```

### Example 3: Update Student Progress

```typescript
// Student updates their own progress
const progress = await fetch('/api/unified-assignments/progress', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    progress_id: 'progress-uuid',
    status: 'in_progress',
    progress_percentage: 60,
    time_spent: 1800 // 30 minutes in seconds
  })
})
```

### Example 4: Grade a Submission

```typescript
// Teacher grades submission
const graded = await fetch('/api/unified-assignments/progress', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    progress_id: 'progress-uuid',
    score: 85,
    max_score: 100,
    percentage: 85,
    letter_grade: 'B',
    feedback: 'Good work! Watch significant figures on problem 3.',
    rubric_scores: {
      'understanding': { score: 4, feedback: 'Excellent conceptual understanding' },
      'calculations': { score: 3, feedback: 'Minor calculation error' },
      'units': { score: 4, feedback: 'Units used correctly throughout' }
    }
  })
})
```

### Example 5: Get Teacher Dashboard

```typescript
const dashboard = await fetch('/api/unified-assignments/analytics?type=teacher_dashboard')
const data = await dashboard.json()

console.log(`Total assignments: ${data.total_assignments}`)
console.log(`Needs grading: ${data.needs_grading}`)
console.log(`Overdue: ${data.overdue_count}`)
```

### Example 6: Filter Assignments

```typescript
// Get all overdue homework assignments for a specific course
const assignments = await fetch(
  '/api/unified-assignments?' +
  'assignment_type=homework&' +
  'course_id=google-course-id&' +
  'overdue_only=true'
)
```

---

## Student Experience

Students access their assignments through their dashboard (implementation recommended):

### Student Dashboard Components

1. **All Assignments View**
   - Unified list of all assignment types
   - Status badges (Assigned, In Progress, Completed, etc.)
   - Due date indicators
   - Progress bars

2. **Due Soon Tab**
   - Assignments due within 7 days
   - Sorted by due date
   - Quick access to start/continue

3. **Overdue Tab**
   - Past due assignments
   - Late submission availability indicator
   - Urgency indicators

4. **Completed Tab**
   - Finished assignments
   - Scores and feedback
   - Review access

---

## Best Practices

### 1. Consistent Scheduling
- Set reasonable due dates
- Allow sufficient time between assignments
- Consider student workload

### 2. Clear Instructions
- Provide specific guidance
- List required materials
- Explain grading criteria

### 3. Regular Monitoring
- Check "Needs Attention" tab daily
- Grade submissions promptly
- Follow up on overdue students

### 4. Data-Driven Decisions
- Review analytics regularly
- Identify struggling students early
- Adjust difficulty based on completion rates

### 5. Communication
- Use assignment comments for feedback
- Flag students needing extra help
- Provide constructive feedback

### 6. Organization
- Use assignment tags effectively
- Maintain consistent naming conventions
- Archive or delete old assignments

---

## Troubleshooting

### Students Can't See Assignment
- Verify `published` is `true`
- Check `available_from` date
- Confirm student is in target course or assigned list
- Check Row Level Security policies

### Analytics Not Updating
- Analytics update automatically via triggers
- If stale, check trigger functions are enabled
- Verify student progress records exist

### Grading Issues
- Ensure teacher has proper permissions
- Check that submission status is 'submitted'
- Verify `max_score` is set correctly

### Performance Issues
- Use indexes (already created by migration)
- Filter queries appropriately
- Consider archiving old assignments

---

## Next Steps

### Phase 2 Features (Planned)

1. **Google Classroom Sync**
   - Auto-create Google Classroom assignments
   - Grade passback integration
   - Roster sync

2. **Advanced Analytics**
   - Time-series trends
   - Student comparison reports
   - Predictive analytics

3. **Student Messaging**
   - In-app notifications
   - Email reminders
   - Push notifications

4. **Bulk Operations**
   - Copy assignments across courses
   - Mass grading workflows
   - Batch updates

5. **Export & Reporting**
   - CSV export
   - PDF report generation
   - Grade book integration

---

## Support & Documentation

- **Database Schema**: See `create_unified_assignment_hub.sql`
- **TypeScript Types**: See `/src/types/unified-assignment.ts`
- **API Routes**: See `/src/app/api/unified-assignments/`
- **Components**: See `/src/components/admin/GlobalAssignmentHub.tsx`

For questions or issues, refer to the codebase documentation or create an issue in your repository.

---

## Summary

The Global Assignment Hub provides a **comprehensive, unified system** for managing all assignment types in your Physics Classroom. With:

✅ **One interface** for all content types  
✅ **Automatic tracking** and analytics  
✅ **Flexible targeting** (courses or individuals)  
✅ **Real-time progress** monitoring  
✅ **Rich analytics** and reporting  
✅ **Streamlined grading** workflows  

You now have complete control over your assignment lifecycle from creation to grading with full visibility into student progress and engagement.

**Access the Hub**: Navigate to `/admin/assignment-hub` to get started!

