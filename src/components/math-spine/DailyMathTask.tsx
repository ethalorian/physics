'use client'

/**
 * DailyMathTask — the math-literacy spine's home on the daily dashboard.
 *
 * Important but not in the nav: a single warm-up to-do, chosen for the skill the
 * student most needs. The answer is SUBMITTED as evidence — it lands in the
 * teacher's control-room review queue, where it earns a Marzano fluency rating.
 * A self-check reveal stays available as a study aid. Also shows what the student
 * has earned and links to the full math-literacy view.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sigma, ArrowRight, Star, Eye, CheckCircle2 } from 'lucide-react'

interface DailyItem {
  spiralItemId: string
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
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/daily')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        setItem(d.item ?? null)
        setSnapshot(d.snapshot ?? null)
        setSubmitted(Boolean(d.alreadySubmitted))
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function submit() {
    if (!item || response.trim() === '') return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/math-spine/warmup-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competency_id: item.competencyId,
          spiral_item_id: item.spiralItemId,
          prompt: item.prompt,
          response,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Submit failed (${res.status})`)
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

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
                The math that carries every unit — answer it, and your teacher will rate your fluency.
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

            {submitted ? (
              <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Submitted — your teacher will review it and rate your fluency.
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Show your work and your answer…"
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" className="rounded-full" disabled={submitting || response.trim() === ''} onClick={submit}>
                    {submitting ? 'Submitting…' : 'Submit for review'}
                  </Button>
                  {item.answerKey &&
                    (revealed ? (
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium">Self-check:</span> {item.answerKey}
                      </span>
                    ) : (
                      <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => setRevealed(true)}>
                        <Eye className="h-4 w-4 mr-1.5" />
                        Self-check
                      </Button>
                    ))}
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
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
