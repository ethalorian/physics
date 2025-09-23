"use client"
import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useViewAwarePermissions } from '@/hooks/useViewAwarePermissions'
import { useAssignments } from '@/contexts/AssignmentContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  FileText, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  EyeOff
} from 'lucide-react'
import StudentLessons from '@/components/student/StudentLessons'
import StudentAssignments from '@/components/student/StudentAssignments'
import { StudentAssignmentView } from '@/components/assignment-system/StudentAssignmentView'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { userRole } = usePermissions()
  const { viewMode, toggleViewMode } = useViewMode()
  const { isAuthenticated, canAccessAdmin } = useViewAwarePermissions(viewMode)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    // Only redirect if user is an admin AND not in student view mode
    if (isAuthenticated && canAccessAdmin && viewMode !== 'student') {
      router.replace('/admin/dashboard')
    }
  }, [isAuthenticated, canAccessAdmin, viewMode, router])

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Authentication Required</h2>
          <p className="text-[#6A4C93] mb-6">Please sign in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  // If admin and not in student view mode, show loading while redirect happens
  if (canAccessAdmin && viewMode !== 'student') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Redirecting...</h2>
          <p className="text-[#6A4C93]">Taking you to the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#4A1A4A] dark:text-[#FFFFFF] relative">
              My Dashboard
              <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-[#D4AF37] to-[#6A4C93] rounded-full" />
            </h1>
            <p className="text-lg text-[#6A4C93] dark:text-[#E8DDFF] mt-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {viewMode === 'student' && (userRole === 'admin' || userRole === 'teacher') && (
              <Button
                onClick={() => {
                  toggleViewMode()
                  router.push('/admin/dashboard')
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Student View</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            )}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Logged in as</span>
              <div className="font-medium text-foreground capitalize">
                {viewMode === 'student' && (userRole === 'admin' || userRole === 'teacher') ? 'Admin' : userRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Lessons</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <StudentOverview />
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <StudentLessons />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <StudentAssignmentView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Overview component with live data
function StudentOverview() {
  const { assignments, submissions, getSubmissionByAssignmentId } = useAssignments()
  const { data: session } = useSession()
  
  // Filter published assignments
  const publishedAssignments = assignments.filter(assignment => assignment.published)
  
  // Calculate stats
  const completedAssignments = publishedAssignments.filter(assignment => {
    const submission = getSubmissionByAssignmentId(assignment.id, session?.user?.id)
    return submission !== undefined
  })
  
  const upcomingAssignments = publishedAssignments.filter(assignment => {
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    const now = new Date()
    const submission = getSubmissionByAssignmentId(assignment.id, session?.user?.id)
    return dueDate && dueDate > now && !submission
  })
  
  const gradedSubmissions = submissions.filter(s => s.score !== undefined)
  const averageGrade = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + ((s.score || 0) / (s.max_score || 1) * 100), 0) / gradedSubmissions.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Progress Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressCard
          title="Total Assignments"
          value={publishedAssignments.length}
          icon={<FileText className="h-4 w-4 text-[#9A8AC0]" />}
        />
        
        <ProgressCard
          title="Assignments Due"
          value={upcomingAssignments.length}
          icon={<Clock className="h-4 w-4 text-[#9A8AC0]" />}
        />
        
        <ProgressCard
          title="Completed"
          value={completedAssignments.length}
          icon={<CheckCircle className="h-4 w-4 text-[#9A8AC0]" />}
        />
        
        <ProgressCard
          title="Average Grade"
          value={gradedSubmissions.length > 0 ? `${averageGrade}%` : '-'}
          icon={<BarChart3 className="h-4 w-4 text-[#9A8AC0]" />}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
      
      {/* Upcoming Deadlines */}
      <UpcomingDeadlines />
    </div>
  )
}

// Progress card component with real data
function ProgressCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="apple-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#6A4C93]">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#4A1A4A]">{value}</div>
        <p className="text-xs text-[#9A8AC0]">
          Current status
        </p>
      </CardContent>
    </Card>
  )
}

// Recent activity component
function RecentActivity() {
  const { submissions } = useAssignments()
  
  // Get recent submissions (last 5)
  const recentSubmissions = submissions
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5)

  return (
    <Card className="apple-card">
      <CardHeader>
        <CardTitle className="text-[#4A1A4A]">Recent Activity</CardTitle>
        <CardDescription className="text-[#6A4C93]">
          Your latest submission activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-[#9A8AC0] mb-4" />
            <p className="text-[#6A4C93] text-center">
              No recent activity to display
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between py-2 border-b border-[#E8E8E8] last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-[#4A1A4A]">Assignment Submitted</p>
                  <p className="text-xs text-[#9A8AC0]">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                {submission.score !== undefined && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#4A1A4A]">
                      {submission.score}/{submission.max_score}
                    </p>
                    <p className="text-xs text-[#9A8AC0]">
                      {Math.round((submission.score / (submission.max_score || 1)) * 100)}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Upcoming deadlines component
function UpcomingDeadlines() {
  const { assignments, getSubmissionByAssignmentId } = useAssignments()
  const { data: session } = useSession()
  
  // Get upcoming assignments (due within next 30 days, not submitted)
  const upcomingDeadlines = assignments
    .filter(assignment => {
      if (!assignment.published || !assignment.due_date) return false
      const dueDate = new Date(assignment.due_date)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const submission = getSubmissionByAssignmentId(assignment.id, session?.user?.id)
      return dueDate > now && dueDate <= thirtyDaysFromNow && !submission
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  return (
    <Card className="apple-card">
      <CardHeader>
        <CardTitle className="text-[#4A1A4A]">Upcoming Deadlines</CardTitle>
        <CardDescription className="text-[#6A4C93]">
          Assignment due dates you need to keep track of
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingDeadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Clock className="h-12 w-12 text-[#9A8AC0] mb-4" />
            <p className="text-[#6A4C93] text-center">
              No upcoming deadlines
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingDeadlines.map((assignment) => {
              const dueDate = new Date(assignment.due_date!)
              const now = new Date()
              const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <div key={assignment.id} className="flex items-center justify-between py-2 border-b border-[#E8E8E8] last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-[#4A1A4A]">{assignment.title}</p>
                    <p className="text-xs text-[#9A8AC0]">
                      {assignment.total_points} points
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#4A1A4A]">
                      {dueDate.toLocaleDateString()}
                    </p>
                    <p className={`text-xs ${daysUntilDue <= 3 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-orange-600' : 'text-[#9A8AC0]'}`}>
                      {daysUntilDue === 1 ? 'Due tomorrow' : `${daysUntilDue} days left`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}