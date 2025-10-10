'use client'

import { useEffect, useRef, useState, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2 
} from 'lucide-react'
import { useSimulations } from '@/contexts/SimulationContext'
import { SimulationInteraction, SimulationResult } from '@/types/interactive-content'

interface SimulationWrapperProps {
  // Identification
  simulationSlug: string
  
  // Tracking options
  trackProgress?: boolean
  aiEnabled?: boolean  // DEPRECATED: AI hints removed for students (Phase 4)
  
  // Context (if embedded in lesson)
  lessonId?: string
  stepId?: string
  
  // Success criteria (optional)
  successCriteria?: {
    type: 'time-based' | 'data-based' | 'completion-based'
    criteria: Record<string, any>
  }
  
  // Render props pattern
  children: (props: SimulationChildProps) => ReactNode
}

interface SimulationChildProps {
  // Callbacks for tracking
  onInteraction: (action: string, data: Record<string, any>) => void
  onComplete: (data: Record<string, any>, score?: number) => void
  
  // AI assistance - DEPRECATED (students work independently)
  requestAIHint: (question: string) => Promise<string>
  
  // State
  isTracking: boolean
  timeSpent: number
}

export function SimulationWrapper({
  simulationSlug,
  trackProgress = true,
  aiEnabled = false,
  lessonId,
  stepId,
  successCriteria,
  children
}: SimulationWrapperProps) {
  const { data: session } = useSession()
  const { 
    getSimulationBySlug, 
    startActivity, 
    recordInteraction, 
    completeActivity 
  } = useSimulations()
  
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [activityId, setActivityId] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  
  const startTimeRef = useRef<number>(Date.now())
  const timerIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const interactionsRef = useRef<SimulationInteraction[]>([])

  // Load simulation metadata
  useEffect(() => {
    async function loadSimulation() {
      const sim = await getSimulationBySlug(simulationSlug)
      if (sim) {
        setSimulationId(sim.id)
      }
    }
    loadSimulation()
  }, [simulationSlug, getSimulationBySlug])

  // Start activity tracking - timer starts immediately when user is logged in
  useEffect(() => {
    if (!session?.user?.id || !trackProgress || isTracking) {
      console.log('⏸️ Timer check:', {
        hasSession: !!session?.user?.id,
        trackProgress,
        isTracking,
        message: !session?.user?.id ? 'No session - not logged in' : 
                 !trackProgress ? 'Tracking disabled' : 
                 isTracking ? 'Already tracking' : 'Should start tracking'
      })
      return
    }

    async function initializeTracking() {
      try {
        console.log('⏱️ Initializing timer for simulation:', simulationSlug)
        
        // Always start local tracking immediately - don't wait for database
        setIsTracking(true)
        startTimeRef.current = Date.now()
        
        // Start timer - updates every second
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setTimeSpent(elapsed)
        }, 1000)
        
        console.log('✓ Timer started successfully')
        
        // Try to register in database (async, don't wait)
        if (simulationId) {
          try {
            const id = await startActivity(simulationId, lessonId, stepId)
            setActivityId(id)
            console.log('✓ Database activity tracking started:', id)
          } catch (dbErr) {
            console.warn('⚠️ Database tracking unavailable (continuing with local tracking):', dbErr)
          }
        } else {
          console.log('ℹ️ Simulation not in database yet - local tracking only')
        }
        
      } catch (err) {
        console.error('⚠️ Error initializing tracking:', err)
        // Still try to start timer even if there's an error
        setIsTracking(true)
        startTimeRef.current = Date.now()
        
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setTimeSpent(elapsed)
        }, 1000)
      }
    }

    initializeTracking()

    return () => {
      if (timerIntervalRef.current) {
        console.log('⏹️ Stopping timer, total time:', timeSpent, 'seconds')
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [session?.user?.id, trackProgress, isTracking, simulationSlug])

  // Record interaction
  const handleInteraction = useCallback((action: string, data: Record<string, any>) => {
    if (!trackProgress) return

    const interaction: SimulationInteraction = {
      timestamp: Date.now() - startTimeRef.current,
      action,
      data
    }

    interactionsRef.current.push(interaction)
    
    // Record to database if activity tracking is active (async, don't wait)
    if (activityId) {
      recordInteraction(activityId, interaction).catch(err => {
        console.warn('⚠️ Could not save interaction to database:', err.message)
      })
    } else {
      console.log('ℹ️ Interaction recorded locally:', action)
    }
  }, [activityId, trackProgress, recordInteraction])

  // Complete simulation
  const handleComplete = useCallback(async (data: Record<string, any>, score?: number) => {
    if (!trackProgress || isCompleted) return

    setIsCompleted(true)
    
    const result: SimulationResult = {
      completed: true,
      score,
      data,
      interactions: interactionsRef.current,
      time_spent: Math.floor((Date.now() - startTimeRef.current) / 1000)
    }

    if (activityId) {
      try {
        await completeActivity(activityId, result)
        console.log('✓ Activity completed and saved to database')
      } catch (err) {
        console.error('⚠️ Could not save completion to database:', err)
      }
    } else {
      console.log('✓ Activity completed locally (database tracking unavailable)')
      console.log('   Score:', score, '| Time:', result.time_spent, 's')
    }
  }, [activityId, trackProgress, isCompleted, completeActivity])

  // Request AI hint - DISABLED: Students work independently
  // Teachers will get AI help for creating questions (Phase 3)
  const requestAIHint = useCallback(async (question: string): Promise<string> => {
    // AI hints disabled for students (Phase 4)
    console.log('ℹ️ AI hints disabled - students work independently')
    return 'Work through the simulation independently. If you need help, ask your teacher!'
  }, [])

  const childProps: SimulationChildProps = {
    onInteraction: handleInteraction,
    onComplete: handleComplete,
    requestAIHint,
    isTracking,
    timeSpent
  }

  return (
    <div className="space-y-4">
      {/* Tracking Status Bar (optional) */}
      {trackProgress && isTracking && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Time: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</span>
                </div>
                
                {/* AI Help badge removed - students work independently (Phase 4) */}
              </div>
              
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Loader2 className="h-3 w-3 mr-1 animate-pulse" />
                    In Progress
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render the actual simulation */}
      {children(childProps)}

      {/* AI Loading Indicator - REMOVED (Phase 4) */}
    </div>
  )
}

// Optional: Pre-built AI hint button component
interface AIHintButtonProps {
  onRequestHint: (question: string) => Promise<string>
  question: string
  onHintReceived?: (hint: string) => void
}

export function AIHintButton({ onRequestHint, question, onHintReceived }: AIHintButtonProps) {
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await onRequestHint(question)
      setHint(result)
      onHintReceived?.(result)
    } catch (err) {
      console.error('Error getting hint:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleClick}
        disabled={loading || hint !== null}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Getting hint...
          </>
        ) : hint ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Hint received
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            Get AI Hint
          </>
        )}
      </Button>

      {hint && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">{hint}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
