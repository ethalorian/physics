"use client"
import { use, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Assignment, Submission, MultipleChoiceQuestion, NumericalQuestion, OpenResponseQuestion, OpenResponseGrade } from '@/types/assignment'
import { useAssignments, saveSubmission } from '@/contexts/ConsolidatedAssignmentContext'
import { useActivityTracking } from '@/contexts/StudentActivityContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import QuestionRenderer from '@/components/assignment-taking/question-renderer'
import ProgressScoreboard from '@/components/assignment-taking/ProgressScoreboard'
import { Clock, CheckCircle, AlertCircle, Save } from 'lucide-react'

export default function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const { getLegacyAssignment, getSubmissionByAssignmentId } = useAssignments()
  const { recordAssignmentStart, recordAssignmentSubmission } = useActivityTracking()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number | string[] | Record<string, any>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [grading, setGrading] = useState(false)
  const [openResponseGrades, setOpenResponseGrades] = useState<OpenResponseGrade[]>([])
  const [startTime, setStartTime] = useState<string | null>(null)
  const [hasRecordedStart, setHasRecordedStart] = useState(false)

  const fetchAssignmentAndSubmission = useCallback(async () => {
    try {
      const assignmentData = getLegacyAssignment(resolvedParams.id)
      if (!assignmentData || !assignmentData.published) {
        setAssignment(null)
        setLoading(false)
        return
      }
      
      setAssignment(assignmentData)

      // Get existing submission
      if (session?.user?.id && getSubmissionByAssignmentId) {
        const existingSubmission = getSubmissionByAssignmentId(resolvedParams.id, session.user.id)
        if (existingSubmission) {
          setSubmission(existingSubmission)
          setAnswers(existingSubmission.answers)
        } else {
          setSubmission(null)
          setAnswers({})
        }
      }
    } catch (error) {
      console.error('Error fetching assignment:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, getLegacyAssignment, getSubmissionByAssignmentId, session])

  useEffect(() => {
    if (session) {
      fetchAssignmentAndSubmission()
    }
  }, [session, fetchAssignmentAndSubmission])

  // Record assignment start when user first accesses the assignment
  useEffect(() => {
    if (assignment && session?.user?.id && !hasRecordedStart && !submission) {
      const now = new Date().toISOString()
      setStartTime(now)
      setHasRecordedStart(true)
      recordAssignmentStart(assignment.id)
    }
  }, [assignment, session, hasRecordedStart, submission, recordAssignmentStart])

  const updateAnswer = (questionId: string, answer: string | number | string[] | Record<string, any>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const saveProgress = async () => {
    if (!session?.user?.id || !assignment) return

    setSaving(true)
    try {
      const submissionData = {
        assignment_id: assignment.id,
        user_id: session.user.id,
        answers: answers,
        status: 'partial' as const,
        submitted_at: new Date().toISOString()
      }
      
      const savedSubmission = await saveSubmission(submissionData)
      setSubmission(savedSubmission)
      
      console.log('Progress saved:', answers)
    } catch (error) {
      console.error('Error saving progress:', error)
      alert('Error saving progress')
    } finally {
      setSaving(false)
    }
  }

  const submitAssignment = async () => {
    if (!session?.user?.id || !assignment) return

    // Check if all required questions are answered
    const unanswered = assignment.questions.filter(q => 
      q.required && (!answers[q.id] || answers[q.id] === '')
    )

    if (unanswered.length > 0) {
      alert(`Please answer all required questions. Missing: ${unanswered.length} questions.`)
      return
    }

    setSubmitting(true)
    try {
      // Grade multiple choice and numerical questions immediately
      const gradedAnswers = await gradeAutoQuestions()
      
      const submissionData = {
        assignment_id: assignment.id,
        user_id: session.user.id,
        answers: answers,
        score: gradedAnswers.totalScore,
        max_score: assignment.total_points,
        feedback: gradedAnswers.feedback,
        rubric_grades: openResponseGrades,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString(),
        graded_at: new Date().toISOString()
      }
      
      const savedSubmission = await saveSubmission(submissionData)
      setSubmission(savedSubmission)
      
      // Record submission activity with timing data
      const timeSpent = startTime ? Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000) : undefined
      await recordAssignmentSubmission(
        assignment.id,
        submissionData,
        startTime || undefined,
        timeSpent
      )
      
      console.log('Assignment submitted:', {
        answers,
        score: gradedAnswers.totalScore,
        max_score: assignment.total_points,
        timeSpent: timeSpent ? `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s` : 'Unknown'
      })

      router.push(`/assignments/${assignment.id}/submitted`)
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('Error submitting assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const gradeAutoQuestions = async () => {
    let totalScore = 0
    const feedback: Record<string, string> = {}

    // Grade traditional questions (multiple choice, numerical)
    assignment!.questions.forEach(question => {
      const answer = answers[question.id]
      
      if (question.type === 'multiple-choice') {
        const mcQuestion = question as MultipleChoiceQuestion
        if (answer === mcQuestion.correctAnswer) {
          totalScore += question.points
          feedback[question.id] = 'Correct!'
        } else {
          feedback[question.id] = `Incorrect. The correct answer was: ${mcQuestion.options[mcQuestion.correctAnswer]}`
        }
      } else if (question.type === 'numerical') {
        const numQuestion = question as NumericalQuestion
        let numAnswer: number
        let selectedUnit = ''
        
        // Parse answer based on whether units are selectable
        if (numQuestion.unitOptions && typeof answer === 'string' && answer.includes('|')) {
          const parts = (answer as string).split('|')
          numAnswer = parseFloat(parts[0])
          selectedUnit = parts[1] || ''
        } else {
          numAnswer = parseFloat(answer as string)
        }
        
        const correct = numQuestion.correctValue
        const tolerance = numQuestion.tolerance || 0
        
        // Check both value and unit
        const valueCorrect = !isNaN(numAnswer) && Math.abs(numAnswer - correct) <= tolerance
        const unitCorrect = !numQuestion.unitOptions || selectedUnit === numQuestion.unit
        
        if (valueCorrect && unitCorrect) {
          totalScore += question.points
          feedback[question.id] = 'Correct!'
        } else if (valueCorrect && !unitCorrect) {
          feedback[question.id] = `Incorrect unit. Expected: ${numQuestion.unit}`
        } else if (!valueCorrect && unitCorrect) {
          feedback[question.id] = `Incorrect value. Expected: ${correct} ± ${tolerance}`
        } else {
          feedback[question.id] = `Incorrect. Expected: ${correct}${numQuestion.unit ? ` ${numQuestion.unit}` : ''}`
        }
      }
    })

    // Grade open response questions with AI
    const openResponseQuestions = assignment!.questions.filter(
      q => q.type === 'open-response' && (q as OpenResponseQuestion).autoGrade
    ) as OpenResponseQuestion[]

    if (openResponseQuestions.length > 0) {
      setGrading(true)
      try {
        const aiGrades = await gradeOpenResponseQuestions(openResponseQuestions)
        setOpenResponseGrades(aiGrades)
        
        // Add AI scores to total
        aiGrades.forEach(grade => {
          totalScore += grade.totalScore
          feedback[grade.questionId] = 'AI graded - see detailed feedback below'
        })
      } catch (error) {
        console.error('Failed to grade open response questions:', error)
        // Continue without AI grading
      } finally {
        setGrading(false)
      }
    }

    return { totalScore, feedback }
  }

  const gradeOpenResponseQuestions = async (questions: OpenResponseQuestion[]): Promise<OpenResponseGrade[]> => {
    try {
      const response = await fetch('/api/grade-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: questions,
          answers: answers,
          context: {
            subject: 'Physics',
            lessonTitle: assignment?.lesson?.title,
            additionalContext: assignment?.description
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to grade: ${response.statusText}`)
      }

      const result = await response.json()
      return result.grades || []
    } catch (error) {
      console.error('Error grading open response questions:', error)
      throw error
    }
  }

  const getProgress = () => {
    if (!assignment) return 0
    const answered = assignment.questions.filter(q => 
      answers[q.id] !== undefined && answers[q.id] !== ''
    ).length
    return (answered / assignment.questions.length) * 100
  }

  const isDuePassed = () => {
    if (!assignment?.due_date) return false
    return new Date() > new Date(assignment.due_date)
  }

  const isSubmitted = () => {
    return submission?.status === 'submitted' || submission?.status === 'graded'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Assignment not found or not published yet.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Scoreboard Drawer */}
      {!isSubmitted() && (
        <ProgressScoreboard 
          assignment={assignment} 
          answers={answers}
        />
      )}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
            {assignment.lesson && (
              <p className="text-muted-foreground">
                Part of: {assignment.lesson.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{assignment.total_points} points</Badge>
            {isSubmitted() && (
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
          </div>
        </div>

        {assignment.description && (
          <p className="text-lg text-muted-foreground mb-4">{assignment.description}</p>
        )}

        {assignment.instructions && (
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
            <div className="text-blue-800 whitespace-pre-wrap">{assignment.instructions}</div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium">Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={getProgress()} className="w-32" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(getProgress())}%
                </span>
              </div>
            </div>
            
            {assignment.due_date && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due Date
                </p>
                <p className={`text-sm ${isDuePassed() ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {new Date(assignment.due_date).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {!isSubmitted() && (
            <div className="flex gap-2">
              <Button 
                onClick={saveProgress} 
                variant="outline" 
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Progress'}
              </Button>
              <Button 
                onClick={submitAssignment} 
                disabled={submitting || grading || isDuePassed()}
              >
                {grading ? 'Grading with AI...' : submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          )}
        </div>

        {isDuePassed() && !isSubmitted() && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This assignment is past due. You may not be able to submit it.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {assignment.questions.map((question, index) => (
          <div key={question.id}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Question {index + 1}</Badge>
              {question.required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
            </div>
            <QuestionRenderer
              question={question}
              answer={answers[question.id]}
              onAnswerChange={(answer) => updateAnswer(question.id, answer)}
              disabled={isSubmitted()}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isSubmitted() && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Make sure to save your progress frequently!
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={saveProgress} 
                variant="outline" 
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Progress'}
              </Button>
              <Button 
                onClick={submitAssignment} 
                disabled={submitting || grading || isDuePassed()}
              >
                {grading ? 'Grading with AI...' : submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

