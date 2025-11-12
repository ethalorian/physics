"use client"
import { use, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Assignment, Submission, OpenResponseQuestion } from '@/types/assignment'
import { useAssignments } from '@/contexts/ConsolidatedAssignmentContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowLeft, Bot } from 'lucide-react'
import Link from 'next/link'
import QuestionRenderer from '@/components/assignment-taking/question-renderer'
import RubricFeedback from '@/components/assignment-taking/rubric-feedback'

// Backend functionality disabled - keeping frontend only
// async function getSubmissionDetails(assignmentId: string, userId: string) {
//   const { data, error } = await supabase
//     .from('submissions')
//     .select(`
//       *,
//       assignment:assignments(
//         title,
//         total_points,
//         lesson:lessons(title, slug)
//       )
//     `)
//     .eq('assignment_id', assignmentId)
//     .eq('user_id', userId)
//     .single()
// 
//   if (error) throw error
//   return data
// }

export default function SubmittedPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const { getLegacyAssignment, getSubmissionByAssignmentId } = useAssignments()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubmissionDetails = useCallback(async () => {
    try {
      const assignmentData = getLegacyAssignment(resolvedParams.id)
      if (!assignmentData) {
        setAssignment(null)
        setSubmission(null)
        setLoading(false)
        return
      }
      
      setAssignment(assignmentData)

      // Get submission for this assignment
      if (session?.user?.id && getSubmissionByAssignmentId) {
        const submissionData = getSubmissionByAssignmentId(resolvedParams.id, session.user.id)
        setSubmission(submissionData || null)
      }
    } catch (error) {
      console.error('Error fetching submission details:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, getLegacyAssignment, getSubmissionByAssignmentId, session])

  useEffect(() => {
    if (session) {
      fetchSubmissionDetails()
    }
  }, [session, fetchSubmissionDetails])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!assignment || !submission) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Submission not found.</p>
            <Link href="/assignments">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const scorePercentage = submission.max_score ? (submission.score! / submission.max_score) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Assignment Submitted Successfully!
          </CardTitle>
          <div className="text-lg font-medium">
            {assignment.title}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Score:</span>
              <Badge variant="default" className="text-lg px-3 py-1">
                {submission.score} / {submission.max_score} ({Math.round(scorePercentage)}%)
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Submitted at:</span>
              <span className="text-muted-foreground">
                {new Date(submission.submitted_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <Badge variant="default">
                <CheckCircle className="w-3 h-3 mr-1" />
                Graded
              </Badge>
            </div>
          </div>

          <div className="text-center">
            <Link href="/assignments">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignments
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Detailed Results</h2>
        
        {assignment.questions.map((question, index) => {
          const answer = submission.answers[question.id]
          const rubricGrade = submission.rubric_grades?.find(g => g.questionId === question.id)
          
          return (
            <div key={question.id} className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">Question {index + 1}</Badge>
                {question.type === 'open-response' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    AI Graded
                  </Badge>
                )}
              </div>
              
              <QuestionRenderer
                question={question}
                answer={answer}
                onAnswerChange={() => {}} // Read-only
                showFeedback={true}
                disabled={true}
              />

              {/* Show rubric feedback for open response questions */}
              {question.type === 'open-response' && rubricGrade && (
                <RubricFeedback
                  grade={rubricGrade}
                  rubric={(question as OpenResponseQuestion).rubric}
                  showDetails={true}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

