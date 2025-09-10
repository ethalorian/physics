"use client"
// import { supabase } from '@/lib/supabase'  // Backend disabled
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Eye, Users } from 'lucide-react'

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
  // Mock data for frontend demo
  const assignments = [
    {
      id: '1',
      title: 'Newton\'s Laws Quiz',
      description: 'Test your understanding of Newton\'s three laws of motion',
      published: true,
      lesson: { title: 'Newton\'s Laws' },
      questions: [1, 2, 3, 4, 5],
      total_points: 100,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Energy and Work Problems',
      description: 'Problem set on kinetic and potential energy',
      published: false,
      lesson: { title: 'Energy and Work' },
      questions: [1, 2, 3],
      total_points: 50,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    }
  ]

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
                  <Link href={`/admin/assignments/${assignment.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/assignments/${assignment.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/assignments/${assignment.id}/submissions`}>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4" />
                    </Button>
                  </Link>
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