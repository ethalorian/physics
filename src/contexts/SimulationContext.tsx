"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Simulation, 
  SimulationActivity,
  SimulationInteraction,
  SimulationResult 
} from '@/types/interactive-content'

interface SimulationContextType {
  // Data
  simulations: Simulation[]
  loading: boolean
  error: string | null
  
  // Current simulation activity
  currentActivity: SimulationActivity | null
  
  // Fetching
  fetchSimulations: (filters?: SimulationFilters) => Promise<void>
  getSimulationBySlug: (slug: string) => Promise<Simulation | null>
  refreshSimulations: () => Promise<void>
  
  // Activity tracking
  startActivity: (simulationId: string, lessonId?: string, stepId?: string) => Promise<string>
  recordInteraction: (activityId: string, interaction: SimulationInteraction) => Promise<void>
  completeActivity: (activityId: string, result: SimulationResult) => Promise<void>
  getStudentActivity: (studentId?: string) => Promise<SimulationActivity[]>
  
  // Admin functions
  updateSimulation: (id: string, updates: Partial<Simulation>) => Promise<Simulation>
  deleteSimulation: (id: string) => Promise<void>
}

interface SimulationFilters {
  category?: string
  unit?: string
  difficulty?: string
  search?: string
  published?: boolean
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentActivity, setCurrentActivity] = useState<SimulationActivity | null>(null)

  // Fetch simulations from database
  const fetchSimulations = useCallback(async (filters: SimulationFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (filters.category) queryParams.append('category', filters.category)
      if (filters.unit) queryParams.append('unit', filters.unit)
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty)
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.published !== undefined) queryParams.append('published', String(filters.published))

      const response = await fetch(`/api/simulations?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch simulations')
      }

      const data = await response.json()
      setSimulations(data.simulations || [])

    } catch (err: any) {
      console.error('Error fetching simulations:', err)
      setError(err.message)
      // Don't throw - allow graceful degradation to mock data
    } finally {
      setLoading(false)
    }
  }, [])

  // Get specific simulation
  const getSimulationBySlug = useCallback(async (slug: string): Promise<Simulation | null> => {
    try {
      const response = await fetch(`/api/simulations/${slug}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch simulation')
      }

      const data = await response.json()
      return data.simulation

    } catch (err: any) {
      console.error('Error fetching simulation:', err)
      return null
    }
  }, [])

  // Refresh simulations
  const refreshSimulations = useCallback(async () => {
    await fetchSimulations()
  }, [fetchSimulations])

  // Start activity tracking
  const startActivity = useCallback(async (
    simulationId: string,
    lessonId?: string,
    stepId?: string
  ): Promise<string> => {
    if (!session?.user?.id) {
      throw new Error('Must be logged in to track activity')
    }

    try {
      const response = await fetch('/api/simulations/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_id: simulationId,
          lesson_id: lessonId,
          step_id: stepId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start activity tracking')
      }

      const data = await response.json()
      setCurrentActivity(data.activity)
      return data.activity.id

    } catch (err: any) {
      console.error('Error starting activity:', err)
      throw err
    }
  }, [session])

  // Record interaction
  const recordInteraction = useCallback(async (
    activityId: string,
    interaction: SimulationInteraction
  ) => {
    try {
      await fetch('/api/simulations/activity/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          interaction
        })
      })
    } catch (err: any) {
      console.error('Error recording interaction:', err)
      // Don't throw - interaction tracking shouldn't break simulation
    }
  }, [])

  // Complete activity
  const completeActivity = useCallback(async (
    activityId: string,
    result: SimulationResult
  ) => {
    try {
      const response = await fetch('/api/simulations/activity/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          result
        })
      })

      if (response.ok) {
        setCurrentActivity(null)
      }

    } catch (err: any) {
      console.error('Error completing activity:', err)
    }
  }, [])

  // Get student activity history
  const getStudentActivity = useCallback(async (studentId?: string): Promise<SimulationActivity[]> => {
    const userId = studentId || session?.user?.id
    if (!userId) return []

    try {
      const response = await fetch(`/api/simulations/activity?student_id=${userId}`)
      
      if (!response.ok) return []

      const data = await response.json()
      return data.activities || []

    } catch (err: any) {
      console.error('Error fetching activity:', err)
      return []
    }
  }, [session])

  // Admin: Update simulation
  const updateSimulation = useCallback(async (
    id: string,
    updates: Partial<Simulation>
  ): Promise<Simulation> => {
    const response = await fetch('/api/simulations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update simulation')
    }

    const data = await response.json()
    setSimulations(prev => prev.map(s => s.id === id ? data.simulation : s))
    return data.simulation
  }, [])

  // Admin: Delete simulation
  const deleteSimulation = useCallback(async (id: string) => {
    const response = await fetch(`/api/simulations/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete simulation')
    }

    setSimulations(prev => prev.filter(s => s.id !== id))
  }, [])

  // Initial load (lazy - only when needed)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Only auto-load on simulation pages
    if (typeof window !== 'undefined' && window.location.pathname.includes('/simulations') && !initialized) {
      fetchSimulations()
      setInitialized(true)
    }
  }, [fetchSimulations, initialized])

  const value: SimulationContextType = {
    simulations,
    loading,
    error,
    currentActivity,
    fetchSimulations,
    getSimulationBySlug,
    refreshSimulations,
    startActivity,
    recordInteraction,
    completeActivity,
    getStudentActivity,
    updateSimulation,
    deleteSimulation
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulations() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error('useSimulations must be used within SimulationProvider')
  }
  return context
}
