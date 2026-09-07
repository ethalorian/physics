"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { VocabularyTerm } from '@/types/assignment'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'

// ============================================================================
// TYPES
// ============================================================================

interface VocabularySet {
  id: string
  name: string
  description?: string
  unit?: string
  lesson?: string
  terms: VocabularyTerm[]
  published: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

interface VocabularyContextType {
  vocabularySets: VocabularySet[]
  publishedVocabularySets: VocabularySet[]
  loading: boolean
  error: string | null
  createVocabularySet: (vocabularySet: Omit<VocabularySet, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateVocabularySet: (id: string, updates: Partial<VocabularySet>) => Promise<void>
  deleteVocabularySet: (id: string) => Promise<void>
  getVocabularySetById: (id: string) => VocabularySet | undefined
  addTermToSet: (setId: string, term: Omit<VocabularyTerm, 'id'>) => Promise<void>
  updateTerm: (setId: string, termId: string, updates: Partial<VocabularyTerm>) => Promise<void>
  deleteTerm: (setId: string, termId: string) => Promise<void>
  refreshVocabularySets: () => Promise<void>
  publishVocabularySet: (id: string, published: boolean) => Promise<void>
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'physics-vocabulary-sets'
const VERSION_KEY = 'physics-vocabulary-version'
const CURRENT_VERSION = 'v2'

// ============================================================================
// CONTEXT
// ============================================================================

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for stable references in callbacks
  const vocabularySetsRef = useRef(vocabularySets)
  vocabularySetsRef.current = vocabularySets

  const userRole = getUserRole(session?.user?.email)
  const canAccessVocabulary = userRole === 'admin' || userRole === 'teacher'

  // ========================================
  // UTILITY: localStorage with fallback
  // ========================================
  
  const saveToStorage = useCallback((sets: VocabularySet[]) => {
    if (!canAccessVocabulary) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
    } catch (err) {
      console.warn('Failed to save to localStorage:', err)
    }
  }, [canAccessVocabulary])

  const loadFromStorage = useCallback((): VocabularySet[] | null => {
    if (!canAccessVocabulary) return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [canAccessVocabulary])

  // ========================================
  // UTILITY: server-confirmed writes
  // ========================================
  
  const executeWrite = useCallback(async (
    apiCall: () => Promise<Response>
  ): Promise<boolean> => {
    try {
      const response = await apiCall()
      if (!response.ok) throw new Error('Vocabulary could not save. Please retry before leaving this page.')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vocabulary could not save'
      setError(message)
      throw new Error(message)
    }
  }, [])

  // ========================================
  // DATA LOADING
  // ========================================

  const refreshVocabularySets = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setError(null)
    
    try {
      // Clear stale cache on version mismatch
      if (localStorage.getItem(VERSION_KEY) !== CURRENT_VERSION) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
      }
      
      const response = await fetch('/api/vocabulary')
      if (!response.ok) throw new Error('Failed to fetch vocabulary sets')
      
      const data = await response.json()
      setVocabularySets(data)
      saveToStorage(data)
    } catch (err) {
      console.error('Error loading vocabulary sets:', err)
      setError('Failed to load vocabulary sets')
      
      // Fallback to localStorage for admins/teachers only
      const stored = loadFromStorage()
      if (stored) {
        setVocabularySets(stored)
      } else if (!canAccessVocabulary) {
        setVocabularySets([])
      }
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, canAccessVocabulary, saveToStorage, loadFromStorage])

  // Lazy load on vocabulary pages. Keyed off usePathname (not window.location)
  // so it re-runs on App Router client-side navigation — otherwise soft-navigating
  // onto a vocab page never fetches and the games stay disabled until a refresh.
  useEffect(() => {
    const isVocabPage = !!pathname &&
      (pathname.includes('/vocabulary') || pathname.includes('/admin/vocabulary'))

    if (isVocabPage && session?.user?.id) {
      refreshVocabularySets()
    }
  }, [pathname, session?.user?.id, refreshVocabularySets])

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  const createVocabularySet = useCallback(async (
    data: Omit<VocabularySet, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const success = await executeWrite(
      () => fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    )
    
    if (success) await refreshVocabularySets()
  }, [executeWrite, refreshVocabularySets])

