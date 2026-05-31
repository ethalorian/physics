"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Trophy, BookOpen, Zap, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  user_name: string
  activity_type: 'game' | 'lesson' | 'achievement'
  description: string
  points?: number
  timestamp: string
}

interface RecentActivityFeedProps {
  activities: ActivityItem[]
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'game':
        return <Trophy className="h-4 w-4 text-reward" />
      case 'lesson':
        return <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'achievement':
        return <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card className="shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-[600ms] flex flex-col min-h-[300px] max-h-[500px]">
      <CardHeader className="bg-primary text-primary-foreground p-4 border-b">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold">Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto bg-card flex-1 min-h-0">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No recent activity</p>
          </div>
        ) : (
          <div>
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="px-4 py-3 border-b hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs">
                      <span className="font-semibold">{activity.user_name}</span>
                      {' '}
                      <span className="text-muted-foreground">{activity.description}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {activity.points && activity.points > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{activity.points}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
