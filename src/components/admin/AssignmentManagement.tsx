"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Removed unused Select imports
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, FileText, Calendar } from 'lucide-react'

interface Assignment {
  id: number
  title: string
  description: string
  content: string
  due_date: string
  points: number
  published: boolean
  created_at: string
}

export default function AssignmentManagement() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    due_date: '',
    points: 100
  })

  // Fetch assignments
  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      // Backend functionality disabled - keeping frontend only
      // const { data, error } = await supabase
      //   .from('assignments')
      //   .select('*')
      //   .order('due_date', { ascending: true })
      // 
      // if (error) throw error
      // setAssignments(data || [])
      
      // Mock data for frontend demo
      setAssignments([
        {
          id: 1,
          title: 'Newton\'s Laws Quiz',
          description: 'Test your understanding of Newton\'s three laws of motion',
          content: 'Complete all questions showing your work.',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          points: 100,
          published: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Energy and Work Problems',
          description: 'Problem set on kinetic and potential energy',
          content: 'Solve the following energy problems.',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          points: 50,
          published: true,
          created_at: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Backend functionality disabled - keeping frontend only
      // if (editingAssignment) {
      //   // Update existing assignment
      //   const { error } = await supabase
      //     .from('assignments')
      //     .update({ ...formData, published: true })
      //     .eq('id', editingAssignment.id)
      //   
      //   if (error) throw error
      //   alert('Assignment updated successfully!')
      // } else {
      //   // Create new assignment
      //   const { error } = await supabase
      //     .from('assignments')
      //     .insert([{ ...formData, published: true }])
      //   
      //   if (error) throw error
      //   alert('Assignment created successfully!')
      // }
      
      // Simulate success for frontend demo
      const action = editingAssignment ? 'updated' : 'created'
      alert(`Assignment ${action} (frontend demo mode - no backend)`)
      console.log('Assignment data (frontend only):', { ...formData, published: true })
      
      // Reset form and refresh assignments
      setFormData({ title: '', description: '', content: '', due_date: '', points: 100 })
      setIsCreating(false)
      setEditingAssignment(null)
      // fetchAssignments() - not needed in demo mode
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Error saving assignment. Please try again.')
    }
  }

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description,
      content: assignment.content,
      due_date: assignment.due_date.split('T')[0], // Format for date input
      points: assignment.points
    })
    setEditingAssignment(assignment)
    setIsCreating(true)
  }

  const handleDelete = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    
    try {
      // Backend functionality disabled - keeping frontend only
      // const { error } = await supabase
      //   .from('assignments')
      //   .delete()
      //   .eq('id', assignmentId)
      // 
      // if (error) throw error
      
      // Simulate deletion for frontend demo
      alert('Assignment deleted (frontend demo mode - no backend)')
      console.log('Deleted assignment ID (frontend only):', assignmentId)
      
      // Remove from local state to simulate deletion
      setAssignments(prev => prev.filter(a => a.id !== assignmentId))
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Error deleting assignment. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', content: '', due_date: '', points: 100 })
    setIsCreating(false)
    setEditingAssignment(null)
  }

  const getStatusBadge = (assignment: Assignment) => {
    const dueDate = new Date(assignment.due_date)
    const now = new Date()
    
    if (dueDate < now) {
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
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="text-[#4A1A4A]">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </CardTitle>
            <CardDescription className="text-[#6A4C93]">
              {editingAssignment ? 'Update assignment details' : 'Design a new assignment for your students'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#4A1A4A]">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Forces and Motion Lab"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#4A1A4A]">Points</label>
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4A1A4A]">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4A1A4A]">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the assignment..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4A1A4A]">Instructions</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detailed assignment instructions..."
                  rows={8}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]"
                >
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] hover:from-[#7A5CA3] hover:to-[#AA9AD0]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
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
                      {assignment.points} pts
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(assignment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
