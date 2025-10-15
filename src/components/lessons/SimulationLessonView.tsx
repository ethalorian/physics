'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Lock, 
  Play, 
  FileText,
  Clock,
  Target,
  Loader2
} from 'lucide-react'

interface SimulationLessonViewProps {
  lesson: {
    id: string
    slug: string
    title: string
    description?: string
    objectives?: string[]
    prerequisites?: string[]
    simulation_id: string
    simulation?: {
      id: string
      slug: string
      title: string
      description?: string
      difficulty: string
      estimated_time?: number
    }
    embedded_questions?: EmbeddedQuestion[]
    question_timing: 'before' | 'after' | 'mixed'
    difficulty?: string
    estimated_time?: number
  }
  onProgress?: (lessonId: string, progress: number) => void
  onComplete?: (lessonId: string) => void
}

interface EmbeddedQuestion {
  id: string
  timing: 'before' | 'after'
  order: number
  question: any // Full question object
}

export default function SimulationLessonView({ 
  lesson, 
  onProgress,
  onComplete 
}: SimulationLessonViewProps) {
  const [currentPhase, setCurrentPhase] = useState<'pre-questions' | 'simulation' | 'post-questions' | 'complete'>('pre-questions')
  const [preQuestionsAnswered, setPreQuestionsAnswered] = useState(false)
  const [simulationCompleted, setSimulationCompleted] = useState(false)
  const [postQuestionsAnswered, setPostQuestionsAnswered] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [simulationData, setSimulationData] = useState<any>(null)

  // Separate questions by timing
  const preQuestions = lesson.embedded_questions?.filter(q => q.timing === 'before').sort((a, b) => a.order - b.order) || []
  const postQuestions = lesson.embedded_questions?.filter(q => q.timing === 'after').sort((a, b) => a.order - b.order) || []

  // Determine initial phase
  useEffect(() => {
    if (preQuestions.length === 0) {
      setCurrentPhase('simulation')
      setPreQuestionsAnswered(true)
    }
  }, [])

  // Calculate progress
  const calculateProgress = useCallback(() => {
    let completed = 0
    const total = 3 // pre-questions, simulation, post-questions

    if (preQuestions.length === 0 || preQuestionsAnswered) completed++
    if (simulationCompleted) completed++
    if (postQuestions.length === 0 || postQuestionsAnswered) completed++

    return (completed / total) * 100
  }, [preQuestions.length, preQuestionsAnswered, simulationCompleted, postQuestions.length, postQuestionsAnswered])

  // Update progress
  useEffect(() => {
    const progress = calculateProgress()
    if (onProgress) {
      onProgress(lesson.id, progress)
    }
  }, [calculateProgress, lesson.id, onProgress])

  // Handle pre-questions completion
  const handlePreQuestionsComplete = useCallback((questionAnswers: Record<string, any>) => {
    setAnswers(prev => ({ ...prev, ...questionAnswers }))
    setPreQuestionsAnswered(true)
    setCurrentPhase('simulation')
  }, [])

  // Handle simulation completion
  const handleSimulationComplete = useCallback((data: any) => {
    setSimulationData(data)
    setSimulationCompleted(true)
    
    if (postQuestions.length > 0) {
      setCurrentPhase('post-questions')
    } else {
      setCurrentPhase('complete')
      if (onComplete) {
        onComplete(lesson.id)
      }
    }
  }, [lesson.id, onComplete, postQuestions.length])

  // Handle post-questions completion
  const handlePostQuestionsComplete = useCallback((questionAnswers: Record<string, any>) => {
    setAnswers(prev => ({ ...prev, ...questionAnswers }))
    setPostQuestionsAnswered(true)
    setCurrentPhase('complete')
    
    if (onComplete) {
      onComplete(lesson.id)
    }
  }, [lesson.id, onComplete])

  // Dynamically load simulation component
  const SimulationComponent = lesson.simulation?.slug 
    ? dynamic(() => import(`@/app/simulations/${lesson.simulation!.slug}/page`), {
        loading: () => (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ),
        ssr: false
      })
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{lesson.unit_id?.toUpperCase()}</span>
              <span>›</span>
              <span>{lesson.title}</span>
            </div>

            {/* Title and Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
                {lesson.description && (
                  <p className="text-muted-foreground max-w-2xl">{lesson.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {lesson.simulation?.difficulty || lesson.difficulty || 'Intermediate'}
                </Badge>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {lesson.estimated_time || 20} min
                </Badge>
              </div>
            </div>

            {/* Objectives */}
            {lesson.objectives && lesson.objectives.length > 0 && (
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="font-semibold text-blue-900">Learning Objectives:</div>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {lesson.objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lesson Progress</span>
                <span className="font-medium">{calculateProgress().toFixed(0)}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${preQuestionsAnswered || preQuestions.length === 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {preQuestionsAnswered || preQuestions.length === 0 ? <CheckCircle className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>Pre-Questions</span>
                </div>
                <div className={`flex items-center gap-1 ${simulationCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {simulationCompleted ? <CheckCircle className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>Simulation</span>
                </div>
                <div className={`flex items-center gap-1 ${postQuestionsAnswered || postQuestions.length === 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {postQuestionsAnswered || postQuestions.length === 0 ? <CheckCircle className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>Post-Questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* Phase 1: Pre-Simulation Questions */}
        {currentPhase === 'pre-questions' && preQuestions.length > 0 && (
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Pre-Lab Questions
              </CardTitle>
              <CardDescription>
                Answer these questions before accessing the simulation. They'll help you think about what to expect.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <QuestionBlock
                questions={preQuestions}
                onComplete={handlePreQuestionsComplete}
                submitButtonText="Unlock Simulation"
              />
            </CardContent>
          </Card>
        )}

        {/* Phase 2: Simulation */}
        {currentPhase === 'simulation' && SimulationComponent && (
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Interactive Simulation: {lesson.simulation?.title}
              </CardTitle>
              <CardDescription>
                Explore the simulation, collect data, and observe the physics concepts in action.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Suspense fallback={
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }>
                <SimulationComponent 
                  embedded={true}
                  onComplete={handleSimulationComplete}
                />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {/* Phase 3: Post-Simulation Questions */}
        {currentPhase === 'post-questions' && postQuestions.length > 0 && (
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Analysis Questions
              </CardTitle>
              <CardDescription>
                Based on your simulation experience and data, answer these questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <QuestionBlock
                questions={postQuestions}
                simulationData={simulationData}
                onComplete={handlePostQuestionsComplete}
                submitButtonText="Complete Lesson"
              />
            </CardContent>
          </Card>
        )}

        {/* Phase 4: Completion */}
        {currentPhase === 'complete' && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-6">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-green-900">Lesson Complete!</h2>
                <p className="text-green-700 max-w-md mx-auto">
                  You've successfully completed {lesson.title}. Great work!
                </p>
                <div className="flex gap-3 justify-center pt-4">
                  <Button variant="outline" onClick={() => window.location.href = '/lessons'}>
                    Back to Lessons
                  </Button>
                  <Button onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Question Block Component
function QuestionBlock({ 
  questions, 
  simulationData,
  onComplete,
  submitButtonText = 'Submit'
}: {
  questions: EmbeddedQuestion[]
  simulationData?: any
  onComplete: (answers: Record<string, any>) => void
  submitButtonText?: string
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswerChange = (questionId: string, answer: any) => {
    setQuestionAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (isLastQuestion) {
      // Submit all answers
      setIsSubmitting(true)
      setTimeout(() => {
        onComplete(questionAnswers)
        setIsSubmitting(false)
      }, 500)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const hasAnsweredCurrent = questionAnswers[currentQuestion.id] !== undefined

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium">
          {Object.keys(questionAnswers).length} / {questions.length} answered
        </span>
      </div>

      {/* Current Question */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="font-medium text-muted-foreground text-sm">
                  Question {currentQuestionIndex + 1}
                </div>
                <div className="text-lg font-semibold">
                  {currentQuestion.question.question}
                </div>
              </div>
              <Badge variant="secondary">{currentQuestion.question.points} pts</Badge>
            </div>

            {/* Question Input (type-specific rendering) */}
            <div className="pt-4">
              {/* This would render different question types */}
              {/* For now, placeholder: */}
              <div className="text-sm text-muted-foreground italic">
                Question rendering component will go here (Multiple Choice, Numerical, Open Response, etc.)
              </div>
              {/* You'd integrate your existing question renderer here */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentQuestionIndex 
                  ? 'bg-primary w-4' 
                  : questionAnswers[questions[index].id] 
                    ? 'bg-green-500'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={!hasAnsweredCurrent || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : isLastQuestion ? (
            submitButtonText
          ) : (
            'Next Question'
          )}
        </Button>
      </div>
    </div>
  )
}


