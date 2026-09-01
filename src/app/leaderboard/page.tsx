"use client"

import { useState, useEffect, type CSSProperties } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EnrollmentGate from '@/components/EnrollmentGate'
import Avatar from '@/components/avatar/Avatar'
import AvatarGallery from '@/components/avatar/AvatarGallery'
import ChallengePanel from '@/components/gamification/ChallengePanel'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'
import { 
  Trophy, 
  Medal, 
  Target,
  TrendingUp,
  Flame,
  Crown,
  Star,
  Zap,
  Gamepad2,
  BookOpen,
  FileText,
  User,
  Heart,
  Swords,
  Joystick,
  Sigma,
  Dices,
  Gift
} from 'lucide-react'

// XP sources, in the order they appear on a row. Zero-XP sources are hidden,
// so a row reads "Arcade 150 · Spin 20" instead of three zero counters.
type XpSource = 'arcade' | 'math' | 'lessons' | 'games' | 'graded' | 'spin' | 'other'
const XP_SOURCES: { key: XpSource; label: string; Icon: typeof Zap }[] = [
  { key: 'arcade', label: 'Arcade', Icon: Joystick },
  { key: 'math', label: 'Math', Icon: Sigma },
  { key: 'lessons', label: 'Lessons', Icon: BookOpen },
  { key: 'games', label: 'Games', Icon: Gamepad2 },
  { key: 'graded', label: 'Graded work', Icon: FileText },
  { key: 'spin', label: 'Spin', Icon: Dices },
  { key: 'other', label: 'Bonus', Icon: Gift },
]
import Link from 'next/link'
import StreakTracker from '@/components/gamification/StreakTracker'
import XpGoalRing from '@/components/gamification/XpGoalRing'

// Stacked-bar colors per XP source — theme tokens so light/dark both work.
const SOURCE_COLOR: Record<XpSource, string> = {
  arcade: 'var(--primary)',
  math: 'var(--success)',
  lessons: 'var(--reward)',
  games: 'color-mix(in oklch, var(--primary) 55%, var(--success))',
  graded: 'color-mix(in oklch, var(--muted-foreground) 70%, var(--border))',
  spin: 'color-mix(in oklch, var(--reward) 55%, var(--primary))',
  other: 'var(--border)',
}

interface ClassStats { weeklyXp: number; activeStudents: number; mathXp: number; arcadeRuns: number; streaksAlive: number }
interface Spotlight { key: string; label: string; name: string; user_id: string; value: number; unit: string }

interface LeaderboardEntry {
  rank: number
  rank_delta?: number | null
  weekly_gain?: number
  user_id: string
  name: string
  email: string
  image: string | null
  total_points: number
  activities: {
    games: number
    lessons: number
    assignments: number
    arcade_runs?: number
    spins?: number
    math_grants?: number
  }
  /** XP contributed by each source — what the total is actually made of. */
  xp_by_source?: Partial<Record<XpSource, number>>
  is_current_user: boolean
  streak?: number
  streak_longest?: number
  streak_total?: number
  has_mii?: boolean
  avatar_traits?: AvatarTraits | null
  avatar_equipped?: EquippedItems
  avatar_items?: AvatarItem[]
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [classStats, setClassStats] = useState<ClassStats | null>(null)
  const [spotlights, setSpotlights] = useState<Spotlight[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'all-time' | 'week' | 'month'>('all-time')
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'rankings' | 'gallery' | 'duels'>('rankings')

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!session) return
      
