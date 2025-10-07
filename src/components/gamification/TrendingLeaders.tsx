"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, ArrowUp } from 'lucide-react'

interface TrendingLeader {
  rank: number
  name: string
  points_gained: number
  trend: 'up' | 'down' | 'new'
  current_rank: number
  previous_rank?: number
}

interface TrendingLeadersProps {
  leaders: TrendingLeader[]
}

export default function TrendingLeaders({ leaders }: TrendingLeadersProps) {
  const getTrendIcon = (trend: string, rankChange?: number) => {
    if (trend === 'new') {
      return <span className="text-green-600 dark:text-green-400 text-xs font-medium">NEW</span>
    }
    if (trend === 'up' && rankChange) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" />
          <span className="text-[10px] font-bold">+{rankChange}</span>
        </div>
      )
    }
    if (trend === 'down' && rankChange) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-3 w-3" />
          <span className="text-[10px] font-bold">-{rankChange}</span>
        </div>
      )
    }
    return <span className="text-muted-foreground text-xs">—</span>
  }

  return (
    <Card className="shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-[450ms] flex flex-col min-h-[300px]">
      <CardHeader className="bg-secondary text-secondary-foreground p-4 border-b">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="font-semibold">Trending This Week</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 bg-card flex-1 overflow-y-auto min-h-0">
        {leaders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No trending data yet</p>
          </div>
        ) : (
          <div>
            {leaders.slice(0, 5).map((leader, index) => (
              <div 
                key={leader.rank}
                className="px-4 py-3 border-b hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-muted rounded-full flex items-center justify-center text-foreground font-bold text-xs border">
                    #{leader.current_rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-foreground text-sm font-semibold truncate">
                      {leader.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getTrendIcon(leader.trend, leader.previous_rank ? Math.abs(leader.current_rank - leader.previous_rank) : undefined)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-green-600 dark:text-green-400 font-bold text-sm">
                      +{leader.points_gained}
                    </div>
                    <div className="text-muted-foreground text-[10px]">this week</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
