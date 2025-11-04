import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Configuration for simulation completion criteria
 */
export interface SimulationCompletionConfig {
  /** Required actions that must be performed */
  requiredActions?: string[]
  /** Minimum number of interactions needed */
  minInteractions?: number
  /** Minimum time in seconds */
  minTimeSeconds?: number
  /** Custom completion check function */
  customCheck?: (state: SimulationCompletionState) => boolean
  /** Whether to auto-complete when criteria are met */
  autoComplete?: boolean
}

/**
 * State of simulation completion tracking
 */
export interface SimulationCompletionState {
  /** Set of completed actions */
  completedActions: Set<string>
  /** Total number of interactions */
  interactionCount: number
  /** Time spent in seconds */
  timeSpent: number
  /** Whether simulation is completed */
  isCompleted: boolean
  /** Percentage progress (0-100) */
  progress: number
  /** Details about what's completed */
  criteria: {
    actions: { completed: number; required: number }
    interactions: { current: number; required: number }
    time: { current: number; required: number }
  }
}

/**
 * Hook for standardized simulation completion tracking
 */
export function useSimulationCompletion(
  config: SimulationCompletionConfig,
  onComplete?: (data: Record<string, any>, score?: number) => void
) {
  // Core state
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const [interactionCount, setInteractionCount] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasTriggeredCompletion, setHasTriggeredCompletion] = useState(false)
  
  // Timer reference
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout>()
  
  // Start timer on mount
  useEffect(() => {
    startTimeRef.current = Date.now()
    
    timerRef.current = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
  // Calculate progress
  const calculateProgress = useCallback((): number => {
    const weights = {
      actions: 0.4,
      interactions: 0.3,
      time: 0.3
    }
    
    let totalProgress = 0
    let totalWeight = 0
    
    // Actions progress
    if (config.requiredActions && config.requiredActions.length > 0) {
      const actionsCompleted = config.requiredActions.filter(action => 
        completedActions.has(action)
      ).length
      totalProgress += (actionsCompleted / config.requiredActions.length) * 100 * weights.actions
      totalWeight += weights.actions
    }
    
    // Interactions progress
    if (config.minInteractions && config.minInteractions > 0) {
      const interactionProgress = Math.min(100, (interactionCount / config.minInteractions) * 100)
      totalProgress += interactionProgress * weights.interactions
      totalWeight += weights.interactions
    }
    
    // Time progress
    if (config.minTimeSeconds && config.minTimeSeconds > 0) {
      const timeProgress = Math.min(100, (timeSpent / config.minTimeSeconds) * 100)
      totalProgress += timeProgress * weights.time
      totalWeight += weights.time
    }
    
    // Custom check contributes to overall if provided
    if (config.customCheck) {
      const customMet = config.customCheck(getState()) ? 100 : 0
      totalProgress += customMet * 0.2 // 20% weight for custom
      totalWeight += 0.2
    }
    
    return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0
  }, [completedActions, interactionCount, timeSpent, config])
  
  // Get current state
  const getState = useCallback((): SimulationCompletionState => {
    const actionsRequired = config.requiredActions?.length || 0
    const actionsCompleted = config.requiredActions?.filter(a => completedActions.has(a)).length || 0
    
    return {
      completedActions,
      interactionCount,
      timeSpent,
      isCompleted,
      progress: calculateProgress(),
      criteria: {
        actions: { 
          completed: actionsCompleted, 
          required: actionsRequired 
        },
        interactions: { 
          current: interactionCount, 
          required: config.minInteractions || 0 
        },
        time: { 
          current: timeSpent, 
          required: config.minTimeSeconds || 0 
        }
      }
    }
  }, [completedActions, interactionCount, timeSpent, isCompleted, calculateProgress, config])
  
  // Track an interaction
  const trackInteraction = useCallback((action: string, data?: Record<string, any>) => {
    // Increment interaction count
    setInteractionCount(prev => prev + 1)
    
    // Track required actions if specified
    if (config.requiredActions?.includes(action)) {
      setCompletedActions(prev => {
        const newSet = new Set(prev)
        newSet.add(action)
        return newSet
      })
    }
    
    return { action, data, timestamp: Date.now() - startTimeRef.current }
  }, [config.requiredActions])
  
  // Check completion criteria
  const checkCompletion = useCallback((): boolean => {
    // Check required actions
    const hasAllActions = !config.requiredActions || 
      config.requiredActions.every(action => completedActions.has(action))
    
    // Check interaction count
    const hasEnoughInteractions = !config.minInteractions || 
      interactionCount >= config.minInteractions
    
    // Check time requirement
    const hasEnoughTime = !config.minTimeSeconds || 
      timeSpent >= config.minTimeSeconds
    
    // Check custom criteria if provided
    const customMet = !config.customCheck || config.customCheck(getState())
    
    return hasAllActions && hasEnoughInteractions && hasEnoughTime && customMet
  }, [completedActions, interactionCount, timeSpent, config, getState])
  
  // Auto-complete effect
  useEffect(() => {
    if (!hasTriggeredCompletion && !isCompleted && config.autoComplete !== false) {
      if (checkCompletion()) {
        setIsCompleted(true)
        setHasTriggeredCompletion(true)
        
        // Trigger completion callback if provided
        if (onComplete) {
          const state = getState()
          onComplete({
            completedActions: Array.from(state.completedActions),
            interactionCount: state.interactionCount,
            timeSpent: state.timeSpent,
            progress: state.progress,
            timestamp: new Date().toISOString()
          }, 100) // Perfect score for meeting all criteria
        }
      }
    }
  }, [checkCompletion, hasTriggeredCompletion, isCompleted, config.autoComplete, onComplete, getState])
  
  // Manual complete function
  const markComplete = useCallback((data?: Record<string, any>, score?: number) => {
    if (!isCompleted) {
      setIsCompleted(true)
      setHasTriggeredCompletion(true)
      
      if (onComplete) {
        const state = getState()
        onComplete({
          ...data,
          completedActions: Array.from(state.completedActions),
          interactionCount: state.interactionCount,
          timeSpent: state.timeSpent,
          progress: state.progress,
          timestamp: new Date().toISOString()
        }, score || calculateProgress())
      }
    }
  }, [isCompleted, onComplete, getState, calculateProgress])
  
  // Reset function
  const reset = useCallback(() => {
    setCompletedActions(new Set())
    setInteractionCount(0)
    setTimeSpent(0)
    setIsCompleted(false)
    setHasTriggeredCompletion(false)
    startTimeRef.current = Date.now()
  }, [])
  
  return {
    // State
    state: getState(),
    
    // Actions
    trackInteraction,
    markComplete,
    reset,
    checkCompletion,
    
    // Individual state pieces for convenience
    completedActions,
    interactionCount,
    timeSpent,
    isCompleted,
    progress: calculateProgress()
  }
}
