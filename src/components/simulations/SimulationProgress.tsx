'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, Clock, Activity, Target } from 'lucide-react'
import { SimulationCompletionState } from '@/hooks/useSimulationCompletion'

interface SimulationProgressProps {
  /** Current completion state */
  state: SimulationCompletionState
  /** Optional title for the progress card */
  title?: string
  /** Whether to show detailed breakdown */
  showDetails?: boolean
  /** Custom action labels */
  actionLabels?: Record<string, string>
  /** Whether to hide the component when completed */
  hideWhenComplete?: boolean
  /** Custom className for the card */
  className?: string
}

export default function SimulationProgress({
  state,
  title = "Complete the Simulation",
  showDetails = true,
  actionLabels = {},
  hideWhenComplete = false,
  className = ""
}: SimulationProgressProps) {
  // Don't render if completed and hideWhenComplete is true
  if (hideWhenComplete && state.isCompleted) {
    return null
  }
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }
  
  // Get completion status for each criterion
  const actionsComplete = state.criteria.actions.required === 0 || 
    state.criteria.actions.completed >= state.criteria.actions.required
  const interactionsComplete = state.criteria.interactions.required === 0 || 
    state.criteria.interactions.current >= state.criteria.interactions.required
  const timeComplete = state.criteria.time.required === 0 || 
    state.criteria.time.current >= state.criteria.time.required
  
  return (
    <Card className={`${state.isCompleted 
      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
      : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'} ${className}`}>
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${state.isCompleted ? 'text-green-900' : 'text-purple-900'}`}>
              {title}
            </h3>
            <Badge variant={state.isCompleted ? "default" : "secondary"}>
              {state.isCompleted ? "Completed!" : "In Progress"}
            </Badge>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className={`font-medium ${state.progress >= 100 ? 'text-green-600' : ''}`}>
                {state.progress}%
              </span>
            </div>
            <Progress 
              value={state.progress} 
              className="h-2"
            />
          </div>
          
          {/* Detailed Breakdown */}
          {showDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {/* Actions */}
              {state.criteria.actions.required > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Actions:</span>
                    <span className={`font-medium ${actionsComplete ? 'text-green-600' : ''}`}>
                      {state.criteria.actions.completed}/{state.criteria.actions.required}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    {Array.from(state.completedActions).map(action => (
                      <div key={action} className="text-green-600">
                        <CheckCircle className="inline h-3 w-3 mr-1" />
                        {actionLabels[action] || action}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Interactions */}
              {state.criteria.interactions.required > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Interactions:</span>
                    <span className={`font-medium ${interactionsComplete ? 'text-green-600' : ''}`}>
                      {state.criteria.interactions.current}/{state.criteria.interactions.required}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (state.criteria.interactions.current / state.criteria.interactions.required) * 100)} 
                    className="h-1.5 mt-1"
                  />
                </div>
              )}
              
              {/* Time */}
              {state.criteria.time.required > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Time:</span>
                    <span className={`font-medium ${timeComplete ? 'text-green-600' : ''}`}>
                      {formatTime(state.criteria.time.current)}/{formatTime(state.criteria.time.required)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (state.criteria.time.current / state.criteria.time.required) * 100)} 
                    className="h-1.5 mt-1"
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Completion Message */}
          {state.isCompleted && (
            <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center font-medium animate-in fade-in duration-500">
              🎉 Great job! You&apos;ve completed all requirements!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
