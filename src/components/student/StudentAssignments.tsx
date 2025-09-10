"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Removed unused Textarea import
// import { supabase } from '@/lib/supabase' // Backend functionality disabled
import { FileText, Search, Calendar, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: number
  title: string
  description: string
  content: string
  due_date: string
  points: number
  published: boolean
  created_at: string
}

interface AssignmentSubmission {
  id: number
  assignment_id: number
  student_id: string
  content: string
  submitted_at: string
  grade?: number
  feedback?: string
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAssignmentsAndSubmissions()
  }, [])

  const fetchAssignmentsAndSubmissions = async () => {
    try {
      setLoading(true)
      
      // Backend functionality disabled - keeping frontend only
      // const { data: assignmentsData, error: assignmentsError } = await supabase
      //   .from('assignments')
      //   .select('*')
      //   .eq('published', true)
      //   .order('due_date', { ascending: true })
      // 
      // if (assignmentsError) throw assignmentsError
      // setAssignments(assignmentsData || [])
      
      // Mock data for frontend demo
      setAssignments([
        {
          id: 1,
          title: 'Newton\'s Laws Quiz',
          description: 'Test your understanding of Newton\'s three laws of motion',
          content: 'Complete all questions showing your work.',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          points: 100,
          published: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Energy and Work Problems',
          description: 'Problem set on kinetic and potential energy',
          content: 'Solve the following energy problems.',
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          points: 50,
          published: true,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Waves and Sound Lab',
          description: 'Experimental lab on wave properties',
          content: 'Complete the lab exercises and submit your report.',
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          points: 75,
          published: true,
          created_at: new Date().toISOString()
        }
      ])
      
      // Mock submission data for demo
      setSubmissions([
        {
          id: 1,
          assignment_id: 3,
          student_id: 'demo-student',
          content: 'Lab report submitted',
          submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          grade: 85,
          feedback: 'Good work on the wave analysis!'
        }
      ])
      
    } catch {
      // Silent error handling
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentSubmission = (assignmentId: number) => {
    return submissions.find(s => s.assignment_id === assignmentId)
  }

  const getStatusBadge = (assignment: Assignment) => {
    const submission = getAssignmentSubmission(assignment.id)
    const dueDate = new Date(assignment.due_date)
    const now = new Date()
    
    if (submission) {
      if (submission.grade !== undefined) {
        return <Badge className="bg-blue-500 hover:bg-blue-600">Graded</Badge>
      }
      return <Badge className="bg-green-500 hover:bg-green-600">Submitted</Badge>
    }
    
    if (dueDate < now) {
      return <Badge variant="destructive">Past Due</Badge>
    } else if (dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Due Soon</Badge>
    } else {
      return <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">Not Started</Badge>
    }
  }

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const upcomingAssignments = assignments.filter(assignment => {
    const dueDate = new Date(assignment.due_date)
    const now = new Date()
    const submission = getAssignmentSubmission(assignment.id)
    return dueDate > now && !submission
  })

  const completedAssignments = assignments.filter(assignment => {
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
              <div className="text-2xl font-bold text-[#4A1A4A]">{assignments.length}</div>
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
                {submissions.filter(s => s.grade !== undefined).length > 0 
                  ? Math.round(submissions.filter(s => s.grade !== undefined).reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.filter(s => s.grade !== undefined).length)
                  : '-'
                }
                {submissions.filter(s => s.grade !== undefined).length > 0 && '%'}
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
                {assignments.length === 0 ? 'No assignments available' : 'No assignments match your search'}
              </h3>
              <p className="text-[#6A4C93] text-center">
                {assignments.length === 0 
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
                        {assignment.points} pts
                      </Badge>
                      {submission?.grade !== undefined && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {submission.grade}%
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
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                      {submission && (
                        <span className="flex items-center gap-1">
                          <Upload className="h-4 w-4" />
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {submission?.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-blue-700">{submission.feedback}</p>
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
