"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, Clock, BookOpen, FileText, Play, CheckCircle, 
  AlertTriangle, XCircle, Eye, RotateCcw, Timer, FlaskConical
} from 'lucide-react'
import { useAssignmentSystem } from '@/contexts/AssignmentSystemContext'
import { UnifiedStudentAssignment, StudentAssignmentFilters } from '@/types/assignment-system'
import { format, parseISO, isAfter, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface StudentAssignmentViewProps {
  studentId?: string
}

export function StudentAssignmentView({ studentId }: StudentAssignmentViewProps) {
  const { data: session } = useSession()
  const {
    studentAssignments,
    studentLoading,
    fetchStudentAssignments,
    updateStudentAssignmentStatus
  } = useAssignmentSystem()

  const [filters, setFilters] = useState<StudentAssignmentFilters>({
    student_id: studentId
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'due-soon' | 'overdue'>('all')

  // Fetch assignments on mount and when filters change
  useEffect(() => {
    fetchStudentAssignments(studentId, filters)
  }, [studentId, filters, fetchStudentAssignments])

  // Filter assignments based on search, status, and type
  const filteredAssignments = studentAssignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus
    const matchesType = selectedType === 'all' || assignment.type === selectedType
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Group assignments by tab
  const assignmentsByTab = {
    all: filteredAssignments,
    'due-soon': filteredAssignments.filter(assignment => {
      if (!assignment.due_date) return false
      const dueDate = parseISO(assignment.due_date)
      const daysUntilDue = differenceInDays(dueDate, new Date())
      return daysUntilDue >= 0 && daysUntilDue <= 7 && !['completed', 'graded'].includes(assignment.status)
    }),
    overdue: filteredAssignments.filter(assignment => {
      if (!assignment.due_date) return false
      const dueDate = parseISO(assignment.due_date)
      return isAfter(new Date(), dueDate) && !['completed', 'graded'].includes(assignment.status)
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'in_progress':
      case 'started':
        return <Play className="h-4 w-4 text-yellow-500" />
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (assignment: UnifiedStudentAssignment) => {
    const now = new Date()
    const isOverdue = assignment.due_date && isAfter(now, parseISO(assignment.due_date))
    
    // Show letter grade for graded simulation assignments
    if (assignment.type === 'simulation' && assignment.letter_grade) {
      const gradeColors = {
        'A': 'bg-green-500 hover:bg-green-600',
        'B': 'bg-blue-500 hover:bg-blue-600',
        'C': 'bg-yellow-500 hover:bg-yellow-600',
        'Fail': 'bg-red-500 hover:bg-red-600'
      }
      return <Badge className={gradeColors[assignment.letter_grade]}>Grade: {assignment.letter_grade}</Badge>
    }
    
    if (assignment.status === 'completed' || assignment.status === 'graded') {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    }
    if (assignment.status === 'submitted') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Submitted</Badge>
    }
    if (isOverdue && !['completed', 'graded', 'submitted'].includes(assignment.status)) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    if (assignment.status === 'in_progress' || assignment.status === 'started') {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">In Progress</Badge>
    }
    return <Badge variant="outline">Not Started</Badge>
  }

  const getDueDateInfo = (assignment: UnifiedStudentAssignment) => {
    if (!assignment.due_date) return null
    
    const dueDate = parseISO(assignment.due_date)
    const now = new Date()
    const isOverdue = isAfter(now, dueDate)
    const daysUntilDue = differenceInDays(dueDate, now)
    
    if (isOverdue) {
      const daysOverdue = Math.abs(daysUntilDue)
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">
            Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
          </span>
        </div>
      )
    } else if (daysUntilDue === 0) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <Timer className="h-4 w-4" />
          <span className="text-sm">Due today</span>
        </div>
      )
    } else if (daysUntilDue <= 3) {
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <Timer className="h-4 w-4" />
          <span className="text-sm">Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">Due {format(dueDate, 'MMM d, yyyy')}</span>
        </div>
      )
    }
  }

  const getActionButton = (assignment: UnifiedStudentAssignment) => {
    const isOverdue = assignment.due_date && isAfter(new Date(), parseISO(assignment.due_date))
    
    // Simulation-specific handling
    if (assignment.type === 'simulation') {
      const simulationSlug = assignment.content_id // Assuming content_id is the slug for simulations
      
      if (assignment.status === 'completed' || assignment.status === 'graded') {
        return (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/simulations/${simulationSlug}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Results
            </Link>
          </Button>
        )
      }
      
      if (assignment.status === 'in_progress' || assignment.status === 'started') {
        return (
          <Button size="sm" asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href={`/simulations/${simulationSlug}`}>
              <FlaskConical className="h-4 w-4 mr-2" />
              Continue Lab
            </Link>
          </Button>
        )
      }
      
      return (
        <Button size="sm" asChild disabled={!!isOverdue} className="bg-purple-600 hover:bg-purple-700">
          <Link href={`/simulations/${simulationSlug}`}>
            <FlaskConical className="h-4 w-4 mr-2" />
            Start Lab
          </Link>
        </Button>
      )
    }
    
    // Original handling for lessons and assignments
    if (assignment.status === 'completed' || assignment.status === 'graded') {
      return (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${assignment.type}s/${assignment.content_id}/review`}>
            <Eye className="h-4 w-4 mr-2" />
            Review
          </Link>
        </Button>
      )
    }
    
    if (assignment.status === 'submitted') {
      return (
        <Button variant="outline" size="sm" disabled>
          <CheckCircle className="h-4 w-4 mr-2" />
          Submitted
        </Button>
      )
    }
    
    if (assignment.type === 'assignment' && assignment.attempts_used && assignment.max_attempts && 
        assignment.attempts_used >= assignment.max_attempts) {
      return (
        <Button variant="outline" size="sm" disabled>
          Max attempts used
        </Button>
      )
    }
    
    if (assignment.status === 'in_progress' || assignment.status === 'started') {
      return (
        <Button size="sm" asChild>
          <Link href={`/${assignment.type}s/${assignment.content_id}`}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Continue
          </Link>
        </Button>
      )
    }
    
    return (
      <Button size="sm" asChild disabled={!!isOverdue}>
        <Link href={`/${assignment.type}s/${assignment.content_id}`}>
          <Play className="h-4 w-4 mr-2" />
          Start
        </Link>
      </Button>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />
      case 'simulation':
        return <FlaskConical className="h-4 w-4 text-purple-600" />
      case 'assignment':
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (studentLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Assignments</h2>
          <p className="text-muted-foreground">
            Track your lessons, homework, and simulation labs
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{studentAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Timer className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="text-lg font-semibold">{assignmentsByTab['due-soon'].length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-lg font-semibold">{assignmentsByTab.overdue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">
                  {studentAssignments.filter(a => ['completed', 'graded'].includes(a.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Not Started</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lesson">Lessons</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All ({assignmentsByTab.all.length})
          </TabsTrigger>
          <TabsTrigger value="due-soon">
            Due Soon ({assignmentsByTab['due-soon'].length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({assignmentsByTab.overdue.length})
          </TabsTrigger>
        </TabsList>
        
        {(['all', 'due-soon', 'overdue'] as const).map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {assignmentsByTab[tab].length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    {tab === 'all' ? 'No assignments found' :
                     tab === 'due-soon' ? 'No assignments due soon' :
                     'No overdue assignments'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              assignmentsByTab[tab].map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getTypeIcon(assignment.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{assignment.title}</h3>
                              {getStatusBadge(assignment)}
                              <Badge variant="outline" className="capitalize">
                                {assignment.type}
                              </Badge>
                            </div>
                            {assignment.description && (
                              <p className="text-muted-foreground text-sm">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress for lessons */}
                        {assignment.type === 'lesson' && assignment.progress_percentage !== undefined && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{assignment.progress_percentage}%</span>
                            </div>
                            <Progress value={assignment.progress_percentage} className="h-2" />
                          </div>
                        )}

                        {/* Score display */}
                        {assignment.score !== undefined && assignment.max_score !== undefined && (
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="font-medium">Score: </span>
                              <span className={cn(
                                "font-semibold",
                                assignment.percentage && assignment.percentage >= 70 ? "text-green-600" : "text-red-600"
                              )}>
                                {assignment.score}/{assignment.max_score}
                                {assignment.percentage && ` (${assignment.percentage.toFixed(0)}%)`}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Attempt info for assignments */}
                        {assignment.type === 'assignment' && assignment.max_attempts && (
                          <div className="text-sm text-muted-foreground">
                            Attempts: {assignment.attempts_used || 0}/{assignment.max_attempts}
                          </div>
                        )}

                        {/* Due date info */}
                        {getDueDateInfo(assignment)}

                        {/* Time spent */}
                        {assignment.time_spent > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Time spent: {Math.round(assignment.time_spent / 60)} minutes</span>
                          </div>
                        )}

                        {/* Last accessed */}
                        {assignment.last_accessed && (
                          <div className="text-xs text-muted-foreground">
                            Last accessed: {format(parseISO(assignment.last_accessed), 'MMM d, yyyy h:mm a')}
                          </div>
                        )}

                        {/* Feedback */}
                        {assignment.feedback && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Feedback:</p>
                            <p className="text-sm">{assignment.feedback}</p>
                          </div>
                        )}

                        {/* Instructions */}
                        {assignment.instructions && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium mb-1">Instructions:</p>
                            <p className="text-sm">{assignment.instructions}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="ml-4">
                        {getActionButton(assignment)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

