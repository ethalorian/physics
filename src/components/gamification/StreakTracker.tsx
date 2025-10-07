"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Calendar, TrendingUp } from 'lucide-react'

interface StreakTrackerProps {
  currentStreak: number
  longestStreak: number
  totalDays: number
}

export default function StreakTracker({ 
  currentStreak, 
  longestStreak, 
  totalDays 
}: StreakTrackerProps) {
  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    if (streak >= 3) return '⚡'
    return '✨'
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'from-red-500 to-orange-600'
    if (streak >= 14) return 'from-orange-500 to-yellow-500'
    if (streak >= 7) return 'from-yellow-500 to-amber-500'
    return 'from-blue-500 to-purple-500'
  }

  return (
    <Card className="shadow-lg overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-150 min-h-[400px]">
      <CardHeader className="bg-accent text-accent-foreground p-4 border-b">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-semibold">Learning Streak</span>
          </div>
          {currentStreak > 0 && (
            <Badge variant="secondary" className="text-lg px-3">
              {getStreakEmoji(currentStreak)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className={`text-6xl font-black bg-gradient-to-r ${getStreakColor(currentStreak)} bg-clip-text text-transparent`}>
            {currentStreak}
          </div>
          <div className="text-muted-foreground text-sm font-medium mt-2">
            {currentStreak === 1 ? 'day' : 'days'} in a row
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center border">
            <div className="text-muted-foreground text-[10px] uppercase mb-1">Best Streak</div>
            <div className="text-foreground font-bold text-xl">{longestStreak}</div>
            <div className="text-muted-foreground text-[10px]">days</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center border">
            <div className="text-muted-foreground text-[10px] uppercase mb-1">Total Days</div>
            <div className="text-foreground font-bold text-xl">{totalDays}</div>
            <div className="text-muted-foreground text-[10px]">active</div>
          </div>
        </div>

        {currentStreak === 0 && (
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-orange-600 dark:text-orange-400 text-xs text-center">
              Start your streak today! Complete any activity to begin.
            </p>
          </div>
        )}

        {currentStreak > 0 && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-xs text-center">
              Keep it up! Come back tomorrow to maintain your streak 🎯
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
