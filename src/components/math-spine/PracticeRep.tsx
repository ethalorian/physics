'use client'

/**
 * PracticeRep — unlimited extra reps after the daily warm-up (decisions 7–8).
 *
 * Self-checked only: type an answer, get an instant verdict. Correct reps earn
 * a token point (capped per day, server-enforced); none of it writes mastery
 * records — your teacher's rating on the daily warm-up is what moves the
 * ladder. That framing is stated in the UI so the two loops never blur.
 */
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'

interface PracticeItem {
  spiralItemId: string
  competencyCode: string
  competencyStatement: string
  prompt: string
  /** present on randomized items — echoed back so the server checks the same numbers */
  templateSeed?: string | null
}

type Verdict = 'match' | 'mismatch' | 'unknown'

export default function PracticeRep() {
  const [item, setItem] = useState<PracticeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [checking, setChecking] = useState(false)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [pointsToday, setPointsToday] = useState(0)
  const [dailyCap, setDailyCap] = useState(3)
  const [lastAward, setLastAward] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setVerdict(null)
    setAnswer('')
    setLastAward(0)
    fetch('/api/math-spine/practice')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setItem(d?.item ?? null)
        if (d) {
          setPointsToday(d.pointsToday ?? 0)
          setDailyCap(d.dailyCap ?? 3)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function check() {
    if (!item || !answer.trim() || checking) return
    setChecking(true)
    try {
      const res = await fetch('/api/math-spine/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spiral_item_id: item.spiralItemId, answer, template_seed: item.templateSeed ?? undefined }),
      })
      const d = await res.json()
      if (res.ok) {
        setVerdict(d.result as Verdict)
        setPointsToday(d.pointsToday ?? pointsToday)
        setLastAward(d.pointsAwarded ?? 0)
      }
    } finally {
      setChecking(false)
    }
  }

  if (loading) return null
  if (!item) return null

  return (
    <Card className="apple-card">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Dumbbell className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <CardTitle className="text-foreground text-base">Keep practicing (optional)</CardTitle>
          <span className="text-[11px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground tabular-nums ml-auto">
            {item.competencyCode}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Instant check, as many reps as you want. Bonus points: {pointsToday}/{dailyCap} today.
          Practice doesn&apos;t change your ladder — your teacher&apos;s rating does.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium text-foreground">{item.prompt}</p>
        {verdict === null ? (
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') check() }}
              placeholder="Your answer, with units"
              aria-label="practice answer"
            />
            <Button size="sm" className="rounded-full" disabled={checking || !answer.trim()} onClick={check}>
              {checking ? 'Checking…' : 'Check'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {verdict === 'match' && (
              <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Correct!{lastAward > 0 ? ` +${lastAward} point` : pointsToday >= dailyCap ? ' (daily bonus maxed — reps still count for you)' : ''}
              </p>
            )}
            {verdict === 'mismatch' && (
              <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--viz-down)' }}>
                <XCircle className="h-4 w-4" />
                Not quite — re-read the mini-lesson above and try another.
              </p>
            )}
            {verdict === 'unknown' && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                Can&apos;t auto-check that one — try another.
              </p>
            )}
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 text-muted-foreground" onClick={load}>
              Next problem →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
