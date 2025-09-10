"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Assignment, Submission, MultipleChoiceQuestion, NumericalQuestion } from '@/types/assignment'
// import { supabase } from '@/lib/supabase' // Backend functionality disabled
import { Button } from '@/components/ui/button'
// Removed unused Card imports
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import QuestionRenderer from '@/components/assignment-taking/question-renderer'
import { Clock, CheckCircle, AlertCircle, Save } from 'lucide-react'

export default function AssignmentPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session) {
      fetchAssignmentAndSubmission()
    }
  }, [session, params.id]) // fetchAssignmentAndSubmission is stable

  const fetchAssignmentAndSubmission = async () => {
    try {
      // Backend functionality disabled - keeping frontend only
      // const { data: assignmentData, error: assignmentError } = await supabase
      //   .from('assignments')
      //   .select(`
      //     *,
      //     lesson:lessons(title, slug)
      //   `)
      //   .eq('id', params.id)
      //   .eq('published', true)
      //   .single()
      // if (assignmentError) throw assignmentError
      // setAssignment(assignmentData)

      // Mock data for frontend demo
      const mockAssignment: Assignment = {
        id: params.id,
        title: 'Newton\'s Laws Quiz',
        description: 'Test your understanding of Newton\'s three laws of motion',
        instructions: 'Answer all questions. Show your work for calculation problems.',
        lesson_id: '1',
        lesson: { title: 'Newton\'s Laws', slug: 'newtons-laws' },
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'What is Newton\'s first law?',
            points: 5,
            required: true,
            options: [
              'Objects at rest stay at rest',
              'F = ma',
              'Action-reaction pairs',
              'Gravity pulls down'
            ],
            correctAnswer: 0
          } as MultipleChoiceQuestion,
          {
            id: 'q2',
            type: 'numerical',
            question: 'Calculate the acceleration of a 10 kg object with 50 N force applied.',
            points: 10,
            required: true,
            correctValue: 5,
            unit: 'm/s²',
            tolerance: 0.1
          } as NumericalQuestion
        ],
        total_points: 15,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setAssignment(mockAssignment)

      // Mock submission - empty for demo
      setSubmission(null)
      setAnswers({})
    } catch (error) {
      console.error('Error fetching assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAnswer = (questionId: string, answer: string | number | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const saveProgress = async () => {
    if (!session?.user?.id || !assignment) return

    setSaving(true)
    try {
      // Backend functionality disabled - keeping frontend only
      // const submissionData = {
      //   assignment_id: assignment.id,
      //   user_id: session.user.id,
      //   answers: answers,
      //   status: 'partial'
      // }
      // if (submission) {
      //   const { error } = await supabase
      //     .from('submissions')
      //     .update({ answers: answers, status: 'partial' })
      //     .eq('id', submission.id)
      //   if (error) throw error
      // } else {
      //   const { data, error } = await supabase
      //     .from('submissions')
      //     .insert([submissionData])
      //     .select()
      //     .single()
      //   if (error) throw error
      //   setSubmission(data)
      // }
      
      // Simulate save for frontend demo
      console.log('Progress saved (frontend only):', answers)
      alert('Progress saved locally (demo mode - no backend)')
      
      // Create mock submission
      if (!submission) {
        setSubmission({
          id: Date.now().toString(),
          assignment_id: assignment.id,
          user_id: session.user.id,
          answers: answers,
          status: 'partial',
          submitted_at: undefined
        } as Submission)
      }
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
      
      // Backend functionality disabled - keeping frontend only
      // const submissionData = {
      //   assignment_id: assignment.id,
      //   user_id: session.user.id,
      //   answers: answers,
      //   score: gradedAnswers.totalScore,
      //   max_score: assignment.total_points,
      //   status: 'submitted',
      //   submitted_at: new Date().toISOString()
      // }
      // if (submission) {
      //   const { error } = await supabase
      //     .from('submissions')
      //     .update(submissionData)
      //     .eq('id', submission.id)
      //   if (error) throw error
      // } else {
      //   const { data, error } = await supabase
      //     .from('submissions')
      //     .insert([submissionData])
      //     .select()
      //     .single()
      //   if (error) throw error
      //   setSubmission(data)
      // }
      
      // Simulate submission for frontend demo
      console.log('Assignment submitted (frontend only):', {
        answers,
        score: gradedAnswers.totalScore,
        max_score: assignment.total_points
      })
      alert(`Assignment submitted! Score: ${gradedAnswers.totalScore}/${assignment.total_points} (demo mode - no backend)`)
      
      // Update local state to show as submitted
      setSubmission({
        id: submission?.id || Date.now().toString(),
        assignment_id: assignment.id,
        user_id: session.user.id,
        answers: answers,
        score: gradedAnswers.totalScore,
        max_score: assignment.total_points,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      } as Submission)

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
        const numAnswer = parseFloat(answer as string)
        const correct = numQuestion.correctValue
        const tolerance = numQuestion.tolerance || 0
        
        if (!isNaN(numAnswer) && Math.abs(numAnswer - correct) <= tolerance) {
          totalScore += question.points
          feedback[question.id] = 'Correct!'
        } else {
          feedback[question.id] = `Incorrect. Expected: ${correct}${numQuestion.unit ? ` ${numQuestion.unit}` : ''}`
        }
      }
    })

    return { totalScore, feedback }
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
                disabled={submitting || isDuePassed()}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
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
                disabled={submitting || isDuePassed()}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

