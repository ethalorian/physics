"use client"

// Notes from your teacher — the student-facing view of teacher_feedback.
// One-way (no replies): written feedback composed in the grading drawers,
// anchored to a learning target or math competency when sent in context.
// Lives on the Growth page so the note sits beside the evidence it's about.

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import styles from './teacher-feedback.module.css'

interface FeedbackItem {
  id: string
  submission_id?: string | null
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

export default function TeacherFeedbackCard({ initialCount = 3, featured = false }: { initialCount?: number; featured?: boolean } = {}) {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoading(true); setError(false)
    fetch('/api/feedback', { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error('feedback')
        const data = await r.json()
        if (!Array.isArray(data.feedback)) throw new Error('feedback')
        return data.feedback as FeedbackItem[]
      })
      .then(feedback => { if (active) setItems(feedback) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [retry])

  if (loading) return <p role="status" className="p-4 text-sm text-muted-foreground">Loading teacher feedback…</p>
  if (error) return <div role="alert" className="flex flex-wrap items-center gap-2 p-4 text-sm">Teacher feedback couldn’t load.<Button variant="outline" className="min-h-11" onClick={() => setRetry(n => n + 1)}>Retry feedback</Button></div>
  if (items.length === 0) return <p className="p-4 text-sm text-muted-foreground">No written feedback yet. Your teacher’s next note will appear here.</p>
  const shown = expanded ? items : items.slice(0, initialCount)

  if (featured) return <div className={styles.featured}>
    <div className={styles.noteHeader}><span className={styles.noteIcon}><MessageCircle size={20} aria-hidden="true" /></span><div><h3 className="text-sm font-semibold">From your teacher</h3><p className="text-xs text-muted-foreground">Your latest written feedback</p></div></div>
    {shown.map(f => <article key={f.id} className={styles.note}>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{when(f.created_at)}</p>
      <p className={styles.message}>{f.message}</p>
      {(f.target?.statement || f.target?.slug || f.competency?.statement || f.competency?.code) && <p className={styles.context}>{[f.target?.slug, f.target?.statement, f.competency?.code, f.competency?.statement].filter(Boolean).join(' · ')}</p>}
      {f.submission_id && <Button asChild className="mt-4 min-h-11"><Link href="/dashboard/math-spine#math-feedback">Open my work and respond<ArrowRight aria-hidden="true" /></Link></Button>}
    </article>)}
    {items.length > initialCount && <Button variant="ghost" className="mt-4 min-h-11" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>{expanded ? 'Show fewer' : `Show all ${items.length}`}</Button>}
  </div>

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>Notes from your teacher</h3>
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
            {f.submission_id && <a className="block min-h-11 underline text-sm" href="/dashboard/math-spine#math-feedback">Open my work and respond</a>}
            <p className="text-sm" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{f.message}</p>
          </div>
        ))}
      </div>
      {items.length > initialCount && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-2 min-h-11 text-sm font-semibold" style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}>
          {expanded ? 'Show fewer' : `Show all ${items.length}`}
        </button>
      )}
    </div>
  )
}
