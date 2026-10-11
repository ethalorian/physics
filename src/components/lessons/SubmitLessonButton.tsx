'use client'

/**
 * SubmitLessonButton — the prominent "turn in" for a lesson.
 *
 * Saving blocks makes evidence available for rating; submitting turns in the lesson.
 * LOCKED UNTIL GRADED: after submitting, the student can't re-submit
 * until the teacher has reviewed it. When the student has finished all steps, a
 * reminder nudges them to submit.
 */
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { Send, CheckCircle2, Clock } from 'lucide-react'

export default function SubmitLessonButton({ lessonId, complete = false, blocked = false, blockedReason, prepare, onChange }: { lessonId: string; complete?: boolean; blocked?: boolean; blockedReason?: string; prepare?: () => Promise<boolean>; /** S-6: the stepped reader shows its Done screen from this. */ onChange?: (state: { submittedAt: string | null; locked: boolean; feedback?: string }) => void }) {
  const { data: session } = useSession()
  const inspection = Boolean(session?.experience)
  blocked = blocked || inspection
  const studentId = session?.user?.id
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [feedback,setFeedback]=useState('')
  const [loaded,setLoaded]=useState(false)
  const [loadAttempt,setLoadAttempt]=useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)

  useEffect(() => {
    let active = true
    setLoaded(false)
    setSubmittedAt(null); setLocked(false); setFeedback(''); setError(null)
    fetch(`/api/lessons/submit?lesson_id=${encodeURIComponent(lessonId)}`)
      .then((r) => { if(!r.ok) throw new Error('Could not check whether this lesson was submitted.'); return r.json() })
      .then((d) => { if (active && d) { setLoaded(true); setSubmittedAt(d.submittedAt ?? null); setFeedback(d.feedback??''); setLocked(Boolean(d.locked)); onChange?.({ submittedAt: d.submittedAt ?? null, locked: Boolean(d.locked), feedback:d.feedback??'' }) } })
      .catch(() => { if(active) setError('Could not check submission status. Retry before submitting.') })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, studentId, loadAttempt])

  async function submit() {
    if (!loaded || locked || blocked || submitting.current || !studentId) return
    submitting.current = true
    setBusy(true)
    setError(null)
    try {
      if (prepare && !await prepare()) throw new Error('Some answers could not be saved. Your work is kept. Please retry submitting.')
      const res = await fetch('/api/lessons/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, expected_user_id: studentId }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409 && d.locked && d.submittedAt) { const at = d.submittedAt; setSubmittedAt(at); setLocked(true); onChange?.({ submittedAt: at, locked: true }); return }
        throw new Error(d.error || 'Submit failed')
      }
      if (!d.submittedAt) throw new Error('Submission could not be confirmed. Reload to check its status.')
      const at = d.submittedAt
      setSubmittedAt(at)
      setLocked(true)
      onChange?.({ submittedAt: at, locked: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  if (!loaded) return <div className="space-y-2 text-sm">{error ? <><p role="alert">{error}</p><button type="button" className="min-h-11 rounded-lg border px-4 font-semibold" onClick={()=>setLoadAttempt(n=>n+1)}>Retry submission status</button></> : <p role="status">Checking submission status…</p>}</div>

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
        {feedback&&<p className="w-full rounded-lg border bg-card p-3 text-sm whitespace-pre-wrap"><strong>Teacher feedback: </strong>{feedback}</p>}
        <button onClick={submit} disabled={busy || blocked}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <Send size={16} /> {busy ? 'Saving and submitting…' : 'Submit revision'}
        </button>
        {blocked && <span role="status" className="text-sm">{inspection ? 'Read-only walkthrough — submissions are disabled.' : blockedReason || 'Complete the required responses before submitting.'}</span>}
        {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
      </div>
    )
  }

  // Not submitted yet → prominent submit + a finish reminder.
  return (
    <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
      {complete && (
        <div className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-3 py-2"
          style={{ background: 'color-mix(in oklch, var(--reward) 16%, var(--card))', color: 'var(--reward-foreground)' }}>
          Answers saved — lesson not submitted yet.
        </div>
      )}
      <button onClick={submit} disabled={busy || blocked}
        className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-extrabold disabled:opacity-60 w-full sm:w-auto"
        style={{ background: 'var(--success)', color: '#fff', boxShadow: '0 10px 26px -8px color-mix(in oklch, var(--success) 70%, transparent)' }}>
        <Send size={18} /> {busy ? 'Saving and submitting…' : 'Submit lesson for review'}
      </button>
      <span className="text-overline inline-flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        <Clock size={12} /> Once you submit, it locks until your teacher reviews it.
      </span>
      {blocked && <span role="status" className="text-sm">{inspection ? 'Read-only walkthrough — submissions are disabled.' : blockedReason || 'Complete the required responses before submitting.'}</span>}
        {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
