"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LayoutGrid, CalendarClock, Users, TrendingUp, BookOpen, ArrowLeft, GraduationCap } from 'lucide-react'

interface Lesson { id: string; title: string; lessonNumber: number | null; unit: string }
interface ClassData {
  course: { id: string; name: string; section: string | null; teacherEmail: string | null }
  students: { id: string; name: string; firstName: string | null; lastName: string | null }[]
  lessons: Lesson[]
  summary: { studentCount: number; classMasteryAvg: number | null; ratingsLogged: number; lessonsGraded: number }
  error?: string
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

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    fetch(`/api/classes/${encodeURIComponent(courseId)}`)
      .then((r) => r.json())
      .then((d: ClassData) => {
        if (d.error) setErr(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setErr('Could not load this class'); setLoading(false) })
  }, [courseId])

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

          {/* Lesson access is now managed on one unified board for all classes. */}
          <Link href="/admin/lesson-access" className="rounded-2xl border p-4 flex items-center justify-between gap-3 mb-7"
            style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'color-mix(in oklch, var(--primary) 6%, var(--card))' }}>
            <div>
              <div className="text-sm font-semibold">Open &amp; close lessons for this class →</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>One board controls which lessons every class can see, and when.</div>
            </div>
            <CalendarClock size={18} style={{ color: 'var(--primary)' }} />
          </Link>

          <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <Users size={14} /> Roster ({data.students.length})
          </div>
          {data.students.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No students enrolled in this class yet.</p>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              {data.students.map((st, i) => (
                <div key={st.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <span className="text-sm font-medium">{st.name}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {st.lastName || '—'}{st.firstName ? `, ${st.firstName}` : ''}
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
