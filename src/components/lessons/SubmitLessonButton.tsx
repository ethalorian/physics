'use client'

/**
 * SubmitLessonButton — the prominent "turn in" for a lesson.
 *
 * Saving blocks keeps a draft; this is what tells the teacher the work is ready
 * to grade. LOCKED UNTIL GRADED: after submitting, the student can't re-submit
 * until the teacher has reviewed it. When the student has finished all steps, a
 * reminder nudges them to submit.
 */
import { useEffect, useState } from 'react'
import { Send, CheckCircle2, Clock, PartyPopper } from 'lucide-react'

export default function SubmitLessonButton({ lessonId, complete = false }: { lessonId: string; complete?: boolean }) {
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/lessons/submit?lesson_id=${encodeURIComponent(lessonId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d) { setSubmittedAt(d.submittedAt ?? null); setLocked(Boolean(d.locked)) } })
      .catch(() => {})
    return () => { active = false }
  }, [lessonId])

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lessons/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409) { setSubmittedAt(d.submittedAt ?? new Date().toISOString()); setLocked(true); return }
        throw new Error(d.error || 'Submit failed')
      }
      setSubmittedAt(d.submittedAt ?? new Date().toISOString())
      setLocked(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  // Submitted and still awaiting review → locked.
  if (submittedAt && locked) {
    return (
      <div className="w-full sm:w-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
        style={{ background: 'color-mix(in oklch, var(--success) 14%, var(--card))', color: 'var(--success)', border: '1px solid color-mix(in oklch, var(--success) 45%, var(--border))' }}>
        <CheckCircle2 size={18} /> Submitted — locked until your teacher reviews it.
      </div>
    )
  }

  // Reviewed → may revise and submit again.
  if (submittedAt && !locked) {
    return (
      <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-1">
        <span className="text-xs font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
          <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> Reviewed by your teacher — you can revise and submit again.
        </span>
        <button onClick={submit} disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <Send size={16} /> {busy ? 'Submitting…' : 'Submit revision'}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    )
  }

  // Not submitted yet → prominent submit + a finish reminder.
  return (
    <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
      {complete && (
        <div className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-3 py-2"
          style={{ background: 'color-mix(in oklch, var(--reward) 16%, var(--card))', color: 'var(--reward-foreground)' }}>
          <PartyPopper size={16} /> You finished every step — don&apos;t forget to submit!
        </div>
      )}
      <button onClick={submit} disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-extrabold disabled:opacity-60 w-full sm:w-auto"
        style={{ background: 'var(--success)', color: '#fff', boxShadow: '0 10px 26px -8px color-mix(in oklch, var(--success) 70%, transparent)' }}>
        <Send size={18} /> {busy ? 'Submitting…' : 'Submit lesson for review'}
      </button>
      <span className="text-[11px] inline-flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        <Clock size={12} /> Once you submit, it locks until your teacher reviews it.
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
