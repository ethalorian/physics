"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Clock, 
  Award, 
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useStudentActivity } from '@/contexts/StudentActivityContext'
import { useToast } from '@/providers/toast-provider'

interface StudentActivityDashboardProps {
  selectedStudent?: string
  onStudentSelect?: (studentEmail: string) => void
}

export default function StudentActivityDashboard({ 
  selectedStudent, 
  onStudentSelect 
}: StudentActivityDashboardProps) {
  const { showToast } = useToast()
  const {
    studentSummaries,
    submissions,
    lessonProgress,
    assignmentAnalytics,
    activities,
    loading,
    error,
    initialized,
    fetchStudentSummaries,
    fetchStudentActivities,
    fetchAssignmentSubmissions,
    refreshAll
  } = useStudentActivity()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'score'>('activity')
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedTab, setSelectedTab] = useState('overview')

  // Initialize data on mount
  useEffect(() => {
    if (!initialized) {
      refreshAll()
    }
  }, [initialized, refreshAll])

  const handleRefresh = async () => {
    try {
      await refreshAll()
      showToast({
        title: "Data Refreshed",
        description: "Student activity data has been updated",
        variant: "success",
        duration: 2000
      })
    } catch (err) {
      showToast({
        title: "Refresh Failed",
        description: "Failed to refresh activity data",
        variant: "error",
        duration: 3000
      })
    }
  }

  const exportData = () => {
    const csvData = [
      'Student Name,Email,Lessons Viewed,Assignments Submitted,Avg Score,Last Activity,Status',
      ...filteredStudents.map(student => 
        `"${student.user_name}","${student.user_email}",${student.total_lessons_viewed},${student.total_assignments_submitted},${student.avg_assignment_score}%,"${new Date(student.last_activity).toLocaleDateString()}","${getStudentStatus(student)}"`
      )
    ].join('\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student-activity-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showToast({
      title: "Export Complete",
      description: `Exported ${filteredStudents.length} student records`,
      variant: "success",
      duration: 2000
    })
  }

  const getStudentStatus = (student: any) => {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceActivity <= 1) return 'Very Active'
    if (daysSinceActivity <= 7) return 'Active'
    if (daysSinceActivity <= 30) return 'Moderate'
    return 'Inactive'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Very Active':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Very Active</Badge>
      case 'Active':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Active</Badge>
      case 'Moderate':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Moderate</Badge>
      case 'Inactive':
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredStudents = studentSummaries
    .filter(student => {
      const matchesSearch = student.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false
      
      if (filterBy === 'all') return true
      
      const status = getStudentStatus(student)
      if (filterBy === 'active') return status === 'Very Active' || status === 'Active'
      if (filterBy === 'inactive') return status === 'Moderate' || status === 'Inactive'
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.user_name.localeCompare(b.user_name)
        case 'activity':
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
        case 'score':
          return b.avg_assignment_score - a.avg_assignment_score
        default:
          return 0
      }
    })

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="apple-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Student Activity System Not Ready</h3>
          <p className="text-muted-foreground text-center mb-4">
            The student activity tracking system needs to be set up. This usually means:
          </p>
          <div className="text-sm text-muted-foreground text-left mb-6 space-y-2">
            <p>• Database tables need to be created (run the migration)</p>
            <p>• No student activity data exists yet</p>
            <p>• Supabase connection issues</p>
          </div>
          <div className="space-y-2">
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <p className="text-xs text-muted-foreground">
              Check console for detailed error information
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Student Activity Dashboard</h2>
          <p className="text-muted-foreground">Monitor student engagement and progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Lessons
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assignments
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentSummaries.length}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredStudents.filter(s => getStudentStatus(s) === 'Very Active' || getStudentStatus(s) === 'Active').length} active
                </p>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Assignment Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentSummaries.length > 0 
                    ? Math.round(studentSummaries.reduce((acc, s) => acc + s.avg_assignment_score, 0) / studentSummaries.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all students
                </p>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {submissions.filter(s => s.score !== null).length} graded
                </p>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lessons Viewed</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentSummaries.reduce((acc, s) => acc + s.total_lessons_viewed, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total lesson views
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest student interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {activity.user_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.user_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.activity_type === 'lesson_view' && 'Viewed lesson'}
                        {activity.activity_type === 'assignment_start' && 'Started assignment'}
                        {activity.activity_type === 'assignment_submit' && 'Submitted assignment'}
                        {activity.lesson?.title && ` • ${activity.lesson.title}`}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="activity">Last Activity</SelectItem>
                <SelectItem value="score">Average Score</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students List */}
          <div className="grid gap-4">
            {filteredStudents.map((student) => {
              const status = getStudentStatus(student)
              const recentSubmissions = submissions.filter(s => s.user_email === student.user_email).slice(0, 3)
              
              return (
                <Card 
                  key={student.user_email} 
                  className="apple-card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onStudentSelect?.(student.user_email)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{student.user_name}</h3>
                          <p className="text-sm text-muted-foreground">{student.user_email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {student.total_lessons_viewed} lessons
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {student.total_assignments_submitted} submissions
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(student.last_activity).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(status)}
                        <div className="mt-2">
                          <div className="text-2xl font-bold text-foreground">
                            {Math.round(student.avg_assignment_score)}%
                          </div>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress indicators */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Assignment Progress</span>
                        <span>{student.assignments_completed}/{student.total_assignments_submitted}</span>
                      </div>
                      <Progress 
                        value={student.total_assignments_submitted > 0 
                          ? (student.assignments_completed / student.total_assignments_submitted) * 100 
                          : 0} 
                        className="h-2"
                      />
                    </div>

                    {/* Recent submissions */}
                    {recentSubmissions.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Recent Submissions</p>
                        <div className="flex gap-2">
                          {recentSubmissions.map((submission) => (
                            <Badge 
                              key={submission.id} 
                              variant={submission.score !== null ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {submission.score !== null && submission.score !== undefined
                                ? `${Math.round((submission.score / (submission.max_score || 1)) * 100)}%`
                                : 'Pending'
                              }
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredStudents.length === 0 && (
            <Card className="apple-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Student Activity Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? 'No students match your search criteria.' 
                    : 'Student activity will appear here once students start viewing lessons and completing assignments.'
                  }
                </p>
                {!searchTerm && (
                  <div className="text-sm text-muted-foreground text-center space-y-1">
                    <p>To see student activity:</p>
                    <p>• Students need to view lessons or start assignments</p>
                    <p>• Database tables must be set up (check migration)</p>
                    <p>• Activity tracking is enabled automatically</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Lesson Engagement</CardTitle>
              <CardDescription>Track which lessons students are viewing and completing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessonProgress
                  .reduce((acc, progress) => {
                    const existing = acc.find(item => item.lesson_id === progress.lesson_id)
                    if (existing) {
                      existing.student_count++
                      existing.total_time += progress.total_time_spent
                      existing.avg_progress += progress.progress_percentage
                    } else {
                      acc.push({
                        lesson_id: progress.lesson_id,
                        lesson_title: progress.lesson?.title || 'Unknown Lesson',
                        student_count: 1,
                        total_time: progress.total_time_spent,
                        avg_progress: progress.progress_percentage
                      })
                    }
                    return acc
                  }, [] as any[])
                  .map(lesson => ({
                    ...lesson,
                    avg_progress: Math.round(lesson.avg_progress / lesson.student_count),
                    avg_time: Math.round(lesson.total_time / lesson.student_count / 60) // Convert to minutes
                  }))
                  .slice(0, 10)
                  .map((lesson) => (
                    <div key={lesson.lesson_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{lesson.lesson_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {lesson.student_count} students • Avg {lesson.avg_time} min
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{lesson.avg_progress}%</div>
                        <Progress value={lesson.avg_progress} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Assignment Performance</CardTitle>
              <CardDescription>Monitor assignment completion and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignmentAnalytics.map((analytics) => (
                  <div key={analytics.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{analytics.assignment_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {analytics.total_submitted}/{analytics.total_assigned} submitted • 
                          {analytics.total_completed} completed
                        </p>
                      </div>
                      <Badge variant={analytics.avg_score && analytics.avg_score >= 70 ? "default" : "secondary"}>
                        {analytics.avg_score ? `${Math.round(analytics.avg_score)}% avg` : 'No scores'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Completion Rate</p>
                        <p className="font-medium">
                          {Math.round((analytics.total_submitted / analytics.total_assigned) * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Score</p>
                        <p className="font-medium">
                          {analytics.avg_score ? `${Math.round(analytics.avg_score)}%` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Time</p>
                        <p className="font-medium">
                          {analytics.avg_time_spent ? `${Math.round(analytics.avg_time_spent / 60)}min` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Updated</p>
                        <p className="font-medium">
                          {new Date(analytics.last_calculated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
