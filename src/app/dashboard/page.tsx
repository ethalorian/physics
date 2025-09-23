"use client"
import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useViewAwarePermissions } from '@/hooks/useViewAwarePermissions'
import { useAssignments } from '@/contexts/AssignmentContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  FileText, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  EyeOff,
  Gamepad2
} from 'lucide-react'
import StudentLessons from '@/components/student/StudentLessons'
import StudentAssignments from '@/components/student/StudentAssignments'
import VocabularyGamesOverview from '@/components/student/VocabularyGamesOverview'
import { StudentAssignmentView } from '@/components/assignment-system/StudentAssignmentView'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useVocabulary } from '@/contexts/VocabularyContext'
import Link from 'next/link'

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
          <h2 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  // If admin and not in student view mode, show loading while redirect happens
  if (canAccessAdmin && viewMode !== 'student') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Redirecting...</h2>
          <p className="text-muted-foreground">Taking you to the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground relative">
              My Dashboard
              <div className="absolute -bottom-1 sm:-bottom-2 left-0 w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}!
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
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

      {/* Dashboard Tabs - Mobile optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4 h-10 sm:h-11">
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Overview</span>
            <span className="xs:hidden sm:hidden">•</span>
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Lessons</span>
            <span className="xs:hidden sm:hidden">•</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Assignments</span>
            <span className="xs:hidden sm:hidden">•</span>
          </TabsTrigger>
          <TabsTrigger value="vocabulary" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Gamepad2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Games</span>
            <span className="xs:hidden sm:hidden">•</span>
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

        {/* Vocabulary Tab */}
        <TabsContent value="vocabulary">
          <VocabularyGamesOverview />
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
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        
        <ProgressCard
          title="Assignments Due"
          value={upcomingAssignments.length}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        
        <ProgressCard
          title="Completed"
          value={completedAssignments.length}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        
        <ProgressCard
          title="Average Grade"
          value={gradedSubmissions.length > 0 ? `${averageGrade}%` : '-'}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />
      
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">
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
        <CardTitle className="text-foreground">Recent Activity</CardTitle>
        <CardDescription className="text-muted-foreground">
          Your latest submission activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No recent activity to display
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-foreground">Assignment Submitted</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                {submission.score !== undefined && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {submission.score}/{submission.max_score}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
        <CardTitle className="text-foreground">Upcoming Deadlines</CardTitle>
        <CardDescription className="text-muted-foreground">
          Assignment due dates you need to keep track of
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingDeadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
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
                <div key={assignment.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.total_points} points
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {dueDate.toLocaleDateString()}
                    </p>
                    <p className={`text-xs ${daysUntilDue <= 3 ? 'text-red-600 dark:text-red-400' : daysUntilDue <= 7 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
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

// Quick Actions component
function QuickActions() {
  return (
    <Card className="apple-card">
      <CardHeader>
        <CardTitle className="text-foreground">Quick Actions</CardTitle>
        <CardDescription className="text-muted-foreground">
          Jump into learning activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/lessons">
            <div className="group p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-foreground group-hover:text-primary">
                    Browse Lessons
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Explore physics concepts
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/assignments">
            <div className="group p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-foreground group-hover:text-primary">
                    View Assignments
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Check what's due
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/vocabulary">
            <div className="group p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Gamepad2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-foreground group-hover:text-primary">
                    Vocabulary Games
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Practice physics terms
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}