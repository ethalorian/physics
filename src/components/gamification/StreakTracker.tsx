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
  // Flame count scales with the streak — real icons, not emoji (audit 1.1).
  const streakFlames = (streak: number) => (streak >= 30 ? 3 : streak >= 14 ? 2 : 1)

  return (
    <Card className="overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-150 min-h-[400px]">
      <CardHeader className="bg-accent text-accent-foreground p-4 border-b">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-reward" />
            <span className="font-semibold">Learning Streak</span>
          </div>
          {currentStreak > 0 && (
            <Badge variant="secondary" className="px-2.5 gap-0.5 flex items-center">
              {Array.from({ length: streakFlames(currentStreak) }).map((_, i) => (
                <Flame key={i} className="h-3.5 w-3.5 text-reward" />
              ))}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-primary tabular-nums">
            {currentStreak}
          </div>
          <div className="text-muted-foreground text-sm font-medium mt-2">
            {currentStreak === 1 ? 'day' : 'days'} in a row
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center border">
            <div className="text-muted-foreground text-[11px] uppercase mb-1">Best Streak</div>
            <div className="text-foreground font-bold text-xl">{longestStreak}</div>
            <div className="text-muted-foreground text-[11px]">days</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center border">
            <div className="text-muted-foreground text-[11px] uppercase mb-1">Total Days</div>
            <div className="text-foreground font-bold text-xl">{totalDays}</div>
            <div className="text-muted-foreground text-[11px]">active</div>
          </div>
        </div>

        {currentStreak === 0 && (
          <div className="mt-4 p-3 bg-muted border border-border rounded-lg">
            <p className="text-muted-foreground text-xs text-center">
              Start your streak today! Complete any activity to begin.
            </p>
          </div>
        )}

        {currentStreak > 0 && (
          <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-success text-xs text-center">
              Keep it up! Come back tomorrow to maintain your streak.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
