'use client'

/**
 * Daily math warm-up — the desk.
 *
 * Chromebooks are landscape, so the page is a desk: the problem and the help
 * drawer sit pinned on the left, the board (typed + drawn work, graph paper when
 * the item needs it) and the final answer fill the right. Below 900px the two
 * columns stack in the order the thinking happens: problem → help → work →
 * answer. Submit enables only when work is shown AND an answer is entered
 * (decision 3: the ✓ requires work).
 *
 * After submit the left column becomes feedback that teaches: verdict, what
 * you wrote, where it went sideways (from the item's misconception bank), what
 * happens next; the board freezes on the right with the verdict stamped, and a
 * practice rep re-arms it with new numbers — same tools, same paper.
 *
 * Vocabulary: students see ONE scale everywhere — Not yet / Almost / Got it
 * (plus "Needs a refresh"). Bonus points are reward, never evidence; the ladder
 * moves only on the teacher's rating.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Languages, ChevronDown, Flame } from 'lucide-react'
import MathCanvas, { type CanvasText } from '@/components/math-spine/MathCanvas'
import EquationSandbox, { type SandboxValue } from '@/components/blocks/EquationSandbox'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import MathSpineDiagram from '@/components/math-spine/MathSpineDiagram'
import type { LadderRung } from '@/components/math-spine/MathLadder'
import PracticeRep from '@/components/math-spine/PracticeRep'
import { tieredLessonsForCode, pickTier, type MiniLesson } from '@/lib/math-spine-lessons'
import { RUNG_STATE_LABEL, type PickKind } from '@/lib/math-spine-picker'
import { MATH_LANGUAGES } from '@/lib/math-languages'
import { useTranslator } from '@/lib/math-translate-store'

type CheckMode = 'numeric' | 'short-answer' | 'teacher-only' | 'exact-form' | 'estimate'

interface DailyItem {
  spiralItemId: string
  competencyId: string
  competencyCode: string
  competencyStatement: string
  prompt: string
  difficulty?: string
  needsGraph?: boolean
  checkMode?: CheckMode
  needsEquationBuilder?: boolean
  competencyValue?: number | null
  miniLessonTiers?: MiniLesson[] | null
  translations?: Record<string, string>
}

type SelfCheck = 'match' | 'mismatch' | 'unknown'
interface SlipFeedback { tag: string | null; label: string | null; message: string; source: 'slip' | 'fallback' }

interface WorkValue {
  answer: string
  workStrokes: Stroke[]
  workTexts: CanvasText[]
  sandbox: SandboxValue
}

/** One student vocabulary: the mini-lesson tier mirrors the student's level. */
const LEVEL_WORDS = ['Not yet', 'Almost', 'Got it'] as const

/** Why today's problem is THIS problem — the picker's reason, in student words. */
const PICK_FRAMING: Record<PickKind, { label: string; explain: string }> = {
  climb: { label: 'Climbing', explain: 'Your current rung. Get it to “Got it” and the next skill unlocks.' },
  refresh: { label: 'Patch it back up', explain: 'You had this at “Got it” before and it slipped. Refreshing it comes first — it holds up everything above.' },
  recheck: { label: 'Still got it?', explain: 'A quick check on a skill you already own — keeping it warm is part of fluency.' },
  maintenance: { label: 'Keeping it sharp', explain: 'Your whole ladder is at “Got it” — today is upkeep and stretch.' },
}

const LABEL = 'text-[11px] font-bold uppercase tracking-widest'

