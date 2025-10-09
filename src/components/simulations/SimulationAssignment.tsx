"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Play,
  X,
  RotateCcw,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import QuestionRenderer from '@/components/assignment-taking/question-renderer'
import { Question } from '@/types/assignment'

interface SimulationAssignment {
  id: string
  title: string
  description?: string
  instructions?: string
  questions: Question[]
  total_points: number
  show_on_start: boolean
  show_on_complete: boolean
  allow_skip: boolean
  required_for_progress: boolean
  time_limit?: number
  available_after: number
  max_attempts: number
  submission?: {
    status: string
    score?: number
    percentage?: number
    attempt_number: number
    feedback?: any
  }
}

interface SimulationAssignmentProps {
  simulationSlug: string
  simulationTime?: number // Time spent in simulation (seconds)
  simulationCompleted?: boolean
  simulationData?: any // Data from the simulation to include in submission
  onClose?: () => void
  onComplete?: (score: number, percentage: number) => void
}

export default function SimulationAssignment({
  simulationSlug,
  simulationTime = 0,
  simulationCompleted = false,
  simulationData,
  onClose,
  onComplete
}: SimulationAssignmentProps) {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<SimulationAssignment[]>([])
  const [currentAssignment, setCurrentAssignment] = useState<SimulationAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssignment, setShowAssignment] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Fetch assignments for this simulation
  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch(`/api/simulations/assignments?simulation_slug=${simulationSlug}&published=true`)
        if (response.ok) {
          const data = await response.json()
          setAssignments(data.assignments || [])
          
          // Check if any assignment should be shown based on conditions
          const assignmentToShow = data.assignments?.find((a: SimulationAssignment) => {
            // Check if it's time to show the assignment
            if (simulationTime < a.available_after) return false
            
            // Check if already completed
            if (a.submission?.status === 'submitted' || a.submission?.status === 'graded') {
              return false
            }
            
            // Show on start
            if (a.show_on_start && simulationTime < 5) return true
            
            // Show on complete
            if (a.show_on_complete && simulationCompleted) return true
            
            // Show based on available_after time
            return simulationTime >= a.available_after
          })
          
          if (assignmentToShow) {
            setCurrentAssignment(assignmentToShow)
            setShowAssignment(true)
            setStartTime(Date.now())
          }
        }
      } catch (error) {
        console.error('Error fetching assignments:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (session?.user?.email) {
      fetchAssignments()
    }
  }, [simulationSlug, simulationTime, simulationCompleted, session])

  // Track time spent
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [startTime])

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    // Auto-save draft
    if (currentAssignment) {
      saveDraft()
    }
  }, [currentAssignment])

  const saveDraft = useCallback(async () => {
    if (!currentAssignment) return
    
    try {
      await fetch('/api/simulations/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: currentAssignment.id,
          answers: answers,
          time_spent: timeSpent,
          simulation_data: simulationData,
          simulation_completed: simulationCompleted,
          submit: false
        })
      })
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }, [currentAssignment, answers, timeSpent, simulationData, simulationCompleted])

  const handleSubmit = async () => {
    if (!currentAssignment) return
    
    setSubmitting(true)
    try {
      const response = await fetch('/api/simulations/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: currentAssignment.id,
          answers: answers,
          time_spent: timeSpent,
          simulation_data: simulationData,
          simulation_completed: simulationCompleted,
          submit: true
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const { submission } = data
        
        // Update assignment with submission data
        setCurrentAssignment(prev => prev ? {
          ...prev,
          submission: submission
        } : null)
        
        // Call onComplete callback
        if (onComplete && submission.score !== undefined) {
          onComplete(submission.score, submission.percentage)
        }
        
        // Show completion message
        alert('Assignment submitted successfully!')
        setShowAssignment(false)
        
        if (onClose) {
          onClose()
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('Failed to submit assignment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    if (currentAssignment?.allow_skip) {
      setShowAssignment(false)
      if (onClose) {
        onClose()
      }
    }
  }

  const handleRetry = async () => {
    if (!currentAssignment) return
    
    // Check if retries are allowed
    const attemptNumber = currentAssignment.submission?.attempt_number || 0
    if (attemptNumber >= currentAssignment.max_attempts) {
      alert('Maximum attempts reached')
      return
    }
    
    // Reset state for new attempt
    setAnswers({})
    setCurrentQuestionIndex(0)
    setTimeSpent(0)
    setStartTime(Date.now())
    setCurrentAssignment(prev => prev ? {
      ...prev,
      submission: undefined
    } : null)
  }

  if (loading) {
    return null
  }

  if (!showAssignment || !currentAssignment) {
    // Show floating button if there are available assignments
    const availableAssignment = assignments.find(a => 
      (!a.submission || a.submission.status === 'in_progress') &&
      simulationTime >= a.available_after
    )
    
    if (availableAssignment) {
      return (
        <Button
          onClick={() => {
            setCurrentAssignment(availableAssignment)
            setShowAssignment(true)
            setStartTime(Date.now())
          }}
          className="fixed bottom-4 right-4 z-50 shadow-lg"
          size="lg"
        >
          <FileText className="h-4 w-4 mr-2" />
          Complete Assignment
          {availableAssignment.required_for_progress && (
            <Badge variant="destructive" className="ml-2">Required</Badge>
          )}
        </Button>
      )
    }
    
    return null
  }

  const currentQuestion = currentAssignment.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === currentAssignment.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0
  const progress = ((currentQuestionIndex + 1) / currentAssignment.questions.length) * 100

  // Check if assignment is already completed
  const isCompleted = currentAssignment.submission?.status === 'submitted' || 
                     currentAssignment.submission?.status === 'graded'

  return (
    <Dialog open={showAssignment} onOpenChange={setShowAssignment}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{currentAssignment.title}</DialogTitle>
              {currentAssignment.description && (
                <DialogDescription className="mt-2">
                  {currentAssignment.description}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentAssignment.time_limit && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentAssignment.time_limit} min
                </Badge>
              )}
              <Badge>
                {currentAssignment.total_points} points
              </Badge>
              {!currentAssignment.required_for_progress && currentAssignment.allow_skip && !isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {isCompleted ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Assignment Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold">
                    {currentAssignment.submission?.score || 0} / {currentAssignment.total_points}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="text-2xl font-bold">
                    {currentAssignment.submission?.percentage?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
              
              {currentAssignment.submission?.attempt_number && 
               currentAssignment.submission.attempt_number < currentAssignment.max_attempts && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have {currentAssignment.max_attempts - currentAssignment.submission.attempt_number} attempt(s) remaining.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAssignment(false)}>
                  Close
                </Button>
                {currentAssignment.submission?.attempt_number && 
                 currentAssignment.submission.attempt_number < currentAssignment.max_attempts && (
                  <Button onClick={handleRetry}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {currentAssignment.instructions && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{currentAssignment.instructions}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {currentAssignment.questions.length}
                  </span>
                  {currentAssignment.submission?.attempt_number && (
                    <Badge variant="outline">
                      Attempt {currentAssignment.submission.attempt_number} of {currentAssignment.max_attempts}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <Progress value={progress} className="h-2" />

              <Card>
                <CardContent className="pt-6">
                  <QuestionRenderer
                    question={currentQuestion}
                    answer={answers[`question_${currentQuestionIndex}`]}
                    onAnswerChange={(answer) => handleAnswerChange(`question_${currentQuestionIndex}`, answer)}
                    disabled={submitting}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  disabled={isFirstQuestion || submitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {!isLastQuestion ? (
                    <Button
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      disabled={submitting}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Assignment
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
