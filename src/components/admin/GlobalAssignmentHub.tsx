"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  BookOpen, 
  FileText, 
  BookMarked, 
  Beaker,
  Filter,
  TrendingUp,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react'
import { UnifiedAssignment, TeacherDashboardSummary, AssignmentType } from '@/types/unified-assignment'
import { AssignmentCreationModal } from './AssignmentCreationModal'
import { AssignmentListView } from './AssignmentListView'
import { AssignmentAnalyticsDashboard } from './AssignmentAnalyticsDashboard'

interface GlobalAssignmentHubProps {
  defaultTab?: string
}

/**
 * Global Assignment Hub - Unified interface for managing all assignment types
 * Allows teachers to create, assign, and track lessons, homework, vocabulary, and simulations
 */
export default function GlobalAssignmentHub({ defaultTab = 'overview' }: GlobalAssignmentHubProps) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)

  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [dashboardSummary, setDashboardSummary] = useState<TeacherDashboardSummary | null>(null)
  const [assignments, setAssignments] = useState<UnifiedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<AssignmentType | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/unified-assignments/analytics?type=teacher_dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardSummary(data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }, [])

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/unified-assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load dashboard data
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'teacher') {
      loadDashboard()
      loadAssignments()
    }
  }, [session, userRole, loadDashboard, loadAssignments])

  const handleCreateAssignment = useCallback((type: AssignmentType) => {
    setSelectedAssignmentType(type)
    setShowCreateModal(true)
  }, [])

  const handleAssignmentCreated = useCallback(() => {
    setShowCreateModal(false)
    setSelectedAssignmentType(null)
    loadDashboard()
    loadAssignments()
  }, [loadDashboard, loadAssignments])

  // Check permissions after all hooks are defined
  if (userRole !== 'admin' && userRole !== 'teacher') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only teachers and administrators can access the Assignment Hub.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Assignment Hub</h1>
          <p className="text-muted-foreground mt-1">
            Create, assign, and track all types of assignments in one place
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Dashboard Summary Cards */}
      {dashboardSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardSummary.total_assignments}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Across {dashboardSummary.courses.length} courses
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Needs Grading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardSummary.needs_grading}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Submissions waiting
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboardSummary.overdue_count}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Past due date
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardSummary.recent_submissions}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Submissions in last 24h
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignment Type Quick Create */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Create Assignment</CardTitle>
          <CardDescription>
            Choose what type of content you want to assign to students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex-col space-y-2"
              onClick={() => handleCreateAssignment('lesson')}
            >
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-semibold">Assign Lesson</div>
                <div className="text-xs text-muted-foreground">
                  {dashboardSummary?.assignments_by_type.lesson || 0} active
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col space-y-2"
              onClick={() => handleCreateAssignment('homework')}
            >
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold">Assign Homework</div>
                <div className="text-xs text-muted-foreground">
                  {dashboardSummary?.assignments_by_type.homework || 0} active
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col space-y-2"
              onClick={() => handleCreateAssignment('vocabulary')}
            >
              <BookMarked className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-semibold">Assign Vocabulary</div>
                <div className="text-xs text-muted-foreground">
                  {dashboardSummary?.assignments_by_type.vocabulary || 0} active
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col space-y-2"
              onClick={() => handleCreateAssignment('simulation')}
            >
              <Beaker className="h-8 w-8 text-orange-600" />
              <div>
                <div className="font-semibold">Assign Simulation</div>
                <div className="text-xs text-muted-foreground">
                  {dashboardSummary?.assignments_by_type.simulation || 0} active
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-assignments">
            All Assignments
            <Badge variant="secondary" className="ml-2">
              {assignments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="needs-attention">
            Needs Attention
            <Badge variant="destructive" className="ml-2">
              {(dashboardSummary?.needs_grading || 0) + (dashboardSummary?.overdue_count || 0)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AssignmentOverview
            assignments={assignments}
            summary={dashboardSummary}
            onViewAll={() => setActiveTab('all-assignments')}
          />
        </TabsContent>

        <TabsContent value="all-assignments">
          <AssignmentListView
            assignments={assignments}
            loading={loading}
            onRefresh={loadAssignments}
          />
        </TabsContent>

        <TabsContent value="needs-attention">
          <AssignmentListView
            assignments={assignments.filter(a => {
              const needsGrading = a.total_submitted > 0
              const hasOverdue = a.total_assigned > a.total_completed && a.due_date && new Date(a.due_date) < new Date()
              return needsGrading || hasOverdue
            })}
            loading={loading}
            onRefresh={loadAssignments}
            showNeedsAttentionOnly
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AssignmentAnalyticsDashboard
            summary={dashboardSummary}
            assignments={assignments}
          />
        </TabsContent>
      </Tabs>

      {/* Assignment Creation Modal */}
      {showCreateModal && (
        <AssignmentCreationModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedAssignmentType(null)
          }}
          onSuccess={handleAssignmentCreated}
          initialType={selectedAssignmentType || undefined}
        />
      )}
    </div>
  )
}

/**
 * Overview tab component
 */
function AssignmentOverview({
  assignments,
  summary,
  onViewAll
}: {
  assignments: UnifiedAssignment[]
  summary: TeacherDashboardSummary | null
  onViewAll: () => void
}) {
  const upcomingDue = assignments
    .filter(a => a.due_date && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  const recentAssignments = assignments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upcoming Due Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Due Dates</CardTitle>
          <CardDescription>Assignments due soon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming due dates</p>
          ) : (
            upcomingDue.map(assignment => (
              <div key={assignment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium text-sm">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getAssignmentTypeLabel(assignment.assignment_type)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatDueDate(assignment.due_date!)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.total_completed}/{assignment.total_assigned} complete
                  </p>
                </div>
              </div>
            ))
          )}
          {upcomingDue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="w-full">
              View All Assignments
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Created</CardTitle>
          <CardDescription>Your latest assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          ) : (
            recentAssignments.map(assignment => (
              <div key={assignment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium text-sm">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getAssignmentTypeLabel(assignment.assignment_type)} • {assignment.course?.name || 'Individual students'}
                  </p>
                </div>
                <Badge variant={assignment.published ? 'default' : 'secondary'}>
                  {assignment.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Course Performance */}
      {summary && summary.courses.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Completion rates by course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.courses.map(course => (
                <div key={course.course_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{course.course_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.active_assignments} active assignments
                      </p>
                    </div>
                    <Badge variant="outline">
                      {course.avg_completion_rate.toFixed(1)}% complete
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${course.avg_completion_rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions
function getAssignmentTypeLabel(type: AssignmentType): string {
  const labels = {
    lesson: 'Lesson',
    homework: 'Homework',
    vocabulary: 'Vocabulary',
    simulation: 'Simulation',
    simulation_embedded: 'Simulation'
  }
  return labels[type] || type
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays < 7) return `Due in ${diffDays} days`

  return date.toLocaleDateString()
}

