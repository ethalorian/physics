"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import {
  LessonAssignment,
  AssignmentAssignment,
  StudentLessonAssignment,
  StudentAssignmentAssignment,
  UnifiedAssignment,
  UnifiedStudentAssignment,
  CreateLessonAssignmentRequest,
  CreateAssignmentAssignmentRequest,
  UpdateStudentAssignmentStatusRequest,
  AssignmentFilters,
  StudentAssignmentFilters,
  AssignmentAnalytics,
  StudentProgress
} from '@/types/assignment-system'

interface AssignmentSystemContextType {
  // Assignment management (teacher/admin)
  lessonAssignments: LessonAssignment[]
  assignmentAssignments: AssignmentAssignment[]
  loading: boolean
  
  // Student assignments (student view)
  studentLessonAssignments: StudentLessonAssignment[]
  studentAssignmentAssignments: StudentAssignmentAssignment[]
  studentLoading: boolean
  
  // Unified views
  allAssignments: UnifiedAssignment[]
  studentAssignments: UnifiedStudentAssignment[]
  
  // Analytics
  analytics: AssignmentAnalytics | null
  studentProgress: StudentProgress | null
  
  // CRUD operations for teachers/admins
  createLessonAssignment: (data: CreateLessonAssignmentRequest) => Promise<LessonAssignment>
  createAssignmentAssignment: (data: CreateAssignmentAssignmentRequest) => Promise<AssignmentAssignment>
  updateLessonAssignment: (id: string, updates: Partial<LessonAssignment>) => Promise<LessonAssignment>
  updateAssignmentAssignment: (id: string, updates: Partial<AssignmentAssignment>) => Promise<AssignmentAssignment>
  deleteLessonAssignment: (id: string) => Promise<void>
  deleteAssignmentAssignment: (id: string) => Promise<void>
  
  // Student progress tracking
  updateStudentAssignmentStatus: (
    assignmentType: 'lesson' | 'assignment',
    assignmentId: string,
    studentId: string,
    updates: UpdateStudentAssignmentStatusRequest
  ) => Promise<void>
  
  // Data fetching
  fetchAssignments: (filters?: AssignmentFilters) => Promise<void>
  fetchStudentAssignments: (studentId?: string, filters?: StudentAssignmentFilters) => Promise<void>
  fetchAnalytics: () => Promise<void>
  fetchStudentProgress: (studentId: string) => Promise<void>
  
  // Utility functions
  getAssignmentById: (id: string, type: 'lesson' | 'assignment') => LessonAssignment | AssignmentAssignment | undefined
  getStudentAssignment: (
    assignmentId: string, 
    studentId: string, 
    type: 'lesson' | 'assignment'
  ) => StudentLessonAssignment | StudentAssignmentAssignment | undefined
  
  refreshAll: () => Promise<void>
}

const AssignmentSystemContext = createContext<AssignmentSystemContextType | undefined>(undefined)