export default function WarmupPage() {
  const [item, setItem] = useState<DailyItem | null>(null)
  const [pickKind, setPickKind] = useState<PickKind>('climb')
  const [ladder, setLadder] = useState<LadderRung[]>([])
  const [dayCount, setDayCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [work, setWork] = useState<WorkValue>({ answer: '', workStrokes: [], workTexts: [], sandbox: { lines: [] } })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [selfCheck, setSelfCheck] = useState<SelfCheck | null>(null)
  const [checkReason, setCheckReason] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<SlipFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState<boolean | null>(null) // null = follow the tier
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
        setDayCount(Number(d.dayCount ?? 0))
        setStreak(Number(d.streak ?? 0))
        setAlreadySubmitted(Boolean(d.alreadySubmitted))
        setTranslationEnabled(Boolean(d.translationEnabled))
        setLoading(false)
      })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Two named checks (decision 3). Work = anything on the board or in the
  // equation builder; answer = the final box. Teacher-only prompts need either.
  const workShown = work.workStrokes.length > 0
    || work.workTexts.some((t) => String(t.text ?? '').trim())
    || (work.sandbox.lines ?? []).some((l) => String(l).trim())
  const answerEntered = work.answer.trim().length > 0
  const teacherOnly = item?.checkMode === 'teacher-only'
  const canSubmit = teacherOnly ? (workShown || answerEntered) : (workShown && answerEntered)

  async function submit() {
    if (!item || !canSubmit || submitting) return
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
          response_json: work,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || `Submit failed (${res.status})`)
      setSelfCheck((j.selfCheck as SelfCheck) ?? 'unknown')
      setCheckReason(typeof j.selfCheckReason === 'string' ? j.selfCheckReason : null)
      setFeedback(j.feedback ?? null)
      setSubmittedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Ladder position: where today sits, and what "Got it" unlocks.
  const { rungIdx, todayRung, nextRung } = useMemo(() => {
    const i = ladder.findIndex((r) => r.isToday)
    return { rungIdx: i, todayRung: i >= 0 ? ladder[i] : null, nextRung: i >= 0 ? ladder[i + 1] ?? null : null }
  }, [ladder])

  // Help drawer default follows the tier: open for "Not yet" and "Needs a
  // refresh", collapsed for re-checks and "Got it" — tiering governs disclosure.
  const helpDefaultOpen = tierIdx === 0 || pickKind === 'refresh'
  const showHelp = helpOpen ?? helpDefaultOpen

  // Translation: only when the student's section has it enabled AND this question
  // carries translations. English stays primary; the student taps to swap.
  const availLangs = item ? MATH_LANGUAGES.filter((l) => item.translations?.[l.code]) : []
  const canTranslate = translationEnabled && availLangs.length > 0
  const effLang = lang && item?.translations?.[lang] ? lang : (availLangs[0]?.code ?? '')
  const displayPrompt = translated && effLang && item?.translations?.[effLang] ? item.translations[effLang] : (item?.prompt ?? '')
  const activeLang = canTranslate && translated ? effLang : ''
  const t = useTranslator(activeLang)

  const translateControl = canTranslate ? (
    <div className="inline-flex items-center gap-1.5">
      <button type="button" onClick={() => setTranslated((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-3 h-8" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
        <Languages className="h-3.5 w-3.5" /> {translated ? 'Show English' : 'Translate'}
      </button>
      <select value={effLang} onChange={(e) => { setLang(e.target.value); try { localStorage.setItem('mathLang', e.target.value) } catch {} setTranslated(true) }}
        className="text-xs rounded-full border px-2 h-8 bg-transparent" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }} aria-label="translation language">
        {availLangs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </div>
  ) : null

  const stateWord = todayRung ? RUNG_STATE_LABEL[todayRung.state] : ''
  const answerLabel = teacherOnly ? t('Your answer & reasoning')
    : item?.checkMode === 'short-answer' ? t('Final answer')
    : item?.needsGraph ? t('Final answer · from your graph')
    : t('Final answer · with units')
  const answerPlaceholder = teacherOnly ? t('A sentence or two — your teacher reads this one.')
    : item?.checkMode === 'short-answer' ? t('A word or short formula — e.g. t = d/v')
    : t('e.g. 3.5 m/s')

  // ------------------------------------------------------------------ render
  const card = 'rounded-xl border bg-card shadow-sm'
  const cardStyle = { borderColor: 'var(--border)' }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 space-y-3">
      {/* Ribbon: where I am, in one 44px line */}
      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap min-h-11">
        <Link href="/dashboard/math-spine" className="inline-flex items-center h-11 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {t('Math hub')}
        </Link>
        <span className="text-sm font-semibold text-foreground">{t('Daily warm-up')}</span>
        {item && todayRung && (
          <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-3 h-8 bg-muted text-foreground tabular-nums">
            <span className="font-semibold">{t('Rung')} {rungIdx + 1} {t('of')} {ladder.length}</span>
            <span aria-hidden>·</span>
            <span>{item.competencyCode}</span>
            <span aria-hidden>·</span>
            <span style={{ color: todayRung.state === 'refresh' ? 'var(--reward-foreground)' : 'var(--primary)' }}>{t(stateWord)}</span>
          </span>
        )}
        {dayCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            {t('Day')} {dayCount}
            {streak >= 2 && <><span aria-hidden>·</span><Flame className="h-3.5 w-3.5" style={{ color: 'var(--reward-foreground)' }} /> {streak}-{t('day streak')}</>}
          </span>
        )}
        <span className="ml-auto">{translateControl}</span>
      </div>

      {loading && <p className="text-sm text-muted-foreground">{t('Loading your warm-up…')}</p>}
      {!loading && !item && <p className="text-sm text-muted-foreground">{t('No warm-up available right now — check back soon.')}</p>}

      {!loading && item && !done && (
        <div className="grid gap-4 min-[900px]:grid-cols-[minmax(320px,2fr)_3fr] min-[900px]:items-start">
          {/* ---------------------------------------------------------- left: problem + help */}
          <div className="space-y-3 min-[900px]:sticky min-[900px]:top-3">
            <section className={`${card} p-4`} style={cardStyle} aria-labelledby="problem-label">
              <div className="flex items-center gap-2">
                <span id="problem-label" className={LABEL} style={{ color: 'var(--primary)' }}>{t("Today's problem")} · {t(framing.label)}</span>
                <span className="ml-auto text-[11px] font-medium rounded px-2 py-0.5 bg-muted text-muted-foreground tabular-nums">{item.competencyCode}</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground leading-snug">{displayPrompt}</p>
              <p className="mt-3 text-xs text-muted-foreground">{t(framing.explain)}</p>
              {nextRung && pickKind === 'climb' && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('Next up:')} <span className="font-semibold text-foreground">{nextRung.code}</span> · {t(nextRung.statement)}
                </p>
              )}
            </section>

            {lesson && (
              <section className={card} style={cardStyle}>
                <button type="button" onClick={() => setHelpOpen(!showHelp)} aria-expanded={showHelp}
                  className="w-full flex items-center gap-2 p-4 text-left">
                  <HelpCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-semibold text-foreground">{t('How to do it:')} {t(lesson.title)}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground whitespace-nowrap">
                    {lesson.steps.length} {t('steps')} · {t(LEVEL_WORDS[tierIdx])}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" style={{ transform: showHelp ? 'rotate(180deg)' : 'none' }} />
                </button>
                {showHelp && (
                  <div className="px-4 pb-4">
                    <MathSpineDiagram code={item.competencyCode} lang={activeLang} />
                    <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground mt-2">
                      {lesson.steps.map((s, i) => <li key={i}>{t(s)}</li>)}
                    </ol>
                    {lesson.tip && (
                      <p className="text-xs mt-3 rounded-md px-3 py-2" style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)', color: 'var(--foreground)' }}>
                        {t(lesson.tip)}
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ---------------------------------------------------------- right: the board */}
          <div className="space-y-3">
            <section className={`${card} p-4`} style={cardStyle} aria-label="work board">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t(item.needsGraph ? 'Graph & work it out' : 'Work it out')}</span>
                <span className="text-[11px] text-muted-foreground">{t('Your teacher rates the thinking, not just the answer.')}</span>
              </div>
              {item.needsEquationBuilder && (
                <div className="mb-3">
                  <span className="text-xs font-semibold text-foreground">{t('Build your equation')}</span>
                  <EquationSandbox embedded value={work.sandbox} onChange={(v) => setWork((w) => ({ ...w, sandbox: v }))} />
                </div>
              )}
              <MathCanvas
                gridded={!!item.needsGraph}
                value={{ strokes: work.workStrokes, texts: work.workTexts }}
                onChange={(v) => setWork((w) => ({ ...w, workStrokes: v.strokes, workTexts: v.texts }))}
                lang={activeLang}
              />
            </section>

            <section className={`${card} p-4`} style={cardStyle}>
              <label htmlFor="final-answer" className={LABEL} style={{ color: 'var(--foreground)' }}>{answerLabel}</label>
              {teacherOnly ? (
                <textarea id="final-answer" rows={3} value={work.answer}
                  onChange={(e) => setWork((w) => ({ ...w, answer: e.target.value }))}
                  placeholder={answerPlaceholder}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] text-foreground" style={{ resize: 'vertical' }} />
              ) : (
                <input id="final-answer" value={work.answer}
                  onChange={(e) => setWork((w) => ({ ...w, answer: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                  placeholder={answerPlaceholder} inputMode="text" autoComplete="off"
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 text-foreground" style={{ fontSize: 18, height: 48 }} />
              )}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3 text-xs" aria-live="polite">
                  <span className={workShown ? 'text-foreground font-medium' : 'text-muted-foreground'}>{workShown ? '✓ ' : '○ '}{t('Work shown')}</span>
                  <span className={answerEntered ? 'text-foreground font-medium' : 'text-muted-foreground'}>{answerEntered ? '✓ ' : '○ '}{t(teacherOnly ? 'Answer written' : 'Answer entered')}</span>
                </div>
                <Button disabled={submitting || !canSubmit} onClick={submit} className="rounded-full ml-auto h-11 px-6">
                  {submitting ? t('Submitting…') : t('Submit')}
                </Button>
                <span className="basis-full text-xs text-muted-foreground">
                  {teacherOnly ? t('Your teacher reads and rates this one.')
                    : !workShown && !answerEntered ? t('Show your work on the board and enter a final answer.')
                    : !workShown ? t('Show your work on the board — the instant check needs it.')
                    : !answerEntered ? t('Enter your final answer so it can be checked.')
                    : t('Checked the moment you submit. Your teacher rates the work.')}
                </span>
                {error && <span className="basis-full text-xs" style={{ color: 'var(--viz-down)' }}>{error}</span>}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ============================================================ after submit */}
      {!loading && item && done && (
        <div className="grid gap-4 min-[900px]:grid-cols-[minmax(320px,2fr)_3fr] min-[900px]:items-start">
          <div className="space-y-3">
            <section className={`${card} p-4`} style={cardStyle} aria-live="polite">
              <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t("Submitted · in your teacher's queue")}</span>

              {/* verdict */}
              {submitted && selfCheck === 'match' && (
                <div className="mt-2 flex items-start gap-2" style={{ color: 'var(--viz-up)' }}>
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-base font-semibold">{work.answer.trim()} — {t('matches')}</p>
                    <p className="text-sm text-foreground mt-1">{t('Your teacher rates the thinking next — that is what moves')} {item.competencyCode} {t('on the ladder.')}</p>
                  </div>
                </div>
              )}
              {submitted && selfCheck === 'mismatch' && (
                <div className="mt-2">
                  <div className="flex items-start gap-2" style={{ color: 'var(--viz-down)' }}>
                    <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-base font-semibold">{feedback?.label ? t(feedback.label) : t('Not the expected answer')}</p>
                  </div>
                  <div className="mt-3 rounded-lg px-3 py-2" style={{ background: 'var(--muted)' }}>
                    <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t('You wrote')}</span>
                    <p className="text-lg font-semibold text-foreground tabular-nums">{work.answer.trim()}</p>
                  </div>
                  <div className="mt-3">
                    <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t('Where it went sideways')}</span>
                    <p className="text-sm text-foreground mt-1 leading-relaxed">
                      {feedback ? feedback.message : t('Not the expected answer. Re-read what the question asks for and check the units on every number. Your teacher will read your work either way.')}
                    </p>
                  </div>
                </div>
              )}
              {submitted && (selfCheck === 'unknown' || selfCheck === null) && (
                <div className="mt-2 flex items-start gap-2 text-foreground">
                  <HelpCircle className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                  <p className="text-sm">
                    {checkReason === 'no-work' ? t('Not checked — the instant check needs work on the board, not just an answer.')
                      : checkReason === 'no-answer' ? t('Not checked — there was no final answer in the box.')
                      : selfCheck === null ? t('This one is for your teacher to read.')
                      : t("We'll let your teacher check this one.")}
                  </p>
                </div>
              )}
              {!submitted && alreadySubmitted && (
                <p className="mt-2 text-sm text-foreground">{t("Today's warm-up is in. One rated submission per day — practice below keeps the habit.")}</p>
              )}

              {/* re-open the how-to right here, so "look at the mini-lesson" isn't a scroll away */}
              {lesson && submitted && selfCheck !== 'match' && (
                <div className="mt-3">
                  <button type="button" onClick={() => setHelpOpen(!showHelp)} aria-expanded={showHelp} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                    <HelpCircle className="h-3.5 w-3.5" /> {showHelp ? t('Hide how-to') : t('Re-open how-to')}
                  </button>
                  {showHelp && (
                    <div className="mt-2 rounded-lg p-3" style={{ background: 'var(--muted)' }}>
                      <MathSpineDiagram code={item.competencyCode} lang={activeLang} />
                      <ol className="list-decimal pl-5 space-y-1 text-sm text-foreground mt-2">
                        {lesson.steps.map((s, i) => <li key={i}>{t(s)}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* what happens next */}
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t('What happens next')}</span>
                <ol className="mt-2 space-y-1.5 text-sm">
                  <li className="flex items-center gap-2 text-foreground"><CheckCircle2 className="h-4 w-4" style={{ color: 'var(--viz-up)' }} /> {t('Submitted — work and answer')}</li>
                  <li className="flex items-center gap-2 text-foreground"><span className="grid place-items-center h-4 w-4 rounded-full bg-muted text-[10px] font-bold">2</span> {t('Your teacher rates the thinking · usually by tomorrow')}</li>
                  <li className="flex items-center gap-2 text-foreground"><span className="grid place-items-center h-4 w-4 rounded-full bg-muted text-[10px] font-bold">3</span> {item.competencyCode} {t('moves on the ladder — the rating decides, not the check')}</li>
                </ol>
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <a href="#practice" className="inline-flex items-center h-10 px-4 rounded-full text-sm font-semibold" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>{t('Try one more · bonus')}</a>
                <Link href="/dashboard/math-spine" className="inline-flex items-center h-10 px-4 rounded-full text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>{t('See my ladder')}</Link>
                <Link href="/home" className="inline-flex items-center h-10 px-3 text-sm text-muted-foreground">{t('Done for today')}</Link>
              </div>
            </section>
          </div>

          <div className="space-y-3">
            {submitted && (
              <section className={`${card} p-4`} style={cardStyle}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t('Your submitted board · read-only')}</span>
                  {submittedAt && <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{t('Submitted')} {submittedAt}</span>}
                </div>
                <MathCanvas
                  readOnly gridded={!!item.needsGraph}
                  value={{ strokes: work.workStrokes, texts: work.workTexts }}
                  onChange={() => {}}
                  stamp={selfCheck === 'match' ? { text: '✓ matches', tone: 'up' } : selfCheck === 'mismatch' ? { text: '✕ not the expected answer', tone: 'down' } : { text: 'submitted', tone: 'neutral' }}
                />
                <div className="mt-3 flex items-baseline gap-3">
                  <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{answerLabel}</span>
                  <span className="text-lg font-semibold text-foreground tabular-nums">{work.answer.trim() || '—'}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{t('Locked — one rated submission per day')}</span>
                </div>
              </section>
            )}
            <div id="practice">
              <PracticeRep needsGraph={!!item.needsGraph} lang={activeLang} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
