"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { 
  UnifiedAssignment, 
  StudentAssignmentProgress,
  AssignmentType 
} from '@/types/unified-assignment'
import { Assignment, Submission } from '@/types/assignment'

interface UnifiedAssignmentContextType {
  // All assignments (teacher view)
  assignments: UnifiedAssignment[]
  loading: boolean
  error: string | null
  
  // Student progress
  studentProgress: StudentAssignmentProgress[]
  studentLoading: boolean
  
  // CRUD operations
  createAssignment: (data: CreateAssignmentData) => Promise<UnifiedAssignment>
  updateAssignment: (id: string, updates: Partial<UnifiedAssignment>) => Promise<UnifiedAssignment>
  deleteAssignment: (id: string) => Promise<void>
  getAssignmentById: (id: string) => UnifiedAssignment | undefined
  
  // Student operations
  getStudentAssignments: () => Promise<StudentAssignmentProgress[]>
  startAssignment: (assignmentId: string) => Promise<void>
  saveProgress: (assignmentId: string, progress: any) => Promise<void>
  submitAssignment: (assignmentId: string, submission: any) => Promise<void>
  
  // Utility functions
  refreshAssignments: () => Promise<void>
  filterAssignmentsByType: (type: AssignmentType) => UnifiedAssignment[]
  getAssignmentsByStudent: (studentId: string) => StudentAssignmentProgress[]
  
  // Legacy compatibility (will be removed after migration)
  getLegacyAssignment: (id: string) => Assignment | undefined
  getLegacySubmission: (assignmentId: string, userId?: string) => Submission | undefined
}

interface CreateAssignmentData {
  type: AssignmentType
  referenceId?: string  // For existing content (lessons, simulations)
  title: string
  description?: string
  instructions?: string
  courseId?: string
  assignedStudents?: string[]
  dueDate?: string
  config?: any  // Type-specific configuration
  questions?: any[]  // For homework/embedded assignments
  maxAttempts?: number
  timeLimit?: number
  published?: boolean
}

const UnifiedAssignmentContext = createContext<UnifiedAssignmentContextType | undefined>(undefined)

