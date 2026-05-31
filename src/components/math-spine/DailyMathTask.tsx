'use client'

/**
 * DailyMathTask — the math-literacy spine's home on the daily dashboard.
 *
 * Important but not in the nav: a single warm-up to-do, chosen for the skill the
 * student most needs, with a snapshot of what they've earned and a link to the
 * full math-literacy view. Activates the spiral-item bank (Rohrer & Taylor
 * spacing) without adding a top-level destination.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sigma, ArrowRight, Star, Eye } from 'lucide-react'

interface DailyItem {
  competencyId: string
  competencyCode: string
  competencyStatement: string
  prompt: string
  answerKey?: string
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
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/daily')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        setItem(d.item ?? null)
        setSnapshot(d.snapshot ?? null)
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
                The math that carries every unit — a quick rep to start.
              </CardDescription>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <div className="text-lg font-bold tracking-tight text-foreground tabular-nums">
                {snapshot.mathPointsEarned}
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">pts earned</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" />
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
            <p className="text-sm font-medium text-foreground leading-relaxed">{item.prompt}</p>

            {item.answerKey && (
              <div>
                {revealed ? (
                  <div className="text-sm rounded-md px-3 py-2 bg-muted/60 text-foreground">
                    <span className="font-medium">Answer: </span>
                    {item.answerKey}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setRevealed(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Check your answer
                  </Button>
                )}
              </div>
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
