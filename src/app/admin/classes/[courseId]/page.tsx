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
type Win = { open_at: string | null; close_at: string | null }

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )
}

// <input type="datetime-local"> uses local "YYYY-MM-DDTHH:mm"; the DB stores ISO.
const toLocalInput = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null)

export default function ClassPage() {
  const params = useParams<{ courseId: string }>()
  const courseId = params.courseId
  const [data, setData] = useState<ClassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [windows, setWindows] = useState<Record<string, Win>>({})
  const [edits, setEdits] = useState<Record<string, Win>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

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

  useEffect(() => {
    if (!courseId) return
    fetch(`/api/classes/${encodeURIComponent(courseId)}/windows`)
      .then((r) => r.json())
      .then((d: { windows?: Record<string, Win> }) => { setWindows(d.windows ?? {}); setEdits(d.windows ?? {}) })
      .catch(() => {})
  }, [courseId])

  const postWindow = async (lessonId: string, win: Win) => {
    setSavingId(lessonId)
    await fetch(`/api/classes/${encodeURIComponent(courseId)}/windows`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, open_at: win.open_at, close_at: win.close_at }),
    }).catch(() => {})
    setWindows((prev) => {
      const next = { ...prev }
      if (!win.open_at && !win.close_at) delete next[lessonId]; else next[lessonId] = win
      return next
    })
    setEdits((prev) => ({ ...prev, [lessonId]: win }))
    setSavingId(null)
  }
  const saveWindow = (lessonId: string) => postWindow(lessonId, edits[lessonId] ?? { open_at: null, close_at: null })
  const openNow = (lessonId: string) => postWindow(lessonId, { open_at: new Date().toISOString(), close_at: null })
  const closeLesson = (lessonId: string) => postWindow(lessonId, { open_at: null, close_at: null })

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

          {/* Lesson schedule — per-class open/close windows */}
          <div className="text-xs font-bold uppercase tracking-widest mt-8 mb-2 flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <CalendarClock size={14} /> Lesson access — open / close for this class
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Lessons are <strong>closed</strong> until you open them for this class. Hit <strong>Open now</strong> to release one immediately, or schedule an <strong>open</strong> date (and an optional <strong>close</strong> date to stop late work). <strong>Close</strong> hides it again.
          </p>
          {data.lessons.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No published lessons yet.</p>
          ) : (
            <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'color-mix(in oklch, var(--secondary) 50%, transparent)' }}>
                    <th className="text-left text-xs font-bold uppercase tracking-wide px-4 py-2.5" style={{ color: 'var(--muted-foreground)' }}>Lesson</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wide px-3 py-2.5" style={{ color: 'var(--muted-foreground)' }}>Status</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wide px-3 py-2.5" style={{ color: 'var(--muted-foreground)' }}>Opens</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wide px-3 py-2.5" style={{ color: 'var(--muted-foreground)' }}>Closes</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.lessons.map((l, i) => {
                    const e = edits[l.id] ?? { open_at: null, close_at: null }
                    const saved = windows[l.id] ?? { open_at: null, close_at: null }
                    const changed = (e.open_at ?? null) !== (saved.open_at ?? null) || (e.close_at ?? null) !== (saved.close_at ?? null)
                    const setE = (patch: Partial<Win>) => setEdits((p) => ({ ...p, [l.id]: { ...e, ...patch } }))
                    const nowMs = Date.now()
                    const openOk = !saved.open_at || nowMs >= Date.parse(saved.open_at)
                    const closeOk = !saved.close_at || nowMs <= Date.parse(saved.close_at)
                    const hasWin = !!(saved.open_at || saved.close_at)
                    const status = !hasWin ? 'Closed' : (openOk && closeOk) ? 'Open' : (!openOk ? 'Scheduled' : 'Ended')
                    const statusColor = status === 'Open' ? 'var(--success)' : status === 'Scheduled' ? 'var(--reward)' : 'var(--muted-foreground)'
                    return (
                      <tr key={l.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <td className="px-4 py-2.5" style={{ whiteSpace: 'nowrap' }}>
                          <span className="font-medium">{l.lessonNumber ? `D${l.lessonNumber} · ` : ''}{l.title}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: `color-mix(in oklch, ${statusColor} 16%, transparent)`, color: statusColor }}>{status}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="datetime-local" value={toLocalInput(e.open_at)} onChange={(ev) => setE({ open_at: fromLocalInput(ev.target.value) })}
                            className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="datetime-local" value={toLocalInput(e.close_at)} onChange={(ev) => setE({ close_at: fromLocalInput(ev.target.value) })}
                            className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                        </td>
                        <td className="px-3 py-2.5 text-right" style={{ whiteSpace: 'nowrap' }}>
                          <div className="inline-flex items-center gap-1.5">
                            {status !== 'Open' && (
                              <button onClick={() => openNow(l.id)} disabled={savingId === l.id}
                                className="text-xs font-semibold rounded-lg px-2.5 py-1.5"
                                style={{ background: 'var(--success)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                                Open now
                              </button>
                            )}
                            {hasWin && (
                              <button onClick={() => closeLesson(l.id)} disabled={savingId === l.id}
                                className="text-xs font-semibold rounded-lg px-2.5 py-1.5"
                                style={{ background: 'transparent', color: 'var(--destructive)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                                Close
                              </button>
                            )}
                            {changed && (
                              <button onClick={() => saveWindow(l.id)} disabled={savingId === l.id}
                                className="text-xs font-semibold rounded-lg px-2.5 py-1.5"
                                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                                {savingId === l.id ? 'Saving…' : 'Save schedule'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
