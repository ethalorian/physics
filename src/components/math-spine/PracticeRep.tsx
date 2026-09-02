'use client'

/**
 * PracticeRep — unlimited extra reps after the daily warm-up (decisions 7–8).
 *
 * Same board, same tools, new numbers. Self-checked only: work it on the board,
 * type an answer, get an instant verdict — and on a ✗, the same descriptive
 * feedback the daily rep gives. Correct reps earn a bonus point (capped per
 * day, server-enforced). Bonus points are the REWARD layer; none of this writes
 * mastery records — the teacher's rating on the daily warm-up moves the ladder.
 */
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, HelpCircle, Dumbbell } from 'lucide-react'
import MathCanvas, { type CanvasText } from './MathCanvas'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import { useTranslator } from '@/lib/math-translate-store'

interface PracticeItem {
  spiralItemId: string
  competencyCode: string
  competencyStatement: string
  prompt: string
  needsGraph?: boolean
  /** present on randomized items — echoed back so the server checks the same numbers */
  templateSeed?: string | null
}

type Verdict = 'match' | 'mismatch' | 'unknown'
interface SlipFeedback { tag: string | null; label: string | null; message: string; source: 'slip' | 'fallback' }

const LABEL = 'text-[11px] font-bold uppercase tracking-widest'

export default function PracticeRep({ needsGraph = false, lang = '' }: { needsGraph?: boolean; lang?: string }) {
  const t = useTranslator(lang)
  const [item, setItem] = useState<PracticeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [board, setBoard] = useState<{ strokes: Stroke[]; texts: CanvasText[] }>({ strokes: [], texts: [] })
  const [boardKey, setBoardKey] = useState(0) // remount the canvas for a fresh board
  const [checking, setChecking] = useState(false)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [feedback, setFeedback] = useState<SlipFeedback | null>(null)
  const [pointsToday, setPointsToday] = useState(0)
  const [dailyCap, setDailyCap] = useState(3)
  const [lastAward, setLastAward] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setVerdict(null)
    setFeedback(null)
    setAnswer('')
    setLastAward(0)
    setBoard({ strokes: [], texts: [] })
    setBoardKey((k) => k + 1)
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
        setFeedback(d.feedback ?? null)
        setPointsToday(d.pointsToday ?? pointsToday)
        setLastAward(d.pointsAwarded ?? 0)
      }
    } finally {
      setChecking(false)
    }
  }

  if (loading || !item) return null
  const gridded = item.needsGraph ?? needsGraph

  return (
    <section className="rounded-xl border bg-card shadow-sm p-4" style={{ borderColor: 'var(--border)' }} aria-label="practice rep">
      <div className="flex items-center gap-2 flex-wrap">
        <Dumbbell className="h-4 w-4" style={{ color: 'var(--reward-foreground)' }} />
        <span className="text-sm font-semibold text-foreground">{t('Practice: new numbers on a fresh board')}</span>
        <span className="ml-auto text-[11px] rounded-full px-2 py-0.5 tabular-nums" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>
          {t('bonus')} {pointsToday} {t('of')} {dailyCap}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        {t("Instant check. Doesn't move the ladder — your teacher's rating does.")}
      </p>

      <p className="mt-3 text-base font-semibold text-foreground leading-snug">{item.prompt}</p>

      <div className="mt-3">
        <MathCanvas
          key={boardKey}
          gridded={gridded}
          readOnly={verdict !== null}
          value={board}
          onChange={(v) => setBoard(v)}
          lang={lang}
          stamp={verdict === 'match' ? { text: '✓ matches', tone: 'up' } : verdict === 'mismatch' ? { text: '✕ not yet', tone: 'down' } : null}
        />
      </div>

      {verdict === null ? (
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="practice-answer" className="sr-only">{t('Final answer')}</label>
          <input
            id="practice-answer"
            className="flex-1 rounded-md border border-border bg-background px-3 text-foreground"
            style={{ fontSize: 16, height: 44 }}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') check() }}
            placeholder={t('Final answer, with units')}
            autoComplete="off"
          />
          <Button className="rounded-full h-11 px-5" disabled={checking || !answer.trim()} onClick={check}>
            {checking ? t('Checking…') : t('Check')}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {verdict === 'match' && (
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--viz-up)' }}>
              <CheckCircle2 className="h-4 w-4" />
              {answer.trim()} — {t('matches')}
              {lastAward > 0 ? <span className="font-normal text-foreground">· +{lastAward} {t('bonus')}</span>
                : pointsToday >= dailyCap ? <span className="font-normal text-muted-foreground">· {t('bonus maxed for today — reps still count for you')}</span> : null}
            </p>
          )}
          {verdict === 'mismatch' && (
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--viz-down)' }}>
                <XCircle className="h-4 w-4" /> {feedback?.label ? t(feedback.label) : t('Not the expected answer')}
              </p>
              <div className="mt-2 rounded-lg px-3 py-2" style={{ background: 'var(--muted)' }}>
                <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t('You wrote')}</span>
                <p className="text-base font-semibold text-foreground tabular-nums">{answer.trim()}</p>
              </div>
              <p className="text-sm text-foreground mt-2 leading-relaxed">
                {feedback ? feedback.message : t('Re-read what the question asks for and check the units on every number, then try another.')}
              </p>
            </div>
          )}
          {verdict === 'unknown' && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              {t("We couldn't check that one — try a plain number with its unit, like 7000 m.")}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            {verdict !== 'match' && (
              <Button variant="ghost" size="sm" className="rounded-full h-10" onClick={() => { setVerdict(null); setFeedback(null) }}>
                ↺ {t('Try again on this board')}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-full h-10 text-muted-foreground" onClick={load}>
              {t('Next problem →')}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
