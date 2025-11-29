"use client"
import { useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useViewAwarePermissions } from '@/hooks/useViewAwarePermissions'
import { useAssignments } from '@/contexts/ConsolidatedAssignmentContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  EyeOff,
  ArrowRight
} from 'lucide-react'
import EnrollmentGate from '@/components/student/EnrollmentGate'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { userRole } = usePermissions()
  const { viewMode, toggleViewMode } = useViewMode()
  const { isAuthenticated, canAccessAdmin } = useViewAwarePermissions(viewMode)
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
    <EnrollmentGate>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Hero Header */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">
                Welcome back
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                {session?.user?.name?.split(' ')[0] || 'Student'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {viewMode === 'student' && (userRole === 'admin' || userRole === 'teacher') && (
                <Button
                  onClick={() => {
                    toggleViewMode()
                    router.push('/admin/dashboard')
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Exit Student View</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - No Tabs, Direct Overview */}
        <StudentOverview />
      </div>
    </EnrollmentGate>
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
    const submission = getSubmissionByAssignmentId?.(assignment.id, session?.user?.id)
    return submission !== undefined
  })
  
  const upcomingAssignments = publishedAssignments.filter(assignment => {
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    const now = new Date()
    const submission = getSubmissionByAssignmentId?.(assignment.id, session?.user?.id)
    return dueDate && dueDate > now && !submission
  })
  
  const gradedSubmissions = (submissions || []).filter(s => s.score !== undefined)
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

      {/* Next Steps - Priority Actions */}
      <NextSteps />
      
      {/* Recent Activity */}
      <RecentActivity />
      
      {/* Upcoming Deadlines */}
      <UpcomingDeadlines />
    </div>
  )
}

// Progress card component - Apple-style stat card
function ProgressCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-muted/80">
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Recent activity component
function RecentActivity() {
  const { submissions } = useAssignments()
  
  // Get recent submissions (last 5)
  const recentSubmissions = (submissions || [])
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
      const submission = getSubmissionByAssignmentId?.(assignment.id, session?.user?.id)
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
                      {assignment.max_score || 0} points
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

// Next Steps component - Shows personalized, contextual actions
function NextSteps() {
  const { assignments, getSubmissionByAssignmentId } = useAssignments()
  const { data: session } = useSession()
  const router = useRouter()
  
  // Find assignments that need attention
  const publishedAssignments = assignments.filter(a => a.published)
  const now = new Date()
  
  // Priority 1: Assignments due soon (within 3 days)
  const dueSoon = publishedAssignments.filter(a => {
    if (!a.due_date) return false
    const dueDate = new Date(a.due_date)
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const submission = getSubmissionByAssignmentId?.(a.id, session?.user?.id)
    return daysUntil <= 3 && daysUntil >= 0 && !submission
  }).slice(0, 2)
  
  // Priority 2: Incomplete assignments (started but not finished)
  const inProgress = publishedAssignments.filter(a => {
    const submission = getSubmissionByAssignmentId?.(a.id, session?.user?.id)
    return submission && submission.status === 'partial'
  }).slice(0, 1)
  
  const hasUrgentActions = dueSoon.length > 0 || inProgress.length > 0
  
  if (!hasUrgentActions) {
    // Show encouraging message when all caught up
    return (
      <Card className="border-2 border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">All Caught Up!</h3>
            <p className="text-sm text-muted-foreground">
              No urgent assignments. Explore lessons or practice vocabulary games.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/lessons')}>
            Browse Lessons
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Next Steps</h2>
        <p className="text-sm text-muted-foreground">Priority tasks that need your attention</p>
      </div>
      
      <div className="space-y-3">
        {/* Due Soon Items */}
        {dueSoon.map((assignment) => {
          const dueDate = new Date(assignment.due_date!)
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          return (
            <Card 
              key={assignment.id} 
              className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/assignments/${assignment.id}`)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{assignment.title}</h3>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    {daysUntil === 0 ? 'Due today!' : daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
                  </p>
                </div>
                <Button size="sm">
                  Start Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
        
        {/* In Progress Items */}
        {inProgress.map((assignment) => (
          <Card 
            key={assignment.id} 
            className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/assignments/${assignment.id}`)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{assignment.title}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">In progress - continue where you left off</p>
              </div>
              <Button size="sm" variant="outline">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}