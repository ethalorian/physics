"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { assignmentService } from '@/services/AssignmentService'
import type { 
  CreateAssignmentParams, 
  UpdateAssignmentParams, 
  StudentProgressParams 
} from '@/services/AssignmentService'
import { 
  UnifiedAssignment, 
  StudentAssignmentProgress,
  AssignmentType,
  AssignmentStatus
} from '@/types/unified-assignment'
import { Assignment, Submission } from '@/types/assignment'
import { useToast } from '@/providers/toast-provider'

// ============================================================================
// CONTEXT TYPE DEFINITION
// ============================================================================

interface ConsolidatedAssignmentContextType {
  // Core state
  assignments: UnifiedAssignment[]
  studentProgress: StudentAssignmentProgress[]
  loading: boolean
  error: string | null
  
  // Teacher/Admin operations
  createAssignment: (params: CreateAssignmentParams) => Promise<UnifiedAssignment>
  updateAssignment: (id: string, params: UpdateAssignmentParams) => Promise<UnifiedAssignment>
  deleteAssignment: (id: string) => Promise<void>
  duplicateAssignment: (id: string, newTitle?: string) => Promise<UnifiedAssignment>
  publishAssignment: (id: string, published: boolean) => Promise<UnifiedAssignment>
  
  // Student operations
  startAssignment: (assignmentId: string) => Promise<StudentAssignmentProgress>
  saveProgress: (params: StudentProgressParams) => Promise<StudentAssignmentProgress>
  submitAssignment: (assignmentId: string, data: any, timeSpent?: number) => Promise<StudentAssignmentProgress>
  
  // Query operations
  getAssignmentById: (id: string) => UnifiedAssignment | undefined
  getStudentProgress: (assignmentId: string) => StudentAssignmentProgress | undefined
  getAssignmentsByType: (type: AssignmentType) => UnifiedAssignment[]
  getAssignmentsByCourse: (courseId: string) => UnifiedAssignment[]
  
  // Specialized operations
  quickAssignSimulation: (
    simulationSlug: string, 
    courseId: string, 
    options?: any
  ) => Promise<UnifiedAssignment>
  batchAssign: (assignmentId: string, courseIds: string[]) => Promise<UnifiedAssignment[]>
  
  // Data refresh
  refreshAssignments: () => Promise<void>
  refreshStudentProgress: () => Promise<void>
  
  // Analytics
  getAnalytics: (assignmentId?: string) => Promise<any>
  getTeacherDashboard: () => Promise<any>
  
  // Legacy compatibility (temporary - will be removed after full migration)
  getLegacyAssignment: (id: string) => Assignment | undefined
  getLegacySubmission: (assignmentId: string) => Submission | undefined
  
  // Additional legacy compatibility for old AssignmentContext
  submissions?: Submission[]  // Maps to studentProgress
  getSubmissionByAssignmentId?: (assignmentId: string, studentId?: string) => Submission | undefined
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ConsolidatedAssignmentContext = createContext<ConsolidatedAssignmentContextType | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function ConsolidatedAssignmentProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  const { showToast } = useToast()
  
