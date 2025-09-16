"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Assignment, Submission, Question } from '@/types/assignment'

interface AssignmentContextType {
  assignments: Assignment[]
  submissions: Submission[]
  loading: boolean
  createAssignment: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>
  deleteAssignment: (id: string) => Promise<void>
  getAssignmentById: (id: string) => Assignment | undefined
  getSubmissionByAssignmentId: (assignmentId: string, userId?: string) => Submission | undefined
  refreshAssignments: () => Promise<void>
  refreshSubmissions: () => Promise<void>
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined)

// Helper function to strip large data from assignments before storing
function stripLargeData(assignment: Assignment): Assignment {
  return {
    ...assignment,
    questions: assignment.questions.map(q => ({
      ...q,
      // Remove base64 images which can be very large
      scenarioImage: q.scenarioImage?.startsWith('data:image') ? undefined : q.scenarioImage
    }))
  }
}

// Helper function to safely store in localStorage with error handling
function safeLocalStorageSet(key: string, data: unknown[]): boolean {
  try {
    // Strip large data before storing
    const dataToStore = data.map((item: unknown) => 
      (item as Assignment).questions ? stripLargeData(item as Assignment) : item
    )
    
    const stringified = JSON.stringify(dataToStore)
    const sizeInMB = new Blob([stringified]).size / (1024 * 1024)
    
    // Warn if data is getting large
    if (sizeInMB > 2) {
      console.warn(`Storage data is ${sizeInMB.toFixed(2)}MB - approaching localStorage limits`)
    }
    
    // Check if we're close to quota
    if (sizeInMB > 4) {
      console.error('Data too large for localStorage, stripping additional data...')
      // Strip even more data if needed
      const minimalData = dataToStore.map((item: unknown) => ({
        ...(item as Assignment),
        questions: (item as Assignment).questions?.map((q: Question) => ({
          ...q,
          scenarioImage: undefined,
          explanation: undefined,
          sampleAnswer: undefined
        }))
      }))
      localStorage.setItem(key, JSON.stringify(minimalData))
      return true
    }
    
    // Try to store
    localStorage.setItem(key, stringified)
    return true
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Clearing old data...')
      
      // Try to clear old data and retry
      try {
        // Clear other potential large items first
        const keysToCheck = ['physics-submissions', 'physics-temp-data', 'physics-cache']
        keysToCheck.forEach(k => {
          if (localStorage.getItem(k)) {
            localStorage.removeItem(k)
            console.log(`Cleared ${k} from localStorage`)
          }
        })
        
        // Store minimal data only
        const minimalData = data.map((item: unknown) => {
          const assignment = item as Assignment
          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            lesson_id: assignment.lesson_id,
            total_points: assignment.total_points,
            published: assignment.published,
            created_at: assignment.created_at,
            updated_at: assignment.updated_at,
            questions: assignment.questions?.map((q: Question) => ({
              id: q.id,
              type: q.type,
              question: q.question,
              points: q.points,
              ...(q.type === 'multiple-choice' && { options: (q as any).options }),
              ...(q.type === 'multiple-choice' && { correctAnswer: (q as any).correctAnswer }),
              ...(q.type === 'open-response' && { rubric: (q as any).rubric })
            }))
          }
        })
        
        localStorage.setItem(key, JSON.stringify(minimalData))
        console.log('Successfully stored minimal data after quota exceeded')
        return true
      } catch (retryError) {
        console.error('Failed to store even minimal data:', retryError)
        alert('Storage quota exceeded. Assignment saved in memory but not persisted. Consider clearing browser data.')
        return false
      }
    }
    console.error('localStorage error:', error)
    return false
  }
}

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clean up localStorage on mount if needed
    try {
      const assignmentsSize = localStorage.getItem('physics-assignments')?.length || 0
      const submissionsSize = localStorage.getItem('physics-submissions')?.length || 0
      const totalSizeMB = (assignmentsSize + submissionsSize) / (1024 * 1024)
      
      if (totalSizeMB > 3) {
        console.warn(`localStorage is using ${totalSizeMB.toFixed(2)}MB. Consider cleanup.`)
        
        // If very large, do automatic cleanup of images
        if (totalSizeMB > 4) {
          const assignments = JSON.parse(localStorage.getItem('physics-assignments') || '[]')
          const cleaned = assignments.map((a: Assignment) => stripLargeData(a))
          safeLocalStorageSet('physics-assignments', cleaned)
          console.log('Automatically cleaned up large data from localStorage')
        }
      }
    } catch (error) {
      console.error('Error checking localStorage:', error)
    }
    
    if (session) {
      refreshAssignments()
      refreshSubmissions()
    } else {
      setAssignments([])
      setSubmissions([])
      setLoading(false)
    }
  }, [session])

  const refreshAssignments = async () => {
    try {
      setLoading(true)
      // In a real app, this would fetch from your backend
      // For now, we'll use localStorage to persist assignments across sessions
      const stored = localStorage.getItem('physics-assignments')
      if (stored) {
        const parsedAssignments = JSON.parse(stored)
        setAssignments(parsedAssignments)
      } else {
        setAssignments([])
      }
    } catch (error) {
      console.error('Error refreshing assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const refreshSubmissions = async () => {
    try {
      // In a real app, this would fetch from your backend
      // For now, we'll use localStorage to persist submissions
      const stored = localStorage.getItem('physics-submissions')
      if (stored) {
        const parsedSubmissions = JSON.parse(stored)
        setSubmissions(parsedSubmissions)
      } else {
        setSubmissions([])
      }
    } catch (error) {
      console.error('Error refreshing submissions:', error)
      setSubmissions([])
    }
  }

  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newAssignment: Assignment = {
        ...assignmentData,
        id: `assignment-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const updatedAssignments = [...assignments, newAssignment]
      setAssignments(updatedAssignments)
      
      // Persist to localStorage with error handling
      safeLocalStorageSet('physics-assignments', updatedAssignments)
      
      console.log('Assignment created:', newAssignment)
    } catch (error) {
      console.error('Error creating assignment:', error)
      throw error
    }
  }

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    try {
      const updatedAssignments = assignments.map(assignment =>
        assignment.id === id 
          ? { ...assignment, ...updates, updated_at: new Date().toISOString() }
          : assignment
      )
      
      setAssignments(updatedAssignments)
      safeLocalStorageSet('physics-assignments', updatedAssignments)
      
      console.log('Assignment updated:', id, updates)
    } catch (error) {
      console.error('Error updating assignment:', error)
      throw error
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      const updatedAssignments = assignments.filter(assignment => assignment.id !== id)
      setAssignments(updatedAssignments)
      safeLocalStorageSet('physics-assignments', updatedAssignments)
      
      // Also remove related submissions
      const updatedSubmissions = submissions.filter(submission => submission.assignment_id !== id)
      setSubmissions(updatedSubmissions)
      safeLocalStorageSet('physics-submissions', updatedSubmissions)
      
      console.log('Assignment deleted:', id)
    } catch (error) {
      console.error('Error deleting assignment:', error)
      throw error
    }
  }

  const getAssignmentById = (id: string): Assignment | undefined => {
    return assignments.find(assignment => assignment.id === id)
  }

  const getSubmissionByAssignmentId = (assignmentId: string, userId?: string): Submission | undefined => {
    const targetUserId = userId || session?.user?.id
    if (!targetUserId) return undefined
    
    return submissions.find(submission => 
      submission.assignment_id === assignmentId && submission.user_id === targetUserId
    )
  }

  const value: AssignmentContextType = {
    assignments,
    submissions,
    loading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    getSubmissionByAssignmentId,
    refreshAssignments,
    refreshSubmissions
  }

  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  )
}

export function useAssignments() {
  const context = useContext(AssignmentContext)
  if (context === undefined) {
    throw new Error('useAssignments must be used within an AssignmentProvider')
  }
  return context
}

// Submission management functions
export function saveSubmission(submission: Omit<Submission, 'id' | 'submitted_at'>) {
  try {
    const newSubmission: Submission = {
      ...submission,
      id: `submission-${Date.now()}`,
      submitted_at: new Date().toISOString()
    }

    const stored = localStorage.getItem('physics-submissions')
    const existingSubmissions = stored ? JSON.parse(stored) : []
    
    // Remove any existing submission for this assignment/user combo
    const filteredSubmissions = existingSubmissions.filter(
      (sub: Submission) => !(sub.assignment_id === submission.assignment_id && sub.user_id === submission.user_id)
    )
    
    const updatedSubmissions = [...filteredSubmissions, newSubmission]
    localStorage.setItem('physics-submissions', JSON.stringify(updatedSubmissions))
    
    return newSubmission
  } catch (error) {
    console.error('Error saving submission:', error)
    throw error
  }
}

export function getSubmission(assignmentId: string, userId: string): Submission | undefined {
  try {
    const stored = localStorage.getItem('physics-submissions')
    if (!stored) return undefined
    
    const submissions = JSON.parse(stored)
    return submissions.find((sub: Submission) => 
      sub.assignment_id === assignmentId && sub.user_id === userId
    )
  } catch (error) {
    console.error('Error getting submission:', error)
    return undefined
  }
}
