// Assignment System Types
// Types for assigning lessons and assignments to classes and students

export interface LessonAssignment {
  id: string
  lesson_id: string
  
  // Assignment target (either course or individual students)
  course_id?: string // Google Classroom course ID
  assigned_students?: string[] // Array of student UUIDs
  
  // Assignment details
  assigned_by: string // Teacher/admin user ID who made the assignment
  assigned_at: string
  due_date?: string
  
  // Assignment configuration
  title?: string // Override lesson title if needed
  instructions?: string // Special instructions for this assignment
  estimated_time?: number // Override lesson estimated time (in minutes)
  
  // Status and tracking
  is_active: boolean
  published: boolean // Whether students can see this assignment
  
  // Analytics
  total_assigned: number // Number of students assigned
  total_started: number // Number who started
  total_completed: number // Number who completed
  
  created_at: string
  updated_at: string
  
  // Populated data
  lesson?: {
    id: string
    title: string
    slug: string
    description?: string
    unit: string
    lesson_number: number
    estimated_time?: number
  }
  course?: {
    id: string
    name: string
    section?: string
    student_count: number
  }
  students?: StudentInfo[]
}

export interface AssignmentAssignment {
  id: string
  assignment_id: string // References assignment from localStorage system
  
  // Assignment target (either course or individual students)
  course_id?: string // Google Classroom course ID
  assigned_students?: string[] // Array of student UUIDs
  
  // Assignment details
  assigned_by: string // Teacher/admin user ID who made the assignment
  assigned_at: string
  due_date?: string
  
  // Assignment configuration
  title?: string // Override assignment title if needed
  instructions?: string // Special instructions for this assignment
  max_attempts: number // Number of attempts allowed
  time_limit?: number // Time limit in minutes
  
  // Status and tracking
  is_active: boolean
  published: boolean // Whether students can see this assignment
  
  // Analytics
  total_assigned: number // Number of students assigned
  total_started: number // Number who started
  total_submitted: number // Number who submitted
  total_completed: number // Number who completed (graded)
  
  created_at: string
  updated_at: string
  
  // Populated data
  assignment?: {
    id: string
    title: string
    description?: string
    total_points: number
    question_count: number
  }
  course?: {
    id: string
    name: string
    section?: string
    student_count: number
  }
  students?: StudentInfo[]
}

export interface StudentLessonAssignment {
  id: string
  lesson_assignment_id: string
  student_id: string
  
  // Individual student status
  status: 'assigned' | 'started' | 'in_progress' | 'completed' | 'overdue'
  started_at?: string
  completed_at?: string
  
  // Progress tracking
  progress_percentage: number
  time_spent: number // Total time in seconds
  last_accessed?: string
  
  // Grading (if applicable)
  score?: number
  max_score?: number
  feedback?: string
  graded_at?: string
  graded_by?: string
  
  created_at: string
  updated_at: string
  
  // Populated data
  student?: StudentInfo
  lesson_assignment?: LessonAssignment
}

export interface StudentAssignmentAssignment {
  id: string
  assignment_assignment_id: string
  student_id: string
  
  // Individual student status
  status: 'assigned' | 'started' | 'in_progress' | 'submitted' | 'graded' | 'overdue'
  started_at?: string
  submitted_at?: string
  
  // Submission tracking
  attempts_used: number
  current_submission_id?: string // References submission from localStorage system
  
  // Time tracking
  time_spent: number // Total time in seconds
  last_accessed?: string
  
  // Grading
  score?: number
  max_score?: number
  percentage?: number
  feedback?: string
  graded_at?: string
  graded_by?: string
  
  created_at: string
  updated_at: string
  
  // Populated data
  student?: StudentInfo
  assignment_assignment?: AssignmentAssignment
}

export interface AssignmentReminder {
  id: string
  
  // Reference to assignment (either lesson or homework)
  lesson_assignment_id?: string
  assignment_assignment_id?: string
  
  student_id: string
  
  // Reminder details
  reminder_type: 'due_soon' | 'overdue' | 'incomplete'
  days_before_due?: number // For 'due_soon' reminders
  
  // Status
  sent_at?: string
  is_sent: boolean
  
  created_at: string
  
  // Populated data
  student?: StudentInfo
  lesson_assignment?: LessonAssignment
  assignment_assignment?: AssignmentAssignment
}

