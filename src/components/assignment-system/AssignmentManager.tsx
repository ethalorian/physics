"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, Clock, Users, BookOpen, FileText, Plus, Edit, Trash2, 
  Eye, CheckCircle, AlertCircle, XCircle, MoreHorizontal 
} from 'lucide-react'
import { useAssignmentSystem } from '@/contexts/AssignmentSystemContext'
import { getUserRole } from '@/lib/permissions'
import { UnifiedAssignment, AssignmentFilters } from '@/types/assignment-system'
import { CreateLessonAssignmentForm, CreateHomeworkAssignmentForm } from './CreateAssignmentForms'
import { format, parseISO, isAfter, isBefore } from 'date-fns'

interface AssignmentManagerProps {
  courseId?: string
}

export function AssignmentManager({ courseId }: AssignmentManagerProps) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  const {
    allAssignments,
    loading,
    fetchAssignments,
    deleteLessonAssignment,
    deleteAssignmentAssignment
  } = useAssignmentSystem()

  const [filters, setFilters] = useState<AssignmentFilters>({
    course_id: courseId,
    is_active: true,
    published: true
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Fetch assignments on mount and when filters change
  useEffect(() => {
    fetchAssignments(filters)
  }, [filters, fetchAssignments])

  // Filter assignments based on search and status
  const filteredAssignments = allAssignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && assignment.is_active) ||
                         (selectedStatus === 'inactive' && !assignment.is_active) ||
                         (selectedStatus === 'overdue' && assignment.due_date && isAfter(new Date(), parseISO(assignment.due_date)))
    
    const matchesType = selectedType === 'all' || assignment.type === selectedType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (assignment: UnifiedAssignment) => {
    const now = new Date()
    const isOverdue = assignment.due_date && isAfter(now, parseISO(assignment.due_date))
    const completionRate = assignment.completion_rate

    if (!assignment.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (!assignment.published) {
      return <Badge variant="outline">Draft</Badge>
    }
    if (isOverdue && completionRate < 100) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    if (completionRate === 100) {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    }
    if (completionRate > 0) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
    }
    return <Badge variant="outline">Not Started</Badge>
  }

  const getTypeIcon = (type: string) => {
    return type === 'lesson' ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />
  }

  const handleDelete = async (assignment: UnifiedAssignment) => {
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

  if (userRole !== 'admin' && userRole !== 'teacher') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Teacher or admin role required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assignment Manager</h2>
          <p className="text-muted-foreground">
            Manage lesson and homework assignments for your classes
          </p>
        </div>
        <div className="flex gap-2">
          <CreateAssignmentDialog />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
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
            <div>
              <Label htmlFor="active">Active Only</Label>
              <Select 
                value={filters.is_active?.toString() || 'all'} 
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  is_active: value === 'all' ? undefined : value === 'true'
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No assignments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
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

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.total_assigned} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.completion_rate.toFixed(0)}% complete</span>
                      </div>
                      {assignment.due_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due {format(parseISO(assignment.due_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Assigned {format(parseISO(assignment.assigned_at), 'MMM d')}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{assignment.total_completed}/{assignment.total_assigned}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${assignment.completion_rate}%` }}
                        />
                      </div>
                    </div>

                    {assignment.instructions && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{assignment.instructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(assignment)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// Create Assignment Dialog Component
function CreateAssignmentDialog() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'lesson' | 'assignment'>('lesson')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'lesson' | 'assignment')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lesson">Lesson Assignment</TabsTrigger>
            <TabsTrigger value="assignment">Homework Assignment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lesson">
            <CreateLessonAssignmentForm onSuccess={() => setOpen(false)} />
          </TabsContent>
          
          <TabsContent value="assignment">
            <CreateHomeworkAssignmentForm onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

