'use client'

/**
 * PracticeRep — unlimited extra reps after the daily warm-up (decisions 7–8).
 *
 * Same board, same tools, new numbers. Self-checked only: work it on the board,
 * type an answer, get an instant verdict — and on a ✗, the same descriptive
 * feedback the daily rep gives. Correct reps earn 1 XP once per issued problem. Bonus points are the REWARD layer; none of this writes
 * mastery records — the teacher's rating on the daily warm-up moves the ladder.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, HelpCircle, Dumbbell } from 'lucide-react'
import ProblemReward from './ProblemReward'
import StandardFocus from './StandardFocus'
import WarmupAnswer from './WarmupAnswer'
import MathTutor from './MathTutor'
import MathWorkReview from './MathWorkReview'
import MathGameRecommendation from './MathGameRecommendation'
import { mathRemediation } from '@/lib/math-remediation'
import type { MathXpStatus } from '@/lib/xp-policy'
import type { MathResponse } from '@/lib/math-response'

import { useTranslator } from '@/lib/math-translate-store'

interface PracticeItem {
  instanceId: string
  spiralItemId: string
  competencyCode: string
  competencyStatement: string
  miniLessonTiers?: unknown
  prompt: string
  needsGraph?: boolean
  needsEquationBuilder?: boolean
  checkMode?: string
  translations?: Record<string, string>
  /** present on randomized items — echoed back so the server checks the same numbers */
  templateSeed?: string | null
}

type Verdict = 'match' | 'mismatch' | 'unknown'
interface SlipFeedback { tag: string | null; label: string | null; message: string; source: 'slip' | 'fallback' }

const LABEL = 'text-overline font-bold uppercase tracking-widest'

export default function PracticeRep({ needsGraph = false, lang = '', skill }: { needsGraph?: boolean; lang?: string; skill?: string }) {
  const t = useTranslator(lang)
  const [item, setItem] = useState<PracticeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [board, setBoard] = useState<MathResponse>({})
  const [error, setError] = useState('')
  const [boardKey, setBoardKey] = useState(0) // remount the canvas for a fresh board
  const [checking, setChecking] = useState(false)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [feedback, setFeedback] = useState<SlipFeedback | null>(null)
  const [lastAward, setLastAward] = useState<number | null>(null)
  const [xpStatus, setXpStatus] = useState<MathXpStatus | null>(null)
  const pendingLoad = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    pendingLoad.current?.abort()
    const controller = new AbortController()
    pendingLoad.current = controller
    setLoading(true)
    setItem(null)
    setError('')
    setVerdict(null)
    setFeedback(null)
    setAnswer('')
    setLastAward(null)
    setBoard({})
    setBoardKey((k) => k + 1)
    fetch('/api/math-spine/practice' + (skill ? `?skill=${encodeURIComponent(skill)}` : ''), { signal: controller.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Could not load practice'); return d })
      .then((d) => {
        if (controller.signal.aborted) return
        setItem(d?.item ?? null)
        setXpStatus(d.xpStatus ?? null)
        setLoading(false)
      })
      .catch(e => { if (!controller.signal.aborted) { setError(e.message); setLoading(false) } })
  }, [skill])

  useEffect(() => { load(); return () => pendingLoad.current?.abort() }, [load])

  async function check() {
    if (!item || !answer.trim() || checking) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/math-spine/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: item.instanceId, answer }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not check your answer')
      if (res.ok) {
        setVerdict(d.result as Verdict)
        setFeedback(d.feedback ?? null)
        setLastAward(d.result === 'match' ? d.xpEarned ?? 0 : null)
        setXpStatus(d.xpStatus ?? null)
        if (d.xpAwarded > 0) window.dispatchEvent(new CustomEvent('xp-updated'))
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not check your answer') } finally {
      setChecking(false)
    }
  }

  if (loading) return <p>Loading practice…</p>
  if (!item) return <p>{error || "No practice available for this skill."} <button className="min-h-11 underline" onClick={load}>Retry</button></p>
  const gridded = item.needsGraph ?? needsGraph

  return (
    <section className="rounded-xl border bg-card shadow-sm p-4" style={{ borderColor: 'var(--border)' }} aria-label="practice rep">
      <div className="flex items-center gap-2 flex-wrap">
        <Dumbbell className="h-4 w-4" style={{ color: 'var(--reward-foreground)' }} />
        <span className="text-sm font-semibold text-foreground">{t('Practice: new numbers on a fresh board')}</span>

      </div>
      <p className="text-overline text-muted-foreground mt-1">
        {t("Instant check. Doesn't move the ladder — your teacher's rating does.")}
      </p>

      <StandardFocus code={item.competencyCode} statement={item.competencyStatement} mode="practice" lang={lang} />
      <p className="mt-3 text-base font-semibold text-foreground leading-snug">{(lang && item.translations?.[lang]) || item.prompt}</p>
      <ProblemReward practice earned={lastAward} status={xpStatus} lang={lang} />

      <div className="mt-3"><MathTutor key={'practice-help-'+boardKey} code={item.competencyCode} customTiers={item.miniLessonTiers} lang={lang} /></div>
      <div className="mt-3">
        {verdict === null ? <WarmupAnswer key={boardKey} value={{ ...board, answer }} onChange={v => {setBoard(v);setAnswer(v.answer ?? '')}} needsGraph={gridded} needsEquationBuilder={item.needsEquationBuilder} checkMode={item.checkMode} lang={lang} /> : <MathWorkReview key={'review'+boardKey} value={{...board,answer,needsGraph:gridded}} />}
      </div>

      {error && <p role="alert">{error}</p>}
      {verdict === null ? (
        <div className="mt-3 flex items-center gap-2">
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
              {lastAward !== null && lastAward > 0 ? <span className="font-normal text-foreground">· +{lastAward} XP</span>
                : null}
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
                {feedback ? t('Check whether this hint fits your reasoning: ') + feedback.message : t('Re-read what the question asks for and check the units on every number, then try another.')}
              </p>
              <div className="mt-3"><MathGameRecommendation recommendation={mathRemediation(item.competencyCode, verdict)} lang={lang} /></div>
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
