'use client'

/**
 * Daily math warm-up — its own screen.
 *
 * Three parts: (1) the prompt, (2) a mini-lesson with an explicit diagram showing
 * HOW to do this kind of problem, and (3) the work surface — an InkPad (always,
 * so students can show any kind of work by hand) plus a final answer, with an
 * optional Given/Equation set-up for solve problems. Submitting sends the answer
 * to the teacher's control-room review queue.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Lightbulb } from 'lucide-react'
import WarmupAnswer, { type WarmupAnswerValue } from '@/components/math-spine/WarmupAnswer'
import MathSpineDiagram from '@/components/math-spine/MathSpineDiagram'
import { miniLessonForCode, type MiniLesson } from '@/lib/math-spine-lessons'

interface DailyItem {
  spiralItemId: string
  competencyId: string
  competencyCode: string
  competencyStatement: string
  prompt: string
  answerKey?: string
  difficulty?: string
  miniLesson?: MiniLesson | null
}

function strandForCode(code: string | undefined): string {
  const p = (code ?? '').slice(0, 2)
  if (p === 'PR') return 'proportional-reasoning'
  if (p === 'QE') return 'quantities-estimation'
  if (p === 'SM') return 'symbolic-manipulation'
  if (p === 'GV') return 'graphs-vectors'
  return ''
}

export default function WarmupPage() {
  const [item, setItem] = useState<DailyItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [ans, setAns] = useState<WarmupAnswerValue | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/daily')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        setItem(d.item ?? null)
        setAlreadySubmitted(Boolean(d.alreadySubmitted))
        setLoading(false)
      })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const hasWork = !!(ans && ((ans.answer && ans.answer.trim()) || (ans.workStrokes && ans.workStrokes.length > 0)))

  async function submit() {
    if (!item || !hasWork) return
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
          response_json: ans,
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

  const lesson: MiniLesson | null = item ? (item.miniLesson ?? miniLessonForCode(item.competencyCode)) : null
  const done = submitted || alreadySubmitted

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Link href="/home" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Link>

      {loading && <p className="text-sm text-muted-foreground">Loading your warm-up…</p>}
      {!loading && !item && <p className="text-sm text-muted-foreground">No warm-up available right now — check back soon.</p>}

      {!loading && item && (
        <>
          <Card className="apple-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium rounded px-2 py-0.5 bg-muted text-muted-foreground tabular-nums">{item.competencyCode}</span>
                <CardTitle className="text-foreground text-base">Today&apos;s Math Warm-Up</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.competencyStatement}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-foreground leading-relaxed">{item.prompt}</p>
            </CardContent>
          </Card>

          {/* Mini-lesson with an explicit diagram */}
          {lesson && (
            <Card className="apple-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-foreground text-base">How to do it: {lesson.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <MathSpineDiagram code={item.competencyCode} />
                <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground mt-2">
                  {lesson.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                {lesson.tip && <p className="text-xs text-muted-foreground mt-3 rounded-md bg-muted/60 px-3 py-2">💡 {lesson.tip}</p>}
              </CardContent>
            </Card>
          )}

          {/* Work surface */}
          {done ? (
            <Card className="apple-card">
              <CardContent className="py-6">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  Submitted — your teacher will review your work and rate your fluency.
                </div>
                <Link href="/dashboard/math-spine">
                  <Button variant="ghost" size="sm" className="rounded-full mt-3 -ml-2 text-muted-foreground">See your math literacy →</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Your work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <WarmupAnswer strand={strandForCode(item.competencyCode)} onChange={setAns} />
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button disabled={submitting || !hasWork} onClick={submit} className="rounded-full">
                    {submitting ? 'Submitting…' : 'Submit for review'}
                  </Button>
                  {!hasWork && <span className="text-xs text-muted-foreground">Show your work or enter an answer first.</span>}
                  {error && <span className="text-xs text-red-600">{error}</span>}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
