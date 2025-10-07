"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Trophy, 
  BookOpen, 
  Target, 
  TrendingUp,
  Clock,
  Award,
  CheckCircle,
  PlayCircle,
  BarChart3,
  LogOut
} from 'lucide-react'
import { getUserRole } from '@/lib/permissions'
import StreakTracker from '@/components/gamification/StreakTracker'
import RecentActivityFeed from '@/components/gamification/RecentActivityFeed'
import DailyChallenge from '@/components/gamification/DailyChallenge'
import TrendingLeaders from '@/components/gamification/TrendingLeaders'

interface GameScore {
  id: string
  game_type: string
  score: number
  max_score: number
  accuracy: number
  time_spent: number
  difficulty: string
  completed_at: string
  perfect_game: boolean
}

interface LessonProgress {
  id: string
  lesson_id: string
  lesson_slug: string
  status: string
  progress_percentage: number
  objectives_completed: number
  objectives_total: number
  videos_watched: number
  videos_total: number
  video_questions_answered: number
  video_questions_correct: number
  video_questions_total: number
  time_spent: number
  completed_at: string | null
}

interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  email: string
  image?: string | null
  total_points: number
  activities: {
    games: number
    lessons: number
    assignments: number
  }
  is_current_user: boolean
}

export default function UserContextSheet({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [gameScores, setGameScores] = useState<GameScore[]>([])
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const userRole = getUserRole(session?.user?.email)

  const handleStartChallenge = () => {
    setOpen(false)
    router.push('/vocabulary')
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open && session?.user?.id) {
      fetchUserData()
    }
  }, [open, session?.user?.id])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Fetch game scores
      try {
        const scoresRes = await fetch('/api/student-progress/game-scores')
        if (scoresRes.ok) {
          const scores = await scoresRes.json()
          setGameScores(scores)
        } else {
          console.log('Game scores table may not exist yet - run migration')
        }
      } catch (err) {
        console.log('Game scores API error - tables may not exist')
      }

      // Fetch lesson progress
      try {
        const lessonsRes = await fetch('/api/student-progress/lessons')
        if (lessonsRes.ok) {
          const lessons = await lessonsRes.json()
          setLessonProgress(lessons)
        } else {
          console.log('Lesson progress table may not exist yet - run migration')
        }
      } catch (err) {
        console.log('Lesson progress API error - tables may not exist')
      }

      // Fetch leaderboard
      try {
        const leaderboardRes = await fetch('/api/leaderboard?limit=10')
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json()
          setLeaderboard(leaderboardData)
        } else {
          console.log('Leaderboard API error - tables may not exist yet')
        }
      } catch (err) {
        console.log('Leaderboard API error - tables may not exist')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const stats = {
    totalGames: gameScores.length,
    averageScore: gameScores.length > 0 
      ? Math.round(gameScores.reduce((sum, g) => sum + (g.score / g.max_score * 100), 0) / gameScores.length)
      : 0,
    perfectGames: gameScores.filter(g => g.perfect_game).length,
    totalGameTime: Math.round(gameScores.reduce((sum, g) => sum + (g.time_spent || 0), 0) / 60), // minutes
    lessonsInProgress: lessonProgress.filter(l => l.status === 'in_progress').length,
    lessonsCompleted: lessonProgress.filter(l => l.status === 'completed').length,
    totalLessonTime: Math.round(lessonProgress.reduce((sum, l) => sum + (l.time_spent || 0), 0) / 60), // minutes
    averageLessonCompletion: lessonProgress.length > 0
      ? Math.round(lessonProgress.reduce((sum, l) => sum + l.progress_percentage, 0) / lessonProgress.length)
      : 0,
    videoQuestionsCorrect: lessonProgress.reduce((sum, l) => sum + (l.video_questions_correct || 0), 0),
    videoQuestionsTotal: lessonProgress.reduce((sum, l) => sum + (l.video_questions_total || 0), 0)
  }

  // Test: Always show some leaderboard data
  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : [
    { rank: 1, user_id: '1', name: 'Top Student', email: 'student1@example.com', image: null, total_points: 500, activities: { games: 5, lessons: 10, assignments: 3 }, is_current_user: false },
    { rank: 2, user_id: '2', name: 'Great Learner', email: 'student2@example.com', image: null, total_points: 450, activities: { games: 4, lessons: 9, assignments: 3 }, is_current_user: false },
    { rank: 3, user_id: session?.user?.id || '3', name: session?.user?.name || 'You', email: session?.user?.email || '', image: session?.user?.image, total_points: 0, activities: { games: 0, lessons: 0, assignments: 0 }, is_current_user: true },
  ]

  // Mock data for gamification
  const mockStreak = { currentStreak: 0, longestStreak: 0, totalDays: 0 }
  const mockActivities: any[] = []
  const mockChallenge = {
    id: '1',
    title: 'Complete 3 Games Today',
    description: 'Play any 3 vocabulary games to earn bonus points',
    type: 'games' as const,
    target: 3,
    current: 0,
    points_reward: 50,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
  const mockTrending = [
    { rank: 1, name: 'Rising Star', points_gained: 150, trend: 'up' as const, current_rank: 2, previous_rank: 5 },
    { rank: 2, name: 'Quick Learner', points_gained: 120, trend: 'up' as const, current_rank: 4, previous_rank: 8 },
  ]

  // Gamification Grid - Responsive grid layout filling the background
  const gamificationElement = open && mounted ? (
    <div 
      className="fixed top-0 left-0 bottom-0 right-0 sm:right-[576px] pointer-events-auto overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 animate-in fade-in-0 duration-700 ease-out"
      style={{ 
        zIndex: 9998,
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Responsive Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pb-24 items-start">
        {/* Row 1: Leaderboard Card */}
        <Card className="shadow-lg overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-75 fill-mode-both min-h-[400px] max-h-[600px]">
          <CardHeader className="bg-accent text-accent-foreground p-4 flex-shrink-0">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span className="font-semibold">Leaderboard</span>
              </div>
              <Badge variant="secondary" className="text-xs">Top 10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 bg-card min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div>
                {displayLeaderboard.map((entry) => (
                  <div 
                    key={entry.user_id}
                    className={`px-4 py-3 border-b transition-all ${
                      entry.is_current_user 
                        ? 'bg-primary/10 border-l-4 border-l-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        entry.rank === 1 
                          ? 'bg-yellow-400 text-yellow-900' 
                          : entry.rank === 2 
                          ? 'bg-gray-300 text-gray-800'
                          : entry.rank === 3
                          ? 'bg-orange-400 text-orange-900'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {entry.rank <= 3 ? (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉') : entry.rank}
                      </div>

                      {/* Avatar */}
                      {entry.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={entry.image} 
                          alt={entry.name}
                          className="flex-shrink-0 w-10 h-10 rounded-full object-cover ring-2 ring-border"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-accent-foreground font-bold text-sm ring-2 ring-border">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold truncate text-sm ${
                          entry.is_current_user ? 'text-primary' : 'text-foreground'
                        }`}>
                          {entry.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {entry.activities.games}G · {entry.activities.lessons}L · {entry.activities.assignments}A
                        </div>
                      </div>

                      {/* Points */}
                      <div className={`text-right font-bold ${
                        entry.rank === 1 ? 'text-yellow-500 text-xl' :
                        entry.rank === 2 ? 'text-gray-500 text-lg' :
                        entry.rank === 3 ? 'text-orange-500 text-lg' :
                        'text-foreground text-base'
                      }`}>
                        {entry.total_points}
                        <div className="text-[10px] text-muted-foreground font-normal">pts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak Tracker */}
        <StreakTracker 
          currentStreak={mockStreak.currentStreak}
          longestStreak={mockStreak.longestStreak}
          totalDays={mockStreak.totalDays}
        />

        {/* Daily Challenge */}
        <DailyChallenge challenge={mockChallenge} onStart={handleStartChallenge} />

        {/* Trending This Week */}
        <TrendingLeaders leaders={mockTrending} />

        {/* Recent Activity */}
        <RecentActivityFeed activities={mockActivities} />
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Render gamification grid via Portal to document.body */}
      {mounted && typeof window !== 'undefined' && gamificationElement && createPortal(
        gamificationElement,
        document.body
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>

        <SheetContent 
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-0 z-[9999] pointer-events-auto"
        onInteractOutside={() => setOpen(false)}
      >
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-blue-50 to-purple-50 border-b p-6 shadow-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'}
                  className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-white"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white text-white font-bold text-xl">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1">
                <div className="text-lg font-bold">{session?.user?.name || 'User'}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {session?.user?.email}
                </div>
                <Badge variant={userRole === 'student' ? 'default' : 'secondary'} className="mt-2">
                  {userRole}
                </Badge>
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">
              View your complete learning progress, game scores, and statistics
            </SheetDescription>
          </SheetHeader>
          
          {/* Mobile Swipe Indicator */}
          <div className="flex justify-center mt-4 sm:hidden">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
            {/* Overview Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stats.lessonsCompleted}</div>
                  <div className="text-xs text-muted-foreground">Lessons Completed</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stats.totalGames}</div>
                  <div className="text-xs text-muted-foreground">Games Played</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stats.averageScore}%</div>
                  <div className="text-xs text-muted-foreground">Avg Game Score</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stats.perfectGames}</div>
                  <div className="text-xs text-muted-foreground">Perfect Games</div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Tabs */}
            <Tabs defaultValue="lessons" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lessons">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Lessons
                </TabsTrigger>
                <TabsTrigger value="games">
                  <Trophy className="h-4 w-4 mr-2" />
                  Games
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lessons" className="space-y-3 mt-4">
                {lessonProgress.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No lessons started yet</p>
                  </div>
                ) : (
                  lessonProgress.map((lesson) => (
                    <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{lesson.lesson_slug}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={
                                lesson.status === 'completed' ? 'default' : 'secondary'
                              } className="text-xs">
                                {lesson.status}
                              </Badge>
                              {lesson.status === 'completed' && (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {Math.round(lesson.time_spent / 60)}min
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{lesson.progress_percentage}%</span>
                            </div>
                            <Progress value={lesson.progress_percentage} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-blue-600" />
                              <span>{lesson.objectives_completed}/{lesson.objectives_total} objectives</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <PlayCircle className="h-3 w-3 text-purple-600" />
                              <span>{lesson.videos_watched}/{lesson.videos_total} videos</span>
                            </div>
                          </div>

                          {lesson.video_questions_total > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Video Questions: {lesson.video_questions_correct}/{lesson.video_questions_total} correct
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="games" className="space-y-3 mt-4">
                {gameScores.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No games played yet</p>
                  </div>
                ) : (
                  gameScores.map((game) => (
                    <Card key={game.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm capitalize">
                              {game.game_type.replace('-', ' ')}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={game.difficulty === 'hard' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {game.difficulty}
                              </Badge>
                              {game.perfect_game && (
                                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                  <Award className="h-3 w-3 mr-1" />
                                  Perfect!
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{game.score}</div>
                            <div className="text-xs text-muted-foreground">
                              / {game.max_score} pts
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {game.accuracy?.toFixed(0)}% accuracy
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {game.time_spent}s
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Total Learning Time</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {stats.totalLessonTime + stats.totalGameTime} min
                    </div>
                    <div className="text-xs text-blue-700">
                      {stats.totalLessonTime}min lessons • {stats.totalGameTime}min games
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sign Out Button */}
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              size="lg"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            </div>
          )}
        </div>
        {/* End Scrollable Content */}
      </SheetContent>
    </Sheet>
    </>
  )
}
