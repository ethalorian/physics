'use client'

/**
 * Daily math warm-up — its own screen.
 *
 * Three parts: (1) the prompt, framed by WHY the picker chose it (climb /
 * re-check / refresh / maintenance), (2) a mini-lesson with an explicit diagram
 * showing HOW to do this kind of problem, and (3) the work surface — a work
 * canvas plus a final answer. Submitting sends the answer to the teacher's
 * control-room review queue AND returns an instant self-check verdict on the
 * answer (the machine judges the answer; the teacher rates the thinking).
 * After submitting, the student can keep practicing with instant-checked reps.
 *
 * Vocabulary: students see ONE scale everywhere — Not yet / Almost / Got it
 * (plus "Needs a refresh" on the ladder). See warmup_remediation_redesign.md.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, Target, Languages, RefreshCw } from 'lucide-react'
import WarmupAnswer, { type WarmupAnswerValue } from '@/components/math-spine/WarmupAnswer'
import MathSpineDiagram from '@/components/math-spine/MathSpineDiagram'
import MathLadder, { type LadderRung } from '@/components/math-spine/MathLadder'
import PracticeRep from '@/components/math-spine/PracticeRep'
import { tieredLessonsForCode, pickTier, type MiniLesson } from '@/lib/math-spine-lessons'
import type { PickKind } from '@/lib/math-spine-picker'
import { MATH_LANGUAGES } from '@/lib/math-languages'
import { useTranslator } from '@/lib/math-translate-store'

interface DailyItem {
  spiralItemId: string
  competencyId: string
  competencyCode: string
  competencyStatement: string
  prompt: string
  difficulty?: string
  needsGraph?: boolean
  needsEquationBuilder?: boolean
  competencyValue?: number | null
  miniLessonTiers?: MiniLesson[] | null
  translations?: Record<string, string>
}

type SelfCheck = 'match' | 'mismatch' | 'unknown'

function strandForCode(code: string | undefined): string {
  const p = (code ?? '').slice(0, 2)
  if (p === 'NS') return 'number-sense'
  if (p === 'PR') return 'proportional-reasoning'
  if (p === 'QE') return 'quantities-estimation'
  if (p === 'SM') return 'symbolic-manipulation'
  if (p === 'GV') return 'graphs-vectors'
  return ''
}

/** One student vocabulary: the mini-lesson tier mirrors the student's level. */
const LEVEL_WORDS = ['Not yet', 'Almost', 'Got it'] as const

/** Why today's problem is THIS problem — the picker's reason, in student words. */
const PICK_FRAMING: Record<PickKind, { label: string; explain: string }> = {
  climb: {
    label: "Today's problem",
    explain: 'This is your current rung on the ladder — get it to “Got it” to unlock the next skill.',
  },
  refresh: {
    label: 'Patch it back up',
    explain: 'You had this skill at “Got it” before and it slipped. Refreshing it comes first — it holds up everything above it.',
  },
  recheck: {
    label: 'Still got it?',
    explain: 'A quick check on a skill you already own — keeping it warm is part of fluency.',
  },
  maintenance: {
    label: 'Keeping it sharp',
    explain: 'Your whole ladder is at “Got it” — today is upkeep and stretch.',
  },
}