      setLoading(true)
      try {
        const response = await fetch(`/api/leaderboard?period=${period}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          // Enriched shape { entries, classStats, spotlights }; tolerate the
          // old bare-array shape during rollout.
          if (Array.isArray(data)) setLeaderboard(data)
          else {
            setLeaderboard(data.entries ?? [])
            setClassStats(data.classStats ?? null)
            setSpotlights(data.spotlights ?? [])
          }
        } else {
          setError('Failed to load leaderboard')
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError('Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [session, period])

  // Find current user's rank
  const currentUserEntry = leaderboard.find(entry => entry.is_current_user)
  const currentUserRank = currentUserEntry?.rank

  // Rank tiers: gold is the only reward accent (#1); #2 and #3 stay on the neutral tokens.
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5" style={{ color: 'var(--reward)' }} />
    if (rank === 2) return <Medal className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />
    if (rank === 3) return <Medal className="h-5 w-5" style={{ color: 'color-mix(in oklch, var(--muted-foreground) 60%, var(--border))' }} />
    return <span className="text-muted-foreground font-bold">#{rank}</span>
  }

  const getRankStyle = (rank: number): CSSProperties | undefined => {
    if (rank === 1) return {
      background: 'color-mix(in oklch, var(--reward) 10%, var(--card))',
      borderColor: 'color-mix(in oklch, var(--reward) 45%, var(--border))',
    }
    if (rank === 2) return {
      background: 'color-mix(in oklch, var(--muted-foreground) 6%, var(--card))',
      borderColor: 'var(--border)',
    }
    if (rank === 3) return {
      background: 'color-mix(in oklch, var(--muted-foreground) 3%, var(--card))',
      borderColor: 'var(--border)',
    }
    return undefined
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Sign in to see the leaderboard</CardTitle>
            <CardDescription>
              See where you rank among your classmates.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <EnrollmentGate>
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header - consistent with other pages */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Compete with your classmates and earn XP
          </p>
        </div>
      </div>

      {/* View toggle — the rankings vs the avatar wall */}
      <div className="inline-flex rounded-full bg-muted p-1 gap-1">
        <button onClick={() => setView('rankings')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'rankings' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Rankings</button>
        <button onClick={() => setView('gallery')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'gallery' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Avatar wall</button>
        <button onClick={() => setView('duels')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === 'duels' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Duels</button>
      </div>

      {view === 'gallery' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-destructive" /> Avatar wall</CardTitle>
            <CardDescription>Everyone&apos;s Mii. Tap a heart to show some love — there&apos;s no ranking here, just appreciation.</CardDescription>
          </CardHeader>
          <CardContent><AvatarGallery /></CardContent>
        </Card>
      ) : view === 'duels' ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5 text-primary" /> Duels</CardTitle>
            <CardDescription>Friendly head-to-head — challenge a classmate to earn the most XP over 3 days.</CardDescription>
          </CardHeader>
          <CardContent><ChallengePanel /></CardContent>
        </Card>
      ) : (
      <>

      {/* Class stat band — the whole class's week. Every student contributed
          to at least one of these numbers, so everyone has a reason to look. */}
      {classStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Class XP this week', value: classStats.weeklyXp.toLocaleString(), Icon: Zap, tint: 'var(--primary)' },
            { label: 'Students active', value: String(classStats.activeStudents), Icon: User, tint: 'var(--success)' },
            { label: 'Streaks alive', value: String(classStats.streaksAlive), Icon: Flame, tint: 'var(--reward)' },
            { label: 'Math XP this week', value: classStats.mathXp.toLocaleString(), Icon: Sigma, tint: 'var(--success)' },
            { label: 'Arcade runs', value: classStats.arcadeRuns.toLocaleString(), Icon: Joystick, tint: 'var(--primary)' },
          ].map((t) => (
            <div key={t.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="flex items-center gap-2 mb-1">
                <t.Icon className="h-4 w-4" style={{ color: t.tint }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{t.label}</span>
              </div>
              <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{t.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly spotlights — growth-based recognition, recomputed every week,
          so the same top-XP names don't win every category. */}
      {spotlights.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {spotlights.map((sp) => {
            const entry = leaderboard.find((e) => e.user_id === sp.user_id)
            const meta: Record<string, { Icon: typeof Zap; tint: string }> = {
              climber: { Icon: TrendingUp, tint: 'var(--success)' },
              math: { Icon: Sigma, tint: 'var(--primary)' },
              arcade: { Icon: Joystick, tint: 'var(--primary)' },
              streak: { Icon: Flame, tint: 'var(--reward)' },
            }
            const m = meta[sp.key] ?? { Icon: Star, tint: 'var(--reward)' }
            return (
              <div key={sp.key} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: `color-mix(in oklch, ${m.tint} 30%, var(--border))`, background: `color-mix(in oklch, ${m.tint} 6%, var(--card))` }}>
                {entry ? <LeaderboardAvatar entry={entry} size={44} /> : <m.Icon className="h-8 w-8" style={{ color: m.tint }} />}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: m.tint }}>
                    <m.Icon className="h-3.5 w-3.5" /> {sp.label}
                  </div>
                  <div className="font-bold truncate" style={{ color: 'var(--foreground)' }}>{sp.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}><b className="tabular-nums">{sp.value.toLocaleString()}</b> {sp.unit}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Current User Stats Banner */}
      {currentUserEntry && (
        <Card className="max-w-lg bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LeaderboardAvatar entry={currentUserEntry} size={48} />

                <div className="text-left">
                  <p className="font-semibold">Your rank</p>
                  <p className="text-2xl font-bold text-primary">#{currentUserRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold">{currentUserEntry.total_points.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" style={{ color: 'var(--reward)' }} />
                  Top performers
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={period === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={period === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('month')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={period === 'all-time' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('all-time')}
                  >
                    All time
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{error}</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">No rankings yet</p>
                  <p className="text-sm">Play games and complete lessons to earn XP — you&apos;ll show up here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => {
                    const isOpen = expanded === entry.user_id
                    const total = Math.max(1, XP_SOURCES.reduce((a, src) => a + (entry.xp_by_source?.[src.key] ?? 0), 0))
                    return (
                    <div key={entry.user_id} className="rounded-lg border overflow-hidden" style={getRankStyle(entry.rank) ?? { borderColor: 'var(--border)' }}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpanded(isOpen ? null : entry.user_id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(isOpen ? null : entry.user_id) } }}
                      className={`flex items-center gap-4 p-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                        entry.is_current_user ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Rank + movement */}
                      <div className="w-10 flex flex-col items-center gap-0.5">
                        {getRankIcon(entry.rank)}
                        {typeof entry.rank_delta === 'number' && entry.rank_delta !== 0 && (
                          <span className="text-[11px] font-bold tabular-nums" style={{ color: entry.rank_delta > 0 ? 'var(--success)' : 'var(--destructive)' }}>
                            {entry.rank_delta > 0 ? `▲${entry.rank_delta}` : `▼${Math.abs(entry.rank_delta)}`}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <LeaderboardAvatar entry={entry} size={40} />

                      {/* Name + XP-source bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${entry.is_current_user ? 'text-primary' : ''}`}>
                            {entry.name}
                          </span>
                          {entry.is_current_user && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                          {(entry.weekly_gain ?? 0) > 0 && (
                            <span className="text-xs font-semibold tabular-nums rounded-full px-2 py-0.5" style={{ background: 'color-mix(in oklch, var(--success) 12%, transparent)', color: 'var(--success)' }}>
                              +{entry.weekly_gain} this wk
                            </span>
                          )}
                          {(entry.streak ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: 'var(--reward)' }}>
                              <Flame className="h-3 w-3" />{entry.streak}
                            </span>
                          )}
                        </div>
                        {/* where the XP comes from, at a glance */}
                        <div className="flex rounded-full overflow-hidden mt-1.5" style={{ height: 7, background: 'var(--secondary)' }} title="Tap for the breakdown">
                          {XP_SOURCES.filter((src) => (entry.xp_by_source?.[src.key] ?? 0) > 0).map((src) => (
                            <span key={src.key} style={{ width: `${((entry.xp_by_source?.[src.key] ?? 0) / total) * 100}%`, background: SOURCE_COLOR[src.key] }} />
                          ))}
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right">
                        <div className="font-bold text-lg tabular-nums">{entry.total_points.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">XP</div>
                      </div>
                    </div>

                    {/* Expanded detail — the fun part: where it all came from */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1" style={{ borderTop: '0.5px solid var(--border)', background: 'color-mix(in oklch, var(--secondary) 25%, transparent)' }}>
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                          {XP_SOURCES.filter((src) => (entry.xp_by_source?.[src.key] ?? 0) > 0).map((src) => (
                            <div key={src.key} className="flex items-center gap-2 text-sm">
                              <span className="rounded-full shrink-0" style={{ width: 10, height: 10, background: SOURCE_COLOR[src.key] }} />
                              <src.Icon className="h-3.5 w-3.5" style={{ color: 'var(--muted-foreground)' }} />
                              <span style={{ color: 'var(--foreground)' }}>{src.label}</span>
                              <span className="ml-auto font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{entry.xp_by_source?.[src.key]}</span>
                              <span className="text-xs tabular-nums w-10 text-right" style={{ color: 'var(--muted-foreground)' }}>{Math.round(((entry.xp_by_source?.[src.key] ?? 0) / total) * 100)}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {(entry.activities.arcade_runs ?? 0) > 0 && <span>🕹 {entry.activities.arcade_runs} arcade runs</span>}
                          {(entry.activities.math_grants ?? 0) > 0 && <span>Σ {entry.activities.math_grants} math awards</span>}
                          {entry.activities.lessons > 0 && <span>📖 {entry.activities.lessons} lessons</span>}
                          {entry.activities.games > 0 && <span>🎮 {entry.activities.games} game plays</span>}
                          {(entry.activities.spins ?? 0) > 0 && <span>🎰 {entry.activities.spins} spins</span>}
                          {(entry.streak ?? 0) > 0 && <span>🔥 {entry.streak}-day streak</span>}
                        </div>
                      </div>
                    )}
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's XP goal — set by this student's teacher */}
          <XpGoalRing />
          {/* Streak Tracker — real data for the current student */}
          <StreakTracker
            currentStreak={currentUserEntry?.streak ?? 0}
            longestStreak={currentUserEntry?.streak_longest ?? 0}
            totalDays={currentUserEntry?.streak_total ?? 0}
          />
        </div>
      </div>

      {/* How to earn XP — flat tokenized tiles: indigo for learning, sage for graded work, gold for bonus reward */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            How to earn XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 rounded-lg" style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)' }}>
                <Gamepad2 className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Play vocabulary games</h4>
                <p className="text-xs text-muted-foreground">Games earn a small capped bonus — learning pays the most</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 rounded-lg" style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)' }}>
                <BookOpen className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Complete lessons</h4>
                <p className="text-xs text-muted-foreground">You earn XP as you read, plus a bonus for video questions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 rounded-lg" style={{ background: 'color-mix(in oklch, var(--success) 12%, transparent)' }}>
                <Joystick className="h-5 w-5" style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Math gym &amp; warm-ups</h4>
                <p className="text-xs text-muted-foreground">Arcade runs pay up to 25 XP each (75/day); mastery milestones pay more</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 rounded-lg" style={{ background: 'color-mix(in oklch, var(--reward) 14%, transparent)' }}>
                <Target className="h-5 w-5" style={{ color: 'var(--reward)' }} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Daily spin &amp; challenges</h4>
                <p className="text-xs text-muted-foreground">One spin a day, plus bonus XP for duels, reviews, and escape rooms</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
    </EnrollmentGate>
  )
}

// Per-entry avatar with the priority order students expect:
// (1) the Mii at medium crop if they opted in and finished setup,
// (2) their Google profile photo,
// (3) a User icon fallback.
function LeaderboardAvatar({ entry, size }: { entry: LeaderboardEntry; size: number }) {
  const showMii = entry.has_mii && entry.avatar_traits
  return (
    <div
      className="rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {showMii ? (
        <Avatar
          traits={entry.avatar_traits}
          equipped={entry.avatar_equipped}
          items={entry.avatar_items}
          size={size}
          crop="medium"
          className="w-full h-full"
        />
      ) : entry.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <User className="text-muted-foreground" style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </div>
  )
}

