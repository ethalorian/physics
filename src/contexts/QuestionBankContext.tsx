"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { QuestionBankItem, QuestionBankFilters, QuestionBankStats, Unit } from '@/types/question-bank'
import { Question } from '@/types/assignment'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'

interface QuestionBankContextType {
  questions: QuestionBankItem[]
  units: Unit[]
  filters: QuestionBankFilters
  filteredQuestions: QuestionBankItem[]
  stats: QuestionBankStats
  loading: boolean
  error: string | null
  addQuestion: (question: Omit<QuestionBankItem, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => Promise<void>
  updateQuestion: (id: string, updates: Partial<QuestionBankItem>) => Promise<void>
  deleteQuestion: (id: string) => Promise<void>
  setFilters: (filters: QuestionBankFilters) => void
  clearFilters: () => void
  searchQuestions: (query: string) => QuestionBankItem[]
  getQuestionsByUnit: (unitId: string) => QuestionBankItem[]
  getQuestionsByLesson: (lessonId: string) => QuestionBankItem[]
  incrementUsageCount: (questionId: string, assignmentId?: string) => Promise<void>
  duplicateQuestion: (questionId: string) => Promise<void>
  importQuestions: (questions: QuestionBankItem[]) => Promise<void>
  exportQuestions: (questionIds?: string[]) => QuestionBankItem[]
  refreshQuestions: () => Promise<void>
  ensureInitialized: () => Promise<void>
}

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined)

