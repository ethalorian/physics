"use client"

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, X, Sparkles, BookOpen, Zap, Flame } from 'lucide-react'
import EnrollmentGate from '@/components/EnrollmentGate'
import MathMarkdown from '@/components/MathMarkdown'
import type { ContentBlock } from '@/data/content-blocks'

// Questions can contain LaTeX (e.g. $v = \frac{\Delta x}{\Delta t}$). Render the
// stem, every choice, and the explanation through MathMarkdown so the math is
// typeset rather than shown as raw source. `mathInline` strips the block margins
// so it sits naturally inside a button / sentence.
const mathInline = 'math-inline-flow'

// BlockRenderer pulls in recharts, react-pdf, sims, etc. — keep it lazy so the
// review page is light when blocks aren't present.
const BlockRenderer = dynamic(() => import('@/components/blocks/BlockRenderer'), { ssr: false, loading: () => null })

interface Q { q: string; choices: string[]; answerIndex: number; explanation: string }
interface Review { id: string; reteach: string; blocks: ContentBlock[] | null; questions: Q[]; shared: boolean }
interface TargetInfo { statement: string; domain: string | null }
interface RetryItem { targetId: string; statement: string; domain: string; level: 1 | 2; lastObservedAt: string }

const LEVEL_LABEL: Record<1 | 2, string> = { 1: 'Not yet', 2: 'Almost' }

// The review is a two-beat loop, not one scroll: REFRESH (re-learn it) →
// CHECK (prove it, one question at a time) → DONE (a payoff that chains to
// the next weak skill). Mastery itself stays teacher-rated — the payoff is
// effort XP + streak + queue movement, never a fake mastery bump.
type Phase = 'refresh' | 'check' | 'done'

