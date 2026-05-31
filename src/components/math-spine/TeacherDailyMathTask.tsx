'use client'

/**
 * TeacherDailyMathTask — the teacher's daily to-do for the math spine.
 *
 * The teacher's job each day: review student outputs and help students name
 * their fluency by giving a Marzano 1-2-3 rating. This card nudges that work —
 * how many students still need a fresh rating, and which competency is least
 * covered (rate it next) — and links straight to the rating surface.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, ArrowRight } from 'lucide-react'

interface TeacherDaily {
  rosterSize: number
  awaitingRating: number
  leastCovered: { code: string; statement: string; ratedCount: number } | null
}

export default function TeacherDailyMathTask() {
  const [data, setData] = useState<TeacherDaily | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/teacher-daily')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading || !data || data.rosterSize === 0) return null

  const allCaughtUp = data.awaitingRating === 0

  return (
    <Card className="apple-card overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-muted/80">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-foreground">Rate Today&apos;s Math Fluency</CardTitle>
            <CardDescription className="text-muted-foreground">
              Review student work and help each student name their fluency — a Marzano 1-2-3 on the spine.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {allCaughtUp ? '✓' : data.awaitingRating}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {allCaughtUp
                ? 'Everyone rated this week'
                : `of ${data.rosterSize} need a fresh rating`}
            </p>
          </div>
          {data.leastCovered && (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium rounded px-2 py-0.5 bg-muted text-muted-foreground tabular-nums">
                  {data.leastCovered.code}
                </span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {data.leastCovered.ratedCount}/{data.rosterSize} rated
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-md leading-snug">
                Least covered — rate next: {data.leastCovered.statement}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <Link href="/admin/math-spine">
            <Button variant="ghost" size="sm" className="rounded-full px-2 -ml-2 text-muted-foreground hover:text-foreground">
              Record fluency ratings
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
