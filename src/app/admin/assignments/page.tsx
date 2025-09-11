"use client"
import Link from 'next/link'
import { useAssignments } from '@/contexts/AssignmentContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Trash2 } from 'lucide-react'

// Backend functionality disabled - keeping frontend only
// async function getAssignments() {
//   const { data: assignments, error } = await supabase
//     .from('assignments')
//     .select(`
//       *,
//       lesson:lessons(title)
//     `)
//     .order('created_at', { ascending: false })
//   
//   if (error) throw error
//   return assignments
// }

export default function AdminAssignmentsPage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Assignments</h1>
        <Link href="/admin/assignments/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {assignment.title}
                    <Badge variant={assignment.published ? 'default' : 'secondary'}>
                      {assignment.published ? 'Published' : 'Draft'}
                    </Badge>
                  </CardTitle>
                  {assignment.lesson && (
                    <CardDescription>
                      Related to: {assignment.lesson.title}
                    </CardDescription>
                  )}
                  {assignment.description && (
                    <CardDescription className="mt-2">
                      {assignment.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/assignments/${assignment.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(assignment.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  {assignment.questions?.length || 0} questions • {assignment.total_points} points
                </div>
                <div>
                  {assignment.due_date && (
                    <>Due: {new Date(assignment.due_date).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              
              {/* Show question types summary */}
              {assignment.questions && assignment.questions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {assignment.questions
                    .reduce((acc, q) => {
                      const type = q.type === 'open-response' ? 'AI Graded' : q.type.replace('-', ' ')
                      const existing = acc.find(item => item.type === type)
                      if (existing) {
                        existing.count++
                      } else {
                        acc.push({ type, count: 1 })
                      }
                      return acc
                    }, [] as { type: string; count: number }[])
                    .map(({ type, count }) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {count} {type}
                      </Badge>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {assignments.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">No assignments created yet.</p>
              <Link href="/admin/assignments/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Assignment
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}