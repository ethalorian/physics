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
  Lock,
  Video,
  Microscope,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Loader2
} from 'lucide-react'

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
  simulation?: {
    id: string
    slug: string
    title: string
    description?: string
    difficulty?: string
    estimated_time?: number
  }
  progress?: number
  isNew?: boolean
  order_index?: number
  // Release-window status (students only; null/absent for staff, who are ungated)
  window?: LessonWindowInfo | null
}

// Mirrors LessonWindowStatus from @/lib/lesson-windows (server-only module —
// it imports supabaseAdmin, so the shape is re-declared here for the client).
type LessonWindowInfo =
  | { state: 'open'; opened_at: string | null; closes_at: string | null }
  | { state: 'scheduled'; opens_at: string }
  | { state: 'closed'; closed_at: string | null }

// "Closes today 11:59 PM" / "Opens Mon 8:00 AM" / "Closed Jun 8" — relative
// day words near today, weekday inside a week, short date beyond.
function fmtWhen(iso: string, withTime = true): string {
  const d = new Date(iso)
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOf(d) - startOf(now)) / 86400000)
  let day: string
  if (dayDiff === 0) day = 'today'
  else if (dayDiff === 1) day = 'tomorrow'
  else if (dayDiff === -1) day = 'yesterday'
  else if (dayDiff > 1 && dayDiff < 7) day = d.toLocaleDateString(undefined, { weekday: 'short' })
  else day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (!withTime) return day
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day} ${time}`
}

const closesSoon = (iso: string) => {
  const dt = new Date(iso).getTime() - Date.now()
  return dt > 0 && dt < 24 * 60 * 60 * 1000
}

interface LessonBrowserProps {
  initialLessons?: Lesson[]
  initialProgress?: Record<string, number>
}

export default function LessonBrowser({ initialLessons = [], initialProgress = {} }: LessonBrowserProps) {
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [progress, setProgress] = useState<Record<string, number>>(initialProgress)
  const [loading, setLoading] = useState(!initialLessons.length)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUnit, setFilterUnit] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  // Fetch lessons on mount if not provided
  useEffect(() => {
    if (!initialLessons.length) {
      fetchLessons()
    }
  }, [initialLessons.length])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterUnit !== 'all') params.append('unit', filterUnit)
      if (filterType !== 'all') params.append('lesson_type', filterType)
      if (filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/lessons/published?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch lessons')

      const data = await response.json()
      setLessons(data.lessons || [])
      setProgress(data.progress || {})
    } catch (error) {
      console.error('Error fetching lessons:', error)
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters change
  useEffect(() => {
    if (initialLessons.length === 0) {
      const timer = setTimeout(() => {
        fetchLessons()
      }, 300) // Debounce
      return () => clearTimeout(timer)
    }
  }, [searchTerm, filterUnit, filterType, filterDifficulty])

  // Get unique units
  const units = Array.from(new Set(lessons.map(l => l.unit).filter((u): u is string => Boolean(u)))).sort()

  // Filter lessons locally if needed
  const filteredLessons = lessons.filter(lesson => {
    if (searchTerm && !lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
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
  const completedCount = Object.values(progress).filter(p => p === 100).length
  const inProgressCount = Object.values(progress).filter(p => p > 0 && p < 100).length
  const simulationCount = lessons.filter(l => l.lesson_type === 'simulation').length

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

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalLessons}</div>
                <div className="text-xs text-muted-foreground">Total Lessons</div>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-success">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <CheckCircle className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{inProgressCount}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{simulationCount}</div>
                <div className="text-xs text-muted-foreground">Simulations</div>
              </div>
              <Microscope className="h-8 w-8 text-primary opacity-50" />
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
                  <LessonCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    progress={progress[lesson.id] || 0}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredLessons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lessons match your filters.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchTerm('')
                setFilterUnit('all')
                setFilterType('all')
                setFilterDifficulty('all')
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Lesson Card Component
function LessonCard({ 
  lesson, 
  progress
}: { 
  lesson: Lesson
  progress: number
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
  const isCompleted = progress === 100
  const isStarted = progress > 0

  // Release-window state. No window info (staff, or pre-deploy cache) = open.
  const win = lesson.window ?? null
  const isLocked = win?.state === 'scheduled' || win?.state === 'closed'
  const urgent = win?.state === 'open' && !!win.closes_at && closesSoon(win.closes_at)

  return (
    <Card
      className={`transition-all group relative overflow-hidden ${
        isLocked
          ? 'opacity-70 cursor-default'
          : `hover:shadow-lg cursor-pointer ${isCompleted ? 'border-success/30 bg-success/5' : ''}`
      }`}
      onClick={() => { if (!isLocked) router.push(`/lessons/${lesson.slug}`) }}
    >
      {/* Progress Bar */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div 
            className={`h-full transition-all ${isCompleted ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* New Badge */}
      {lesson.isNew && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-reward text-reward-foreground flex items-center gap-1">
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
            {isCompleted && (
              <Badge variant="default" className="text-xs bg-success text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">
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

        {/* Release window — opened / closes / opens / closed, at a glance */}
        {win && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              urgent
                ? 'text-amber-600 dark:text-amber-400'
                : win.state === 'open'
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/80'
            }`}
          >
            {win.state === 'open' ? (
              <>
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {win.opened_at ? `Opened ${fmtWhen(win.opened_at, false)}` : 'Open'}
                  {win.closes_at ? ` · Closes ${fmtWhen(win.closes_at)}` : ''}
                </span>
              </>
            ) : win.state === 'scheduled' ? (
              <>
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>Opens {fmtWhen(win.opens_at)}</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>Closed{win.closed_at ? ` ${fmtWhen(win.closed_at, false)}` : ''}</span>
              </>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full"
          variant={isCompleted || isLocked ? "outline" : "default"}
          disabled={isLocked}
          onClick={(e) => {
            e.stopPropagation()
            if (!isLocked) router.push(`/lessons/${lesson.slug}`)
          }}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              {win?.state === 'scheduled' ? `Opens ${fmtWhen(win.opens_at, false)}` : 'Closed'}
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Review
            </>
          ) : isStarted ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Continue ({progress.toFixed(0)}%)
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Lesson
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
