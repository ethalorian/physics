"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { usePermissions } from "@/hooks/usePermissions"
import { useAssignments } from "@/contexts/ConsolidatedAssignmentContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  BookOpen,
  Microscope,
  ClipboardList
} from "lucide-react"
import Link from "next/link"

export default function AssignmentsPage() {
  const { data: session, status } = useSession()
  const { isAuthenticated } = usePermissions()
  const { assignments, studentProgress, loading, getStudentProgress } = useAssignments()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">
              Please sign in to view your assignments.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter published assignments
  const publishedAssignments = assignments.filter(a => a.published)
  
  // Categorize assignments
  const now = new Date()
  const upcomingAssignments = publishedAssignments.filter(a => {
    const progress = getStudentProgress(a.id)
    const dueDate = a.due_date ? new Date(a.due_date) : null
    return dueDate && dueDate > now && progress?.status !== 'submitted' && progress?.status !== 'graded'
  })
  
  const completedAssignments = publishedAssignments.filter(a => {
    const progress = getStudentProgress(a.id)
    return progress?.status === 'submitted' || progress?.status === 'graded'
  })
  
  const inProgressAssignments = publishedAssignments.filter(a => {
    const progress = getStudentProgress(a.id)
    return progress?.status === 'in_progress'
  })

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="h-4 w-4" />
      case 'simulation': return <Microscope className="h-4 w-4" />
      case 'homework': return <ClipboardList className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (assignmentId: string) => {
    const progress = getStudentProgress(assignmentId)
    if (!progress) {
      return <Badge variant="outline">Not Started</Badge>
    }
    switch (progress.status) {
      case 'graded':
        return <Badge className="bg-green-500">Graded: {progress.score}/{progress.max_score}</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500">Submitted</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) {
      return <span className="text-red-600 dark:text-red-400 text-sm">Overdue</span>
    } else if (daysUntilDue === 0) {
      return <span className="text-orange-600 dark:text-orange-400 text-sm">Due Today</span>
    } else if (daysUntilDue === 1) {
      return <span className="text-orange-600 dark:text-orange-400 text-sm">Due Tomorrow</span>
    } else if (daysUntilDue <= 7) {
      return <span className="text-yellow-600 dark:text-yellow-400 text-sm">{daysUntilDue} days left</span>
    } else {
      return <span className="text-muted-foreground text-sm">Due {due.toLocaleDateString()}</span>
    }
  }

  const getAssignmentLink = (assignment: typeof assignments[0]) => {
    // Route based on assignment type
    if (assignment.assignment_type === 'simulation' && assignment.reference_id) {
      return `/simulations/${assignment.reference_id}`
    }
    if (assignment.assignment_type === 'lesson' && assignment.reference_id) {
      return `/lessons/${assignment.reference_id}`
    }
    // Default to assignment detail page
    return `/assignments/${assignment.id}`
  }

  const renderAssignmentCard = (assignment: typeof assignments[0]) => (
    <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getAssignmentTypeIcon(assignment.assignment_type)}
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {assignment.assignment_type}
            </Badge>
          </div>
          {getStatusBadge(assignment.id)}
        </div>
        <CardTitle className="text-lg mt-2">{assignment.title}</CardTitle>
        {assignment.description && (
          <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            {assignment.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {getDueDateDisplay(assignment.due_date)}
              </div>
            )}
            {assignment.max_score && (
              <span>{assignment.max_score} points</span>
            )}
          </div>
        </div>
        
        <Button 
          className="w-full"
          variant={getStudentProgress(assignment.id)?.status === 'submitted' ? 'outline' : 'default'}
          onClick={() => router.push(getAssignmentLink(assignment))}
        >
          {getStudentProgress(assignment.id)?.status === 'submitted' ? 'View Submission' : 'Start Assignment'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )

  const filterAssignments = (tab: string) => {
    switch (tab) {
      case 'upcoming': return upcomingAssignments
      case 'in-progress': return inProgressAssignments
      case 'completed': return completedAssignments
      default: return publishedAssignments
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Assignments</h1>
          <p className="text-sm text-muted-foreground">
            View and complete your assigned work
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <ArrowRight className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressAssignments.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filterAssignments(activeTab).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'all' 
                    ? "You don't have any assignments yet. Check back soon!"
                    : `No ${activeTab.replace('-', ' ')} assignments.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterAssignments(activeTab).map(renderAssignmentCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

