"use client"
import { useAssignments } from '@/contexts/ConsolidatedAssignmentContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, FileText, Calendar, Eye } from 'lucide-react'
import Link from 'next/link'

export default function AssignmentManagement() {
  const { assignments, loading, deleteAssignment } = useAssignments()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteAssignment(id)
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Error deleting assignment. Please try again.')
    }
  }

  const getStatusBadge = (assignment: { due_date?: string | null; published?: boolean }) => {
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    const now = new Date()
    
    if (!dueDate) {
      return <Badge variant="secondary">No Due Date</Badge>
    } else if (dueDate < now) {
      return <Badge variant="destructive">Past Due</Badge>
    } else if (dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Due Soon</Badge>
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A4C93]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#4A1A4A]">Assignment Management</h2>
          <p className="text-[#6A4C93]">Create and manage student assignments</p>
        </div>
        <Link href="/admin/assignments/create">
          <Button className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]">
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </Link>
      </div>


      {/* Assignments List */}
      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <Card className="apple-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-[#9A8AC0] mb-4" />
              <h3 className="text-lg font-medium text-[#4A1A4A] mb-2">No assignments yet</h3>
              <p className="text-[#6A4C93] text-center mb-4">
                Create your first assignment to get students engaged
              </p>
              <Link href="/admin/assignments/create">
                <Button className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Assignment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="apple-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(assignment)}
                    <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">
                      {assignment.max_score || 0} pts
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/assignments/${assignment.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-[#4A1A4A]">{assignment.title}</CardTitle>
                <CardDescription className="text-[#6A4C93]">{assignment.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-[#9A8AC0]">
                  <div className="flex items-center gap-4">
                    {assignment.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span>{assignment.questions?.length || 0} questions • {assignment.max_score || 0} points</span>
                  </div>
                  <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* Question types summary */}
                {assignment.questions && assignment.questions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {assignment.questions
                      .reduce((acc: Array<{type: string, count: number}>, q: {type: string}) => {
                        const type = q.type === 'open-response' ? 'AI Graded' : q.type.replace('-', ' ')
                        const existing = acc.find(item => item.type === type)
                        if (existing) {
                          existing.count++
                        } else {
                          acc.push({ type, count: 1 })
                        }
                        return acc
                      }, [])
                      .map(({ type, count }: {type: string, count: number}) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {count} {type}
                        </Badge>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
