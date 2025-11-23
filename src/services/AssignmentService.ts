/**
 * Unified Assignment Service
 * 
 * Single source of truth for all assignment operations across the application.
 * Consolidates functionality from AssignmentContext, AssignmentSystemContext, 
 * and UnifiedAssignmentContext.
 * 
 * This service handles:
 * - Lessons
 * - Homework assignments
 * - Vocabulary games
 * - Simulations
 * - Embedded simulation questions
 */

import { 
  UnifiedAssignment, 
  StudentAssignmentProgress, 
  AssignmentType,
  AssignmentStatus
} from '@/types/unified-assignment'
import { Assignment, Submission, Question } from '@/types/assignment'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CreateAssignmentParams {
  type: AssignmentType
  title: string
  description?: string
  instructions?: string
  
  // Reference to existing content
  referenceId?: string  // ID of lesson, simulation, vocabulary set, etc.
  
  // Target audience
  courseId?: string
  assignedStudents?: string[]
  
  // Scheduling
  dueDate?: string | Date
  availableFrom?: string | Date
  closesAt?: string | Date
  
  // Configuration
  maxAttempts?: number
  timeLimit?: number  // minutes
  allowLateSubmission?: boolean
  requiresCompletion?: boolean
  
  // Grading
  maxScore?: number
  weight?: number
  
  // Type-specific data
  questions?: Question[]  // For homework assignments
  config?: any  // Type-specific configuration
  
  // Publishing
  published?: boolean
}

export interface UpdateAssignmentParams {
  title?: string
  description?: string
  instructions?: string
  dueDate?: string | Date
  maxAttempts?: number
  timeLimit?: number
  allowLateSubmission?: boolean
  published?: boolean
  config?: any
}

export interface StudentProgressParams {
  assignmentId: string
  status?: AssignmentStatus
  progress?: number
  timeSpent?: number
  submissionData?: any
  score?: number
  feedback?: string
}

// ============================================================================
// ASSIGNMENT SERVICE CLASS
// ============================================================================

class AssignmentService {
  private baseUrl = '/api/unified-assignments'
  
  // ========================================
  // TEACHER/ADMIN OPERATIONS
  // ========================================
  
