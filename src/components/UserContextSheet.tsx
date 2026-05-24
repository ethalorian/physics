"use client"

// Progress slide-over. Opened ONLY from the account menu's "My progress" item —
// never directly from the avatar, and no full-screen gamification grid behind it.
// Role-aware: students see their real learning progress; staff see a personal
// "what's on my plate" cut (distinct from the /admin/home command center).

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy, BookOpen, Target, TrendingUp, Clock, Award, CheckCircle, PlayCircle,
  BarChart3, Users, LayoutGrid, GraduationCap, AlertTriangle,
} from 'lucide-react'
import { getUserRole } from '@/lib/permissions'

interface GameScore {
  id: string; game_type: string; score: number; max_score: number; accuracy: number
  time_spent: number; difficulty: string; completed_at: string; perfect_game: boolean
}
interface LessonProgress {
  id: string; lesson_id: string; lesson_slug: string; status: string
  progress_percentage: number; objectives_completed: number; objectives_total: number
  videos_watched: number; videos_total: number; video_questions_answered: number
  video_questions_correct: number; video_questions_total: number; time_spent: number
  completed_at: string | null
}
interface TeacherSummary { classes: number; students: number; needsGrading: number; aged: number; ratingsThisWeek: number }

export default function UserContextSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: session } = useSession()
  const role = getUserRole(session?.user?.email)
  const isStaff = role === 'admin' || role === 'teacher'

  const [gameScores, setGameScores] = useState<GameScore[]>([])
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [summary, setSummary] = useState<TeacherSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (isStaff) {
        const r = await fetch('/api/teacher/summary')
        if (r.ok) setSummary(await r.json())
      } else {
        const [sRes, lRes] = await Promise.all([
          fetch('/api/student-progress/game-scores').catch(() => null),
          fetch('/api/student-progress/lessons').catch(() => null),
        ])
        if (sRes?.ok) setGameScores(await sRes.json())
        if (lRes?.ok) setLessonProgress(await lRes.json())
      }
    } catch (e) {
      console.error('Progress fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [isStaff])

  useEffect(() => {
    if (open && session?.user?.id) fetchData()
  }, [open, session?.user?.id, fetchData])

  // student stats
  const stats = {
    totalGames: gameScores.length,
    averageScore: gameScores.length > 0
      ? Math.round(gameScores.reduce((s, g) => s + (g.score / g.max_score * 100), 0) / gameScores.length) : 0,
    perfectGames: gameScores.filter((g) => g.perfect_game).length,
    totalGameTime: Math.round(gameScores.reduce((s, g) => s + (g.time_spent || 0), 0) / 60),
    lessonsCompleted: lessonProgress.filter((l) => l.status === 'completed').length,
    totalLessonTime: Math.round(lessonProgress.reduce((s, l) => s + (l.time_spent || 0), 0) / 60),
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* header */}
        <div className="sticky top-0 z-10 border-b p-6" style={{ background: 'var(--card)' }}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={session.user.name || 'User'}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                  referrerPolicy="no-referrer" crossOrigin="anonymous" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)' }}>
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 text-left">
                <div className="text-lg font-bold">{session?.user?.name || 'User'}</div>
                <div className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>{session?.user?.email}</div>
                <Badge variant={role === 'student' ? 'default' : 'secondary'} className="mt-2">{role}</Badge>
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">
              {isStaff ? 'Your teaching at a glance' : 'Your learning progress'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} />
            </div>
          ) : isStaff ? (
            <StaffView summary={summary} />
          ) : (
            <StudentView stats={stats} lessonProgress={lessonProgress} gameScores={gameScores} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Staff: "what's on my plate"
// ---------------------------------------------------------------------------
function StaffView({ summary }: { summary: TeacherSummary | null }) {
  const s = summary ?? { classes: 0, students: 0, needsGrading: 0, aged: 0, ratingsThisWeek: 0 }
  const stat = (label: string, value: number | string, accent: string, icon: React.ReactNode) => (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )
  const links = [
    { href: '/admin/control-room', label: 'Control Room', icon: <LayoutGrid size={16} /> },
    { href: '/admin/roster', label: 'Roster & classes', icon: <GraduationCap size={16} /> },
    { href: '/admin/analytics', label: 'Mastery analytics', icon: <BarChart3 size={16} /> },
  ]
  return (
    <div className="space-y-5">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>On your plate</div>
      <div className="grid grid-cols-2 gap-3">
        {stat('Your classes', s.classes, 'var(--primary)', <BookOpen size={18} />)}
        {stat('Your students', s.students, 'var(--primary)', <Users size={18} />)}
        {stat('Needs grading', s.needsGrading, s.needsGrading > 0 ? 'var(--reward)' : 'var(--muted-foreground)', <CheckCircle size={18} />)}
        {stat('Ratings this week', s.ratingsThisWeek, 'var(--success)', <TrendingUp size={18} />)}
      </div>
      {s.aged > 0 && (
        <div className="flex items-center gap-2 text-sm rounded-lg p-3" style={{ background: 'color-mix(in oklch, var(--reward) 16%, transparent)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--reward)' }} />
          <span>{s.aged} student{s.aged === 1 ? '' : 's'} have work waiting 48h+.</span>
        </div>
      )}
      <div className="space-y-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-transform hover:translate-x-0.5"
            style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--primary)' }}>{l.icon}</span>{l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Student: real learning progress (no mock data)
// ---------------------------------------------------------------------------
function StudentView({
  stats, lessonProgress, gameScores,
}: {
  stats: { totalGames: number; averageScore: number; perfectGames: number; totalGameTime: number; lessonsCompleted: number; totalLessonTime: number }
  lessonProgress: LessonProgress[]
  gameScores: GameScore[]
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="text-sm font-medium flex items-center gap-2 mb-3"><BarChart3 className="h-4 w-4" /> Quick stats</div>
        <div className="grid grid-cols-2 gap-4">
          <div><div className="text-2xl font-bold">{stats.lessonsCompleted}</div><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Lessons completed</div></div>
          <div><div className="text-2xl font-bold">{stats.totalGames}</div><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Games played</div></div>
          <div><div className="text-2xl font-bold">{stats.averageScore}%</div><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Avg game score</div></div>
          <div><div className="text-2xl font-bold">{stats.perfectGames}</div><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Perfect games</div></div>
        </div>
      </div>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lessons"><BookOpen className="h-4 w-4 mr-2" /> Lessons</TabsTrigger>
          <TabsTrigger value="games"><Trophy className="h-4 w-4 mr-2" /> Games</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-3 mt-4">
          {lessonProgress.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No lessons started yet</p>
            </div>
          ) : lessonProgress.map((lesson) => (
            <div key={lesson.id} className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-sm">{lesson.lesson_slug}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={lesson.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{lesson.status}</Badge>
                    {lesson.status === 'completed' && <CheckCircle className="h-3 w-3" style={{ color: 'var(--success)' }} />}
                  </div>
                </div>
                <div className="text-right text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <Clock className="h-3 w-3 inline mr-1" />{Math.round(lesson.time_spent / 60)}min
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{lesson.progress_percentage}%</span></div>
                  <Progress value={lesson.progress_percentage} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1"><Target className="h-3 w-3" style={{ color: 'var(--primary)' }} /> {lesson.objectives_completed}/{lesson.objectives_total} objectives</div>
                  <div className="flex items-center gap-1"><PlayCircle className="h-3 w-3" style={{ color: 'var(--primary)' }} /> {lesson.videos_watched}/{lesson.videos_total} videos</div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="games" className="space-y-3 mt-4">
          {gameScores.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No games played yet</p>
            </div>
          ) : gameScores.map((game) => (
            <div key={game.id} className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-sm capitalize">{game.game_type.replace('-', ' ')}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={game.difficulty === 'hard' ? 'destructive' : 'secondary'} className="text-xs">{game.difficulty}</Badge>
                    {game.perfect_game && <Badge className="text-xs"><Award className="h-3 w-3 mr-1" /> Perfect!</Badge>}
                  </div>
                </div>
                <div className="text-right"><div className="text-lg font-bold">{game.score}</div><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>/ {game.max_score} pts</div></div>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <div className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {game.accuracy?.toFixed(0)}% accuracy</div>
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {game.time_spent}s</div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'color-mix(in oklch, var(--primary) 16%, transparent)' }}>
            <TrendingUp className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div className="font-semibold text-sm">Total learning time</div>
            <div className="text-2xl font-bold">{stats.totalLessonTime + stats.totalGameTime} min</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{stats.totalLessonTime}min lessons · {stats.totalGameTime}min games</div>
          </div>
        </div>
      </div>
    </div>
  )
}