  // State
  const [assignments, setAssignments] = useState<UnifiedAssignment[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentAssignmentProgress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // ========================================
  // INITIAL DATA LOADING
  // ========================================
  
  useEffect(() => {
    if (session?.user?.email) {
      loadInitialData()
    }
  }, [session, userRole])
  
  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (userRole === 'admin' || userRole === 'teacher') {
        await refreshAssignments()
      }
      
      if (userRole === 'student') {
        await refreshStudentProgress()
      }
    } catch (err) {
      console.error('Failed to load initial data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  
  // ========================================
  // DATA REFRESH OPERATIONS
  // ========================================
  
  const refreshAssignments = useCallback(async () => {
    try {
      const data = await assignmentService.getAssignments()
      setAssignments(data)
    } catch (err) {
      console.error('Failed to refresh assignments:', err)
      throw err
    }
  }, [])
  
  const refreshStudentProgress = useCallback(async () => {
    try {
      const data = await assignmentService.getStudentAssignments()
      setStudentProgress(data)
      
      // Also load the full assignment details for student view
      const assignmentIds = [...new Set(data.map(p => p.unified_assignment_id))]
      const assignmentPromises = assignmentIds.map(id => 
        assignmentService.getAssignmentById(id).catch(() => null)
      )
      const assignmentDetails = await Promise.all(assignmentPromises)
      const validAssignments = assignmentDetails.filter(a => a !== null) as UnifiedAssignment[]
      setAssignments(validAssignments)
    } catch (err) {
      console.error('Failed to refresh student progress:', err)
      throw err
    }
  }, [])
  
  // ========================================
  // TEACHER/ADMIN OPERATIONS
  // ========================================
  
  const createAssignment = useCallback(async (params: CreateAssignmentParams) => {
    try {
      const assignment = await assignmentService.createAssignment(params)
      setAssignments(prev => [...prev, assignment])
      showToast({
        title: 'Success',
        description: 'Assignment created successfully',
        variant: 'success'
      })
      return assignment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create assignment'
      showToast({
        title: 'Error',
        description: message,
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  const updateAssignment = useCallback(async (id: string, params: UpdateAssignmentParams) => {
    try {
      const updated = await assignmentService.updateAssignment(id, params)
      setAssignments(prev => prev.map(a => a.id === id ? updated : a))
      showToast({
        title: 'Success',
        description: 'Assignment updated successfully',
        variant: 'success'
      })
      return updated
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to update assignment',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  const deleteAssignment = useCallback(async (id: string) => {
    try {
      await assignmentService.deleteAssignment(id)
      setAssignments(prev => prev.filter(a => a.id !== id))
      showToast({
        title: 'Success',
        description: 'Assignment deleted successfully',
        variant: 'success'
      })
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to delete assignment',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  const duplicateAssignment = useCallback(async (id: string, newTitle?: string) => {
    try {
      const duplicated = await assignmentService.duplicateAssignment(id, newTitle)
      setAssignments(prev => [...prev, duplicated])
      showToast({
        title: 'Success',
        description: 'Assignment duplicated successfully',
        variant: 'success'
      })
      return duplicated
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to duplicate assignment',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  const publishAssignment = useCallback(async (id: string, published: boolean) => {
    try {
      const updated = await assignmentService.setPublishStatus(id, published)
      setAssignments(prev => prev.map(a => a.id === id ? updated : a))
      showToast({
        title: 'Success',
        description: published ? 'Assignment published' : 'Assignment unpublished',
        variant: 'success'
      })
      return updated
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to update publish status',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  // ========================================
  // STUDENT OPERATIONS
  // ========================================
  
  const startAssignment = useCallback(async (assignmentId: string) => {
    try {
      const progress = await assignmentService.startAssignment(assignmentId)
      setStudentProgress(prev => [...prev, progress])
      return progress
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to start assignment',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  const saveProgress = useCallback(async (params: StudentProgressParams) => {
    try {
      const updated = await assignmentService.saveProgress(params)
      setStudentProgress(prev => 
        prev.map(p => p.unified_assignment_id === params.assignmentId ? updated : p)
      )
      // Silent save - no toast
      return updated
    } catch (err) {
      console.error('Failed to save progress:', err)
      throw err
    }
  }, [])
  
  const submitAssignment = useCallback(async (
    assignmentId: string, 
    data: any, 
    timeSpent?: number
  ) => {
    try {
      const result = await assignmentService.submitAssignment(assignmentId, data, timeSpent)
      setStudentProgress(prev => 
        prev.map(p => p.unified_assignment_id === assignmentId ? result : p)
      )
      showToast({
        title: 'Success',
        description: 'Assignment submitted successfully',
        variant: 'success'
      })
      return result
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  // ========================================
  // QUERY OPERATIONS
  // ========================================
  
  const getAssignmentById = useCallback((id: string) => {
    return assignments.find(a => a.id === id)
  }, [assignments])
  
  const getStudentProgress = useCallback((assignmentId: string) => {
    return studentProgress.find(p => p.unified_assignment_id === assignmentId)
  }, [studentProgress])
  
  const getAssignmentsByType = useCallback((type: AssignmentType) => {
    return assignments.filter(a => a.assignment_type === type)
  }, [assignments])
  
  const getAssignmentsByCourse = useCallback((courseId: string) => {
    return assignments.filter(a => a.course_id === courseId)
  }, [assignments])
  
  // ========================================
  // SPECIALIZED OPERATIONS
  // ========================================
  
  const quickAssignSimulation = useCallback(async (
    simulationSlug: string,
    courseId: string,
    options?: any
  ) => {
    try {
      const assignment = await assignmentService.quickAssignSimulation(
        simulationSlug,
        courseId,
        options
      )
      setAssignments(prev => [...prev, assignment])
      showToast({
        title: 'Success',
        description: 'Simulation assigned successfully',
        variant: 'success'
      })
      return assignment
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to assign simulation',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  const batchAssign = useCallback(async (assignmentId: string, courseIds: string[]) => {
    try {
      const assignments = await assignmentService.batchAssign(assignmentId, courseIds)
      setAssignments(prev => [...prev, ...assignments])
      showToast({
        title: 'Success',
        description: `Assignment created for ${courseIds.length} courses`,
        variant: 'success'
      })
      return assignments
    } catch (err) {
      showToast({
        title: 'Error',
        description: 'Failed to batch assign',
        variant: 'error'
      })
      throw err
    }
  }, [showToast])
  
  // ========================================
  // ANALYTICS
  // ========================================
  
  const getAnalytics = useCallback(async (assignmentId?: string) => {
    try {
      return await assignmentService.getAnalytics(assignmentId)
    } catch (err) {
      console.error('Failed to get analytics:', err)
      throw err
    }
  }, [])
  
  const getTeacherDashboard = useCallback(async () => {
    try {
      return await assignmentService.getTeacherDashboard()
    } catch (err) {
      console.error('Failed to get dashboard:', err)
      throw err
    }
  }, [])
  
  // ========================================
  // LEGACY COMPATIBILITY
  // ========================================
  
  const getLegacyAssignment = useCallback((id: string): Assignment | undefined => {
    const unified = getAssignmentById(id)
    if (!unified || unified.assignment_type !== 'homework') return undefined
    
    // Convert unified assignment to legacy format
    // Note: Questions would need to be fetched separately using reference_id
    return {
      id: unified.id,
      title: unified.title,
      description: unified.description || '',
      instructions: unified.instructions || '',
      questions: [], // Questions are stored separately and would need to be fetched using reference_id
      total_points: unified.max_score || 0,
      due_date: unified.due_date || undefined,
      published: unified.published,
      created_at: unified.created_at,
      updated_at: unified.updated_at
    }
  }, [getAssignmentById])
  
  const getLegacySubmission = useCallback((assignmentId: string): Submission | undefined => {
    const progress = getStudentProgress(assignmentId)
    if (!progress) return undefined
    
    // Convert progress to legacy submission format
    return {
      id: progress.id,
      assignment_id: assignmentId,
      user_id: progress.student_id,
      answers: (progress.submission_data?.answers || {}) as Record<string, string | number | string[] | Record<string, unknown>>,
      score: progress.score || undefined,
      max_score: progress.max_score || undefined,
      feedback: undefined, // StudentAssignmentProgress has feedback as string, but Submission expects Record<string, string>
      rubric_grades: progress.rubric_scores || undefined,
      status: progress.status as 'draft' | 'submitted' | 'graded',
      submitted_at: progress.submitted_at || undefined,
      graded_at: progress.graded_at || undefined,
      created_at: progress.created_at,
      updated_at: progress.updated_at
    }
  }, [getStudentProgress])
  
  // Additional legacy compatibility
  const getSubmissionByAssignmentId = useCallback((assignmentId: string, studentId?: string): Submission | undefined => {
    // Use provided studentId or current session user id
    const targetStudentId = studentId || session?.user?.id
    if (!targetStudentId) return undefined
    
    // Find the student progress for this assignment
    const progress = studentProgress.find(p => 
      p.assignment_id === assignmentId && p.student_id === targetStudentId
    )
    
    if (!progress) return undefined
    
    // Convert to legacy Submission format
    return {
      id: progress.id,
      assignment_id: progress.assignment_id,
      student_id: progress.student_id,
      student_name: progress.student_name || '',
      student_email: progress.student_email || '',
      answers: progress.progress_data?.answers || [],
      score: progress.score ?? undefined,
      max_score: progress.max_score ?? undefined,
      feedback: progress.feedback || undefined,
      time_spent: progress.time_spent || 0,
      simulation_data: progress.progress_data?.simulation_data,
      submitted_at: progress.submitted_at || undefined,
      graded_at: progress.graded_at || undefined,
      created_at: progress.created_at,
      updated_at: progress.updated_at
    }
  }, [studentProgress, session])
  
  // Map studentProgress to legacy submissions format
  const submissions: Submission[] = useMemo(() => {
    return studentProgress.map(progress => ({
      id: progress.id,
      assignment_id: progress.assignment_id,
      student_id: progress.student_id,
      student_name: progress.student_name || '',
      student_email: progress.student_email || '',
      answers: progress.progress_data?.answers || [],
      score: progress.score ?? undefined,
      max_score: progress.max_score ?? undefined,
      feedback: progress.feedback || undefined,
      time_spent: progress.time_spent || 0,
      simulation_data: progress.progress_data?.simulation_data,
      submitted_at: progress.submitted_at || undefined,
      graded_at: progress.graded_at || undefined,
      created_at: progress.created_at,
      updated_at: progress.updated_at
    }))
  }, [studentProgress])
  
  // ========================================
  // CONTEXT VALUE
  // ========================================
  
  const value: ConsolidatedAssignmentContextType = {
    // State
    assignments,
    studentProgress,
    loading,
    error,
    
    // Teacher operations
    createAssignment,
    updateAssignment,
    deleteAssignment,
    duplicateAssignment,
    publishAssignment,
    
    // Student operations
    startAssignment,
    saveProgress,
    submitAssignment,
    
    // Queries
    getAssignmentById,
    getStudentProgress,
    getAssignmentsByType,
    getAssignmentsByCourse,
    
    // Specialized
    quickAssignSimulation,
    batchAssign,
    
    // Data refresh
    refreshAssignments,
    refreshStudentProgress,
    
    // Analytics
    getAnalytics,
    getTeacherDashboard,
    
    // Legacy
    getLegacyAssignment,
    getLegacySubmission,
    
    // Additional legacy compatibility
    submissions,
    getSubmissionByAssignmentId
  }
  
  return (
    <ConsolidatedAssignmentContext.Provider value={value}>
      {children}
    </ConsolidatedAssignmentContext.Provider>
  )
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useAssignments() {
  const context = useContext(ConsolidatedAssignmentContext)
  if (!context) {
    throw new Error('useAssignments must be used within ConsolidatedAssignmentProvider')
  }
  return context
}

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Export with old names for backward compatibility during migration
export const AssignmentProvider = ConsolidatedAssignmentProvider
export const AssignmentContext = ConsolidatedAssignmentContext

// Also export a saveSubmission function for backward compatibility
export async function saveSubmission(submission: Omit<Submission, 'id' | 'created_at' | 'updated_at'>) {
  const service = assignmentService
  const progress = await service.submitAssignment(
    submission.assignment_id,
    { answers: submission.answers, rubric_grades: submission.rubric_grades },
    undefined
  )
  
  // Convert back to legacy format
  return {
    id: progress.id,
    ...submission,
    created_at: progress.created_at,
    updated_at: progress.updated_at
  } as Submission
}
