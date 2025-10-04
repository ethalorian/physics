"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Assignment, Submission } from '@/types/assignment'

interface AssignmentContextType {
  assignments: Assignment[]
  submissions: Submission[]
  loading: boolean
  error: string | null
  createAssignment: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<Assignment>
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<Assignment>
  deleteAssignment: (id: string) => Promise<void>
  getAssignmentById: (id: string) => Assignment | undefined
  getSubmissionByAssignmentId: (assignmentId: string, userId?: string) => Submission | undefined
  saveSubmission: (submission: Omit<Submission, 'id' | 'created_at' | 'updated_at'>) => Promise<Submission>
  updateSubmission: (id: string, updates: Partial<Submission>) => Promise<Submission>
  refreshAssignments: () => Promise<void>
  refreshSubmissions: () => Promise<void>
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined)

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch assignments on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      refreshAssignments()
      refreshSubmissions()
    } else {
      setAssignments([])
      setSubmissions([])
      setLoading(false)
    }
  }, [session])

  // Fetch assignments from API
  const refreshAssignments = useCallback(async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/assignments')
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }

      const data = await response.json()
      setAssignments(data)

    } catch (err) {
      console.error('Error refreshing assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [session])

  // Fetch submissions from API
  const refreshSubmissions = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setError(null)

      const response = await fetch('/api/submissions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data)

    } catch (err) {
      console.error('Error refreshing submissions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load submissions')
      setSubmissions([])
    }
  }, [session])

  // Create new assignment
  const createAssignment = useCallback(async (
    assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Assignment> => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create assignment')
      }

      const newAssignment = await response.json()
      
      // Update local state
      setAssignments(prev => [newAssignment, ...prev])
      
      return newAssignment

    } catch (err) {
      console.error('Error creating assignment:', err)
      throw err
    }
  }, [])

  // Update assignment
  const updateAssignment = useCallback(async (
    id: string,
    updates: Partial<Assignment>
  ): Promise<Assignment> => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update assignment')
      }

      const updatedAssignment = await response.json()
      
      // Update local state
      setAssignments(prev => 
        prev.map(a => a.id === id ? updatedAssignment : a)
      )
      
      return updatedAssignment

    } catch (err) {
      console.error('Error updating assignment:', err)
      throw err
    }
  }, [])

  // Delete assignment
  const deleteAssignment = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/assignments?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete assignment')
      }

      // Update local state
      setAssignments(prev => prev.filter(a => a.id !== id))
      
      // Also remove associated submissions
      setSubmissions(prev => prev.filter(s => s.assignment_id !== id))

    } catch (err) {
      console.error('Error deleting assignment:', err)
      throw err
    }
  }, [])

  // Save submission (create or update)
  const saveSubmission = useCallback(async (
    submissionData: Omit<Submission, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Submission> => {
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save submission')
      }

      const savedSubmission = await response.json()
      
      // Update local state
      setSubmissions(prev => {
        const existing = prev.findIndex(
          s => s.assignment_id === savedSubmission.assignment_id && 
               s.user_id === savedSubmission.user_id
        )
        
        if (existing >= 0) {
          // Update existing
          const newSubmissions = [...prev]
          newSubmissions[existing] = savedSubmission
          return newSubmissions
        } else {
          // Add new
          return [savedSubmission, ...prev]
        }
      })
      
      return savedSubmission

    } catch (err) {
      console.error('Error saving submission:', err)
      throw err
    }
  }, [])

  // Update submission
  const updateSubmission = useCallback(async (
    id: string,
    updates: Partial<Submission>
  ): Promise<Submission> => {
    try {
      const response = await fetch('/api/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update submission')
      }

      const updatedSubmission = await response.json()
      
      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === id ? updatedSubmission : s)
      )
      
      return updatedSubmission

    } catch (err) {
      console.error('Error updating submission:', err)
      throw err
    }
  }, [])

  // Get assignment by ID from local state
  const getAssignmentById = useCallback((id: string): Assignment | undefined => {
    return assignments.find(a => a.id === id)
  }, [assignments])

  // Get submission by assignment ID and user ID
  const getSubmissionByAssignmentId = useCallback((
    assignmentId: string,
    userId?: string
  ): Submission | undefined => {
    const targetUserId = userId || session?.user?.id
    if (!targetUserId) return undefined
    
    return submissions.find(s => 
      s.assignment_id === assignmentId && s.user_id === targetUserId
    )
  }, [submissions, session])

  const value: AssignmentContextType = {
    assignments,
    submissions,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    getSubmissionByAssignmentId,
    saveSubmission,
    updateSubmission,
    refreshAssignments,
    refreshSubmissions
  }

  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  )
}

// Hook to use the assignment context
export function useAssignments() {
  const context = useContext(AssignmentContext)
  if (context === undefined) {
    throw new Error('useAssignments must be used within an AssignmentProvider')
  }
  return context
}

// Export saveSubmission as standalone function for compatibility
export async function saveSubmission(
  submissionData: Omit<Submission, 'id' | 'created_at' | 'updated_at'>
): Promise<Submission> {
  const response = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submissionData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save submission')
  }

  return await response.json()
}

