"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Target, Clock, Trophy, CheckCircle, Gamepad2 } from 'lucide-react'

interface DailyChallengeProps {
  challenge: {
    id: string
    title: string
    description: string
    type: 'games' | 'lessons' | 'points'
    target: number
    current: number
    points_reward: number
    expires_at: string
  }
  onStart?: () => void
}

export default function DailyChallenge({ challenge, onStart }: DailyChallengeProps) {
  const progress = (challenge.current / challenge.target) * 100
  const isComplete = challenge.current >= challenge.target
  const timeLeft = new Date(challenge.expires_at).getTime() - Date.now()
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))

  return (
    <Card className="shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-300 flex flex-col min-h-[300px]">
      <CardHeader className="bg-secondary text-secondary-foreground p-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="font-semibold">Daily Challenge</span>
          </div>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {hoursLeft}h left
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col justify-center">
        {isComplete ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="text-foreground font-bold text-lg mb-2">Challenge Complete!</div>
            <div className="text-muted-foreground text-sm mb-4">
              You earned <span className="text-success font-bold">+{challenge.points_reward} points</span>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              ✓ Completed
            </Badge>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-foreground font-semibold text-sm mb-2">
                {challenge.title}
              </div>
              <div className="text-muted-foreground text-xs">
                {challenge.description}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="font-semibold">{challenge.current}/{challenge.target}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-reward" />
                <span className="text-muted-foreground text-xs">Reward:</span>
              </div>
              <span className="text-foreground font-bold text-base">
                +{challenge.points_reward} pts
              </span>
            </div>

            <Button 
              onClick={onStart}
              className="w-full mt-4 shadow-md hover:shadow-lg transition-all"
            >
              <Gamepad2 /> Start Playing Now
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
