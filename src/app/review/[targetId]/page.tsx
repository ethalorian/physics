"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Check, X, Sparkles } from 'lucide-react'
import type { ContentBlock } from '@/data/content-blocks'

// BlockRenderer pulls in recharts, react-pdf, sims, etc. — keep it lazy so the
// review page is light when blocks aren't present.
const BlockRenderer = dynamic(() => import('@/components/blocks/BlockRenderer'), { ssr: false, loading: () => null })

interface Q { q: string; choices: string[]; answerIndex: number; explanation: string }
interface Review { id: string; reteach: string; blocks: ContentBlock[] | null; questions: Q[]; shared: boolean }

export default function ReviewPage() {
  const params = useParams<{ targetId: string }>()
  const targetId = params.targetId
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  useEffect(() => {
    if (!targetId) return
    setLoading(true)
    fetch(`/api/reviews/serve?target_id=${encodeURIComponent(targetId)}`)
      .then((r) => r.json())
      .then((d: { review?: Review; error?: string }) => {
        if (d.error) setErr(d.error)
        else setReview(d.review ?? null)
        setLoading(false)
      })
      .catch(() => { setErr('Could not load your review'); setLoading(false) })
  }, [targetId])

  const total = review?.questions.length ?? 0
  const answered = Object.keys(answers).length
  const correct = review ? review.questions.filter((q, i) => answers[i] === q.answerIndex).length : 0
  const done = total > 0 && answered === total

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ color: 'var(--foreground)' }}>
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Home
      </Link>

      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Building your review…</p>}
      {err && !loading && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{err}</p>}

      {review && !loading && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Skill review</span>
          </div>

          {/* Rich re-teach: blocks if present, else fallback summary text. */}
          {review.blocks && review.blocks.length > 0 ? (
            <div className="mb-5">
              <BlockRenderer blocks={review.blocks} lessonId={`review-${review.id}`} />
            </div>
          ) : (
            <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <p className="text-sm" style={{ lineHeight: 1.6 }}>{review.reteach}</p>
            </div>
          )}

          {!review.shared && (
            <p className="text-xs mb-4 rounded-lg px-3 py-2" style={{ color: 'var(--reward-foreground)', background: 'color-mix(in oklch, var(--reward) 16%, transparent)' }}>
              This review was just generated for you — your teacher reviews it before classmates see it.
            </p>
          )}

          {/* MC questions with instant feedback */}
          <div className="flex flex-col gap-4">
            {review.questions.map((q, qi) => {
              const chosen = answers[qi]
              const locked = chosen !== undefined
              return (
                <div key={qi} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="font-semibold text-sm mb-3">{qi + 1}. {q.q}</div>
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
                          <span>{c}</span>
                          {locked && isAnswer && <Check size={15} />}
                          {locked && isChosen && !isAnswer && <X size={15} />}
                        </button>
                      )
                    })}
                  </div>
                  {locked && (
                    <p className="text-xs mt-2.5" style={{ color: 'var(--muted-foreground)' }}>{q.explanation}</p>
                  )}
                </div>
              )
            })}
          </div>

          {done && (
            <div className="rounded-2xl border p-5 mt-5 text-center" style={{ borderColor: 'color-mix(in oklch, var(--success) 40%, var(--border))', background: 'color-mix(in oklch, var(--success) 8%, var(--card))' }}>
              <div className="text-lg font-semibold">You got {correct} of {total} right</div>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Nice work strengthening this skill. Your teacher rates mastery from your class work — keep practicing.</p>
              <Link href="/home" className="inline-block mt-4 text-sm font-semibold rounded-lg px-4 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Back to home</Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