export function AssignmentSystemProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  
  // State for assignments (teacher/admin view)
  const [lessonAssignments, setLessonAssignments] = useState<LessonAssignment[]>([])
  const [assignmentAssignments, setAssignmentAssignments] = useState<AssignmentAssignment[]>([])
  const [loading, setLoading] = useState(false)
  
  // State for student assignments
  const [studentLessonAssignments, setStudentLessonAssignments] = useState<StudentLessonAssignment[]>([])
  const [studentAssignmentAssignments, setStudentAssignmentAssignments] = useState<StudentAssignmentAssignment[]>([])
  const [studentLoading, setStudentLoading] = useState(false)
  
  // Analytics and progress
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null)
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null)
  
  // Unified views
  const allAssignments: UnifiedAssignment[] = React.useMemo(() => {
    const lessons = lessonAssignments.map(la => ({
      id: la.id,
      type: 'lesson' as const,
      content_id: la.lesson_id,
      title: la.title || la.lesson?.title || 'Untitled Lesson',
      description: la.lesson?.description,
      instructions: la.instructions,
      due_date: la.due_date,
      assigned_at: la.assigned_at,
      assigned_by: la.assigned_by,
      course_id: la.course_id,
      course_name: la.course?.name,
      assigned_students: la.assigned_students,
      total_assigned: la.total_assigned,
      total_started: la.total_started,
      total_completed: la.total_completed,
      completion_rate: la.total_assigned > 0 ? (la.total_completed / la.total_assigned) * 100 : 0,
      is_active: la.is_active,
      published: la.published,
      created_at: la.created_at,
      updated_at: la.updated_at
    }))
    
    const assignments = assignmentAssignments.map(aa => ({
      id: aa.id,
      type: 'assignment' as const,
      content_id: aa.assignment_id,
      title: aa.title || aa.assignment?.title || 'Untitled Assignment',
      description: aa.assignment?.description,
      instructions: aa.instructions,
      due_date: aa.due_date,
      assigned_at: aa.assigned_at,
      assigned_by: aa.assigned_by,
      course_id: aa.course_id,
      course_name: aa.course?.name,
      assigned_students: aa.assigned_students,
      total_assigned: aa.total_assigned,
      total_started: aa.total_started,
      total_completed: aa.total_completed,
      completion_rate: aa.total_assigned > 0 ? (aa.total_completed / aa.total_assigned) * 100 : 0,
      is_active: aa.is_active,
      published: aa.published,
      created_at: aa.created_at,
      updated_at: aa.updated_at
    }))
    
    return [...lessons, ...assignments].sort((a, b) => 
      new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    )
  }, [lessonAssignments, assignmentAssignments])
  
  const studentAssignments: UnifiedStudentAssignment[] = React.useMemo(() => {
    const lessons = studentLessonAssignments.map(sla => ({
      id: sla.id,
      type: 'lesson' as const,
      content_id: sla.lesson_assignment?.lesson_id || '',
      title: sla.lesson_assignment?.title || sla.lesson_assignment?.lesson?.title || 'Untitled Lesson',
      description: sla.lesson_assignment?.lesson?.description,
      instructions: sla.lesson_assignment?.instructions,
      due_date: sla.lesson_assignment?.due_date,
      assigned_at: sla.lesson_assignment?.assigned_at || sla.created_at,
      status: sla.status,
      progress_percentage: sla.progress_percentage,
      started_at: sla.started_at,
      completed_at: sla.completed_at,
      time_spent: sla.time_spent,
      last_accessed: sla.last_accessed,
      score: sla.score,
      max_score: sla.max_score,
      percentage: sla.score && sla.max_score ? (sla.score / sla.max_score) * 100 : undefined,
      feedback: sla.feedback,
      graded_at: sla.graded_at,
      created_at: sla.created_at,
      updated_at: sla.updated_at
    }))
    
    const assignments = studentAssignmentAssignments.map(saa => ({
      id: saa.id,
      type: 'assignment' as const,
      content_id: saa.assignment_assignment?.assignment_id || '',
      title: saa.assignment_assignment?.title || saa.assignment_assignment?.assignment?.title || 'Untitled Assignment',
      description: saa.assignment_assignment?.assignment?.description,
      instructions: saa.assignment_assignment?.instructions,
      due_date: saa.assignment_assignment?.due_date,
      assigned_at: saa.assignment_assignment?.assigned_at || saa.created_at,
      status: saa.status,
      started_at: saa.started_at,
      submitted_at: saa.submitted_at,
      time_spent: saa.time_spent,
      last_accessed: saa.last_accessed,
      score: saa.score,
      max_score: saa.max_score,
      percentage: saa.percentage,
      feedback: saa.feedback,
      graded_at: saa.graded_at,
      attempts_used: saa.attempts_used,
      max_attempts: saa.assignment_assignment?.max_attempts,
      current_submission_id: saa.current_submission_id,
      created_at: saa.created_at,
      updated_at: saa.updated_at
    }))
    
    return [...lessons, ...assignments].sort((a, b) => 
      new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    )
  }, [studentLessonAssignments, studentAssignmentAssignments])
  
  // CRUD operations
  const createLessonAssignment = useCallback(async (data: CreateLessonAssignmentRequest): Promise<LessonAssignment> => {
    const response = await fetch('/api/assignments/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create lesson assignment')
    }
    
    const result = await response.json()
    setLessonAssignments(prev => [result.assignment, ...prev])
    return result.assignment
  }, [])
  
  const createAssignmentAssignment = useCallback(async (data: CreateAssignmentAssignmentRequest): Promise<AssignmentAssignment> => {
    const response = await fetch('/api/assignments/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create assignment assignment')
    }
    
    const result = await response.json()
    setAssignmentAssignments(prev => [result.assignment, ...prev])
    return result.assignment
  }, [])
  
  const updateLessonAssignment = useCallback(async (id: string, updates: Partial<LessonAssignment>): Promise<LessonAssignment> => {
    const response = await fetch(`/api/assignments/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update lesson assignment')
    }
    
    const result = await response.json()
    setLessonAssignments(prev => prev.map(la => la.id === id ? result.assignment : la))
    return result.assignment
  }, [])
  
  const updateAssignmentAssignment = useCallback(async (id: string, updates: Partial<AssignmentAssignment>): Promise<AssignmentAssignment> => {
    const response = await fetch(`/api/assignments/homework/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update assignment assignment')
    }
    
    const result = await response.json()
    setAssignmentAssignments(prev => prev.map(aa => aa.id === id ? result.assignment : aa))
    return result.assignment
  }, [])
  
  const deleteLessonAssignment = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/assignments/lessons/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete lesson assignment')
    }
    
    setLessonAssignments(prev => prev.filter(la => la.id !== id))
  }, [])
  
  const deleteAssignmentAssignment = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/assignments/homework/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete assignment assignment')
    }
    
    setAssignmentAssignments(prev => prev.filter(aa => aa.id !== id))
  }, [])
  
  const updateStudentAssignmentStatus = useCallback(async (
    assignmentType: 'lesson' | 'assignment',
    assignmentId: string,
    studentId: string,
    updates: UpdateStudentAssignmentStatusRequest
  ): Promise<void> => {
    const response = await fetch('/api/assignments/student', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_type: assignmentType,
        assignment_id: assignmentId,
        student_id: studentId,
        ...updates
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update student assignment status')
    }
    
    // Refresh student assignments to reflect changes
    await fetchStudentAssignments()
  }, [])
  
  // Data fetching
  const fetchAssignments = useCallback(async (filters?: AssignmentFilters): Promise<void> => {
    if (userRole !== 'admin' && userRole !== 'teacher') return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.course_id) params.append('course_id', filters.course_id)
      if (filters?.assigned_by) params.append('assigned_by', filters.assigned_by)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.due_date_from) params.append('due_date_from', filters.due_date_from)
      if (filters?.due_date_to) params.append('due_date_to', filters.due_date_to)
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())
      if (filters?.published !== undefined) params.append('published', filters.published.toString())
      
      const [lessonsResponse, assignmentsResponse] = await Promise.all([
        fetch(`/api/assignments/lessons?${params.toString()}`),
        fetch(`/api/assignments/homework?${params.toString()}`)
      ])
      
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json()
        setLessonAssignments(lessonsData.assignments || [])
      }
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignmentAssignments(assignmentsData.assignments || [])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }, [userRole])
  
  const fetchStudentAssignments = useCallback(async (studentId?: string, filters?: StudentAssignmentFilters): Promise<void> => {
    setStudentLoading(true)
    try {
      const params = new URLSearchParams()
      if (studentId) params.append('student_id', studentId)
      if (filters?.course_id) params.append('course_id', filters.course_id)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.assignment_type) params.append('assignment_type', filters.assignment_type)
      if (filters?.due_date_from) params.append('due_date_from', filters.due_date_from)
      if (filters?.due_date_to) params.append('due_date_to', filters.due_date_to)
      if (filters?.overdue_only) params.append('overdue_only', filters.overdue_only.toString())
      
      const response = await fetch(`/api/assignments/student?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setStudentLessonAssignments(data.lesson_assignments || [])
        setStudentAssignmentAssignments(data.assignment_assignments || [])
      }
    } catch (error) {
      console.error('Error fetching student assignments:', error)
    } finally {
      setStudentLoading(false)
    }
  }, [])
  
  const fetchAnalytics = useCallback(async (): Promise<void> => {
    if (userRole !== 'admin' && userRole !== 'teacher') return
    
    try {
      const response = await fetch('/api/assignments/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }, [userRole])
  
  const fetchStudentProgress = useCallback(async (studentId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/assignments/student/progress?student_id=${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setStudentProgress(data)
      }
    } catch (error) {
      console.error('Error fetching student progress:', error)
    }
  }, [])
  
  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchAssignments(),
      fetchStudentAssignments(),
      fetchAnalytics()
    ])
  }, [fetchAssignments, fetchStudentAssignments, fetchAnalytics])
  
  // Utility functions
  const getAssignmentById = useCallback((id: string, type: 'lesson' | 'assignment') => {
    if (type === 'lesson') {
      return lessonAssignments.find(la => la.id === id)
    } else {
      return assignmentAssignments.find(aa => aa.id === id)
    }
  }, [lessonAssignments, assignmentAssignments])
  
  const getStudentAssignment = useCallback((
    assignmentId: string, 
    studentId: string, 
    type: 'lesson' | 'assignment'
  ) => {
    if (type === 'lesson') {
      return studentLessonAssignments.find(sla => 
        sla.lesson_assignment_id === assignmentId && sla.student_id === studentId
      )
    } else {
      return studentAssignmentAssignments.find(saa => 
        saa.assignment_assignment_id === assignmentId && saa.student_id === studentId
      )
    }
  }, [studentLessonAssignments, studentAssignmentAssignments])
  
  // Initialize data on mount
  useEffect(() => {
    if (session?.user?.email) {
      if (userRole === 'admin' || userRole === 'teacher') {
        fetchAssignments()
        fetchAnalytics()
      } else if (userRole === 'student') {
        fetchStudentAssignments()
      }
    }
  }, [session, userRole, fetchAssignments, fetchStudentAssignments, fetchAnalytics])
  
  const value: AssignmentSystemContextType = {
    lessonAssignments,
    assignmentAssignments,
    loading,
    studentLessonAssignments,
    studentAssignmentAssignments,
    studentLoading,
    allAssignments,
    studentAssignments,
    analytics,
    studentProgress,
    createLessonAssignment,
    createAssignmentAssignment,
    updateLessonAssignment,
    updateAssignmentAssignment,
    deleteLessonAssignment,
    deleteAssignmentAssignment,
    updateStudentAssignmentStatus,
    fetchAssignments,
    fetchStudentAssignments,
    fetchAnalytics,
    fetchStudentProgress,
    getAssignmentById,
    getStudentAssignment,
    refreshAll
  }
  
  return (
    <AssignmentSystemContext.Provider value={value}>
      {children}
    </AssignmentSystemContext.Provider>
  )
}

export function useAssignmentSystem() {
  const context = useContext(AssignmentSystemContext)
  if (context === undefined) {
    throw new Error('useAssignmentSystem must be used within an AssignmentSystemProvider')
  }
  return context
}

