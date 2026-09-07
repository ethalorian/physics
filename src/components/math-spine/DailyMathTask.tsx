'use client'

/**
 * DailyMathTask — the math-literacy spine's home on the daily dashboard/hub.
 *
 * A teaser card: today's warm-up (the skill the student most needs) plus a button
 * to its own screen, where the mini-lesson + GEWA solve block live. Shows
 * what the student has earned and whether today's warm-up is already submitted.
 */
import { useEffect, useRef, useState } from 'react'
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

export interface DailyMathStatus {
  hasItem: boolean
  submitted: boolean
}

export default function DailyMathTask({ onStatus }: { onStatus?: (s: DailyMathStatus) => void } = {}) {
  const [item, setItem] = useState<DailyItem | null>(null)
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const onStatusRef = useRef(onStatus)
  useEffect(() => { onStatusRef.current = onStatus }, [onStatus])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoading(true); setError(null)
    fetch('/api/math-spine/daily', { signal: controller.signal })
      .then(async r => {
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error || 'Could not load the warm-up. Please retry.')
        if (!d || typeof d !== 'object' || !('item' in d)) throw new Error('The warm-up response was incomplete. Please retry.')
        return d
      })
      .then(d => {
        if (!active) return
        setItem(d.item ?? null)
        setSnapshot(d.snapshot ?? null)
        setAlreadySubmitted(Boolean(d.alreadySubmitted))
        onStatusRef.current?.({ hasItem: Boolean(d.item), submitted: Boolean(d.alreadySubmitted) })
      })
      .catch(e => {
        if (active) setError(e instanceof Error && e.name === 'AbortError' ? 'The warm-up took too long to load. Please retry.' : e instanceof Error ? e.message : 'Could not load the warm-up. Please retry.')
      })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [retry])

  if (loading) return <div role="status" className="rounded-lg border bg-card p-4 text-sm">Loading today’s math question…</div>
  if (error) return <div className="space-y-3 rounded-lg border bg-card p-4"><p role="alert" className="text-sm">{error}</p><div className="flex flex-wrap gap-3"><Button onClick={() => setRetry(n => n + 1)}>Retry warm-up</Button><Link className="inline-flex min-h-11 items-center text-sm underline" href="/dashboard/math-spine/warmup">Open warm-up page</Link></div></div>

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
          {snapshot && <div className="hidden sm:flex items-center gap-3 text-right">
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
          </div>}
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
            <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">{item.prompt}</p>

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
