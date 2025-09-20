"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'

// Types for student activity data
export interface StudentActivity {
  id: string
  user_id: string
  user_email: string
  user_name: string
  activity_type: 'lesson_view' | 'assignment_start' | 'assignment_submit' | 'assignment_complete'
  lesson_id?: string
  assignment_id?: string
  session_duration?: number
  page_views?: number
  ip_address?: string
  user_agent?: string
  referrer?: string
  created_at: string
  updated_at: string
  lesson?: {
    id: string
    title: string
    slug: string
  }
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  user_id: string
  user_email: string
  user_name: string
  submission_data: any
  score?: number
  max_score?: number
  percentage?: number
  time_started?: string
  time_submitted: string
  time_spent?: number
  auto_graded: boolean
  manually_graded: boolean
  graded_by?: string
  graded_at?: string
  feedback?: string
  question_scores?: any
  created_at: string
  updated_at: string
}

export interface LessonProgress {
  id: string
  lesson_id: string
  user_id: string
  user_email: string
  user_name: string
  started_at: string
  last_accessed: string
  completed_at?: string
  total_time_spent: number
  visit_count: number
  sections_viewed: string[]
  progress_percentage: number
  created_at: string
  updated_at: string
  lesson?: {
    id: string
    title: string
    slug: string
  }
}

export interface StudentActivitySummary {
  user_email: string
  user_name: string
  total_lessons_viewed: number
  total_assignments_submitted: number
  avg_assignment_score: number
  last_activity: string
  lessons_in_progress: number
  assignments_completed: number
}

export interface AssignmentAnalytics {
  id: string
  assignment_id: string
  assignment_title: string
  total_assigned: number
  total_submitted: number
  total_completed: number
  avg_score?: number
  median_score?: number
  min_score?: number
  max_score?: number
  avg_time_spent?: number
  median_time_spent?: number
  last_calculated: string
  created_at: string
  updated_at: string
}

interface StudentActivityContextType {
  // Data
  activities: StudentActivity[]
  submissions: AssignmentSubmission[]
  lessonProgress: LessonProgress[]
  studentSummaries: StudentActivitySummary[]
  assignmentAnalytics: AssignmentAnalytics[]
  
  // State
  loading: boolean
  error: string | null
  initialized: boolean
  
  // Actions
  recordActivity: (activity: Partial<StudentActivity>) => Promise<void>
  recordSubmission: (submission: Partial<AssignmentSubmission>) => Promise<string>
  updateSubmissionGrade: (submissionId: string, score: number, maxScore: number, feedback?: string) => Promise<void>
  
  // Fetchers
  fetchStudentActivities: (filters?: { student_email?: string; activity_type?: string; lesson_id?: string; assignment_id?: string }) => Promise<void>
  fetchStudentSummaries: (studentEmail?: string) => Promise<void>
  fetchAssignmentSubmissions: (assignmentId?: string, studentEmail?: string) => Promise<void>
  
  // Utilities
  getStudentSummary: (studentEmail: string) => StudentActivitySummary | undefined
  getSubmissionsForAssignment: (assignmentId: string) => AssignmentSubmission[]
  getSubmissionsForStudent: (studentEmail: string) => AssignmentSubmission[]
  getLessonProgressForStudent: (studentEmail: string) => LessonProgress[]
  
  // Refresh
  refreshAll: () => Promise<void>
}

const StudentActivityContext = createContext<StudentActivityContextType | undefined>(undefined)