  const updateVocabularySet = useCallback(async (id: string, updates: Partial<VocabularySet>) => {
    const currentSet = vocabularySetsRef.current.find(s => s.id === id)
    if (!currentSet) throw new Error('Vocabulary set not found')

    const success = await executeWrite(
      () => fetch('/api/vocabulary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: updates.name ?? currentSet.name,
          description: updates.description ?? currentSet.description,
          unit: updates.unit ?? currentSet.unit,
          lesson: updates.lesson ?? currentSet.lesson,
          terms: updates.terms ?? currentSet.terms,
          published: updates.published ?? currentSet.published
        })
      })
    )
    
    if (success) await refreshVocabularySets()
  }, [executeWrite, refreshVocabularySets])

  const deleteVocabularySet = useCallback(async (id: string) => {
    const success = await executeWrite(
      () => fetch(`/api/vocabulary?id=${id}`, { method: 'DELETE' })
    )
    
    if (success) await refreshVocabularySets()
  }, [executeWrite, refreshVocabularySets])

  const publishVocabularySet = useCallback(async (id: string, published: boolean) => {
    await updateVocabularySet(id, { published })
  }, [updateVocabularySet])

  // ========================================
  // TERM OPERATIONS (delegate to updateVocabularySet)
  // ========================================

  const addTermToSet = useCallback(async (setId: string, termData: Omit<VocabularyTerm, 'id'>) => {
    const currentSet = vocabularySetsRef.current.find(s => s.id === setId)
    if (!currentSet) throw new Error('Vocabulary set not found')
    
    const newTerm = { ...termData, id: `term-${Date.now()}` }
    await updateVocabularySet(setId, { terms: [...currentSet.terms, newTerm] })
  }, [updateVocabularySet])

  const updateTerm = useCallback(async (setId: string, termId: string, updates: Partial<VocabularyTerm>) => {
    const currentSet = vocabularySetsRef.current.find(s => s.id === setId)
    if (!currentSet) throw new Error('Vocabulary set not found')
    
    const updatedTerms = currentSet.terms.map(t => 
      t.id === termId ? { ...t, ...updates } : t
    )
    await updateVocabularySet(setId, { terms: updatedTerms })
  }, [updateVocabularySet])

  const deleteTerm = useCallback(async (setId: string, termId: string) => {
    const currentSet = vocabularySetsRef.current.find(s => s.id === setId)
    if (!currentSet) throw new Error('Vocabulary set not found')
    
    const updatedTerms = currentSet.terms.filter(t => t.id !== termId)
    await updateVocabularySet(setId, { terms: updatedTerms })
  }, [updateVocabularySet])

  // ========================================
  // QUERY OPERATIONS
  // ========================================

  const getVocabularySetById = useCallback((id: string) => {
    return vocabularySets.find(set => set.id === id)
  }, [vocabularySets])

  const publishedVocabularySets = useMemo(() => vocabularySets.filter(set => set.published), [vocabularySets])

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value = useMemo<VocabularyContextType>(() => ({
    vocabularySets,
    publishedVocabularySets,
    loading,
    error,
    createVocabularySet,
    updateVocabularySet,
    deleteVocabularySet,
    getVocabularySetById,
    addTermToSet,
    updateTerm,
    deleteTerm,
    refreshVocabularySets,
    publishVocabularySet
  }), [vocabularySets, publishedVocabularySets, loading, error, createVocabularySet, updateVocabularySet,
    deleteVocabularySet, getVocabularySetById, addTermToSet, updateTerm, deleteTerm, refreshVocabularySets, publishVocabularySet])

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useVocabulary() {
  const context = useContext(VocabularyContext)
  if (!context) {
    throw new Error('useVocabulary must be used within a VocabularyProvider')
  }
  return context
}

export type { VocabularySet }
