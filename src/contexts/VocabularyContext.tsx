"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { VocabularyTerm } from '@/types/assignment'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'

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

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined)

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user can access vocabulary management
  const userRole = getUserRole(session?.user?.email)
  const canAccessVocabulary = userRole === 'admin' || userRole === 'teacher'

  // Load vocabulary sets from API
  // Students can load to see published sets, admin/teachers see all
  const refreshVocabularySets = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      // Clear old localStorage data that might not have published field
      // This ensures students get fresh data from the API with proper filtering
      const VOCAB_VERSION = 'v2' // Increment this to clear old cached data
      const cachedVersion = localStorage.getItem('physics-vocabulary-version')
      if (cachedVersion !== VOCAB_VERSION) {
        console.log('Clearing old vocabulary cache...')
        localStorage.removeItem('physics-vocabulary-sets')
        localStorage.setItem('physics-vocabulary-version', VOCAB_VERSION)
      }
      
      const response = await fetch('/api/vocabulary')
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary sets')
      }
      
      const vocabularySets = await response.json()
      
      // Debug logging
      console.log('🔍 Vocabulary API Response:', {
        totalSets: vocabularySets.length,
        sets: vocabularySets.map((s: any) => ({ 
          id: s.id, 
          name: s.name, 
          published: s.published,
          terms: s.terms?.length || 0
        })),
        userRole,
        canAccessVocabulary
      })
      
      setVocabularySets(vocabularySets)
      
      // Only admins/teachers cache to localStorage (students always use API)
      if (canAccessVocabulary) {
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(vocabularySets))
        } catch (storageError) {
          console.warn('Could not cache vocabulary sets:', storageError)
        }
      }
    } catch (error) {
      console.error('Error loading vocabulary sets:', error)
      setError('Failed to load vocabulary sets')
      
      // Only fallback to localStorage for admin/teachers, NOT students
      // Students should always get data from API to respect published status
      if (canAccessVocabulary) {
        try {
          const stored = localStorage.getItem('physics-vocabulary-sets')
          if (stored) {
            const parsedSets = JSON.parse(stored)
            setVocabularySets(parsedSets)
          }
        } catch (fallbackError) {
          console.error('Fallback to localStorage failed:', fallbackError)
        }
      } else {
        // For students, show empty state if API fails - don't use old cached data
        setVocabularySets([])
      }
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, canAccessVocabulary])

  // LAZY LOADING: Only load vocabulary when user navigates to vocabulary pages
  useEffect(() => {
    const shouldAutoInit = typeof window !== 'undefined' && 
      (window.location.pathname.includes('/vocabulary') || 
       window.location.pathname.includes('/admin/vocabulary'))
    
    // Load for all logged-in users (students see published, admin/teachers see all)
    if (shouldAutoInit && session?.user?.id) {
      refreshVocabularySets()
    }
  }, [session?.user?.id, refreshVocabularySets])

  const createVocabularySet = async (vocabularySetData: Omit<VocabularySet, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: vocabularySetData.name,
          description: vocabularySetData.description,
          unit: vocabularySetData.unit,
          lesson: vocabularySetData.lesson,
          terms: vocabularySetData.terms
        })
      })

      if (!response.ok) {
        // Fallback to localStorage when API fails
        console.log('API failed, falling back to localStorage')
        const newSet: VocabularySet = {
          ...vocabularySetData,
          id: `vocab-set-${Date.now()}`,
          published: vocabularySetData.published || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: session?.user?.id
        }

        const updatedSets = [...vocabularySets, newSet]
        setVocabularySets(updatedSets)
        
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        } catch (storageError) {
          console.error('localStorage error:', storageError)
        }
        return
      }

      // Refresh the vocabulary sets to get the updated list
      await refreshVocabularySets()
    } catch (error) {
      console.error('Error creating vocabulary set:', error)
      throw error
    }
  }

  const updateVocabularySet = async (id: string, updates: Partial<VocabularySet>) => {
    try {
      const currentSet = vocabularySets.find(set => set.id === id)
      if (!currentSet) throw new Error('Vocabulary set not found')

      const response = await fetch('/api/vocabulary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: updates.name || currentSet.name,
          description: updates.description || currentSet.description,
          unit: updates.unit || currentSet.unit,
          lesson: updates.lesson || currentSet.lesson,
          terms: updates.terms || currentSet.terms
        })
      })

      if (!response.ok) {
        // Fallback to localStorage when API fails
        console.log('API update failed, falling back to localStorage')
        const updatedSets = vocabularySets.map(set =>
          set.id === id 
            ? { ...set, ...updates, updated_at: new Date().toISOString() }
            : set
        )
        setVocabularySets(updatedSets)
        
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        } catch (storageError) {
          console.error('localStorage error:', storageError)
        }
        return
      }

      // Refresh the vocabulary sets to get the updated list
      await refreshVocabularySets()
    } catch (error) {
      console.error('Error updating vocabulary set:', error)
      // Fallback to localStorage even on network errors
      try {
        const updatedSets = vocabularySets.map(set =>
          set.id === id 
            ? { ...set, ...updates, updated_at: new Date().toISOString() }
            : set
        )
        setVocabularySets(updatedSets)
        localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        console.log('Successfully updated in localStorage as fallback')
      } catch (fallbackError) {
        console.error('Fallback update failed:', fallbackError)
        throw error
      }
    }
  }

  const deleteVocabularySet = async (id: string) => {
    try {
      const response = await fetch(`/api/vocabulary?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Fallback to localStorage when API fails
        console.log('API delete failed, falling back to localStorage')
        const updatedSets = vocabularySets.filter(set => set.id !== id)
        setVocabularySets(updatedSets)
        
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        } catch (storageError) {
          console.error('localStorage error:', storageError)
        }
        return
      }

      // Refresh the vocabulary sets to get the updated list
      await refreshVocabularySets()
    } catch (error) {
      console.error('Error deleting vocabulary set:', error)
      // Fallback to localStorage even on network errors
      try {
        const updatedSets = vocabularySets.filter(set => set.id !== id)
        setVocabularySets(updatedSets)
        localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        console.log('Successfully deleted from localStorage as fallback')
      } catch (fallbackError) {
        console.error('Fallback delete failed:', fallbackError)
        throw error
      }
    }
  }

  const getVocabularySetById = (id: string): VocabularySet | undefined => {
    return vocabularySets.find(set => set.id === id)
  }

  const addTermToSet = async (setId: string, termData: Omit<VocabularyTerm, 'id'>) => {
    try {
      const currentSet = vocabularySets.find(set => set.id === setId)
      if (!currentSet) throw new Error('Vocabulary set not found')

      const updatedTerms = [...currentSet.terms, { ...termData, id: `temp-${Date.now()}` }]
      
      const response = await fetch('/api/vocabulary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: setId,
          name: currentSet.name,
          description: currentSet.description,
          unit: currentSet.unit,
          lesson: currentSet.lesson,
          terms: updatedTerms
        })
      })

      if (!response.ok) {
        // Fallback to localStorage when API fails
        console.log('API add term failed, falling back to localStorage')
        const updatedSets = vocabularySets.map(set =>
          set.id === setId
            ? { 
                ...set, 
                terms: [...set.terms, { ...termData, id: `term-${Date.now()}` }],
                updated_at: new Date().toISOString()
              }
            : set
        )
        setVocabularySets(updatedSets)
        
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        } catch (storageError) {
          console.error('localStorage error:', storageError)
        }
        return
      }

      // Refresh the vocabulary sets to get the updated list
      await refreshVocabularySets()
    } catch (error) {
      console.error('Error adding term to set:', error)
      // Fallback to localStorage even on network errors
      try {
        const updatedSets = vocabularySets.map(set =>
          set.id === setId
            ? { 
                ...set, 
                terms: [...set.terms, { ...termData, id: `term-${Date.now()}` }],
                updated_at: new Date().toISOString()
              }
            : set
        )
        setVocabularySets(updatedSets)
        localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        console.log('Successfully added term in localStorage as fallback')
      } catch (fallbackError) {
        console.error('Fallback add term failed:', fallbackError)
        throw error
      }
    }
  }

  const updateTerm = async (setId: string, termId: string, updates: Partial<VocabularyTerm>) => {
    try {
      const currentSet = vocabularySets.find(set => set.id === setId)
      if (!currentSet) throw new Error('Vocabulary set not found')

      const updatedTerms = currentSet.terms.map(term =>
        term.id === termId ? { ...term, ...updates } : term
      )
      
      const response = await fetch('/api/vocabulary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: setId,
          name: currentSet.name,
          description: currentSet.description,
          unit: currentSet.unit,
          lesson: currentSet.lesson,
          terms: updatedTerms
        })
      })

      if (!response.ok) {
        // Fallback to localStorage when API fails
        console.log('API update term failed, falling back to localStorage')
        const updatedSets = vocabularySets.map(set =>
          set.id === setId
            ? {
                ...set,
                terms: set.terms.map(term =>
                  term.id === termId ? { ...term, ...updates } : term
                ),
                updated_at: new Date().toISOString()
              }
            : set
        )
        setVocabularySets(updatedSets)
        
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        } catch (storageError) {
          console.error('localStorage error:', storageError)
        }
        return
      }

      // Refresh the vocabulary sets to get the updated list
      await refreshVocabularySets()
    } catch (error) {
      console.error('Error updating term:', error)
      // Fallback to localStorage even on network errors
      try {
        const updatedSets = vocabularySets.map(set =>
          set.id === setId
            ? {
                ...set,
                terms: set.terms.map(term =>
                  term.id === termId ? { ...term, ...updates } : term
                ),
                updated_at: new Date().toISOString()
              }
            : set
        )
        setVocabularySets(updatedSets)
        localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        console.log('Successfully updated term in localStorage as fallback')
      } catch (fallbackError) {
        console.error('Fallback update term failed:', fallbackError)
        throw error
      }
    }
  }

  const deleteTerm = async (setId: string, termId: string) => {
    try {
      const currentSet = vocabularySets.find(set => set.id === setId)
      if (!currentSet) throw new Error('Vocabulary set not found')

      const updatedTerms = currentSet.terms.filter(term => term.id !== termId)
      
      const response = await fetch('/api/vocabulary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: setId,
          name: currentSet.name,
          description: currentSet.description,
          unit: currentSet.unit,
          lesson: currentSet.lesson,
          terms: updatedTerms
        })
      })

      if (!response.ok) {
        // Fallback to localStorage when API fails
        console.log('API delete term failed, falling back to localStorage')
        const updatedSets = vocabularySets.map(set =>
          set.id === setId
            ? {
                ...set,
                terms: set.terms.filter(term => term.id !== termId),
                updated_at: new Date().toISOString()
              }
            : set
        )
        setVocabularySets(updatedSets)
        
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        } catch (storageError) {
          console.error('localStorage error:', storageError)
        }
        return
      }

      // Refresh the vocabulary sets to get the updated list
      await refreshVocabularySets()
    } catch (error) {
      console.error('Error deleting term:', error)
      // Fallback to localStorage even on network errors
      try {
        const updatedSets = vocabularySets.map(set =>
          set.id === setId
            ? {
                ...set,
                terms: set.terms.filter(term => term.id !== termId),
                updated_at: new Date().toISOString()
              }
            : set
        )
        setVocabularySets(updatedSets)
        localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        console.log('Successfully deleted term in localStorage as fallback')
      } catch (fallbackError) {
        console.error('Fallback delete term failed:', fallbackError)
        throw error
      }
    }
  }

  const publishVocabularySet = async (id: string, published: boolean) => {
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          published
        })
      })

      if (!response.ok) {
        // Fallback to localStorage when API fails
        console.log('API publish failed, falling back to localStorage')
        const updatedSets = vocabularySets.map(set =>
          set.id === id
            ? { ...set, published, updated_at: new Date().toISOString() }
            : set
        )
        setVocabularySets(updatedSets)
        
        try {
          localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        } catch (storageError) {
          console.error('localStorage error:', storageError)
        }
        return
      }

      // Refresh the vocabulary sets to get the updated list
      await refreshVocabularySets()
    } catch (error) {
      console.error('Error publishing vocabulary set:', error)
      // Fallback to localStorage even on network errors
      try {
        const updatedSets = vocabularySets.map(set =>
          set.id === id
            ? { ...set, published, updated_at: new Date().toISOString() }
            : set
        )
        setVocabularySets(updatedSets)
        localStorage.setItem('physics-vocabulary-sets', JSON.stringify(updatedSets))
        console.log('Successfully updated published status in localStorage as fallback')
      } catch (fallbackError) {
        console.error('Fallback publish failed:', fallbackError)
        throw error
      }
    }
  }

  // Filter published vocabulary sets for students
  const publishedVocabularySets = vocabularySets.filter(set => set.published)
  
  // Debug: Log filtered published sets
  useEffect(() => {
    if (vocabularySets.length > 0) {
      console.log('📚 Published Vocabulary Sets:', {
        total: vocabularySets.length,
        published: publishedVocabularySets.length,
        unpublished: vocabularySets.length - publishedVocabularySets.length,
        userRole,
        details: publishedVocabularySets.map(s => ({ 
          name: s.name, 
          terms: s.terms.length 
        }))
      })
    }
  }, [vocabularySets, publishedVocabularySets, userRole])

  const value: VocabularyContextType = {
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
  }

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  )
}

export function useVocabulary() {
  const context = useContext(VocabularyContext)
  if (!context) {
    throw new Error('useVocabulary must be used within a VocabularyProvider')
  }
  return context
}

export type { VocabularySet }
