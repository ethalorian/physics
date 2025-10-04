"use client"
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserRole } from '@/lib/permissions'
import { useAssignments } from '@/contexts/AssignmentContext'
import { useAssignmentSystem } from '@/contexts/AssignmentSystemContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, Search, Filter, Calendar, Users, FileText, 
  MoreVertical, Edit, Trash2, Eye, Copy, Send,
  TrendingUp, Clock, CheckCircle2, AlertCircle,
  BookOpen, Target, Award, BarChart3, Settings,
  GraduationCap, ClipboardList, Sparkles
} from 'lucide-react'
import { format, isAfter, isBefore, parseISO } from 'date-fns'
import { CreateLessonAssignmentForm, CreateHomeworkAssignmentForm } from '@/components/assignment-system/CreateAssignmentForms'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function UnifiedAssignmentHub() {
  const { data: session, status } = useSession()
  const userRole = getUserRole(session?.user?.email)
  
  // Both contexts
  const { 
    assignments: homeworkAssignments, 
    submissions, 
    loading: homeworkLoading, 
    deleteAssignment 
  } = useAssignments()
  
  const {
    allAssignments: assignedItems,
    loading: systemLoading,
    deleteLessonAssignment,
    deleteAssignmentAssignment
  } = useAssignmentSystem()

  // State
  const [activeTab, setActiveTab] = useState('homework')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createType, setCreateType] = useState<'homework' | 'lesson'>('homework')

  // Combined statistics - MUST be before early returns
  const stats = useMemo(() => {
    const homeworkCount = homeworkAssignments.length
    const homeworkPublished = homeworkAssignments.filter(a => a.published).length
    const homeworkDrafts = homeworkCount - homeworkPublished
    const totalQuestions = homeworkAssignments.reduce((sum, a) => sum + (a.questions?.length || 0), 0)
    const totalPoints = homeworkAssignments.reduce((sum, a) => sum + a.total_points, 0)
    const totalSubmissions = submissions.length
    const gradedSubmissions = submissions.filter(s => s.status === 'graded').length
    
    const assignedLessons = assignedItems.filter(a => a.type === 'lesson').length
    const assignedHomework = assignedItems.filter(a => a.type === 'assignment').length
    const totalAssigned = assignedLessons + assignedHomework

    return {
      homeworkCount,
      homeworkPublished,
      homeworkDrafts,
      totalQuestions,
      totalPoints,
      totalSubmissions,
      gradedSubmissions,
      assignedLessons,
      assignedHomework,
      totalAssigned
    }
  }, [homeworkAssignments, submissions, assignedItems])

  // Filter homework assignments - MUST be before early returns
  const filteredHomework = useMemo(() => {
    let filtered = homeworkAssignments

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(a => {
        const dueDate = a.due_date ? parseISO(a.due_date) : null
        
        switch (statusFilter) {
          case 'published':
            return a.published
          case 'draft':
            return !a.published
          case 'upcoming':
            return dueDate && isAfter(dueDate, now)
          case 'overdue':
            return dueDate && isBefore(dueDate, now)
          default:
            return true
        }
      })
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'due_date':
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        default:
          return 0
      }
    })
  }, [homeworkAssignments, searchQuery, statusFilter, sortBy])

  // Filter assigned items - MUST be before early returns
  const filteredAssigned = useMemo(() => {
    let filtered = assignedItems

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => {
        switch (statusFilter) {
          case 'published':
            return a.published
          case 'draft':
            return !a.published
          case 'active':
            return a.is_active
          default:
            return true
        }
      })
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
        case 'oldest':
          return new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'due_date':
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        default:
          return 0
      }
    })
  }, [assignedItems, searchQuery, statusFilter, sortBy])

  // Auth check - AFTER all hooks
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (userRole !== 'admin' && userRole !== 'teacher') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Teacher or admin role required to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleDeleteHomework = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis will also delete all student submissions. This action cannot be undone.`)) {
      return
    }
    try {
      await deleteAssignment(id)
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment. Please try again.')
    }
  }

  const handleDeleteAssigned = async (assignment: any) => {
    if (!confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
      return
    }
    try {
      if (assignment.type === 'lesson') {
        await deleteLessonAssignment(assignment.id)
      } else {
        await deleteAssignmentAssignment(assignment.id)
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment')
    }
  }

  const getAssignmentStatus = (assignment: any) => {
    const now = new Date()
    const dueDate = assignment.due_date ? parseISO(assignment.due_date) : null
    const assignmentSubmissions = submissions.filter(s => s.assignment_id === assignment.id)

    return {
      dueDate,
      isOverdue: dueDate && isBefore(dueDate, now),
      isUpcoming: dueDate && isAfter(dueDate, now),
      submissionCount: assignmentSubmissions.length,
      gradedCount: assignmentSubmissions.filter(s => s.status === 'graded').length
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#6A4C93] via-[#4A1A4A] to-[#2A0A2A] text-white rounded-xl p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <GraduationCap className="h-10 w-10" />
                Assignment Hub
              </h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Your command center for creating homework, assigning to classes, and tracking student progress
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-[#4A1A4A] hover:bg-white/90 shadow-lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                </DialogHeader>
                <Tabs value={createType} onValueChange={(v) => setCreateType(v as 'homework' | 'lesson')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="homework" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Homework Assignment
                    </TabsTrigger>
                    <TabsTrigger value="lesson" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Assign Lesson
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="homework" className="mt-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Create a new homework assignment with custom questions, AI grading, and more.
                      </p>
                      <Link href="/admin/assignments/create" onClick={() => setCreateDialogOpen(false)}>
                        <Button className="w-full" size="lg">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Go to Assignment Builder
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                  <TabsContent value="lesson" className="mt-4">
                    <CreateLessonAssignmentForm onSuccess={() => setCreateDialogOpen(false)} />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Stats in Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Homework Created</p>
                  <p className="text-3xl font-bold">{stats.homeworkCount}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-white/60" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Assigned to Classes</p>
                  <p className="text-3xl font-bold">{stats.totalAssigned}</p>
                </div>
                <Send className="h-8 w-8 text-white/60" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Questions</p>
                  <p className="text-3xl font-bold">{stats.totalQuestions}</p>
                </div>
                <Target className="h-8 w-8 text-white/60" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Submissions</p>
                  <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
                </div>
                <Award className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="homework" className="flex items-center gap-2 py-3">
            <ClipboardList className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Homework Library</div>
              <div className="text-xs text-muted-foreground">{stats.homeworkCount} assignments</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-2 py-3">
            <Send className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Assigned to Students</div>
              <div className="text-xs text-muted-foreground">{stats.totalAssigned} active</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2 py-3">
            <BarChart3 className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Results & Grading</div>
              <div className="text-xs text-muted-foreground">{stats.totalSubmissions} submissions</div>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Filters (shared across tabs) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tab 1: Homework Library */}
        <TabsContent value="homework" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Homework Assignments</h2>
              <p className="text-muted-foreground">Create and manage homework with questions</p>
            </div>
            <Link href="/admin/assignments/create">
              <Button className="bg-[#6A4C93] hover:bg-[#4A1A4A]">
                <Plus className="h-4 w-4 mr-2" />
                Build New Homework
              </Button>
            </Link>
          </div>

          {homeworkLoading ? (
            <LoadingState />
          ) : filteredHomework.length === 0 ? (
            <EmptyState
              title={searchQuery || statusFilter !== 'all' ? 'No homework found' : 'No homework created yet'}
              description={searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search query' 
                : 'Build your first homework assignment with custom questions'}
              actionLabel="Create Homework"
              actionHref="/admin/assignments/create"
              icon={<ClipboardList className="h-16 w-16" />}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredHomework.length} of {homeworkAssignments.length} homework assignments
              </p>
              {filteredHomework.map((assignment) => {
                const status = getAssignmentStatus(assignment)
                return (
                  <HomeworkCard
                    key={assignment.id}
                    assignment={assignment}
                    status={status}
                    onDelete={handleDeleteHomework}
                  />
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Assigned to Students */}
        <TabsContent value="assigned" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Assigned to Classes</h2>
              <p className="text-muted-foreground">Lessons and homework assigned to your students</p>
            </div>
            <Button 
              onClick={() => {
                setCreateType('lesson')
                setCreateDialogOpen(true)
              }}
              className="bg-[#6A4C93] hover:bg-[#4A1A4A]"
            >
              <Send className="h-4 w-4 mr-2" />
              Assign to Students
            </Button>
          </div>

          {systemLoading ? (
            <LoadingState />
          ) : filteredAssigned.length === 0 ? (
            <EmptyState
              title={searchQuery || statusFilter !== 'all' ? 'No assignments found' : 'No assignments to classes yet'}
              description={searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Assign lessons or homework to your Google Classroom courses'}
              actionLabel="Assign to Students"
              actionOnClick={() => {
                setCreateType('lesson')
                setCreateDialogOpen(true)
              }}
              icon={<Send className="h-16 w-16" />}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAssigned.length} of {assignedItems.length} assigned items
              </p>
              {filteredAssigned.map((assignment) => (
                <AssignedCard
                  key={assignment.id}
                  assignment={assignment}
                  onDelete={handleDeleteAssigned}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Results & Grading */}
        <TabsContent value="results" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Results & Grading</h2>
            <p className="text-muted-foreground">Review student submissions and provide feedback</p>
          </div>

          {submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Student submissions will appear here once they start taking assignments"
              icon={<BarChart3 className="h-16 w-16" />}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Summary Cards */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Submissions</p>
                      <p className="text-4xl font-bold text-blue-600">{stats.totalSubmissions}</p>
                    </div>
                    <FileText className="h-12 w-12 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Graded</p>
                      <p className="text-4xl font-bold text-green-600">{stats.gradedSubmissions}</p>
                    </div>
                    <CheckCircle2 className="h-12 w-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-900">Needs Grading</p>
                      <p className="text-4xl font-bold text-orange-600">
                        {stats.totalSubmissions - stats.gradedSubmissions}
                      </p>
                    </div>
                    <AlertCircle className="h-12 w-12 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              {/* Submissions List */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest student work awaiting review</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {submissions.slice(0, 10).map((submission) => {
                      const assignment = homeworkAssignments.find(a => a.id === submission.assignment_id)
                      return (
                        <div key={submission.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium">{assignment?.title || 'Unknown Assignment'}</p>
                            <p className="text-sm text-muted-foreground">
                              Student ID: {submission.user_id.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                              {submission.status}
                            </Badge>
                            {submission.score !== undefined && (
                              <span className="font-semibold">
                                {submission.score}/{submission.max_score}
                              </span>
                            )}
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Homework Assignment Card Component
function HomeworkCard({ assignment, status, onDelete }: any) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-[#6A4C93]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
              <Badge variant={assignment.published ? 'default' : 'secondary'}>
                {assignment.published ? 'Published' : 'Draft'}
              </Badge>
              {status.isOverdue && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            {assignment.description && (
              <CardDescription className="text-base">
                {assignment.description}
              </CardDescription>
            )}
            {assignment.lesson && (
              <div className="flex items-center gap-2 mt-2">
                <BookOpen className="h-4 w-4 text-[#6A4C93]" />
                <span className="text-sm text-muted-foreground">
                  Linked to: <span className="font-medium">{assignment.lesson.title}</span>
                </span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/assignments/${assignment.id}`} className="cursor-pointer">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(assignment.id, assignment.title)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBadge icon={<Target />} label="Questions" value={assignment.questions?.length || 0} color="blue" />
          <MetricBadge icon={<Award />} label="Points" value={assignment.total_points} color="purple" />
          <MetricBadge icon={<Users />} label="Submissions" value={status.submissionCount} color="green" />
          {status.dueDate && (
            <MetricBadge 
              icon={<Calendar />} 
              label="Due Date" 
              value={format(status.dueDate, 'MMM d')} 
              color={status.isOverdue ? 'red' : 'orange'} 
            />
          )}
        </div>

        {assignment.questions && assignment.questions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assignment.questions
              .reduce((acc: any[], q: any) => {
                const typeName = q.type === 'open-response' 
                  ? 'AI Graded' 
                  : q.type.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                const existing = acc.find(item => item.type === typeName)
                if (existing) {
                  existing.count++
                } else {
                  acc.push({ type: typeName, count: 1 })
                }
                return acc
              }, [] as Array<{ type: string; count: number }>)
              .map(({ type, count }: { type: string; count: number }) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {count}× {type}
                </Badge>
              ))
            }
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Created {format(parseISO(assignment.created_at), 'MMM d, yyyy')}
        </div>
      </CardContent>
    </Card>
  )
}