  /**
   * Create a new assignment of any type
   */
  async createAssignment(params: CreateAssignmentParams): Promise<UnifiedAssignment> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_type: params.type,
        reference_id: params.referenceId || this.generateReferenceId(params),
        title: params.title,
        description: params.description,
        instructions: params.instructions,
        course_id: params.courseId,
        assigned_students: params.assignedStudents,
        due_date: params.dueDate,
        available_from: params.availableFrom,
        closes_at: params.closesAt,
        max_attempts: params.maxAttempts || 1,
        time_limit: params.timeLimit,
        allow_late_submission: params.allowLateSubmission ?? true,
        requires_completion: params.requiresCompletion ?? false,
        max_score: params.maxScore,
        weight: params.weight || 1.0,
        published: params.published ?? false,
        config: params.config || {},
        questions: params.questions
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create assignment')
    }
    
    return response.json()
  }
  
  /**
   * Update an existing assignment
   */
  async updateAssignment(id: string, params: UpdateAssignmentParams): Promise<UnifiedAssignment> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update assignment')
    }
    
    return response.json()
  }
  
  /**
   * Delete an assignment
   */
  async deleteAssignment(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete assignment')
    }
  }
  
  /**
   * Get all assignments (teacher view)
   */
  async getAssignments(filters?: {
    type?: AssignmentType
    courseId?: string
    published?: boolean
  }): Promise<UnifiedAssignment[]> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.courseId) params.append('course_id', filters.courseId)
    if (filters?.published !== undefined) params.append('published', String(filters.published))
    
    const response = await fetch(`${this.baseUrl}?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch assignments')
    }
    
    const data = await response.json()
    return data.assignments || data || []
  }
  
  /**
   * Get single assignment by ID
   */
  async getAssignmentById(id: string): Promise<UnifiedAssignment> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      throw new Error('Assignment not found')
    }
    
    return response.json()
  }
  
  /**
   * Publish/unpublish an assignment
   */
  async setPublishStatus(id: string, published: boolean): Promise<UnifiedAssignment> {
    return this.updateAssignment(id, { published })
  }
  
  /**
   * Duplicate an assignment
   */
  async duplicateAssignment(id: string, newTitle?: string): Promise<UnifiedAssignment> {
    const original = await this.getAssignmentById(id)
    
    return this.createAssignment({
      type: original.assignment_type as AssignmentType,
      title: newTitle || `${original.title} (Copy)`,
      description: original.description,
      instructions: original.instructions,
      referenceId: original.reference_id,
      maxAttempts: original.max_attempts,
      timeLimit: original.time_limit,
      allowLateSubmission: original.allow_late_submission,
      requiresCompletion: original.requires_completion,
      maxScore: original.max_score,
      weight: original.weight,
      published: false  // Always create as draft
    })
  }
  
  // ========================================
  // STUDENT OPERATIONS
  // ========================================
  
  /**
   * Get student's assigned work
   */
  async getStudentAssignments(studentId?: string): Promise<StudentAssignmentProgress[]> {
    const params = studentId ? `?student_id=${studentId}` : ''
    const response = await fetch(`${this.baseUrl}/student${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch student assignments')
    }
    
    const data = await response.json()
    return data.assignments || data || []
  }
  
  /**
   * Start working on an assignment
   */
  async startAssignment(assignmentId: string): Promise<StudentAssignmentProgress> {
    const response = await fetch(`${this.baseUrl}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: assignmentId,
        status: 'started',
        started_at: new Date().toISOString()
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to start assignment')
    }
    
    return response.json()
  }
  
  /**
   * Save student progress
   */
  async saveProgress(params: StudentProgressParams): Promise<StudentAssignmentProgress> {
    const response = await fetch(`${this.baseUrl}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: params.assignmentId,
        status: params.status,
        progress_percentage: params.progress,
        time_spent: params.timeSpent,
        submission_data: params.submissionData,
        last_accessed_at: new Date().toISOString()
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to save progress')
    }
    
    return response.json()
  }
  
  /**
   * Submit assignment for grading
   */
  async submitAssignment(
    assignmentId: string, 
    submissionData: any,
    timeSpent?: number
  ): Promise<StudentAssignmentProgress> {
    const response = await fetch(`${this.baseUrl}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: assignmentId,
        submission_data: submissionData,
        time_spent: timeSpent,
        submitted_at: new Date().toISOString()
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to submit assignment')
    }
    
    return response.json()
  }
  
  /**
   * Grade an assignment (teacher)
   */
  async gradeAssignment(
    progressId: string,
    score: number,
    feedback?: string,
    rubricScores?: any
  ): Promise<StudentAssignmentProgress> {
    const response = await fetch(`${this.baseUrl}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        progress_id: progressId,
        score,
        feedback,
        rubric_scores: rubricScores,
        graded_at: new Date().toISOString()
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to grade assignment')
    }
    
    return response.json()
  }
  
  // ========================================
  // ANALYTICS & REPORTING
  // ========================================
  
  /**
   * Get assignment analytics
   */
  async getAnalytics(assignmentId?: string, courseId?: string): Promise<any> {
    const params = new URLSearchParams()
    if (assignmentId) params.append('assignment_id', assignmentId)
    if (courseId) params.append('course_id', courseId)
    
    const response = await fetch(`${this.baseUrl}/analytics?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics')
    }
    
    return response.json()
  }
  
  /**
   * Get teacher dashboard summary
   */
  async getTeacherDashboard(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/analytics?type=teacher_dashboard`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard')
    }
    
    return response.json()
  }
  
  /**
   * Export assignment data
   */
  async exportAssignmentData(assignmentId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${assignmentId}/export?format=${format}`)
    
    if (!response.ok) {
      throw new Error('Failed to export data')
    }
    
    return response.blob()
  }
  
  // ========================================
  // SPECIALIZED OPERATIONS
  // ========================================
  
  /**
   * Quick assign simulation
   */
  async quickAssignSimulation(
    simulationSlug: string,
    courseId: string,
    options?: {
      instructions?: string
      dueDate?: string
      minTime?: number
    }
  ): Promise<UnifiedAssignment> {
    return this.createAssignment({
      type: 'simulation',
      title: `Simulation: ${this.formatTitle(simulationSlug)}`,
      description: `Complete the ${this.formatTitle(simulationSlug)} simulation`,
      instructions: options?.instructions || 'Follow the simulation instructions and collect data as directed.',
      referenceId: simulationSlug,
      courseId,
      dueDate: options?.dueDate,
      config: {
        min_time_required: options?.minTime || 10,
        requires_data_export: true
      },
      maxAttempts: 3,
      requiresCompletion: true,
      published: true
    })
  }
  
  /**
   * Create simulation with embedded questions
   */
  async createSimulationWithQuestions(
    simulationSlug: string,
    questions: Question[],
    courseId?: string,
    students?: string[]
  ): Promise<UnifiedAssignment> {
    return this.createAssignment({
      type: 'simulation_embedded',
      title: `${this.formatTitle(simulationSlug)} with Questions`,
      referenceId: simulationSlug,
      courseId,
      assignedStudents: students,
      questions,
      config: {
        show_on_complete: true,
        required_for_progress: true
      },
      published: true
    })
  }
  
  /**
   * Batch assign to multiple courses
   */
  async batchAssign(
    assignmentId: string,
    courseIds: string[]
  ): Promise<UnifiedAssignment[]> {
    const original = await this.getAssignmentById(assignmentId)
    
    const promises = courseIds.map(courseId => 
      this.createAssignment({
        type: original.assignment_type as AssignmentType,
        title: original.title,
        description: original.description,
        instructions: original.instructions,
        referenceId: original.reference_id,
        courseId,
        maxAttempts: original.max_attempts,
        timeLimit: original.time_limit,
        published: true
      })
    )
    
    return Promise.all(promises)
  }
  
  // ========================================
  // LEGACY COMPATIBILITY
  // ========================================
  
  /**
   * Convert legacy assignment to unified format
   */
  async migrateLegacyAssignment(
    legacyAssignment: Assignment
  ): Promise<UnifiedAssignment> {
    return this.createAssignment({
      type: 'homework',
      title: legacyAssignment.title,
      description: legacyAssignment.description,
      instructions: legacyAssignment.instructions,
      questions: legacyAssignment.questions,
      dueDate: legacyAssignment.due_date,
      maxScore: legacyAssignment.total_points,
      published: legacyAssignment.published
    })
  }
  
  /**
   * Convert legacy submission to progress format
   */
  convertLegacySubmission(
    submission: Submission
  ): Partial<StudentAssignmentProgress> {
    return {
      status: submission.status as AssignmentStatus,
      score: submission.score,
      feedback: submission.feedback,
      submission_data: {
        answers: submission.answers,
        rubric_grades: submission.rubric_grades
      },
      submitted_at: submission.submitted_at
    }
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  private generateReferenceId(params: CreateAssignmentParams): string {
    if (params.type === 'homework') {
      return `hw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    return `${params.type}-${Date.now()}`
  }
  
  private formatTitle(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

// Export singleton instance
export const assignmentService = new AssignmentService()

// Export types for convenience
export type { CreateAssignmentParams, UpdateAssignmentParams, StudentProgressParams }

