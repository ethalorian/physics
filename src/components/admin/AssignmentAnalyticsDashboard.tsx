"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UnifiedAssignment, TeacherDashboardSummary } from '@/types/unified-assignment'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface AssignmentAnalyticsDashboardProps {
  summary: TeacherDashboardSummary | null
  assignments: UnifiedAssignment[]
}

export function AssignmentAnalyticsDashboard({
  summary,
  assignments
}: AssignmentAnalyticsDashboardProps) {
  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts
  const assignmentTypeData = [
    { name: 'Lessons', value: summary.assignments_by_type.lesson, color: '#3b82f6' },
    { name: 'Homework', value: summary.assignments_by_type.homework, color: '#22c55e' },
    { name: 'Vocabulary', value: summary.assignments_by_type.vocabulary, color: '#a855f7' },
    { name: 'Simulations', value: summary.assignments_by_type.simulation + summary.assignments_by_type.simulation_embedded, color: '#f97316' }
  ].filter(d => d.value > 0)

  const courseCompletionData = summary.courses.map(course => ({
    name: course.course_name,
    assignments: course.active_assignments,
    completion: course.avg_completion_rate
  }))

  // Calculate some stats
  const totalCompletionRate = summary.courses.length > 0
    ? summary.courses.reduce((sum, c) => sum + c.avg_completion_rate, 0) / summary.courses.length
    : 0

  const activeAssignments = assignments.filter(a => a.published).length
  const draftAssignments = assignments.filter(a => !a.published).length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {draftAssignments} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_students}</div>
            <p className="text-xs text-muted-foreground">
              Unique students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Type Distribution</CardTitle>
            <CardDescription>
              Breakdown by content type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignmentTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assignmentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assignmentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No assignments yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Course Completion Rates</CardTitle>
            <CardDescription>
              Average completion by course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseCompletionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis 
                    label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Bar dataKey="completion" fill="#3b82f6" name="Completion Rate" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No course data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
          <CardDescription>
            Tasks that need your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.needs_grading > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Grade Submissions</p>
                  <p className="text-sm text-muted-foreground">
                    {summary.needs_grading} submission{summary.needs_grading !== 1 ? 's' : ''} waiting for review
                  </p>
                </div>
                <Badge variant="secondary">{summary.needs_grading}</Badge>
              </div>
            )}

            {summary.overdue_count > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/50">
                <div>
                  <p className="font-medium text-destructive">Overdue Assignments</p>
                  <p className="text-sm text-muted-foreground">
                    {summary.overdue_count} student{summary.overdue_count !== 1 ? 's' : ''} with overdue work
                  </p>
                </div>
                <Badge variant="destructive">{summary.overdue_count}</Badge>
              </div>
            )}

            {summary.flagged_count > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg border-orange-500/50">
                <div>
                  <p className="font-medium text-orange-600">Flagged for Attention</p>
                  <p className="text-sm text-muted-foreground">
                    {summary.flagged_count} student{summary.flagged_count !== 1 ? 's need' : ' needs'} follow-up
                  </p>
                </div>
                <Badge variant="secondary">{summary.flagged_count}</Badge>
              </div>
            )}

            {summary.needs_grading === 0 && summary.overdue_count === 0 && summary.flagged_count === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium text-green-600">All caught up!</p>
                <p className="text-sm">No action items at this time</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Submissions</p>
              <p className="text-2xl font-bold text-green-600">{summary.recent_submissions}</p>
              <p className="text-xs text-muted-foreground">New submissions received</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Completions</p>
              <p className="text-2xl font-bold text-blue-600">{summary.recent_completions}</p>
              <p className="text-xs text-muted-foreground">Assignments completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Details */}
      {summary.courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>
              Assignment activity by course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.courses.map(course => (
                <div key={course.course_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{course.course_name}</h4>
                    <Badge>{course.active_assignments} assignments</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Average Completion</span>
                      <span className="font-medium">{course.avg_completion_rate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${course.avg_completion_rate}%` }}
                      />
                    </div>
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

