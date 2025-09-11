"use client"
import { useState } from 'react'
import { useAssignments } from '@/contexts/AssignmentContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import Link from 'next/link'
import { Assignment, Submission } from '@/types/assignment'

export default function StudentAssignments() {
  const { assignments, submissions, loading, getSubmissionByAssignmentId } = useAssignments()
  const [searchTerm, setSearchTerm] = useState('')

  const getAssignmentSubmission = (assignmentId: string): Submission | undefined => {
    return getSubmissionByAssignmentId(assignmentId)
  }

  const getStatusBadge = (assignment: Assignment) => {
    const submission = getAssignmentSubmission(assignment.id)
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    const now = new Date()
    
    if (submission) {
      if (submission.score !== undefined) {
        return <Badge className="bg-blue-500 hover:bg-blue-600">Graded</Badge>
      }
      return <Badge className="bg-green-500 hover:bg-green-600">Submitted</Badge>
    }
    
    if (dueDate && dueDate < now) {
      return <Badge variant="destructive">Past Due</Badge>
    } else if (dueDate && dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Due Soon</Badge>
    } else {
      return <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">Not Started</Badge>
    }
  }

  const publishedAssignments = assignments.filter(assignment => assignment.published)

  const filteredAssignments = publishedAssignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (assignment.description && assignment.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const upcomingAssignments = publishedAssignments.filter(assignment => {
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    const now = new Date()
    const submission = getAssignmentSubmission(assignment.id)
    return dueDate && dueDate > now && !submission
  })

  const completedAssignments = publishedAssignments.filter(assignment => {
    const submission = getAssignmentSubmission(assignment.id)
    return submission !== undefined
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A4C93]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#4A1A4A]">My Assignments</h2>
          <p className="text-[#6A4C93]">Track your assignment progress and submissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9A8AC0]" />
        <Input
          placeholder="Search assignments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Assignment Overview */}
      {assignments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6A4C93]">
                Total Assignments
              </CardTitle>
              <FileText className="h-4 w-4 text-[#9A8AC0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A1A4A]">{publishedAssignments.length}</div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6A4C93]">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-[#9A8AC0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A1A4A]">{completedAssignments.length}</div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6A4C93]">
                Upcoming
              </CardTitle>
              <Clock className="h-4 w-4 text-[#9A8AC0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A1A4A]">{upcomingAssignments.length}</div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6A4C93]">
                Average Grade
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-[#9A8AC0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A1A4A]">
                {submissions.filter(s => s.score !== undefined).length > 0 
                  ? Math.round(submissions.filter(s => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score !== undefined).length)
                  : '-'
                }
                {submissions.filter(s => s.score !== undefined).length > 0 && '%'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card className="apple-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-[#9A8AC0] mb-4" />
              <h3 className="text-lg font-medium text-[#4A1A4A] mb-2">
                {publishedAssignments.length === 0 ? 'No assignments available' : 'No assignments match your search'}
              </h3>
              <p className="text-[#6A4C93] text-center">
                {publishedAssignments.length === 0 
                  ? 'Your teacher hasn\'t published any assignments yet. Check back later!'
                  : 'Try adjusting your search terms to find the assignments you\'re looking for.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const submission = getAssignmentSubmission(assignment.id)
            return (
              <Card key={assignment.id} className="apple-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(assignment)}
                      <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">
                        {assignment.total_points} pts
                      </Badge>
                      {submission?.score !== undefined && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {submission.score}/{submission.max_score} ({Math.round((submission.score / (submission.max_score || 1)) * 100)}%)
                        </Badge>
                      )}
                    </div>
                    <Link href={`/assignments/${assignment.id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]">
                        {submission ? 'View Submission' : 'Start Assignment'}
                      </Button>
                    </Link>
                  </div>
                  <CardTitle className="text-[#4A1A4A]">{assignment.title}</CardTitle>
                  <CardDescription className="text-[#6A4C93]">{assignment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-[#9A8AC0]">
                    <div className="flex items-center gap-4">
                      {assignment.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {submission && (
                        <span className="flex items-center gap-1">
                          <Upload className="h-4 w-4" />
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {submission?.feedback && Object.keys(submission.feedback).length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-1">Feedback:</p>
                      <div className="text-sm text-blue-700 space-y-1">
                        {Object.entries(submission.feedback).map(([questionId, feedback]) => (
                          <p key={questionId}>{feedback}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
