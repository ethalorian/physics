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
import ProblemReward from '@/components/math-spine/ProblemReward'
import MathStudioHeader from '@/components/math-spine/MathStudioHeader'
import StandardFocus from '@/components/math-spine/StandardFocus'
import ReasoningWorkspace from '@/components/math-spine/ReasoningWorkspace'
import styles from '@/components/math-spine/StudentMathInput.module.css'
import MathFeedbackLoop from '@/components/math-spine/MathFeedbackLoop'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Languages, ArrowRight } from 'lucide-react'
import MathCanvas, { type CanvasText } from '@/components/math-spine/MathCanvas'
import { type SandboxValue } from '@/components/blocks/EquationSandbox'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import MathTutor from '@/components/math-spine/MathTutor'
import PracticeRep from '@/components/math-spine/PracticeRep'
import { pickTier, type MiniLesson } from '@/lib/math-spine-lessons'
import { type PickKind } from '@/lib/math-spine-picker'
import { MATH_LANGUAGES } from '@/lib/math-languages'
import { useTranslator } from '@/lib/math-translate-store'

type CheckMode = 'numeric' | 'short-answer' | 'teacher-only' | 'exact-form' | 'estimate'

interface DailyItem {
  instanceId?: string
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
  work?: string
  needsGraph?: boolean
  helpUsed?: boolean
  answer: string
  workStrokes: Stroke[]
  workTexts: CanvasText[]
  sandbox: SandboxValue
}


const LABEL = 'text-[11px] font-bold uppercase tracking-widest'

