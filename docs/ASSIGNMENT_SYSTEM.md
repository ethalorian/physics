# Assignment System Documentation

## Overview

The assignment system allows teachers to assign lessons and homework assignments to classes and/or individual students with comprehensive tracking and analytics.

## Quick Start

1. **Database Setup**: Run the migration to create tables:
   ```bash
   psql -d your_database < supabase/migrations/create_assignment_system_tables.sql
   ```

2. **Install Dependencies**: 
   ```bash
   npm install
   ```

3. **Access the System**:
   - Teachers/Admins: `/admin/assignments-system`
   - Students: Integrated into dashboard automatically

## Core Features

### For Teachers/Admins
- **Assignment Creation**: Assign lessons or homework to entire classes or specific students
- **Progress Tracking**: Real-time completion rates and student analytics
- **Due Date Management**: Set deadlines with automatic overdue detection
- **Flexible Configuration**: Attempt limits, time constraints, custom instructions

### For Students
- **Unified Dashboard**: All assignments in one place with clear status indicators
- **Smart Organization**: All, Due Soon, and Overdue tabs
- **Progress Tracking**: Visual progress bars and time spent metrics
- **Action-Oriented**: Context-appropriate buttons (Start, Continue, Review)

## Architecture

### Database Schema
- **`lesson_assignments`** / **`assignment_assignments`**: Core assignment tables
- **`student_lesson_assignments`** / **`student_assignment_assignments`**: Individual progress
- **`assignment_reminders`**: Due date notifications
- **Automatic triggers**: Create student records when assigning to courses

### API Endpoints
- **`/api/assignments/lessons`**: Lesson assignment management
- **`/api/assignments/homework`**: Homework assignment management
- **`/api/assignments/student`**: Student view and progress updates

### UI Components
- **`AssignmentManager`**: Teacher interface for managing assignments
- **`CreateAssignmentForms`**: Assignment creation with course/student targeting
- **`StudentAssignmentView`**: Student dashboard with progress tracking

## Usage Examples

### Create Lesson Assignment
```typescript
await createLessonAssignment({
  lesson_id: "lesson-uuid",
  course_id: "google-classroom-course-id",
  due_date: "2024-02-15T23:59:59Z",
  instructions: "Read chapter 3 and take notes",
  published: true
})
```

### Create Homework Assignment
```typescript
await createAssignmentAssignment({
  assignment_id: "assignment-from-localstorage",
  course_id: "google-classroom-course-id",
  due_date: "2024-02-20T23:59:59Z",
  max_attempts: 2,
  time_limit: 60,
  published: true
})
```

### Track Student Progress
```typescript
await updateStudentAssignmentStatus('lesson', assignmentId, studentId, {
  status: 'in_progress',
  progress_percentage: 75,
  time_spent: 1800
})
```

## Integration

- **Google Classroom**: Uses existing course and student data
- **Existing Assignments**: References localStorage assignment system
- **Permission System**: Integrates with role-based access control
- **Student Activity**: Tracks detailed engagement metrics

## Security & Performance

- **Role-based Access**: Students only see their own assignments
- **Database Optimization**: Proper indexing and efficient queries
- **Caching**: Context providers cache frequently accessed data
- **Input Validation**: Comprehensive validation on all endpoints

## Development

See the Cursor rules for detailed development patterns:
- `assignment-system-architecture.mdc`: Overall system design
- `assignment-system-development.mdc`: Component and API patterns
- `database-assignment-patterns.mdc`: Database and SQL best practices