// Assigned Items Card Component
function AssignedCard({ assignment, onDelete }: any) {
  const dueDate = assignment.due_date ? parseISO(assignment.due_date) : null
  const isOverdue = dueDate && isBefore(dueDate, new Date())

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${assignment.type === 'lesson' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                {assignment.type === 'lesson' ? (
                  <BookOpen className="h-5 w-5 text-blue-600" />
                ) : (
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{assignment.title}</h3>
                  <Badge variant="outline" className="capitalize">
                    {assignment.type}
                  </Badge>
                  {assignment.published && (
                    <Badge variant="default">Published</Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
                {assignment.description && (
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{assignment.total_assigned} students</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{assignment.total_completed} completed</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>{assignment.completion_rate.toFixed(0)}% progress</span>
              </div>
              {dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    Due {format(dueDate, 'MMM d')}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${assignment.completion_rate}%` }}
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Student Progress
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(assignment)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Assignment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper Components
function MetricBadge({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon?: React.ReactNode
  label: string
  value: string | number
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red'
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
        {icon && <div className="h-4 w-4">{icon}</div>}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    </div>
  )
}

function EmptyState({ title, description, actionLabel, actionHref, actionOnClick, icon }: any) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="text-center py-16">
        <div className="text-muted-foreground/50 mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
        {actionLabel && (
          actionHref ? (
            <Link href={actionHref}>
              <Button size="lg" className="bg-[#6A4C93] hover:bg-[#4A1A4A]">
                <Plus className="h-5 w-5 mr-2" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="lg" onClick={actionOnClick} className="bg-[#6A4C93] hover:bg-[#4A1A4A]">
              <Plus className="h-5 w-5 mr-2" />
              {actionLabel}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  )
}
