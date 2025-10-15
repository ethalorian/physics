/**
 * Unified Assignment System Types
 * 
 * Central type definitions for the global assignment hub that manages
 * all types of assignments: lessons, homework, vocabulary, and simulations
 */

// Assignment types that can be assigned to students
export type AssignmentType = 'lesson' | 'homework' | 'vocabulary' | 'simulation' | 'simulation_embedded'

// Student assignment status progression
export type AssignmentStatus = 
  | 'assigned'       // Initial state when assigned
  | 'started'        // Student has opened the assignment
  | 'in_progress'    // Student is actively working
  | 'completed'      // Student finished (for lessons without submission)
  | 'submitted'      // Student submitted for grading
  | 'graded'         // Teacher has graded
  | 'overdue'        // Past due date without completion
  | 'late_submitted' // Submitted after due date

/**
 * Central assignment record that can reference any type of content
 */
export interface UnifiedAssignment {
  id: string
  
  // Type and content reference
  assignment_type: AssignmentType
  reference_id: string // ID of the actual content (lesson.id, assignment.id, etc.)
  
  // Assignment details
  title: string
  description?: string
  instructions?: string
  
  // Target audience
  course_id?: string     // Google Classroom course ID
  assigned_students?: string[] // Specific student IDs (alternative to course_id)
  
  // Scheduling
  assigned_at: string
  available_from?: string
  due_date?: string
  closes_at?: string // Hard deadline (no submissions after)
  
  // Configuration
  max_attempts?: number
  time_limit?: number // Minutes
  allow_late_submission?: boolean
  requires_completion?: boolean
  
  // Grading
  max_score?: number
  weight?: number // Weight for grade calculation (0-100)
  
  // Status
  published: boolean
  assigned_by: string // Teacher email
  
  // Analytics (auto-calculated)
  total_assigned: number
  total_started: number
  total_completed: number
  total_submitted: number
  average_score?: number
  average_time_spent?: number // Seconds
  
  // Metadata
  created_at: string
  updated_at: string
  
  // Expanded relations (for joins)
  course?: {
    id: string
    name: string
    google_course_id: string
  }
  tags?: AssignmentTag[]
}

/**
 * Individual student's progress on an assignment
 */
export interface StudentAssignmentProgress {
  id: string
  unified_assignment_id: string
  student_id: string
  student_email: string
  
  // Progress tracking
  status: AssignmentStatus
  progress_percentage: number // 0-100
  
  // Time tracking
  started_at?: string
  completed_at?: string
  submitted_at?: string
  first_viewed_at?: string
  last_accessed_at?: string
  time_spent: number // Total seconds spent
  
  // Attempts
  attempt_number: number
  attempts_used: number
  
  // Grading
  score?: number
  max_score?: number
  percentage?: number
  letter_grade?: string
  rubric_scores?: Record<string, number | { score: number; feedback?: string }>
  feedback?: string
  graded_at?: string
  graded_by?: string
  
  // Submission data (flexible for different assignment types)
  submission_data?: Record<string, unknown>
  
  // Flags
  is_late: boolean
  is_excused: boolean
  needs_attention: boolean
  
  // Metadata
  created_at: string
  updated_at: string
  
  // Expanded relations
  assignment?: UnifiedAssignment
  student?: {
    id: string
    name: string
    email: string
    photo_url?: string
  }
  comments?: AssignmentComment[]
}

/**
 * Tag for organizing assignments
 */
export interface AssignmentTag {
  id: string
  unified_assignment_id: string
  tag_name: string
  tag_category?: string // e.g., 'unit', 'topic', 'standard'
  created_at: string
}

/**
 * Comment on an assignment (teacher-student communication)
 */
export interface AssignmentComment {
  id: string
  student_progress_id: string
  commenter_email: string
  commenter_name?: string
  comment_text: string
  is_private: boolean // Visible only to teachers
  created_at: string
}

/**
 * Request to create a new unified assignment
 */
