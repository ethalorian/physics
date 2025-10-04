"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Eye, 
  ExternalLink, 
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  Target,
  FileText,
  Video,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'
import LessonVideoManager from './LessonVideoManager'
import { LessonVideo } from '@/types/assignment'

interface Lesson {
  id: string
  title: string
  slug: string
  description: string
  content: string
  unit: string
  lesson_number: number
  published: boolean
  created_at: string
  updated_at: string
  estimated_time?: number
  objectives?: string[]
  videos?: LessonVideo[]
}

export default function LessonManagement() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [managingVideos, setManagingVideos] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    unit: '',
    lesson_number: 1,
    estimated_time: 30,
    objectives: [] as string[]
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
        .order('unit', { ascending: true })
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

  const handleVideoSave = async (lessonId: string, videos: LessonVideo[]) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ videos })
        .eq('id', lessonId)
      
      if (error) throw error
      
      alert('Videos saved successfully!')
      setManagingVideos(null)
      fetchLessons()
    } catch (error) {
      console.error('Error saving videos:', error)
      alert('Error saving videos. Please try again.')
    }
  }

  const toggleExpand = (lessonId: string) => {
    setExpandedLesson(prev => prev === lessonId ? null : lessonId)
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
      setFormData({ 
        title: '', 
        slug: '', 
        description: '', 
        content: '', 
        unit: '', 
        lesson_number: 1,
        estimated_time: 30,
        objectives: []
      })
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
      lesson_number: lesson.lesson_number,
      estimated_time: lesson.estimated_time || 30,
      objectives: lesson.objectives || []
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
    setFormData({ 
      title: '', 
      slug: '', 
      description: '', 
      content: '', 
      unit: '', 
      lesson_number: 1,
      estimated_time: 30,
      objectives: []
    })
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

  // Calculate statistics
  const stats = {
    totalLessons: lessons.length,
    totalVideos: lessons.reduce((sum, l) => sum + (l.videos?.length || 0), 0),
    published: lessons.filter(l => l.published).length,
    draft: lessons.filter(l => !l.published).length,
    unitCount: new Set(lessons.map(l => l.unit)).size
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#4A1A4A]">Lesson Management</h2>
          <p className="text-[#6A4C93]">Create and manage physics lessons - All functionality in one place</p>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">{stats.totalLessons}</span>
              <span className="text-gray-600">Lessons</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-purple-600" />
              <span className="font-semibold">{stats.totalVideos}</span>
              <span className="text-gray-600">Videos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{stats.published}</span>
              <span className="text-gray-600">Published</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-orange-600" />
              <span className="font-semibold">{stats.draft}</span>
              <span className="text-gray-600">Draft</span>
            </div>
          </div>
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

      {/* Lessons List - Enhanced with expandable details */}
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
          lessons.map((lesson) => {
            const isExpanded = expandedLesson === lesson.id
            const isManagingVideos = managingVideos === lesson.id
            
            return (
              <Card key={lesson.id} className="apple-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleExpand(lesson.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">
                          Lesson {lesson.lesson_number}
                        </Badge>
                        <Badge variant="outline" className="text-[#9A8AC0] border-[#9A8AC0]">
                          {lesson.unit}
                        </Badge>
                        {lesson.published ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-[#4A1A4A] text-xl mb-1">
                        {lesson.title}
                      </CardTitle>
                      <CardDescription className="text-[#6A4C93]">
                        {lesson.description}
                      </CardDescription>
                      
                      {/* Quick Stats Row */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Video className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{lesson.videos?.length || 0}</span>
                          <span className="text-gray-600">videos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{lesson.objectives?.length || 0}</span>
                          <span className="text-gray-600">objectives</span>
                        </div>
                        {lesson.estimated_time && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">{lesson.estimated_time}</span>
                            <span className="text-gray-600">min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-gray-600">
                            {lesson.content ? '✓ Content' : '✗ No content'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setManagingVideos(isManagingVideos ? null : lesson.id)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Manage Videos"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        asChild
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Preview as Student"
                      >
                        <a 
                          href={`/lessons/${lesson.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(lesson)}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        title="Edit Lesson"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(lesson.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete Lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <CardContent className="pt-0 space-y-4 border-t">
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Slug</div>
                          <div className="text-sm font-mono bg-gray-50 p-2 rounded">{lesson.slug}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Created</div>
                          <div className="text-sm">{new Date(lesson.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Updated</div>
                          <div className="text-sm">{new Date(lesson.updated_at).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {/* Right Column - Objectives */}
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-2">Learning Objectives</div>
                        {lesson.objectives && lesson.objectives.length > 0 ? (
                          <div className="space-y-1.5">
                            {lesson.objectives.map((obj, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-blue-600 font-bold">{idx + 1}.</span>
                                <span className="text-gray-700">{obj}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">No objectives defined</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Videos List */}
                    {lesson.videos && lesson.videos.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-2">Videos</div>
                        <div className="space-y-2">
                          {lesson.videos.map((video, idx) => (
                            <div key={video.id} className="flex items-center gap-3 bg-purple-50 p-2 rounded text-sm">
                              <Play className="h-4 w-4 text-purple-600" />
                              <div className="flex-1">
                                <div className="font-medium">{video.title}</div>
                                {video.duration && (
                                  <div className="text-xs text-gray-600">{video.duration}</div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-7"
                              >
                                <a 
                                  href={`https://youtube.com/watch?v=${video.youtubeId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
                
                {/* Video Management Section */}
                {isManagingVideos && (
                  <CardContent className="pt-4 border-t bg-purple-50/30">
                    <LessonVideoManager
                      lessonId={lesson.id}
                      lessonTitle={lesson.title}
                      initialVideos={lesson.videos || []}
                      onSave={(videos) => handleVideoSave(lesson.id, videos)}
                    />
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
