"use client"

// Notes from your teacher — the student-facing view of teacher_feedback.
// One-way (no replies): written feedback composed in the grading drawers,
// anchored to a learning target or math competency when sent in context.
// Lives on the Growth page so the note sits beside the evidence it's about.

import { useEffect, useState } from 'react'

interface FeedbackItem {
  id: string
  teacher_email: string
  message: string
  created_at: string
  target: { slug: string | null; statement: string | null } | null
  competency: { code: string | null; statement: string | null } | null
}

function when(iso: string): string {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function TeacherFeedbackCard() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/feedback')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.feedback) setItems(d.feedback) })
      .catch(() => {})
  }, [])

  if (items.length === 0) return null
  const shown = expanded ? items : items.slice(0, 3)

  return (
    <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>💬 Notes from your teacher</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
        Written feedback on your work — each note names what&apos;s strong and what to try next.
      </p>
      <div className="flex flex-col gap-2.5">
        {shown.map((f) => (
          <div key={f.id} className="rounded-lg px-3 py-2.5" style={{ background: 'color-mix(in oklch, var(--secondary) 45%, transparent)', border: '0.5px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {f.target?.slug && (
                <span className="rounded px-1.5 py-0.5 font-semibold" title={f.target.statement ?? undefined} style={{ background: 'color-mix(in oklch, var(--reward) 18%, transparent)', color: 'var(--reward-foreground)' }}>
                  {f.target.slug}
                </span>
              )}
              {f.competency?.code && (
                <span className="rounded px-1.5 py-0.5 font-semibold" title={f.competency.statement ?? undefined} style={{ background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>
                  {f.competency.code}
                </span>
              )}
              {!f.target?.slug && !f.competency?.code && <span>General note</span>}
              <span className="ml-auto">{when(f.created_at)}</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{f.message}</p>
          </div>
        ))}
      </div>
      {items.length > 3 && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-xs font-semibold" style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}>
          {expanded ? 'Show fewer' : `Show all ${items.length}`}
        </button>
      )}
    </div>
  )
}