export interface CreateUnifiedAssignmentRequest {
  assignment_type: AssignmentType
  reference_id: string
  title: string
  description?: string
  instructions?: string
  course_id?: string
  assigned_students?: string[]
  available_from?: string
  due_date?: string
  closes_at?: string
  max_attempts?: number
  time_limit?: number
  allow_late_submission?: boolean
  requires_completion?: boolean
  max_score?: number
  weight?: number
  published?: boolean
  tags?: string[] // Tag names to create
}

/**
 * Request to update student progress
 */
export interface UpdateStudentProgressRequest {
  status?: AssignmentStatus
  progress_percentage?: number
  time_spent?: number
  score?: number
  percentage?: number
  letter_grade?: string
  rubric_scores?: Record<string, number | { score: number; feedback?: string }>
  feedback?: string
  submission_data?: Record<string, unknown>
  is_excused?: boolean
  needs_attention?: boolean
}

/**
 * Filters for querying assignments
 */
export interface AssignmentFilters {
  assignment_type?: AssignmentType | AssignmentType[]
  course_id?: string
  student_id?: string
  status?: AssignmentStatus | AssignmentStatus[]
  due_before?: string
  due_after?: string
  tags?: string[]
  search_query?: string
  include_drafts?: boolean
  overdue_only?: boolean
  needs_grading?: boolean
}

/**
 * Analytics summary for an assignment
 */
export interface AssignmentAnalytics {
  assignment_id: string
  title: string
  assignment_type: AssignmentType
  
  // Participation
  total_assigned: number
  total_started: number
  total_completed: number
  total_submitted: number
  
  // Completion rates
  start_rate: number // Percentage who started
  completion_rate: number // Percentage who completed
  submission_rate: number // Percentage who submitted
  
  // Performance
  average_score?: number
  median_score?: number
  highest_score?: number
  lowest_score?: number
  grade_distribution?: {
    [grade: string]: number
  }
  
  // Time
  average_time_spent?: number // Seconds
  median_time_spent?: number
  
  // Status breakdown
  status_counts: {
    [status in AssignmentStatus]?: number
  }
  
  // Students needing attention
  overdue_students: number
  needs_grading_count: number
  flagged_students: number
}

/**
 * Dashboard summary for teacher
 */
export interface TeacherDashboardSummary {
  total_assignments: number
  total_students: number
  
  // By type
  assignments_by_type: {
    [key in AssignmentType]: number
  }
  
  // Actions needed
  needs_grading: number
  overdue_count: number
  flagged_count: number
  
  // Recent activity
  recent_submissions: number // Last 24 hours
  recent_completions: number
  
  // Course breakdown
  courses: {
    course_id: string
    course_name: string
    active_assignments: number
    avg_completion_rate: number
  }[]
}

/**
 * Student dashboard summary
 */
export interface StudentDashboardSummary {
  // Current assignments
  total_assignments: number
  in_progress: number
  completed: number
  overdue: number
  
  // Upcoming
  due_this_week: number
  due_today: number
  
  // Performance
  overall_average?: number
  recent_scores: {
    assignment_title: string
    score: number
    max_score: number
    percentage: number
  }[]
  
  // Time
  total_time_spent: number // Seconds
  avg_time_per_assignment: number
  
  // By type
  assignments_by_type: {
    [key in AssignmentType]: {
      total: number
      completed: number
      in_progress: number
    }
  }
}

/**
 * Bulk assignment creation (for assigning multiple items at once)
 */
export interface BulkAssignmentRequest {
  assignments: CreateUnifiedAssignmentRequest[]
  apply_to_all?: {
    course_id?: string
    assigned_students?: string[]
    due_date?: string
    closes_at?: string
    max_attempts?: number
    time_limit?: number
  }
}

/**
 * Grade passback integration (for Google Classroom sync)
 */
export interface GradePassbackConfig {
  unified_assignment_id: string
  sync_to_classroom: boolean
  classroom_assignment_id?: string
  auto_sync_on_grade: boolean
  last_synced_at?: string
}

