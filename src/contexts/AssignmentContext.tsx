"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Assignment, Submission } from '@/types/assignment'

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

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      
      // Persist to localStorage
      localStorage.setItem('physics-assignments', JSON.stringify(updatedAssignments))
      
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
      localStorage.setItem('physics-assignments', JSON.stringify(updatedAssignments))
      
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
      localStorage.setItem('physics-assignments', JSON.stringify(updatedAssignments))
      
      // Also remove related submissions
      const updatedSubmissions = submissions.filter(submission => submission.assignment_id !== id)
      setSubmissions(updatedSubmissions)
      localStorage.setItem('physics-submissions', JSON.stringify(updatedSubmissions))
      
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