export default function WarmupPage() {
  const [item, setItem] = useState<DailyItem | null>(null)
  const [pickKind, setPickKind] = useState<PickKind>('climb')
  const [loading, setLoading] = useState(true)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [work, setWork] = useState<WorkValue>({ answer: '', workStrokes: [], workTexts: [], sandbox: { lines: [] } })
  const [resumedDraft, setResumedDraft] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [selfCheck, setSelfCheck] = useState<SelfCheck | null>(null)
  const [checkReason, setCheckReason] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<SlipFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [translationEnabled, setTranslationEnabled] = useState(false)
  const [lang, setLang] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('mathLang') || '' : ''))
  const [translated, setTranslated] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/daily')
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Could not load your warm-up'); return d })
      .then((d) => {
        if (!active || !d) return
        setItem(d.item ?? null)
        if (d.item?.instanceId && !d.alreadySubmitted) { try { const draft = sessionStorage.getItem('math-draft:' + d.item.instanceId); if (draft) { setWork(JSON.parse(draft)); setResumedDraft(true) } } catch {} }
        setPickKind((d.pickKind as PickKind) ?? 'climb')
        setAlreadySubmitted(Boolean(d.alreadySubmitted))
        setTranslationEnabled(Boolean(d.translationEnabled))
        setLoading(false)
      })
      .catch((e) => { if (active) { setLoading(false); setError(e.message) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!item?.instanceId || alreadySubmitted || submitted) return
    try { sessionStorage.setItem('math-draft:' + item.instanceId, JSON.stringify(work)); setDraftSaved(true) } catch { setDraftSaved(false) }
  }, [item?.instanceId, work, alreadySubmitted, submitted])

  // Two named checks (decision 3). Work = anything on the board or in the
  // equation builder; answer = the final box. Teacher-only prompts need either.
  const workShown = !!work.work?.trim() || work.workStrokes.length > 0
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
          instance_id: item.instanceId,
          competency_id: item.competencyId,
          spiral_item_id: item.spiralItemId,
          prompt: item.prompt,
          response_json: { ...work, needsGraph: item.needsGraph },
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || `Submit failed (${res.status})`)
      setSelfCheck(j.selfCheck === null ? null : (j.selfCheck as SelfCheck) ?? 'unknown')
      if (j.response_json) setWork(j.response_json)
      try { sessionStorage.removeItem('math-draft:' + item.instanceId) } catch {}
      setCheckReason(typeof j.selfCheckReason === 'string' ? j.selfCheckReason : null)
      setFeedback(j.feedback ?? null)
      setSubmittedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
      setXpEarned(j.xpEarned ?? 0)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const tierIdx = pickTier(item?.competencyValue)
  const done = submitted || alreadySubmitted
  // Help drawer default follows the tier: open for "Not yet" and "Needs a
  // refresh", collapsed for re-checks and "Got it" — tiering governs disclosure.
  const helpDefaultOpen = tierIdx === 0 || pickKind === 'refresh'

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

  const answerLabel = teacherOnly ? t('Your answer & reasoning')
    : item?.checkMode === 'short-answer' ? t('Final answer')
    : item?.needsGraph ? t('Final answer · from your graph')
    : t('Final answer')
  const answerPlaceholder = teacherOnly ? t('A sentence or two — your teacher reads this one.')
    : item?.checkMode === 'short-answer' ? t('A word or short formula — e.g. t = d/v')
    : t('Include all requested parts and units where needed.')

  // ------------------------------------------------------------------ render
  const card = 'rounded-xl border bg-card shadow-sm'
  const cardStyle = { borderColor: 'var(--border)' }

  return (
    <div data-math-studio className={`max-w-6xl mx-auto p-3 sm:p-4 space-y-3 ${styles.studio}`}>
      {/* Ribbon: where I am, in one 44px line */}
      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap min-h-11">
        <Link href="/dashboard/math-spine" className="inline-flex items-center h-11 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {t('Math hub')}
        </Link>
        <span className="ml-auto">{translateControl}</span>
      </div>

      <MathStudioHeader resumed={resumedDraft} done={done} lang={activeLang} />

      {!loading && item && <StandardFocus code={item.competencyCode} statement={item.competencyStatement} mode={done ? 'submitted' : 'assessment'} lang={activeLang} />}

      {error && !item && <p role="alert">{error} <button onClick={() => window.location.reload()} className="underline min-h-11">Retry</button></p>}
      {loading && <p className="text-sm text-muted-foreground">{t('Loading your warm-up…')}</p>}
      {!loading && !item && <p className="text-sm text-muted-foreground">{t('No warm-up available right now — check back soon.')}</p>}

      {!loading && item && !done && (
        <div className="grid gap-4 min-[900px]:grid-cols-[minmax(320px,2fr)_3fr] min-[900px]:items-start">
          {/* ---------------------------------------------------------- left: problem + help */}
          <div className="space-y-3">
            <section className={styles.problemCard} aria-labelledby="problem-label">
              <div className="flex items-center gap-2">
                <span id="problem-label" className={styles.eyebrow}>{t("Today's challenge")}</span>

              </div>
              
              <p className="mt-2 text-xl font-semibold text-foreground leading-relaxed whitespace-pre-wrap">{displayPrompt}</p>
              <ProblemReward lang={activeLang} />


            <div className={styles.inlineHelp}><MathTutor key={item.instanceId ?? item.spiralItemId} code={item.competencyCode} customTiers={item.miniLessonTiers} lang={activeLang} initiallyOpen={helpDefaultOpen} onReturnToWork={()=>document.getElementById('math-reasoning')?.focus()} /></div>
            </section>

          </div>

          {/* ---------------------------------------------------------- right: the board */}
          <div className={styles.workDesk}>
            <section className={styles.workCard} aria-label="work board">
              <div className={styles.sectionHeader}><h2 className={styles.step}>{t('Your work')}</h2>{(workShown || answerEntered) && <span className={styles.draft}>{t(draftSaved ? 'Draft saved in this tab' : 'Draft not saved in this tab')}</span>}</div>
              <ReasoningWorkspace key={item.instanceId ?? item.spiralItemId} reasoningId="math-reasoning" value={work} onChange={v => setWork(w => ({ ...w, ...v }))} needsGraph={!!item.needsGraph} needsEquationBuilder={!!item.needsEquationBuilder} lang={activeLang} />
              <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-muted-foreground"><input type="checkbox" checked={work.helpUsed ?? false} onChange={e => setWork(w => ({ ...w, helpUsed: e.target.checked }))} />{t('I used the how-to to solve this problem')}</label>
            </section>

            <section className={styles.answer}>
              
              <label htmlFor="final-answer" className={LABEL} style={{ color: 'var(--foreground)' }}>{answerLabel}</label>
              {teacherOnly ? (
                <textarea id="final-answer" rows={3} value={work.answer}
                  onChange={(e) => setWork((w) => ({ ...w, answer: e.target.value }))}
                  placeholder={answerPlaceholder}
                  className={styles.input} style={{ resize: 'vertical' }} />
              ) : (
                <input id="final-answer" value={work.answer}
                  onChange={(e) => setWork((w) => ({ ...w, answer: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit() }}
                  placeholder={answerPlaceholder} inputMode="text" autoComplete="off"
                  className={styles.input} style={{ fontSize: 18, height: 48 }} />
              )}
              <div className={styles.submitArea}>
                <div className={styles.readiness} aria-live="polite">
                  <span className={workShown ? styles.complete : styles.incomplete}>{workShown ? '✓ ' : '○ '}{t('Work shown')}</span>
                  <span className={answerEntered ? styles.complete : styles.incomplete}>{answerEntered ? '✓ ' : '○ '}{t(teacherOnly ? 'Answer written' : 'Answer entered')}</span>
                </div>
                <Button disabled={submitting || !canSubmit} onClick={submit} className={styles.submitButton}>
                  {submitting ? t('Submitting…') : error ? t('Retry submission') : t('Submit warm-up')}<ArrowRight size={16} aria-hidden="true" />
                </Button>
                <span className={styles.submitHint}>
                  {teacherOnly ? t('Write an explanation or show your reasoning. Your teacher reads and rates this one.')
                    : !workShown && !answerEntered ? t('Add your reasoning, then enter a final answer.')
                    : !workShown ? t('Add your reasoning in text, equations, or a drawing.')
                    : !answerEntered ? t('Enter your final answer so it can be checked.')
                    : t('Checked the moment you submit. Your teacher rates the work.')}
                </span>
                {error && <span role="alert" className={styles.submitError}>{error} {t('Your work is still here.')}</span>}
              </div>
            </section>
          </div>
        </div>
      )}

      {submitted && xpEarned > 0 && <p role="status" className={styles.problemReward}>+{xpEarned} XP · {t('Added to your XP balance')}</p>}
      {done && <MathFeedbackLoop refreshKey={submitted ? 1 : 0} />}
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
                    <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t('A possible cause to check')}</span>
                    <p className="text-sm text-foreground mt-1 leading-relaxed">
                      {feedback ? t('This answer can happen for several reasons. Check whether this hint fits your work: ') + feedback.message : t('Not the expected answer. Re-read what the question asks for and check the units on every number. Your teacher will read your work either way.')}
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

              {submitted && selfCheck !== 'match' && <div className="mt-3"><MathTutor key={'review-help-'+(item.instanceId ?? item.spiralItemId)} code={item.competencyCode} customTiers={item.miniLessonTiers} lang={activeLang} /></div>}

              {/* what happens next */}
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <span className={LABEL} style={{ color: 'var(--muted-foreground)' }}>{t('What happens next')}</span>
                <ol className="mt-2 space-y-1.5 text-sm">
                  <li className="flex items-center gap-2 text-foreground"><CheckCircle2 className="h-4 w-4" style={{ color: 'var(--viz-up)' }} /> {t('Submitted — work and answer')}</li>
                  <li className="flex items-center gap-2 text-foreground"><span className="grid place-items-center h-4 w-4 rounded-full bg-muted text-[10px] font-bold">2</span> {t('Your teacher reviews the thinking and any next step')}</li>
                  <li className="flex items-center gap-2 text-foreground"><span className="grid place-items-center h-4 w-4 rounded-full bg-muted text-[10px] font-bold">3</span> {item.competencyCode} {t('moves on the ladder — the rating decides, not the check')}</li>
                </ol>
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <a href="#practice" className="inline-flex items-center h-10 px-4 rounded-full text-sm font-semibold" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>{t('Try one more · +1 XP')}</a>
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
                {work.work && <p className="mb-3 whitespace-pre-wrap">{work.work}</p>}
                {work.sandbox.lines.map((line,i) => <p key={i}>{line}</p>)}
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
