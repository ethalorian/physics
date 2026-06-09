"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LayoutGrid, CalendarClock, Users, TrendingUp, BookOpen, ArrowLeft, GraduationCap, Languages } from 'lucide-react'

interface Lesson { id: string; title: string; lessonNumber: number | null; unit: string }
interface ClassData {
  course: { id: string; name: string; section: string | null; teacherEmail: string | null; mathTranslationEnabled?: boolean }
  students: { id: string; name: string; firstName: string | null; lastName: string | null; lastLoginAt: string | null; lastSeenAt: string | null }[]
  lessons: Lesson[]
  summary: { studentCount: number; classMasteryAvg: number | null; ratingsLogged: number; lessonsGraded: number }
  error?: string
}

const fmtSeen = (iso: string | null) => {
  if (!iso) return 'Never signed in'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60000) return 'just now'
  const m = Math.floor(ms / 60000); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
const seenColor = (iso: string | null) => {
  if (!iso) return 'var(--muted-foreground)'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 24 * 3600000) return 'var(--success)'
  if (ms < 7 * 24 * 3600000) return 'var(--reward-foreground)'
  return 'var(--muted-foreground)'
}

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )
}

export default function ClassPage() {
  const params = useParams<{ courseId: string }>()
  const courseId = params.courseId
  const [data, setData] = useState<ClassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [mathTx, setMathTx] = useState(false)
  const [savingTx, setSavingTx] = useState(false)

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    fetch(`/api/classes/${encodeURIComponent(courseId)}`)
      .then((r) => r.json())
      .then((d: ClassData) => {
        if (d.error) setErr(d.error)
        else { setData(d); setMathTx(Boolean(d.course?.mathTranslationEnabled)) }
        setLoading(false)
      })
      .catch(() => { setErr('Could not load this class'); setLoading(false) })
  }, [courseId])

  const toggleMathTx = async (next: boolean) => {
    setMathTx(next); setSavingTx(true)
    try {
      const res = await fetch(`/api/classes/${encodeURIComponent(courseId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ math_translation_enabled: next }),
      })
      if (!res.ok) setMathTx(!next)
    } catch { setMathTx(!next) } finally { setSavingTx(false) }
  }

  const c = data?.course
  const s = data?.summary
  const controlRoomHref = c
    ? `/admin/control-room?class=${encodeURIComponent(c.id)}&label=${encodeURIComponent(c.section ? `${c.name} · ${c.section}` : c.name)}`
    : '/admin/control-room'

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/oversight" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> All classes
      </Link>

      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading class…</p>}
      {err && !loading && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{err}</p>}

      {c && !loading && (
        <>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={16} style={{ color: 'var(--primary)' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Class</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {c.section ? `${c.section} · ` : ''}{c.teacherEmail ?? 'Unassigned'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={controlRoomHref} className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                <LayoutGrid size={15} /> Open in Control Room
              </Link>
              <Link href="/admin/pacing" className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <CalendarClock size={15} /> Pacing
              </Link>
            </div>
          </div>

          {s && (
            <div className="grid gap-3 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <Tile value={s.studentCount} label="Students" />
              <Tile value={s.classMasteryAvg != null ? s.classMasteryAvg.toFixed(1) : '—'} label="Class mastery (1–3)" />
              <Tile value={s.ratingsLogged} label="Mastery ratings logged" />
              <Tile value={s.lessonsGraded} label="Lesson scores in gradebook" />
            </div>
          )}

          {/* Per-section setting: math-fluency translations (SEI control). */}
          <div className="rounded-2xl border p-4 mb-7 flex items-start justify-between gap-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Languages size={15} style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-semibold">Math fluency translations</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)', maxWidth: 560 }}>
                When on, students in this section get a Translate button on their daily math warm-up (Spanish, French, Portuguese, Haitian Creole). Turn it off when you want them working in English only.
              </p>
            </div>
            <button onClick={() => toggleMathTx(!mathTx)} disabled={savingTx} aria-pressed={mathTx}
              className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold" style={{ border: '1px solid var(--border)', background: mathTx ? 'var(--primary)' : 'var(--card)', color: mathTx ? 'var(--primary-foreground)' : 'var(--muted-foreground)', opacity: savingTx ? 0.6 : 1 }}>
              {mathTx ? 'On' : 'Off'}
            </button>
          </div>

          {/* Lesson access is now managed on one unified board for all classes. */}
          <Link href="/admin/lesson-access" className="rounded-2xl border p-4 flex items-center justify-between gap-3 mb-7"
            style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'color-mix(in oklch, var(--primary) 6%, var(--card))' }}>
            <div>
              <div className="text-sm font-semibold">Open &amp; close lessons for this class →</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>One board controls which lessons every class can see, and when.</div>
            </div>
            <CalendarClock size={18} style={{ color: 'var(--primary)' }} />
          </Link>

          <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-between gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <span className="flex items-center gap-1.5"><Users size={14} /> Roster ({data.students.length})</span>
            <span className="font-medium normal-case tracking-normal">Last signed in</span>
          </div>
          {data.students.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No students enrolled in this class yet.</p>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              {data.students.map((st, i) => (
                <div key={st.id} className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <span className="text-sm font-medium truncate">{st.name}</span>
                  <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: seenColor(st.lastSeenAt) }}
                    title={st.lastSeenAt ? `Last seen ${new Date(st.lastSeenAt).toLocaleString()}` : 'No recorded sign-in yet'}
                  >
                    {fmtSeen(st.lastSeenAt)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <BookOpen size={15} /> <TrendingUp size={15} />
            <span>Open the Control Room to rate work and copy grades for just this class.</span>
          </div>
        </>
      )}
    </div>
  )
}