export function UnifiedAssignmentProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  
  // State
  const [assignments, setAssignments] = useState<UnifiedAssignment[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentAssignmentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [studentLoading, setStudentLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Load assignments based on user role
  useEffect(() => {
    if (session?.user?.email) {
      if (userRole === 'admin' || userRole === 'teacher') {
        loadTeacherAssignments()
      } else if (userRole === 'student') {
        loadStudentAssignments()
      }
    } else {
      setLoading(false)
    }
  }, [session, userRole])
  
  // Load all assignments for teachers/admins
  const loadTeacherAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/unified-assignments')
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      
      const data = await response.json()
      setAssignments(data.assignments || data || [])
    } catch (err) {
      console.error('Error loading assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Load student's assignments
  const loadStudentAssignments = useCallback(async () => {
    if (!session?.user?.email) return
    
    try {
      setStudentLoading(true)
      setError(null)
      
      const response = await fetch('/api/unified-assignments/student')
      if (!response.ok) {
        throw new Error('Failed to fetch student assignments')
      }
      
      const data = await response.json()
      setStudentProgress(data.assignments || data || [])
    } catch (err) {
      console.error('Error loading student assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setStudentLoading(false)
    }
  }, [session])
  
  // Create new assignment
  const createAssignment = useCallback(async (data: CreateAssignmentData): Promise<UnifiedAssignment> => {
    try {
      // Build assignment object based on type
      const assignmentData: any = {
        assignment_type: data.type,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        course_id: data.courseId,
        assigned_students: data.assignedStudents,
        due_date: data.dueDate,
        max_attempts: data.maxAttempts || 1,
        time_limit: data.timeLimit,
        published: data.published !== false,
        assigned_by: session?.user?.email || ''
      }
      
      // Handle different assignment types
      switch (data.type) {
        case 'lesson':
          assignmentData.reference_id = data.referenceId // lesson ID
          break
          
        case 'homework':
          // For homework, create the assignment content first if needed
          if (data.questions && data.questions.length > 0) {
            // Create homework assignment
            const homeworkResponse = await fetch('/api/assignments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: data.title,
                description: data.description,
                questions: data.questions,
                published: data.published,
                total_points: data.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)
              })
            })
            
            if (!homeworkResponse.ok) {
              throw new Error('Failed to create homework assignment')
            }
            
            const homework = await homeworkResponse.json()
            assignmentData.reference_id = homework.id
          } else if (data.referenceId) {
            assignmentData.reference_id = data.referenceId
          } else {
            throw new Error('Homework assignments require questions or a reference ID')
          }
          break
          
        case 'simulation':
          assignmentData.reference_id = data.referenceId // simulation slug or ID
          assignmentData.config = data.config || {
            min_time_required: 10,
            requires_data_export: false
          }
          break
          
        case 'simulation_embedded':
          assignmentData.reference_id = data.referenceId // simulation slug
          assignmentData.questions = data.questions || []
          assignmentData.config = data.config || {
            show_on_start: false,
            show_on_complete: true,
            allow_skip: true
          }
          break
          
        case 'vocabulary':
          assignmentData.reference_id = data.referenceId // vocabulary set ID
          break
          
        default:
          throw new Error(`Unknown assignment type: ${data.type}`)
      }
      
      // Create unified assignment
      const response = await fetch('/api/unified-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assignment')
      }
      
      const newAssignment = await response.json()
      
      // Update local state
      setAssignments(prev => [...prev, newAssignment])
      
      return newAssignment
    } catch (err) {
      console.error('Error creating assignment:', err)
      throw err
    }
  }, [session])
  
  // Update assignment
  const updateAssignment = useCallback(async (id: string, updates: Partial<UnifiedAssignment>): Promise<UnifiedAssignment> => {
    try {
      const response = await fetch(`/api/unified-assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update assignment')
      }
      
      const updated = await response.json()
      
      // Update local state
      setAssignments(prev => prev.map(a => a.id === id ? updated : a))
      
      return updated
    } catch (err) {
      console.error('Error updating assignment:', err)
      throw err
    }
  }, [])
  
  // Delete assignment
  const deleteAssignment = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/unified-assignments/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete assignment')
      }
      
      // Update local state
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting assignment:', err)
      throw err
    }
  }, [])
  
  // Get assignment by ID
  const getAssignmentById = useCallback((id: string): UnifiedAssignment | undefined => {
    return assignments.find(a => a.id === id)
  }, [assignments])
  
  // Student operations
  const getStudentAssignments = useCallback(async (): Promise<StudentAssignmentProgress[]> => {
    await loadStudentAssignments()
    return studentProgress
  }, [loadStudentAssignments, studentProgress])
  
  const startAssignment = useCallback(async (assignmentId: string): Promise<void> => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/unified-assignments/${assignmentId}/start`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to start assignment')
      }
      
      // Reload student assignments to get updated status
      await loadStudentAssignments()
    } catch (err) {
      console.error('Error starting assignment:', err)
      throw err
    }
  }, [session, loadStudentAssignments])
  
  const saveProgress = useCallback(async (assignmentId: string, progress: any): Promise<void> => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/unified-assignments/${assignmentId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save progress')
      }
    } catch (err) {
      console.error('Error saving progress:', err)
      throw err
    }
  }, [session])
  
  const submitAssignment = useCallback(async (assignmentId: string, submission: any): Promise<void> => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/unified-assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit assignment')
      }
      
      // Reload to get updated status
      await loadStudentAssignments()
    } catch (err) {
      console.error('Error submitting assignment:', err)
      throw err
    }
  }, [session, loadStudentAssignments])
  
  // Utility functions
  const refreshAssignments = useCallback(async (): Promise<void> => {
    if (userRole === 'admin' || userRole === 'teacher') {
      await loadTeacherAssignments()
    } else if (userRole === 'student') {
      await loadStudentAssignments()
    }
  }, [userRole, loadTeacherAssignments, loadStudentAssignments])
  
  const filterAssignmentsByType = useCallback((type: AssignmentType): UnifiedAssignment[] => {
    return assignments.filter(a => a.assignment_type === type)
  }, [assignments])
  
  const getAssignmentsByStudent = useCallback((studentId: string): StudentAssignmentProgress[] => {
    return studentProgress.filter(p => p.student_id === studentId)
  }, [studentProgress])
  
  // Legacy compatibility functions (temporary)
  const getLegacyAssignment = useCallback((id: string): Assignment | undefined => {
    const unified = assignments.find(a => a.id === id || a.reference_id === id)
    if (!unified) return undefined
    
    // Convert unified assignment to legacy format
    // This is a temporary adapter until all components are migrated
    return {
      id: unified.id,
      title: unified.title,
      description: unified.description || '',
      questions: [], // Would need to fetch from reference
      total_points: unified.max_score || 0,
      published: unified.published,
      created_at: unified.created_at,
      updated_at: unified.updated_at,
      created_by: unified.assigned_by
    } as Assignment
  }, [assignments])
  
  const getLegacySubmission = useCallback((assignmentId: string, userId?: string): Submission | undefined => {
    const progress = studentProgress.find(p => 
      p.unified_assignment_id === assignmentId && 
      (!userId || p.student_id === userId)
    )
    
    if (!progress) return undefined
    
    // Convert to legacy submission format
    return {
      id: progress.id,
      assignment_id: assignmentId,
      user_id: progress.student_id,
      answers: progress.submission_data || {},
      score: progress.score || 0,
      max_score: progress.max_score || 0,
      feedback: progress.feedback,
      status: progress.status as any,
      submitted_at: progress.submitted_at || '',
      graded_at: progress.graded_at || '',
      created_at: progress.created_at,
      updated_at: progress.updated_at
    } as Submission
  }, [studentProgress])
  
  const value: UnifiedAssignmentContextType = {
    assignments,
    loading,
    error,
    studentProgress,
    studentLoading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    getStudentAssignments,
    startAssignment,
    saveProgress,
    submitAssignment,
    refreshAssignments,
    filterAssignmentsByType,
    getAssignmentsByStudent,
    getLegacyAssignment,
    getLegacySubmission
  }
  
  return (
    <UnifiedAssignmentContext.Provider value={value}>
      {children}
    </UnifiedAssignmentContext.Provider>
  )
}

// Custom hook with error handling
export function useUnifiedAssignments() {
  const context = useContext(UnifiedAssignmentContext)
  if (!context) {
    throw new Error('useUnifiedAssignments must be used within UnifiedAssignmentProvider')
  }
  return context
}

// Convenience hooks for specific assignment types
export function useSimulationAssignments() {
  const { filterAssignmentsByType, ...rest } = useUnifiedAssignments()
  const simulations = filterAssignmentsByType('simulation')
  const simulationEmbedded = filterAssignmentsByType('simulation_embedded')
  
  return {
    simulations: [...simulations, ...simulationEmbedded],
    ...rest
  }
}

export function useHomeworkAssignments() {
  const { filterAssignmentsByType, ...rest } = useUnifiedAssignments()
  return {
    homework: filterAssignmentsByType('homework'),
    ...rest
  }
}

export function useLessonAssignments() {
  const { filterAssignmentsByType, ...rest } = useUnifiedAssignments()
  return {
    lessons: filterAssignmentsByType('lesson'),
    ...rest
  }
}