export default function WarmupPage() {
  const [item, setItem] = useState<DailyItem | null>(null)
  const [pickKind, setPickKind] = useState<PickKind>('climb')
  const [ladder, setLadder] = useState<LadderRung[]>([])
  const [loading, setLoading] = useState(true)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [ans, setAns] = useState<WarmupAnswerValue | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selfCheck, setSelfCheck] = useState<SelfCheck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [translationEnabled, setTranslationEnabled] = useState(false)
  const [lang, setLang] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('mathLang') || '' : ''))
  const [translated, setTranslated] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/daily')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        setItem(d.item ?? null)
        setPickKind((d.pickKind as PickKind) ?? 'climb')
        setLadder((d.ladder as LadderRung[]) ?? [])
        setAlreadySubmitted(Boolean(d.alreadySubmitted))
        setTranslationEnabled(Boolean(d.translationEnabled))
        setLoading(false)
      })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const hasWork = !!(
    ans &&
    ((ans.answer && ans.answer.trim()) ||
      (ans.workStrokes && ans.workStrokes.length > 0) ||
      (ans.workTexts && ans.workTexts.length > 0) ||
      (ans.sandbox?.lines && ans.sandbox.lines.some((l) => l.trim())))
  )

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
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(j.error || `Submit failed (${res.status})`)
      }
      setSelfCheck((j.selfCheck as SelfCheck) ?? 'unknown')
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const tiers: MiniLesson[] | null = item ? (item.miniLessonTiers ?? tieredLessonsForCode(item.competencyCode)) : null
  const tierIdx = pickTier(item?.competencyValue)
  const lesson: MiniLesson | null = tiers ? (tiers[tierIdx] ?? tiers[0]) : null
  const done = submitted || alreadySubmitted
  const framing = PICK_FRAMING[pickKind]

  // Translation: only when the student's section has it enabled AND this question
  // carries translations. English stays primary; the student taps to swap.
  const availLangs = item ? MATH_LANGUAGES.filter((l) => item.translations?.[l.code]) : []
  const canTranslate = translationEnabled && availLangs.length > 0
  const effLang = lang && item?.translations?.[lang] ? lang : (availLangs[0]?.code ?? '')
  const displayPrompt = translated && effLang && item?.translations?.[effLang] ? item.translations[effLang] : (item?.prompt ?? '')

  // When translation is on, every visible string flows through t() (chrome,
  // statement, mini-lesson) and the child components receive the language.
  const activeLang = canTranslate && translated ? effLang : ''
  const t = useTranslator(activeLang)

  const translateBar = canTranslate ? (
    <div className="flex items-center gap-2 mt-2">
      <button onClick={() => setTranslated((t) => !t)} className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
        <Languages className="h-3.5 w-3.5" /> {translated ? 'Show English' : 'Translate'}
      </button>
      <select value={effLang} onChange={(e) => { setLang(e.target.value); if (typeof window !== 'undefined') localStorage.setItem('mathLang', e.target.value); setTranslated(true) }}
        className="text-xs rounded-full border px-2 py-1 bg-transparent" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }} aria-label="translation language">
        {availLangs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </div>
  ) : null

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Link href="/home" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> {t('Back')}
      </Link>

      {loading && <p className="text-sm text-muted-foreground">{t('Loading your warm-up…')}</p>}
      {!loading && !item && <p className="text-sm text-muted-foreground">{t('No warm-up available right now — check back soon.')}</p>}

      {!loading && item && (
        <>
          {/* Today's problem — the can't-miss callout, framed by WHY it was picked */}
          <div
            className="rounded-xl border-l-4 p-4 shadow-sm"
            style={{ borderColor: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 9%, var(--card))' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {pickKind === 'refresh' || pickKind === 'recheck'
                ? <RefreshCw className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                : <Target className="h-4 w-4" style={{ color: 'var(--primary)' }} />}
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>{t(framing.label)}</span>
              <span className="text-[11px] font-medium rounded px-2 py-0.5 bg-muted text-muted-foreground tabular-nums ml-auto">{item.competencyCode}</span>
            </div>
            <p className="text-base font-semibold text-foreground leading-snug">{displayPrompt}</p>
            {translateBar}
            <p className="text-xs text-muted-foreground mt-2">{t(item.competencyStatement)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{t(framing.explain)}</p>

            {/* Where this problem sits on the ladder */}
            {ladder.length > 0 && (
              <div className="mt-3 pt-2.5" style={{ borderTop: '0.5px solid var(--border)' }}>
                <MathLadder rungs={ladder} compact />
                <Link href="/dashboard/math-spine" className="text-[11px] font-medium" style={{ color: 'var(--primary)' }}>
                  {t('See your full ladder →')}
                </Link>
              </div>
            )}
          </div>

          {/* Mini-lesson with an explicit diagram */}
          {lesson && (
            <Card className="apple-card">
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-foreground text-base">{t('How to do it:')} {t(lesson.title)}</CardTitle>
                  <span className="text-[11px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
                    {t('matched to you')} · {t(LEVEL_WORDS[tierIdx])}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <MathSpineDiagram code={item.competencyCode} lang={activeLang} />
                <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground mt-2">
                  {lesson.steps.map((s, i) => <li key={i}>{t(s)}</li>)}
                </ol>
                {lesson.tip && <p className="text-xs text-muted-foreground mt-3 rounded-md bg-muted/60 px-3 py-2">💡 {t(lesson.tip)}</p>}
              </CardContent>
            </Card>
          )}

          {/* Work surface / post-submit state */}
          {done ? (
            <>
              <Card className="apple-card">
                <CardContent className="py-6 space-y-2">
                  {selfCheck === 'match' && (
                    <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span>
                        {t('Your answer matches!')}{' '}
                        <span className="text-muted-foreground">{t('Your teacher rates the thinking — Not yet, Almost, or Got it — and that moves your ladder.')}</span>
                      </span>
                    </div>
                  )}
                  {selfCheck === 'mismatch' && (
                    <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--viz-down)' }}>
                      <XCircle className="h-5 w-5 shrink-0" />
                      <span>
                        {t("Your answer doesn't match the expected one — worth another look at the mini-lesson.")}{' '}
                        <span className="text-muted-foreground">{t('Your teacher will read your work either way. Try a practice rep below to nail it.')}</span>
                      </span>
                    </div>
                  )}
                  {(selfCheck === 'unknown' || selfCheck === null) && (
                    <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span>{t('Submitted — your teacher will check your work and rate it: Not yet, Almost, or Got it.')}</span>
                    </div>
                  )}
                  <Link href="/dashboard/math-spine">
                    <Button variant="ghost" size="sm" className="rounded-full mt-1 -ml-2 text-muted-foreground">{t('See your ladder & math literacy →')}</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Unlimited extra reps — instant check, token points, no records */}
              <PracticeRep />
            </>
          ) : (
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-foreground text-base">{t('Your work')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-l-4 px-3 py-2" style={{ borderColor: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 6%, transparent)' }}>
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>{t('Solve this')}</span>
                  <p className="text-sm font-medium text-foreground">{displayPrompt}</p>
                </div>
                <WarmupAnswer
                  strand={strandForCode(item.competencyCode)}
                  needsGraph={item.needsGraph}
                  needsEquationBuilder={item.needsEquationBuilder}
                  onChange={setAns}
                  lang={activeLang}
                />
                <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                  <Button disabled={submitting || !hasWork} onClick={submit} className="rounded-full">
                    {submitting ? t('Submitting…') : t('Submit — instant check')}
                  </Button>
                  {!hasWork && <span className="text-xs text-muted-foreground">{t('Show your work or enter an answer first.')}</span>}
                  {hasWork && <span className="text-xs text-muted-foreground">{t('Show your work to get the instant answer check.')}</span>}
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
