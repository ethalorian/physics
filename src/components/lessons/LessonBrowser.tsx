'use client'

import LessonConceptMap from './LessonConceptMap'
import type { LessonConceptMapData } from '@/lib/lesson-concept-map'
import mapStyles from './LessonConceptMap.module.css'
import { Network, List } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import PhysicsLearningLibrary, { hasPhysicsLearning } from './PhysicsLearningLibrary'
import { useState, useEffect, useCallback } from 'react'
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
  Sparkles,
  } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  slug: string
  description?: string
  unit?: string
  lesson_number?: number
  lesson_type: 'video' | 'simulation' | 'markdown'
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
  watchHref?: string
}

// Mirrors LessonWindowStatus from @/lib/lesson-windows (server-only module —
// it imports supabaseAdmin, so the shape is re-declared here for the client).
type LessonWindowInfo = { due_at?: string | null } & (
  | { state: 'open'; opened_at: string | null; closes_at: string | null }
  | { state: 'scheduled'; opens_at: string }
  | { state: 'closed'; closed_at: string | null }
)

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
  observer?: boolean
  initialLessons?: Lesson[]
  initialProgress?: Record<string, number>
}

export default function LessonBrowser({ initialLessons = [], initialProgress = {}, observer = false }: LessonBrowserProps) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [progress, setProgress] = useState<Record<string, number>>(initialProgress)
  const [loading, setLoading] = useState(!initialLessons.length)
  const [loadError, setLoadError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUnit, setFilterUnit] = useState('all')
  const [showAllCourses, setShowAllCourses] = useState(false)
  const [conceptMap,setConceptMap]=useState<LessonConceptMapData|null>(null)
  const [mapView,setMapView]=useState(true)
  const [staff,setStaff]=useState(false)

  const fetchLessons = useCallback(async (quiet = false) => {
    try {
      if(!quiet)setLoading(true)
      setLoadError(false)
      const response = await fetch('/api/lessons/published')
      if (!response.ok) throw new Error('Failed to fetch lessons')

      const data = await response.json()
      setLessons(data.lessons || [])
      setProgress(data.progress || {})
      setConceptMap(data.conceptMap ?? null)
      setStaff(data.isAdmin === true)
    } catch (error) {
      console.error('Error fetching lessons:', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch the authorized catalog once; filters use that same list so unit
  // choices stay available and slower requests cannot overwrite newer filters.
  useEffect(() => {
    if (!initialLessons.length) void fetchLessons()
  }, [initialLessons.length, fetchLessons])

  const hasConceptMap = Boolean(conceptMap?.nodes.length)
  useEffect(()=>{
    if(!hasConceptMap)return
    const refresh=()=>{if(document.visibilityState==='visible')void fetchLessons(true)}
    window.addEventListener('focus',refresh)
    const interval=setInterval(refresh,60000)
    return()=>{window.removeEventListener('focus',refresh);clearInterval(interval)}
  },[hasConceptMap,fetchLessons])

  // Get unique units
  const units = Array.from(new Set(lessons.map(l => l.unit).filter((u): u is string => Boolean(u)))).sort()

  const filteredLessons = lessons.filter(lesson => {
    if (filterUnit !== 'all' && lesson.unit !== filterUnit) return false
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

  if (!loading && !loadError && !showAllCourses && conceptMap?.nodes.length) return <>
    <nav className={mapStyles.viewTabs} aria-label="Lesson view"><button type="button" aria-pressed={mapView} onClick={()=>setMapView(true)}><Network size={17}/>Concept map</button><button type="button" aria-pressed={!mapView} onClick={()=>setMapView(false)}><List size={17}/>Lesson list</button></nav>
    {mapView?<LessonConceptMap data={conceptMap} onRefresh={()=>void fetchLessons(true)} observer={observer}/>:<PhysicsLearningLibrary lessons={lessons} onOtherCourses={()=>setShowAllCourses(true)} staff={false} observer={observer}/>}
  </>
  if (!loading && !loadError && !showAllCourses && hasPhysicsLearning(lessons)) return <PhysicsLearningLibrary lessons={lessons} onOtherCourses={()=>setShowAllCourses(true)} staff={staff} observer={observer}/>

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Spinner size="lg" className="text-primary mx-auto" />
          <p className="text-muted-foreground">Loading lessons...</p>
        </div>
      </div>
    )
  }

  if (loadError) return <section role="alert" className="rounded-xl border p-8"><h2 className="text-xl font-semibold">Your lessons could not be loaded.</h2><p className="my-3 text-muted-foreground">Your work is still saved. Try loading your class lessons again.</p><Button onClick={()=>void fetchLessons()}>Try again</Button></section>
  if (!lessons.length) return <section className="rounded-xl border bg-card p-8 sm:p-12"><p className="text-sm font-medium text-primary">YOUR LEARNING PATH</p><h2 className="mt-4 font-serif text-3xl">Your next lesson will appear here.</h2><p className="my-4 max-w-xl text-muted-foreground">There are no released lessons available for your class and course track yet. When your teacher opens one, you can watch, investigate, and save your thinking here.</p><a className="inline-flex min-h-11 items-center text-primary underline" href="/home">Return to your class home →</a></section>
  return (
    <div className="space-y-6">
      {showAllCourses && hasPhysicsLearning(lessons) && <Button variant="outline" onClick={()=>setShowAllCourses(false)}>Back to physics learning</Button>}
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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



          </div>
        </CardContent>
      </Card>

      {loadError && <div role="alert" className="rounded-xl border p-4">
        Couldn’t load lessons. <Button variant="outline" onClick={()=>void fetchLessons()}>Retry</Button>
      </div>}
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
      {!loadError && filteredLessons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm || filterUnit !== 'all' ? 'No lessons match your filters.' : 'No lessons are available yet.'}</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm('')
                setFilterUnit('all')
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
        return { icon: Video, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' }
      case 'simulation':
        return { icon: Microscope, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/40' }
      default:
        return { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/40' }
    }
  }

  const typeInfo = getTypeInfo()
  const TypeIcon = typeInfo.icon
  const isCompleted = progress === 100
  const isStarted = progress > 0

  // Release-window state. No window info (staff, or pre-deploy cache) = open.
  const win = lesson.window ?? null
  const isLocked = !lesson.watchHref && (win?.state === 'scheduled' || win?.state === 'closed')
  const href = lesson.watchHref ?? `/lessons/${lesson.slug}`
  const urgent = win?.state === 'open' && !!win.closes_at && closesSoon(win.closes_at)

  return (
    <Card
      className={`transition-all group relative overflow-hidden ${
        isLocked
          ? 'opacity-70 cursor-default'
          : `hover:shadow-lg cursor-pointer ${isCompleted ? 'border-success/30 bg-success/5' : ''}`
      }`}
      onClick={() => { if (!isLocked) router.push(href) }}
    >
      {/* Progress Bar */}
      {!lesson.watchHref && progress > 0 && (
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
            {!lesson.watchHref && isCompleted && (
              <Badge variant="default" className="text-xs bg-success text-background">
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

        {!lesson.watchHref && win?.due_at && <p className="text-sm font-semibold">Due {fmtWhen(win.due_at)}</p>}
        {/* Release window — opened / closes / opens / closed, at a glance */}
        {!lesson.watchHref && win && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              urgent
                ? 'text-primary '
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
            if (!isLocked) router.push(href)
          }}
        >
          {lesson.watchHref ? <><Play className="h-4 w-4 mr-2"/>Watch video</> : isLocked ? (
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
