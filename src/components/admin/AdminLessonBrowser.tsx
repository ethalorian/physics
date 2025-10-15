'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  Filter,
  Play,
  CheckCircle,
  Video,
  Microscope,
  BookOpen,
  Clock,
  Target,
  Award,
  Sparkles,
  Loader2,
  Edit,
  Eye,
  Trash2,
  Plus,
  FileText,
  Copy,
  AlertCircle,
  X
} from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

interface Lesson {
  id: string
  title: string
  slug: string
  description?: string
  unit?: string
  lesson_number?: number
  lesson_type: 'video' | 'simulation' | 'markdown'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimated_time?: number
  objectives?: string[]
  published: boolean
  simulation?: {
    id: string
    slug: string
    title: string
  }
  progress?: number
  isNew?: boolean
  order_index?: number
  created_at: string
}

interface SimulationOption {
  id: string
  slug: string
  title: string
  description?: string
  category?: string
  unit?: string
}

interface LessonData {
  title: string
  slug: string
  description: string
  unit: string
  lesson_number: number
  lesson_type: 'video' | 'simulation' | 'markdown'
  estimated_time: number
  objectives: string[]
  published: boolean
  content?: string
  video_url?: string
  simulation_id?: string
}

export default function AdminLessonBrowser() {
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUnit, setFilterUnit] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterPublished, setFilterPublished] = useState('all')
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    unit: '',
    lesson_number: 1,
    lesson_type: 'markdown' as 'video' | 'simulation' | 'markdown',
    estimated_time: 30,
    objectives: [] as string[],
    simulation_id: '',
    video_url: ''
  })
  const [availableSimulations, setAvailableSimulations] = useState<SimulationOption[]>([])

  useEffect(() => {
    fetchLessons()
    fetchSimulations()
  }, [])

  const fetchSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, slug, title, description, category, unit')
        .eq('published', true)
        .order('unit', { ascending: true })
        .order('title', { ascending: true })

      if (!error && data) {
        setAvailableSimulations(data)
      }
    } catch (error) {
      console.error('Error fetching simulations:', error)
    }
  }

  const fetchLessons = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (filterUnit !== 'all') params.append('unit', filterUnit)
      if (filterType !== 'all') params.append('lesson_type', filterType)
      if (filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/lessons/published?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', response.status, errorData)
        setError(`${response.status}: ${errorData.error || 'Failed to fetch lessons'}`)
        throw new Error(`Failed to fetch lessons: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Fetched lessons:', data.lessons?.length || 0)
      setLessons(data.lessons || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
      if (!error) {
        setError('Network error - please check your connection')
      }
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLessons()
    }, 300) // Debounce
    return () => clearTimeout(timer)
  }, [searchTerm, filterUnit, filterType, filterDifficulty])

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation for simulation type
    if (formData.lesson_type === 'simulation' && !formData.simulation_id) {
      alert('Please select a simulation')
      return
    }
    
    setLoading(true)
    
    try {
      const lessonData: LessonData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        unit: formData.unit,
        lesson_number: formData.lesson_number,
        lesson_type: formData.lesson_type,
        estimated_time: formData.estimated_time,
        objectives: formData.objectives,
        published: false
      }

      // Add type-specific fields
      if (formData.lesson_type === 'markdown') {
        lessonData.content = formData.content
      }
      
      if (formData.lesson_type === 'video' && formData.video_url) {
        lessonData.video_url = formData.video_url
      }
      
      if (formData.lesson_type === 'simulation') {
        lessonData.simulation_id = formData.simulation_id
      }

      // Use API route instead of direct Supabase
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create lesson')
      }

      const { data } = await response.json()

      // Reset form
      setFormData({
        title: '',
        slug: '',
        description: '',
        content: '',
        unit: '',
        lesson_number: 1,
        lesson_type: 'markdown',
        estimated_time: 30,
        objectives: [],
        simulation_id: '',
        video_url: ''
      })
      setIsCreating(false)

      // Refresh lessons list
      await fetchLessons()

      // Navigate to edit the new lesson
      if (data) {
        router.push(`/admin/lessons/${data.id}/edit`)
      }
    } catch (error) {
      console.error('Error creating lesson:', error)
      alert(error instanceof Error ? error.message : 'Failed to create lesson')
    } finally {
      setLoading(false)
    }
  }

  // Get unique units
  const units = Array.from(new Set(lessons.map(l => l.unit).filter((u): u is string => Boolean(u)))).sort()

  // Filter lessons locally
  const filteredLessons = lessons.filter(lesson => {
    if (searchTerm && !lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (filterPublished !== 'all') {
      const isPublished = lesson.published
      if (filterPublished === 'published' && !isPublished) return false
      if (filterPublished === 'draft' && isPublished) return false
    }
    return true
  })

  // Group by unit
  const lessonsByUnit = filteredLessons.reduce((acc, lesson) => {
    const unit = lesson.unit || 'Other'
    if (!acc[unit]) acc[unit] = []
    acc[unit].push(lesson)
    return acc
  }, {} as Record<string, Lesson[]>)

  // Calculate stats
  const totalLessons = lessons.length
  const publishedCount = lessons.filter(l => l.published).length
  const draftCount = lessons.filter(l => !l.published).length
  const videoCount = lessons.filter(l => l.lesson_type === 'video').length
  const simulationCount = lessons.filter(l => l.lesson_type === 'simulation').length
  const markdownCount = lessons.filter(l => l.lesson_type === 'markdown').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading lessons...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Lessons</h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={fetchLessons} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={() => {
                    setError(null)
                    setIsCreating(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Lesson Anyway
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lesson Management</h2>
          <p className="text-muted-foreground">Create and manage physics lessons - All functionality in one place</p>
        </div>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? (
            <>
              <X className="h-5 w-5" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              New Lesson
            </>
          )}
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Create New Lesson</CardTitle>
            <p className="text-sm text-muted-foreground">Add a new physics lesson to your curriculum</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLesson} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Newton's First Law"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug *</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., newtons-first-law"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit *</label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., Unit 1: Kinematics"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lesson Type *</label>
                  <Select 
                    value={formData.lesson_type} 
                    onValueChange={(value: 'video' | 'simulation' | 'markdown') => 
                      setFormData({ ...formData, lesson_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">📖 Reading Lesson</SelectItem>
                      <SelectItem value="video">📹 Video Lesson</SelectItem>
                      <SelectItem value="simulation">🔬 Simulation Lesson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lesson Number *</label>
                  <Input
                    type="number"
                    value={formData.lesson_number}
                    onChange={(e) => setFormData({ ...formData, lesson_number: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimated Time (minutes)</label>
                  <Input
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 30 })}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the lesson..."
                  rows={3}
                  required
                />
              </div>

              {/* Conditional fields based on lesson type */}
              {formData.lesson_type === 'markdown' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Lesson content in markdown format (supports KaTeX math)..."
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use \( ... \) for inline math and \[ ... \] for display math
                  </p>
                </div>
              )}

              {formData.lesson_type === 'video' && (
                <div className="space-y-4">
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Video className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900 mb-1">Video Lesson Setup</h4>
                          <p className="text-sm text-red-700">
                            Create the lesson first, then manage videos and questions from the edit page.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube URL (Optional)</label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground">
                      You can add this later and manage video questions from the edit page
                    </p>
                  </div>
                </div>
              )}

              {formData.lesson_type === 'simulation' && (
                <div className="space-y-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Microscope className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-purple-900 mb-1">Simulation Lesson</h4>
                          <p className="text-sm text-purple-700">
                            Select an interactive simulation to embed as a lesson. You can add questions later.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Simulation *</label>
                    <Select 
                      value={formData.simulation_id} 
                      onValueChange={(value) => setFormData({ ...formData, simulation_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a simulation..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSimulations.length === 0 ? (
                          <SelectItem value="none" disabled>No simulations available</SelectItem>
                        ) : (
                          availableSimulations.map(sim => (
                            <SelectItem key={sim.id} value={sim.id}>
                              {sim.title} ({sim.category})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {availableSimulations.length} simulations available
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false)
                    setFormData({
                      title: '',
                      slug: '',
                      description: '',
                      content: '',
                      unit: '',
                      lesson_number: 1,
                      lesson_type: 'markdown',
                      estimated_time: 30,
                      objectives: [],
                      simulation_id: '',
                      video_url: ''
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalLessons}</div>
              <div className="text-xs text-muted-foreground mt-1">Total</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{publishedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Published</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{draftCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Drafts</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{videoCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Videos</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{simulationCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Simulations</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{markdownCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Reading</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Unit Filter */}
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="simulation">🔬 Simulations</SelectItem>
                <SelectItem value="video">📹 Videos</SelectItem>
                <SelectItem value="markdown">📖 Reading</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Published Filter */}
            <Select value={filterPublished} onValueChange={setFilterPublished}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lessons by Unit */}
      <div className="space-y-8">
        {Object.keys(lessonsByUnit).sort().map(unitId => (
          <div key={unitId}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">{unitId}</h2>
              <Badge variant="secondary">
                {lessonsByUnit[unitId].length} lessons
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessonsByUnit[unitId]
                .sort((a, b) => (a.lesson_number || 0) - (b.lesson_number || 0))
                .map(lesson => (
                  <AdminLessonCard 
                    key={lesson.id} 
                    lesson={lesson}
                    onRefresh={fetchLessons}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredLessons.length === 0 && !isCreating && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{lessons.length === 0 ? 'No lessons yet. Create your first lesson to get started!' : 'No lessons match your filters.'}</p>
            <div className="flex gap-2 justify-center mt-4">
              {lessons.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterUnit('all')
                    setFilterType('all')
                    setFilterDifficulty('all')
                    setFilterPublished('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Admin Lesson Card Component
function AdminLessonCard({ 
  lesson,
  onRefresh
}: { 
  lesson: Lesson
  onRefresh: () => void
}) {
  const router = useRouter()

  const getTypeInfo = () => {
    switch (lesson.lesson_type) {
      case 'video':
        return { icon: Video, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
      case 'simulation':
        return { icon: Microscope, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' }
      default:
        return { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    }
  }

  const typeInfo = getTypeInfo()
  const TypeIcon = typeInfo.icon

  return (
    <Card 
      className={`hover:shadow-lg transition-all group relative overflow-hidden ${
        !lesson.published ? 'border-yellow-200 bg-yellow-50/20' : ''
      }`}
    >
      {/* New Badge */}
      {lesson.isNew && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-yellow-500 text-white flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            New
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`p-2 rounded-lg ${typeInfo.bg} ${typeInfo.border} border`}>
            <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
          </div>
          <div className="flex gap-1">
            {lesson.difficulty && (
              <Badge variant="outline" className="text-xs">
                {lesson.difficulty}
              </Badge>
            )}
            <Badge variant={lesson.published ? "default" : "secondary"} className="text-xs">
              {lesson.published ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-lg mb-1">
            {lesson.title}
          </CardTitle>
          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {lesson.estimated_time && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{lesson.estimated_time} min</span>
            </div>
          )}
          {lesson.objectives && lesson.objectives.length > 0 && (
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{lesson.objectives.length} objectives</span>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/admin/lessons/${lesson.id}/edit`)}
            className="gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/lessons/${lesson.slug}`)}
            className="gap-1"
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/admin/lessons/${lesson.id}/preview`)}
            className="gap-1"
          >
            <Play className="h-3 w-3" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

