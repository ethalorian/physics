'use client'

/**
 * DailyMathTask — the math-literacy spine's home on the daily dashboard/hub.
 *
 * A teaser card: today's warm-up (the skill the student most needs) plus a button
 * to its own screen, where the mini-lesson + GEWA/InkPad solve block live. Shows
 * what the student has earned and whether today's warm-up is already submitted.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sigma, ArrowRight, Star, CheckCircle2 } from 'lucide-react'

interface DailyItem {
  spiralItemId: string
  competencyId: string
  competencyCode: string
  competencyStatement: string
  prompt: string
  difficulty?: string
}

interface DailySnapshot {
  mathPointsEarned: number
  fluentCount: number
  total: number
}

export default function DailyMathTask() {
  const [item, setItem] = useState<DailyItem | null>(null)
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/daily')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        setItem(d.item ?? null)
        setSnapshot(d.snapshot ?? null)
        setAlreadySubmitted(Boolean(d.alreadySubmitted))
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading || !snapshot) return null

  return (
    <Card className="apple-card overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-muted/80">
              <Sigma className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-foreground">Today&apos;s Math Warm-Up</CardTitle>
              <CardDescription className="text-muted-foreground">
                A quick rep on the math that carries every unit — your teacher rates your fluency.
              </CardDescription>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <div className="text-lg font-bold tracking-tight text-foreground tabular-nums">{snapshot.mathPointsEarned}</div>
              <p className="text-[11px] font-medium text-muted-foreground">pts earned</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-reward" />
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {snapshot.fluentCount}/{snapshot.total}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {item ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium rounded px-2 py-0.5 bg-muted text-muted-foreground tabular-nums">
                {item.competencyCode}
              </span>
              <span className="text-xs text-muted-foreground">{item.competencyStatement}</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">{item.prompt}</p>

            {alreadySubmitted ? (
              <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2 bg-success/10 text-success">
                <CheckCircle2 className="h-4 w-4" />
                Submitted — waiting for your teacher to review.
              </div>
            ) : (
              <Link href="/dashboard/math-spine/warmup">
                <Button className="rounded-full">
                  Start warm-up
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No warm-up available yet — check back soon.</p>
        )}

        <div className="mt-4 pt-3 border-t border-border">
          <Link href="/dashboard/math-spine">
            <Button variant="ghost" size="sm" className="rounded-full px-2 -ml-2 text-muted-foreground hover:text-foreground">
              See your math literacy
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