export default function ReviewPage() {
  const params = useParams<{ targetId: string }>()
  const targetId = params.targetId
  const [review, setReview] = useState<Review | null>(null)
  const [target, setTarget] = useState<TargetInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // Why-you're-here context + the chain: pulled from the same retry queue the
  // home hub renders, so the two surfaces can never disagree.
  const [queueItem, setQueueItem] = useState<RetryItem | null>(null)
  const [nextWeak, setNextWeak] = useState<RetryItem | null>(null)

  const [phase, setPhase] = useState<Phase>('refresh')
  const [qi, setQi] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  // Payoff state
  const [xp, setXp] = useState<number | null>(null)
  const [xpNote, setXpNote] = useState<string | null>(null)

  useEffect(() => {
    if (!targetId) return
    // "Next weak skill →" navigates within this same route — App Router keeps
    // the component mounted, so reset the loop state for the new target.
    setPhase('refresh'); setQi(0); setAnswers({}); setXp(null); setXpNote(null)
    setLoading(true)
    fetch(`/api/reviews/serve?target_id=${encodeURIComponent(targetId)}`)
      .then((r) => r.json())
      .then((d: { review?: Review; target?: TargetInfo; error?: string }) => {
        if (d.error) setErr(d.error)
        else { setReview(d.review ?? null); setTarget(d.target ?? null) }
        setLoading(false)
      })
      .catch(() => { setErr('Could not load your review'); setLoading(false) })
  }, [targetId])

  // Retry-queue context (last seen level + the next weak skill to chain into).
  useEffect(() => {
    if (!targetId) return
    fetch('/api/home')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { retry?: RetryItem[] } | null) => {
        const queue = d?.retry ?? []
        const idx = queue.findIndex((it) => it.targetId === targetId)
        setQueueItem(idx >= 0 ? queue[idx] : null)
        // Next weak skill = the next queue entry that isn't this one.
        const next = idx >= 0 ? queue[idx + 1] : queue[0]
        setNextWeak(next && next.targetId !== targetId ? next : null)
      })
      .catch(() => { /* context is optional — the review still works */ })
  }, [targetId])

  const total = review?.questions.length ?? 0
  const correct = review ? review.questions.filter((q, i) => answers[i] === q.answerIndex).length : 0

  // Bank the effort XP exactly once, when the last answer lands.
  useEffect(() => {
    if (phase !== 'done' || !targetId || total === 0) return
    fetch('/api/reviews/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, correct, total }),
    })
      .then((r) => r.json())
      .then((d: { xp?: number; capped?: boolean; alreadyPaid?: boolean }) => {
        if (typeof d.xp === 'number' && d.xp > 0) setXp(d.xp)
        else if (d.alreadyPaid) setXpNote('Already banked for this skill today — it still counts as practice.')
        else if (d.capped) setXpNote('Daily review XP is maxed — the practice still counts.')
      })
      .catch(() => { /* payoff copy degrades gracefully */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const lastSeen = useMemo(() => {
    if (!queueItem?.lastObservedAt) return null
    try {
      return new Date(queueItem.lastObservedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch { return null }
  }, [queueItem])

  const statement = target?.statement ?? queueItem?.statement

  const q = review?.questions[qi]
  const chosen = answers[qi]
  const locked = chosen !== undefined

  return (
    <EnrollmentGate>
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ color: 'var(--foreground)' }}>
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Home
      </Link>

      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Building your review…</p>}
      {err && !loading && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{err}</p>}

      {review && !loading && (
        <>
          {/* header: name the skill + why you're here */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Skill review</span>
              {queueItem && (
                <span
                  className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                  style={{
                    background: queueItem.level === 1 ? 'color-mix(in oklch, var(--destructive) 14%, transparent)' : 'color-mix(in oklch, var(--reward) 20%, transparent)',
                    color: queueItem.level === 1 ? 'var(--destructive)' : 'var(--reward-foreground)',
                  }}
                >
                  Last seen: {LEVEL_LABEL[queueItem.level]}{lastSeen ? ` · ${lastSeen}` : ''}
                </span>
              )}
            </div>
            {statement && (
              <h1 className="text-lg font-semibold tracking-tight mt-1.5" style={{ lineHeight: 1.35 }}>{statement}</h1>
            )}
            {queueItem && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                This is in your retry queue because your last rating was &ldquo;{LEVEL_LABEL[queueItem.level]}.&rdquo; A quick refresh, then {total} question{total === 1 ? '' : 's'} to check yourself.
              </p>
            )}
          </div>

          {/* segmented progress: refresh beat + one segment per question */}
          <div className="mb-5 flex items-center gap-1" aria-hidden>
            <div className="rounded-full" style={{ height: 6, flex: '0 0 22%', background: phase === 'refresh' ? 'var(--reward)' : 'var(--primary)', transition: 'background .2s cubic-bezier(0.16,1,0.3,1)' }} />
            {review.questions.map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: 6,
                  transition: 'background .2s cubic-bezier(0.16,1,0.3,1)',
                  background: phase !== 'refresh' && i < qi ? 'var(--primary)' : phase === 'check' && i === qi ? 'var(--reward)' : 'var(--secondary)',
                }}
              />
            ))}
          </div>

          {/* ------------ beat 1: REFRESH ------------ */}
          {phase === 'refresh' && (
            <>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                <BookOpen size={13} /> Refresh
              </div>
              {review.blocks && review.blocks.length > 0 ? (
                <div className="mb-5">
                  <BlockRenderer blocks={review.blocks} lessonId={`review-${review.id}`} />
                </div>
              ) : (
                <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <p className="text-sm" style={{ lineHeight: 1.6 }}>{review.reteach}</p>
                </div>
              )}

              {total > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setPhase('check')}
                    className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                  >
                    I&rsquo;m refreshed — check me ({total} question{total === 1 ? '' : 's'}) <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ------------ beat 2: CHECK (one question at a time) ------------ */}
          {phase === 'check' && q && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                  <Check size={13} /> Check
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Question {qi + 1} of {total}</span>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className={`font-semibold text-sm mb-3 ${mathInline}`}>
                  <MathMarkdown content={q.q} />
                </div>
                <div className="flex flex-col gap-2">
                  {q.choices.map((c, ci) => {
                    const isAnswer = ci === q.answerIndex
                    const isChosen = chosen === ci
                    let bg = 'var(--card)', border = 'var(--border)', fg = 'var(--foreground)'
                    if (locked && isAnswer) { bg = 'color-mix(in oklch, var(--success) 16%, var(--card))'; border = 'var(--success)'; fg = 'var(--success)' }
                    else if (locked && isChosen && !isAnswer) { bg = 'color-mix(in oklch, var(--destructive) 14%, var(--card))'; border = 'var(--destructive)'; fg = 'var(--destructive)' }
                    return (
                      <button
                        key={ci}
                        disabled={locked}
                        onClick={() => setAnswers((p) => ({ ...p, [qi]: ci }))}
                        className="text-left rounded-lg border px-3 py-2 text-sm flex items-center justify-between gap-2"
                        style={{ borderColor: border, background: bg, color: fg, cursor: locked ? 'default' : 'pointer' }}
                      >
                        <span className={mathInline}><MathMarkdown content={c} /></span>
                        {locked && isAnswer && <Check size={15} />}
                        {locked && isChosen && !isAnswer && <X size={15} />}
                      </button>
                    )
                  })}
                </div>
                {locked && (
                  <div className={`text-xs mt-2.5 ${mathInline}`} style={{ color: 'var(--muted-foreground)' }}>
                    <MathMarkdown content={q.explanation} />
                  </div>
                )}
              </div>

              {locked && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => (qi + 1 < total ? setQi(qi + 1) : setPhase('done'))}
                    className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                  >
                    {qi + 1 < total ? 'Next question' : 'Finish'} <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ------------ beat 3: DONE (make the payoff land, then chain) ------------ */}
          {phase === 'done' && (
            <div className="rounded-2xl border p-5 mt-2 text-center" style={{ borderColor: 'color-mix(in oklch, var(--success) 40%, var(--border))', background: 'color-mix(in oklch, var(--success) 8%, var(--card))' }}>
              <div className="text-lg font-semibold">You got {correct} of {total} right</div>

              {xp !== null && (
                <div className="inline-flex items-center gap-1.5 mt-2 rounded-full px-3 py-1 text-sm font-bold" style={{ background: 'color-mix(in oklch, var(--reward) 20%, transparent)', color: 'var(--reward-foreground)' }}>
                  <Zap size={14} /> +{xp} XP for the practice
                </div>
              )}
              {xp === null && xpNote && (
                <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>{xpNote}</p>
              )}

              <p className="text-sm mt-3" style={{ color: 'var(--muted-foreground)' }}>
                <Flame size={13} className="inline -mt-0.5" style={{ color: 'var(--reward-foreground)' }} /> This counts toward your streak, and this skill is now primed — show it in class work and your teacher can rate it up.
              </p>

              <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                {nextWeak && (
                  <Link
                    href={`/review/${nextWeak.targetId}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold rounded-lg px-4 py-2"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  >
                    Next weak skill <ArrowRight size={15} />
                  </Link>
                )}
                <Link
                  href="/home"
                  className="inline-flex items-center text-sm font-semibold rounded-lg px-4 py-2"
                  style={nextWeak
                    ? { border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }
                    : { background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  Back to home
                </Link>
              </div>
              {nextWeak && (
                <p className="text-xs mt-2 truncate" style={{ color: 'var(--muted-foreground)' }}>Up next: {nextWeak.statement}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
    </EnrollmentGate>
  )
}