export interface StudentInfo {
  id: string
  google_user_id: string
  email: string
  name: string
  first_name?: string
  last_name?: string
  profile_photo_url?: string
  course_id: string
  enrollment_state: 'ACTIVE' | 'INVITED' | 'DECLINED'
  grade_level?: string
  student_id?: string
  is_active: boolean
  last_synced_at: string
  created_at: string
  updated_at: string
}

export interface CourseInfo {
  id: string
  google_course_id: string
  name: string
  section?: string
  description?: string
  room?: string
  owner_id: string
  course_state: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED'
  creation_time?: string
  update_time?: string
  last_synced_at: string
  student_count: number
  created_at: string
  updated_at: string
}

// Request/Response types for API endpoints

export interface CreateLessonAssignmentRequest {
  lesson_id: string
  course_id?: string
  assigned_students?: string[]
  due_date?: string
  title?: string
  instructions?: string
  estimated_time?: number
  published?: boolean
}

export interface CreateAssignmentAssignmentRequest {
  assignment_id: string
  course_id?: string
  assigned_students?: string[]
  due_date?: string
  title?: string
  instructions?: string
  max_attempts?: number
  time_limit?: number
  published?: boolean
}

export interface UpdateStudentAssignmentStatusRequest {
  status: StudentLessonAssignment['status'] | StudentAssignmentAssignment['status']
  progress_percentage?: number
  time_spent?: number
  score?: number
  max_score?: number
  feedback?: string
}

export interface AssignmentFilters {
  course_id?: string
  assigned_by?: string
  status?: string
  due_date_from?: string
  due_date_to?: string
  is_active?: boolean
  published?: boolean
  assignment_type?: 'lesson' | 'assignment'
}

export interface StudentAssignmentFilters {
  student_id?: string
  course_id?: string
  status?: string
  assignment_type?: 'lesson' | 'assignment'
  due_date_from?: string
  due_date_to?: string
  overdue_only?: boolean
}

// Dashboard/Analytics types

export interface AssignmentAnalytics {
  total_assignments: number
  total_lesson_assignments: number
  total_homework_assignments: number
  
  by_status: {
    assigned: number
    in_progress: number
    completed: number
    overdue: number
  }
  
  by_course: Array<{
    course_id: string
    course_name: string
    assignment_count: number
    completion_rate: number
  }>
  
  recent_assignments: Array<LessonAssignment | AssignmentAssignment>
  overdue_assignments: Array<StudentLessonAssignment | StudentAssignmentAssignment>
  
  completion_rates: {
    overall: number
    by_course: Record<string, number>
    by_assignment_type: {
      lessons: number
      assignments: number
    }
  }
}

export interface StudentProgress {
  student_id: string
  student_name: string
  student_email: string
  
  total_assignments: number
  completed_assignments: number
  overdue_assignments: number
  in_progress_assignments: number
  
  completion_rate: number
  average_score?: number
  total_time_spent: number // in seconds
  
  recent_activity: Array<{
    type: 'lesson' | 'assignment'
    title: string
    status: string
    last_accessed?: string
    completed_at?: string
    score?: number
  }>
}

// Utility types

export type AssignmentType = 'lesson' | 'assignment'
export type AssignmentStatus = 'assigned' | 'started' | 'in_progress' | 'completed' | 'submitted' | 'graded' | 'overdue'
export type ReminderType = 'due_soon' | 'overdue' | 'incomplete'

// Combined types for unified views

export interface UnifiedAssignment {
  id: string
  type: AssignmentType
  content_id: string // lesson_id or assignment_id
  title: string
  description?: string
  instructions?: string
  due_date?: string
  assigned_at: string
  assigned_by: string
  
  // Target info
  course_id?: string
  course_name?: string
  assigned_students?: string[]
  
  // Progress
  total_assigned: number
  total_started: number
  total_completed: number
  completion_rate: number
  
  // Status
  is_active: boolean
  published: boolean
  
  created_at: string
  updated_at: string
}

export interface UnifiedStudentAssignment {
  id: string
  type: AssignmentType
  content_id: string // lesson_id or assignment_id
  title: string
  description?: string
  instructions?: string
  due_date?: string
  assigned_at: string
  
  // Student progress
  status: AssignmentStatus
  progress_percentage?: number
  started_at?: string
  completed_at?: string
  submitted_at?: string
  
  // Time tracking
  time_spent: number
  last_accessed?: string
  
  // Grading
  score?: number
  max_score?: number
  percentage?: number
  feedback?: string
  graded_at?: string
  
  // Submission info (for assignments)
  attempts_used?: number
  max_attempts?: number
  current_submission_id?: string
  
  created_at: string
  updated_at: string
}