export function QuestionBankProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [filters, setFilters] = useState<QuestionBankFilters>({})
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([])
  const [loading, setLoading] = useState(false) // Start as false, only set to true when actually fetching
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false) // Track if we've attempted to load data

  // Fetch units from database
  const fetchUnits = useCallback(async () => {
    try {
      const response = await fetch('/api/question-bank/units')
      if (!response.ok) throw new Error('Failed to fetch units')
      const data = await response.json()
      setUnits(data)
    } catch (error) {
      console.error('Error fetching units:', error)
      setError('Failed to load units')
    }
  }, [])

  // Fetch questions from database
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (filters.units?.length) params.append('unit', filters.units.join(','))
      if (filters.lessons?.length) params.append('lesson', filters.lessons.join(','))
      if (filters.difficulty?.length) params.append('difficulty', filters.difficulty.join(','))
      if (filters.questionTypes?.length) params.append('type', filters.questionTypes.join(','))
      if (filters.topics?.length) params.append('topics', filters.topics.join(','))
      if (filters.tags?.length) params.append('tags', filters.tags.join(','))
      if (filters.searchText) params.append('search', filters.searchText)

      const response = await fetch(`/api/question-bank?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      
      const data = await response.json()
      
      // Transform database format to context format
      const transformedQuestions: QuestionBankItem[] = data.map((item: any) => ({
        id: item.id,
        question: item.question_data,
        unit: item.unit_id,
        lesson: item.lesson_id,
        topics: item.topics || [],
        difficulty: item.difficulty,
        usage_count: item.usage_count,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        tags: item.tags,
        estimated_time: item.estimated_time,
        cognitive_level: item.cognitive_level
      }))

      setQuestions(transformedQuestions)
      setFilteredQuestions(transformedQuestions)
    } catch (error) {
      console.error('Error fetching questions:', error)
      setError('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Check if user can access question bank
  const userRole = getUserRole(session?.user?.email)
  const canAccessQuestionBank = userRole === 'admin' || userRole === 'teacher'

  // Initialize data loading - only for authorized users
  const initializeData = useCallback(async () => {
    if (!canAccessQuestionBank || initialized) return
    
    try {
      setLoading(true)
      setError(null)
      await Promise.all([fetchUnits(), fetchQuestions()])
      setInitialized(true)
    } catch (error) {
      console.error('Error initializing question bank data:', error)
      setError('Failed to load question bank data')
    } finally {
      setLoading(false)
    }
  }, [canAccessQuestionBank, initialized, fetchUnits, fetchQuestions])

  // Load units and questions only for authorized users
  useEffect(() => {
    if (session?.user?.id && canAccessQuestionBank && !initialized) {
      initializeData()
    }
  }, [session, canAccessQuestionBank, initialized, initializeData])

  // Calculate stats
  const stats: QuestionBankStats = {
    total_questions: questions.length,
    by_unit: questions.reduce((acc, q) => {
      acc[q.unit] = (acc[q.unit] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    by_difficulty: {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
    },
    by_type: questions.reduce((acc, q) => {
      acc[q.question.type] = (acc[q.question.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    most_used: [...questions]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5),
    recently_added: [...questions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
  }

  const addQuestion = async (newQuestion: Omit<QuestionBankItem, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => {
    try {
      const response = await fetch('/api/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion.question,
          unit_id: newQuestion.unit,
          lesson_id: newQuestion.lesson,
          difficulty: newQuestion.difficulty,
          topics: newQuestion.topics,
          tags: newQuestion.tags,
          cognitive_level: newQuestion.cognitive_level,
          estimated_time: newQuestion.estimated_time
        })
      })

      if (!response.ok) throw new Error('Failed to add question')
      
      // Refresh questions to get the new one
      await fetchQuestions()
    } catch (error) {
      console.error('Error adding question:', error)
      throw error
    }
  }

  const updateQuestion = async (id: string, updates: Partial<QuestionBankItem>) => {
    try {
      const updateData: any = { id }
      
      if (updates.question) updateData.question_data = updates.question
      if (updates.unit) updateData.unit_id = updates.unit
      if (updates.lesson) updateData.lesson_id = updates.lesson
      if (updates.difficulty) updateData.difficulty = updates.difficulty
      if (updates.topics) updateData.topics = updates.topics
      if (updates.tags) updateData.tags = updates.tags
      if (updates.cognitive_level) updateData.cognitive_level = updates.cognitive_level
      if (updates.estimated_time) updateData.estimated_time = updates.estimated_time

      const response = await fetch('/api/question-bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) throw new Error('Failed to update question')
      
      // Refresh questions to get the updated one
      await fetchQuestions()
    } catch (error) {
      console.error('Error updating question:', error)
      throw error
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      const response = await fetch(`/api/question-bank?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete question')
      
      // Refresh questions
      await fetchQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
      throw error
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  const searchQuestions = (query: string): QuestionBankItem[] => {
    const searchLower = query.toLowerCase()
    return questions.filter(q => 
      q.question.question.toLowerCase().includes(searchLower) ||
      q.topics.some(t => t.toLowerCase().includes(searchLower)) ||
      q.tags?.some(t => t.toLowerCase().includes(searchLower))
    )
  }

  const getQuestionsByUnit = (unitId: string): QuestionBankItem[] => {
    return questions.filter(q => q.unit === unitId)
  }

  const getQuestionsByLesson = (lessonId: string): QuestionBankItem[] => {
    return questions.filter(q => q.lesson === lessonId)
  }

  const incrementUsageCount = async (questionId: string, assignmentId?: string) => {
    try {
      const response = await fetch('/api/question-bank/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, assignmentId })
      })

      if (!response.ok) throw new Error('Failed to increment usage count')
      
      // Update local state
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, usage_count: q.usage_count + 1 }
          : q
      ))
    } catch (error) {
      console.error('Error incrementing usage count:', error)
    }
  }

  const duplicateQuestion = async (questionId: string) => {
    const originalQuestion = questions.find(q => q.id === questionId)
    if (!originalQuestion) return

    const duplicate: Omit<QuestionBankItem, 'id' | 'created_at' | 'updated_at' | 'usage_count'> = {
      question: {
        ...originalQuestion.question,
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: `${originalQuestion.question.question} (Copy)`,
      },
      unit: originalQuestion.unit,
      lesson: originalQuestion.lesson,
      topics: originalQuestion.topics,
      difficulty: originalQuestion.difficulty,
      tags: originalQuestion.tags,
      cognitive_level: originalQuestion.cognitive_level,
      estimated_time: originalQuestion.estimated_time
    }

    await addQuestion(duplicate)
  }

  const importQuestions = async (importedQuestions: QuestionBankItem[]) => {
    try {
      // Add each question to the database
      for (const q of importedQuestions) {
        await addQuestion({
          question: q.question,
          unit: q.unit,
          lesson: q.lesson,
          topics: q.topics,
          difficulty: q.difficulty,
          tags: q.tags,
          cognitive_level: q.cognitive_level,
          estimated_time: q.estimated_time
        })
      }
      
      // Refresh questions
      await fetchQuestions()
    } catch (error) {
      console.error('Error importing questions:', error)
      throw error
    }
  }

  const exportQuestions = (questionIds?: string[]): QuestionBankItem[] => {
    if (questionIds && questionIds.length > 0) {
      return questions.filter(q => questionIds.includes(q.id))
    }
    return questions
  }

  const refreshQuestions = async () => {
    await fetchQuestions()
  }

  // Public method to initialize data (useful for components that need to ensure data is loaded)
  const ensureInitialized = useCallback(async () => {
    if (!initialized && canAccessQuestionBank) {
      await initializeData()
    }
  }, [initialized, canAccessQuestionBank, initializeData])

  return (
    <QuestionBankContext.Provider value={{
      questions,
      units,
      filters,
      filteredQuestions,
      stats,
      loading,
      error,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      setFilters,
      clearFilters,
      searchQuestions,
      getQuestionsByUnit,
      getQuestionsByLesson,
      incrementUsageCount,
      duplicateQuestion,
      importQuestions,
      exportQuestions,
      refreshQuestions,
      ensureInitialized
    }}>
      {children}
    </QuestionBankContext.Provider>
  )
}

export function useQuestionBank() {
  const context = useContext(QuestionBankContext)
  if (!context) {
    throw new Error('useQuestionBank must be used within a QuestionBankProvider')
  }
  return context
}