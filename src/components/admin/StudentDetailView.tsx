"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  BookOpen, 
  FileText, 
  Clock, 
  Award, 
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Timer,
  Target,
  Activity
} from 'lucide-react'
import { useStudentActivity, StudentActivitySummary, AssignmentSubmission, LessonProgress } from '@/contexts/StudentActivityContext'
import MathMarkdown from '@/components/MathMarkdown'

interface StudentDetailViewProps {
  studentEmail: string
  onBack: () => void
}

export default function StudentDetailView({ studentEmail, onBack }: StudentDetailViewProps) {
  const {
    studentSummaries,
    getStudentSummary,
    getSubmissionsForStudent,
    getLessonProgressForStudent,
    activities,
    fetchStudentActivities,
    fetchStudentSummaries,
    fetchAssignmentSubmissions
  } = useStudentActivity()

  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  const studentSummary = getStudentSummary(studentEmail)
  const studentSubmissions = getSubmissionsForStudent(studentEmail)
  const studentLessonProgress = getLessonProgressForStudent(studentEmail)
  const studentActivities = activities.filter(activity => activity.user_email === studentEmail)

  // Load detailed data for this student
  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchStudentActivities({ student_email: studentEmail }),
          fetchAssignmentSubmissions(undefined, studentEmail),
          fetchStudentSummaries(studentEmail)
        ])
      } catch (error) {
        console.error('Error loading student data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStudentData()
  }, [studentEmail, fetchStudentActivities, fetchAssignmentSubmissions, fetchStudentSummaries])

  if (!studentSummary) {
    return (
      <Card className="apple-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Student Not Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Could not find activity data for {studentEmail}
          </p>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-500 text-white">Excellent</Badge>
    if (percentage >= 80) return <Badge className="bg-blue-500 text-white">Good</Badge>
    if (percentage >= 70) return <Badge className="bg-yellow-500 text-white">Fair</Badge>
    return <Badge variant="destructive">Needs Improvement</Badge>
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {studentSummary.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{studentSummary.user_name}</h2>
              <p className="text-muted-foreground">{studentSummary.user_email}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {Math.round(studentSummary.avg_assignment_score)}%
          </div>
          <p className="text-sm text-muted-foreground">Average Score</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Viewed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentSummary.total_lessons_viewed}</div>
            <p className="text-xs text-muted-foreground">
              {studentSummary.lessons_in_progress} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentSummary.total_assignments_submitted}</div>
            <p className="text-xs text-muted-foreground">
              {studentSummary.assignments_completed} completed
            </p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(studentLessonProgress.reduce((acc, p) => acc + p.total_time_spent, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all lessons
            </p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - new Date(studentSummary.last_activity).getTime()) / (1000 * 60 * 60 * 24))}d
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(studentSummary.last_activity).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Assignment Performance</CardTitle>
                <CardDescription>Recent assignment scores and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentSubmissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Assignment {submission.assignment_id.split('-').pop()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(submission.time_submitted).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {submission.score !== null && submission.score !== undefined && submission.max_score ? (
                        <>
                          <div className={`text-lg font-bold ${getScoreColor((submission.score / submission.max_score) * 100)}`}>
                            {Math.round((submission.score / submission.max_score) * 100)}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {submission.score}/{submission.max_score} pts
                          </p>
                        </>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Lesson Progress</CardTitle>
                <CardDescription>Current lesson engagement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentLessonProgress.slice(0, 5).map((progress) => (
                  <div key={progress.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{progress.lesson?.title || 'Unknown Lesson'}</p>
                        <p className="text-sm text-muted-foreground">
                          {progress.visit_count} visits • {formatDuration(progress.total_time_spent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{progress.progress_percentage}%</div>
                        {progress.completed_at && (
                          <CheckCircle className="h-4 w-4 text-green-500 inline" />
                        )}
                      </div>
                    </div>
                    <Progress value={progress.progress_percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Learning Insights</CardTitle>
              <CardDescription>Analysis of student&apos;s learning patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">
                    {studentSubmissions.filter(s => s.percentage && s.percentage >= 80).length}
                  </div>
                  <p className="text-sm text-muted-foreground">High-scoring assignments</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Timer className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">
                    {Math.round(studentLessonProgress.reduce((acc, p) => acc + p.total_time_spent, 0) / studentLessonProgress.length / 60) || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Avg minutes per lesson</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">
                    {studentLessonProgress.filter(p => p.completed_at).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Lessons completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
              <CardDescription>All assignment submissions and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentSubmissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">Assignment {submission.assignment_id.split('-').pop()}</h4>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(submission.time_submitted).toLocaleString()}
                        </p>
                        {submission.time_spent && (
                          <p className="text-sm text-muted-foreground">
                            Time spent: {formatDuration(submission.time_spent)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {submission.score !== null && submission.score !== undefined && submission.max_score ? (
                          <div>
                            <div className={`text-xl font-bold ${getScoreColor((submission.score / submission.max_score) * 100)}`}>
                              {Math.round((submission.score / submission.max_score) * 100)}%
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {submission.score}/{submission.max_score} points
                            </p>
                            {getScoreBadge((submission.score / submission.max_score) * 100)}
                          </div>
                        ) : (
                          <Badge variant="secondary">Pending Review</Badge>
                        )}
                      </div>
                    </div>
                    
                    {submission.feedback && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <h5 className="font-medium mb-2">Teacher Feedback</h5>
                        <MathMarkdown content={submission.feedback} />
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Badge variant={submission.auto_graded ? "default" : "outline"}>
                        {submission.auto_graded ? "Auto-graded" : "Manual"}
                      </Badge>
                      {submission.manually_graded && (
                        <Badge variant="secondary">Teacher Reviewed</Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {studentSubmissions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No assignment submissions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Lesson Progress</CardTitle>
              <CardDescription>Detailed lesson engagement and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentLessonProgress.map((progress) => (
                  <div key={progress.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{progress.lesson?.title || 'Unknown Lesson'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(progress.started_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last accessed: {new Date(progress.last_accessed).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{progress.progress_percentage}%</div>
                        {progress.completed_at ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Progress value={progress.progress_percentage} className="mb-4" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Visits</p>
                        <p className="font-medium">{progress.visit_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Spent</p>
                        <p className="font-medium">{formatDuration(progress.total_time_spent)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sections Viewed</p>
                        <p className="font-medium">{progress.sections_viewed.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">
                          {progress.completed_at ? 'Complete' : 'In Progress'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {studentLessonProgress.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No lesson progress found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Chronological log of all student activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                    <div className="p-2 rounded-full bg-primary/10">
                      {activity.activity_type === 'lesson_view' && <BookOpen className="h-4 w-4 text-primary" />}
                      {activity.activity_type === 'assignment_start' && <FileText className="h-4 w-4 text-primary" />}
                      {activity.activity_type === 'assignment_submit' && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {activity.activity_type === 'lesson_view' && 'Viewed lesson'}
                            {activity.activity_type === 'assignment_start' && 'Started assignment'}
                            {activity.activity_type === 'assignment_submit' && 'Submitted assignment'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.lesson?.title || `Assignment ${activity.assignment_id?.split('-').pop()}`}
                          </p>
                          {activity.session_duration && (
                            <p className="text-xs text-muted-foreground">
                              Duration: {formatDuration(activity.session_duration)}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{new Date(activity.created_at).toLocaleDateString()}</div>
                          <div>{new Date(activity.created_at).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {studentActivities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity records found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
