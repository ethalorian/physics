"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  TrendingUp,
  Search,
  RefreshCw,
  BookOpen,
  FileText,
  BookMarked,
  Beaker
} from 'lucide-react'
import { UnifiedAssignment, AssignmentType } from '@/types/unified-assignment'
import { format } from 'date-fns'
import Link from 'next/link'

interface AssignmentListViewProps {
  assignments: UnifiedAssignment[]
  loading?: boolean
  onRefresh?: () => void
  showNeedsAttentionOnly?: boolean
}

export function AssignmentListView({
  assignments,
  loading = false,
  onRefresh,
  showNeedsAttentionOnly = false
}: AssignmentListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<AssignmentType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'due_date' | 'created' | 'title'>('due_date')

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !assignment.title.toLowerCase().includes(query) &&
        !assignment.description?.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    // Type filter
    if (typeFilter !== 'all' && assignment.assignment_type !== typeFilter) {
      return false
    }

    return true
  })

  // Sort assignments
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    switch (sortBy) {
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      
      case 'title':
        return a.title.localeCompare(b.title)
      
      default:
        return 0
    }
  })

  const getAssignmentTypeIcon = (type: AssignmentType) => {
    const iconProps = { className: "h-4 w-4" }
    switch (type) {
      case 'lesson':
        return <BookOpen {...iconProps} className="h-4 w-4 text-blue-600" />
      case 'homework':
        return <FileText {...iconProps} className="h-4 w-4 text-green-600" />
      case 'vocabulary':
        return <BookMarked {...iconProps} className="h-4 w-4 text-purple-600" />
      case 'simulation':
      case 'simulation_embedded':
        return <Beaker {...iconProps} className="h-4 w-4 text-orange-600" />
      default:
        return null
    }
  }

  const getCompletionRate = (assignment: UnifiedAssignment) => {
    if (assignment.total_assigned === 0) return 0
    return Math.round((assignment.total_completed / assignment.total_assigned) * 100)
  }

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/unified-assignments?id=${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onRefresh?.()
      } else {
        alert('Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment')
    }
  }

  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return null

    const now = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (diffDays === 0) {
      return <Badge variant="destructive">Due Today</Badge>
    } else if (diffDays <= 3) {
      return <Badge variant="default" className="bg-orange-500">Due Soon</Badge>
    } else {
      return <Badge variant="outline">{format(due, 'MMM d')}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {showNeedsAttentionOnly ? 'Assignments Needing Attention' : 'All Assignments'}
              </CardTitle>
              <CardDescription>
                {sortedAssignments.length} assignment{sortedAssignments.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as AssignmentType | 'all')}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="lesson">Lessons</option>
                <option value="homework">Homework</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="simulation">Simulations</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="due_date">Sort by Due Date</option>
                <option value="created">Sort by Created</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading assignments...' : 'No assignments found'}
                  </TableCell>
                </TableRow>
              ) : (
                sortedAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getAssignmentTypeIcon(assignment.assignment_type)}
                        </div>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {assignment.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {assignment.assignment_type}
                            </Badge>
                            {assignment.total_submitted > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {assignment.total_submitted} to grade
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {assignment.course?.name || 'Individual students'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assignment.total_assigned} student{assignment.total_assigned !== 1 ? 's' : ''}
                      </div>
                    </TableCell>

                    <TableCell>
                      {assignment.due_date ? (
                        <>
                          {getDueDateStatus(assignment.due_date)}
                        </>
                      ) : (
                        <Badge variant="outline">No due date</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium">
                            {getCompletionRate(assignment)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${getCompletionRate(assignment)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.total_completed}/{assignment.total_assigned} complete
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={assignment.published ? 'default' : 'secondary'}>
                        {assignment.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/assignments/${assignment.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/assignments/${assignment.id}/progress`}>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              View Progress
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/assignments/${assignment.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

