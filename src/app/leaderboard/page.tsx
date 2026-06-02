"use client"

import { useState, useEffect } from 'react'
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
  Swords
} from 'lucide-react'
import Link from 'next/link'
import StreakTracker from '@/components/gamification/StreakTracker'

interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  email: string
  image: string | null
  total_points: number
  activities: {
    games: number
    lessons: number
    assignments: number
  }
  is_current_user: boolean
  streak?: number
  streak_longest?: number
  streak_total?: number
  use_custom_avatar?: boolean
  avatar_traits?: AvatarTraits | null
  avatar_equipped?: EquippedItems
  avatar_items?: AvatarItem[]
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
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
          setLeaderboard(data)
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-muted-foreground font-bold">#{rank}</span>
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30'
    return ''
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Sign In to View Leaderboard</CardTitle>
            <CardDescription>
              See where you rank among your classmates!
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
            Compete with your classmates and earn points
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

      {/* Current User Stats Banner */}
      {currentUserEntry && (
        <Card className="max-w-lg bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LeaderboardAvatar entry={currentUserEntry} size={48} />

                <div className="text-left">
                  <p className="font-semibold">Your Rank</p>
                  <p className="text-2xl font-bold text-primary">#{currentUserRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Points</p>
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
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top Performers
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
                    All Time
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
                  <p className="font-medium mb-2">No data yet</p>
                  <p className="text-sm">Start playing games and completing lessons to appear on the leaderboard!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                        entry.is_current_user ? 'bg-primary/5 border-primary/20' : ''
                      } ${getRankStyle(entry.rank)}`}
                    >
                      {/* Rank */}
                      <div className="w-10 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar */}
                      <LeaderboardAvatar entry={entry} size={40} />


                      {/* Name & Activities */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${entry.is_current_user ? 'text-primary' : ''}`}>
                            {entry.name}
                          </span>
                          {entry.is_current_user && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Gamepad2 className="h-3 w-3" />
                            {entry.activities.games} games
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {entry.activities.lessons} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {entry.activities.assignments} assignments
                          </span>
                          {(entry.streak ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-reward font-medium">
                              <Flame className="h-3 w-3" />
                              {entry.streak}-day streak
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.total_points.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Streak Tracker — real data for the current student */}
          <StreakTracker
            currentStreak={currentUserEntry?.streak ?? 0}
            longestStreak={currentUserEntry?.streak_longest ?? 0}
            totalDays={currentUserEntry?.streak_total ?? 0}
          />
        </div>
      </div>

      {/* How to Earn Points */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Vocabulary Games</h4>
                <p className="text-xs text-muted-foreground">Games earn a small capped bonus — learning pays the most</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Complete Lessons</h4>
                <p className="text-xs text-muted-foreground">1 point per % progress + video question bonus</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Submit Assignments</h4>
                <p className="text-xs text-muted-foreground">Graded work earns points (up to 40 each)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Daily Challenges</h4>
                <p className="text-xs text-muted-foreground">Complete challenges for bonus points</p>
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
  const showMii = entry.use_custom_avatar && entry.avatar_traits
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

