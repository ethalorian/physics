"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'

interface Lesson {
  id: string  // Changed from number to string for UUID
  title: string
  slug: string
  description: string
  content: string
  unit: string
  lesson_number: number
  published: boolean
  created_at: string
}

export default function LessonManagement() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    unit: '',
    lesson_number: 1
  })

  // Fetch lessons
  useEffect(() => {
    fetchLessons()
  }, [])

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('lesson_number', { ascending: true })
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      setLessons(data || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
      // Show user-friendly error message
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        if (error.message.includes('relation "public.lessons" does not exist')) {
          alert('The lessons table does not exist in your database. Please create it first.')
        } else if (error.message.includes('permission denied')) {
          alert('Permission denied. Please check your Supabase RLS policies.')
        } else {
          alert(`Error loading lessons: ${error.message}`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingLesson) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({ ...formData, published: true })
          .eq('id', editingLesson.id)
        
        if (error) throw error
        alert('Lesson updated successfully!')
      } else {
        // Create new lesson
        const { error } = await supabase
          .from('lessons')
          .insert([{ ...formData, published: true }])
        
        if (error) throw error
        alert('Lesson created successfully!')
      }
      
      // Reset form and refresh lessons
      setFormData({ title: '', slug: '', description: '', content: '', unit: '', lesson_number: 1 })
      setIsCreating(false)
      setEditingLesson(null)
      fetchLessons()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Error saving lesson. Please try again.')
    }
  }

  const handleEdit = (lesson: Lesson) => {
    setFormData({
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      content: lesson.content,
      unit: lesson.unit,
      lesson_number: lesson.lesson_number
    })
    setEditingLesson(lesson)
    setIsCreating(true)
  }

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
      
      if (error) throw error
      alert('Lesson deleted successfully!')
      fetchLessons()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Error deleting lesson. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', slug: '', description: '', content: '', unit: '', lesson_number: 1 })
    setIsCreating(false)
    setEditingLesson(null)
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
          <h2 className="text-2xl font-bold text-[#4A1A4A]">Lesson Management</h2>
          <p className="text-[#6A4C93]">Create and manage physics lessons</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-[#4A1A4A] to-[#6A4C93] hover:from-[#5A2A5A] hover:to-[#7A5CA3]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Lesson
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="text-[#4A1A4A]">
              {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </CardTitle>
            <CardDescription className="text-[#6A4C93]">
              {editingLesson ? 'Update lesson details' : 'Add a new physics lesson to your curriculum'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#4A1A4A]">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Newton's First Law"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#4A1A4A]">Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., newtons-first-law"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#4A1A4A]">Unit</label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., Mechanics"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#4A1A4A]">Lesson Number</label>
                  <Input
                    type="number"
                    value={formData.lesson_number}
                    onChange={(e) => setFormData({ ...formData, lesson_number: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4A1A4A]">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the lesson..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4A1A4A]">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Lesson content in markdown format..."
                  rows={10}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#4A1A4A] to-[#6A4C93] hover:from-[#5A2A5A] hover:to-[#7A5CA3]"
                >
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      <div className="grid gap-4">
        {lessons.length === 0 ? (
          <Card className="apple-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-[#9A8AC0] mb-4" />
              <h3 className="text-lg font-medium text-[#4A1A4A] mb-2">No lessons yet</h3>
              <p className="text-[#6A4C93] text-center mb-4">
                Get started by creating your first physics lesson
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-[#4A1A4A] to-[#6A4C93] hover:from-[#5A2A5A] hover:to-[#7A5CA3]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Lesson
              </Button>
            </CardContent>
          </Card>
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id} className="apple-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">
                        Lesson {lesson.lesson_number}
                      </Badge>
                      <Badge variant="outline" className="text-[#9A8AC0] border-[#9A8AC0]">
                        {lesson.unit}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(lesson)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(lesson.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-[#4A1A4A]">{lesson.title}</CardTitle>
                <CardDescription className="text-[#6A4C93]">{lesson.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-[#9A8AC0]">
                  <span>Created: {new Date(lesson.created_at).toLocaleDateString()}</span>
                  <span>Slug: {lesson.slug}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