export function StudentActivityProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [activities, setActivities] = useState<StudentActivity[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [studentSummaries, setStudentSummaries] = useState<StudentActivitySummary[]>([])
  const [assignmentAnalytics, setAssignmentAnalytics] = useState<AssignmentAnalytics[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Check if user has permission to access activity data
  const userRole = getUserRole(session?.user?.email)
  const canAccessActivityData = userRole === 'admin' || userRole === 'teacher'

  // Initialize data on mount for authorized users
  useEffect(() => {
    if (session?.user?.id && canAccessActivityData && !initialized) {
      initializeData()
    }
  }, [session, canAccessActivityData, initialized])

  const initializeData = async () => {
    if (!canAccessActivityData) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Run all fetches in parallel but don't let one failure stop the others
      const results = await Promise.allSettled([
        fetchStudentSummaries(),
        fetchStudentActivities(),
        fetchAssignmentSubmissions()
      ])
      
      // Check if any critical errors occurred (not just missing data)
      const criticalErrors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason)
        .filter(error => error instanceof Error && !error.message.includes('404'))
      
      if (criticalErrors.length > 0) {
        console.warn('Some student activity services had issues:', criticalErrors)
        // Don't set error state unless it's a real authentication/network issue
      }
      
      setInitialized(true)
    } catch (err) {
      console.warn('Error initializing student activity data:', err)
      // Still mark as initialized even if some services failed
      setInitialized(true)
      // Only set error for critical issues
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const recordActivity = useCallback(async (activity: Partial<StudentActivity>) => {
    try {
      const response = await fetch('/api/student-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      })

      if (!response.ok) {
        throw new Error('Failed to record activity')
      }

      const result = await response.json()
      
      // Add to local state if we have the full activity object
      if (result.activity) {
        setActivities(prev => [result.activity, ...prev])
      }

    } catch (err) {
      console.error('Error recording activity:', err)
      throw err
    }
  }, [])

  const recordSubmission = useCallback(async (submission: Partial<AssignmentSubmission>): Promise<string> => {
    try {
      const response = await fetch('/api/assignment-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      })

      if (!response.ok) {
        throw new Error('Failed to record submission')
      }

      const result = await response.json()
      
      // Refresh submissions to get updated data
      if (submission.assignment_id) {
        await fetchAssignmentSubmissions(submission.assignment_id)
      }
      
      return result.submission_id

    } catch (err) {
      console.error('Error recording submission:', err)
      throw err
    }
  }, [])

  const updateSubmissionGrade = useCallback(async (
    submissionId: string, 
    score: number, 
    maxScore: number, 
    feedback?: string
  ) => {
    if (!canAccessActivityData) {
      throw new Error('Insufficient permissions to grade submissions')
    }

    try {
      const response = await fetch('/api/assignment-submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          score,
          max_score: maxScore,
          feedback
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update submission grade')
      }

      const result = await response.json()
      
      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId ? { ...sub, ...result.submission } : sub
      ))

    } catch (err) {
      console.error('Error updating submission grade:', err)
      throw err
    }
  }, [canAccessActivityData])

  const fetchStudentActivities = useCallback(async (filters?: {
    student_email?: string
    activity_type?: string
    lesson_id?: string
    assignment_id?: string
  }) => {
    if (!canAccessActivityData) return

    try {
      const params = new URLSearchParams()
      if (filters?.student_email) params.append('student_email', filters.student_email)
      if (filters?.activity_type) params.append('activity_type', filters.activity_type)
      if (filters?.lesson_id) params.append('lesson_id', filters.lesson_id)
      if (filters?.assignment_id) params.append('assignment_id', filters.assignment_id)

      const response = await fetch(`/api/student-activity?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.warn('Student activities API error:', response.status, errorData)
        
        // Don't throw error for 404s or empty data - just set empty array
        if (response.status === 404 || response.status === 500) {
          setActivities([])
          return
        }
        
        throw new Error(errorData.error || 'Failed to fetch student activities')
      }

      const result = await response.json()
      setActivities(result.activities || [])

    } catch (err) {
      console.warn('Error fetching student activities:', err)
      // Set empty array instead of error state for missing data
      setActivities([])
      // Only set error for actual network/auth issues
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
      }
    }
  }, [canAccessActivityData])

  const fetchStudentSummaries = useCallback(async (studentEmail?: string) => {
    if (!canAccessActivityData) return

    try {
      const params = new URLSearchParams()
      if (studentEmail) params.append('student_email', studentEmail)

      const response = await fetch(`/api/student-activity/summary?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.warn('Student summaries API error:', response.status, errorData)
        
        // Don't throw error for 404s or missing tables - just set empty arrays
        if (response.status === 404 || response.status === 500) {
          setStudentSummaries([])
          setLessonProgress([])
          setAssignmentAnalytics([])
          return
        }
        
        throw new Error(errorData.error || 'Failed to fetch student summaries')
      }

      const result = await response.json()
      
      // Merge activity data with imported roster data
      let summaries = result.summary || []
      
      // If we have imported roster data, merge it with activity summaries
      try {
        const rosterResponse = await fetch('/api/roster/students')
        if (rosterResponse.ok) {
          const rosterData = await rosterResponse.json()
          const rosterStudents = rosterData.students || []
          
          // Create summaries for students who don't have activity yet
          const existingEmails = new Set(summaries.map((s: any) => s.user_email))
          const newSummaries = rosterStudents
            .filter((student: any) => !existingEmails.has(student.email))
            .map((student: any) => ({
              user_email: student.email,
              user_name: student.name,
              total_lessons_viewed: 0,
              total_assignments_submitted: 0,
              avg_assignment_score: 0,
              last_activity: student.created_at,
              lessons_in_progress: 0,
              assignments_completed: 0
            }))
          
          summaries = [...summaries, ...newSummaries]
        }
      } catch (rosterErr) {
        console.warn('Could not fetch roster data for merging:', rosterErr)
      }
      
      setStudentSummaries(summaries)
      setLessonProgress(result.recent_lesson_progress || [])
      setAssignmentAnalytics(result.assignment_analytics || [])

    } catch (err) {
      console.warn('Error fetching student summaries:', err)
      // Set empty arrays instead of error state for missing data
      setStudentSummaries([])
      setLessonProgress([])
      setAssignmentAnalytics([])
      // Only set error for actual network/auth issues
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
      }
    }
  }, [canAccessActivityData])

  const fetchAssignmentSubmissions = useCallback(async (assignmentId?: string, studentEmail?: string) => {
    if (!canAccessActivityData) return

    try {
      const params = new URLSearchParams()
      if (assignmentId) params.append('assignment_id', assignmentId)
      if (studentEmail) params.append('student_email', studentEmail)

      const response = await fetch(`/api/assignment-submissions?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.warn('Assignment submissions API error:', response.status, errorData)
        
        // Don't throw error for 404s or missing tables - just set empty array
        if (response.status === 404 || response.status === 500) {
          setSubmissions([])
          return
        }
        
        throw new Error(errorData.error || 'Failed to fetch assignment submissions')
      }

      const result = await response.json()
      setSubmissions(result.submissions || [])

    } catch (err) {
      console.warn('Error fetching assignment submissions:', err)
      // Set empty array instead of error state for missing data
      setSubmissions([])
      // Only set error for actual network/auth issues
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
      }
    }
  }, [canAccessActivityData])

  const refreshAll = useCallback(async () => {
    if (!canAccessActivityData) return
    
    await initializeData()
  }, [canAccessActivityData, initializeData])

  // Utility functions
  const getStudentSummary = useCallback((studentEmail: string) => {
    return studentSummaries.find(summary => summary.user_email === studentEmail)
  }, [studentSummaries])

  const getSubmissionsForAssignment = useCallback((assignmentId: string) => {
    return submissions.filter(sub => sub.assignment_id === assignmentId)
  }, [submissions])

  const getSubmissionsForStudent = useCallback((studentEmail: string) => {
    return submissions.filter(sub => sub.user_email === studentEmail)
  }, [submissions])

  const getLessonProgressForStudent = useCallback((studentEmail: string) => {
    return lessonProgress.filter(progress => progress.user_email === studentEmail)
  }, [lessonProgress])

  const value: StudentActivityContextType = {
    // Data
    activities,
    submissions,
    lessonProgress,
    studentSummaries,
    assignmentAnalytics,
    
    // State
    loading,
    error,
    initialized,
    
    // Actions
    recordActivity,
    recordSubmission,
    updateSubmissionGrade,
    
    // Fetchers
    fetchStudentActivities,
    fetchStudentSummaries,
    fetchAssignmentSubmissions,
    
    // Utilities
    getStudentSummary,
    getSubmissionsForAssignment,
    getSubmissionsForStudent,
    getLessonProgressForStudent,
    
    // Refresh
    refreshAll
  }

  return (
    <StudentActivityContext.Provider value={value}>
      {children}
    </StudentActivityContext.Provider>
  )
}

export function useStudentActivity() {
  const context = useContext(StudentActivityContext)
  if (context === undefined) {
    throw new Error('useStudentActivity must be used within a StudentActivityProvider')
  }
  return context
}

// Hook for students to record their own activity (limited permissions)
export function useActivityTracking() {
  const { data: session } = useSession()
  
  const recordLessonView = useCallback(async (lessonId: string, sessionDuration?: number) => {
    if (!session?.user?.email) return
    
    try {
      await fetch('/api/student-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'lesson_view',
          lesson_id: lessonId,
          session_duration: sessionDuration
        })
      })
    } catch (err) {
      console.error('Error recording lesson view:', err)
    }
  }, [session])

  const recordAssignmentStart = useCallback(async (assignmentId: string) => {
    if (!session?.user?.email) return
    
    try {
      await fetch('/api/student-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'assignment_start',
          assignment_id: assignmentId
        })
      })
    } catch (err) {
      console.error('Error recording assignment start:', err)
    }
  }, [session])

  const recordAssignmentSubmission = useCallback(async (
    assignmentId: string,
    submissionData: any,
    timeStarted?: string,
    timeSpent?: number
  ) => {
    if (!session?.user?.email) return
    
    try {
      await fetch('/api/assignment-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          submission_data: submissionData,
          time_started: timeStarted,
          time_spent: timeSpent
        })
      })
    } catch (err) {
      console.error('Error recording assignment submission:', err)
    }
  }, [session])

  return {
    recordLessonView,
    recordAssignmentStart,
    recordAssignmentSubmission
  }
}
