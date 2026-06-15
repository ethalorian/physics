"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { PlayCircle, GraduationCap, ArrowRight } from 'lucide-react'

interface ClassRow { id: string; name: string; section: string | null; track: string | null }
interface LessonRow { id: string; title: string; slug: string; unit: string | null; lesson_number: number | null }
interface Win { open_at: string | null; close_at: string | null }
interface Data { classes: ClassRow[]; lessons: LessonRow[]; windows: Record<string, Win> }

function isOpen(w?: Win): boolean {
  if (!w || (!w.open_at && !w.close_at)) return false
  const now = Date.now()
  const openOk = !w.open_at || now >= Date.parse(w.open_at)
  const closeOk = !w.close_at || now <= Date.parse(w.close_at)
  return openOk && closeOk
}
const label = (l: LessonRow) => `${l.lesson_number ? `D${l.lesson_number} · ` : ''}${l.title}`

/**
 * Compact, interactive lesson-access snapshot for the Manage landing: per class,
 * what's open and a one-tap "open next". The full scheduling board lives at
 * /admin/lesson-access.
 */
export default function LessonAccessSnapshot() {
  const [data, setData] = useState<Data | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/lesson-access').then((r) => r.json()).then((d: Data) => {
      if (Array.isArray(d?.classes) && Array.isArray(d?.lessons)) setData(d)
    }).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const openNext = async (courseId: string, lessonId: string) => {
    setBusy(courseId)
    const open_at = new Date().toISOString()
    await fetch(`/api/classes/${encodeURIComponent(courseId)}/windows`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, open_at, close_at: null }),
    }).catch(() => {})
    setData((d) => (d ? { ...d, windows: { ...d.windows, [`${courseId}|${lessonId}`]: { open_at, close_at: null } } } : d))
    setBusy(null)
  }

  if (!data || data.classes.length === 0) return null

  const summary = (c: ClassRow): { openCount: number; lastOpen: LessonRow | null; nextClosed: LessonRow | null } => {
    let openCount = 0
    let lastOpen: LessonRow | null = null
    let nextClosed: LessonRow | null = null
    for (const l of data.lessons) {
      if (isOpen(data.windows[`${c.id}|${l.id}`])) { openCount++; lastOpen = l }
      else if (!nextClosed) nextClosed = l
    }
    return { openCount, lastOpen, nextClosed }
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Lesson access</h2>
        <Link href="/admin/lesson-access" className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--primary)' }}>Full board <ArrowRight size={13} /></Link>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {data.classes.map((c) => {
          const s = summary(c)
          return (
            <div key={c.id} className="rounded-2xl border p-3.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-semibold text-sm truncate">{c.section || c.name}</div>
                {c.track === 'honors'
                  ? <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: 'color-mix(in oklch, var(--primary) 18%, transparent)', color: 'var(--primary)' }}><GraduationCap size={9} /> Honors</span>
                  : <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>CPA</span>}
              </div>
              <div className="text-xs mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
                {s.openCount > 0
                  ? <>Open: <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{s.lastOpen ? label(s.lastOpen) : '—'}</span> <span style={{ color: 'var(--success)' }}>· {s.openCount} live</span></>
                  : 'Nothing open yet.'}
              </div>
              {s.nextClosed ? (
                <button onClick={() => s.nextClosed && openNext(c.id, s.nextClosed.id)} disabled={busy === c.id}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                  <PlayCircle size={14} /> {busy === c.id ? 'Opening…' : `Open next: ${label(s.nextClosed).slice(0, 20)}`}
                </button>
              ) : <div className="text-center text-xs py-2" style={{ color: 'var(--muted-foreground)' }}>All lessons open ✓</div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
