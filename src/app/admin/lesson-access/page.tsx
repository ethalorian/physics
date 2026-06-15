"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, DoorOpen, Lock, Clock, Check, CalendarClock, Search, ChevronDown, ChevronRight, PlayCircle, GraduationCap } from 'lucide-react'

interface ClassRow { id: string; name: string; section: string | null; track: string | null }
interface LessonRow { id: string; title: string; slug: string; unit: string | null; lesson_number: number | null; published: boolean }
interface Win { open_at: string | null; close_at: string | null }
interface Data { classes: ClassRow[]; lessons: LessonRow[]; windows: Record<string, Win> }

type Status = 'open' | 'closed' | 'scheduled' | 'ended'
function statusOf(w: Win | undefined): Status {
  if (!w || (!w.open_at && !w.close_at)) return 'closed'
  const now = Date.now()
  const openOk = !w.open_at || now >= Date.parse(w.open_at)
  const closeOk = !w.close_at || now <= Date.parse(w.close_at)
  if (openOk && closeOk) return 'open'
  if (!openOk) return 'scheduled'
  return 'ended'
}
const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  open: { bg: 'color-mix(in oklch, var(--success) 16%, transparent)', color: 'var(--success)', border: 'color-mix(in oklch, var(--success) 45%, var(--border))' },
  scheduled: { bg: 'color-mix(in oklch, var(--reward) 20%, transparent)', color: 'var(--reward-foreground)', border: 'color-mix(in oklch, var(--reward) 50%, var(--border))' },
  ended: { bg: 'transparent', color: 'var(--muted-foreground)', border: 'var(--border)' },
  closed: { bg: 'transparent', color: 'var(--muted-foreground)', border: 'var(--border)' },
}
const toInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '')
const fromInput = (v: string) => (v ? new Date(v).toISOString() : null)
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '')
const unitShort = (u: string | null) => { const m = u?.match(/Unit\s*(\d+)/i); return m ? `U${m[1]}` : (u ?? '—') }
const lessonLabel = (l: LessonRow) => `${l.lesson_number ? `D${l.lesson_number} · ` : ''}${l.title}`

function TrackBadge({ track }: { track: string | null }) {
  if (track === 'honors') return (
    <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide"
      style={{ background: 'color-mix(in oklch, var(--primary) 18%, transparent)', color: 'var(--primary)' }}>
      <GraduationCap size={9} /> Honors
    </span>
  )
  return <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>CPA</span>
}

export default function LessonAccessPage() {
  const [data, setData] = useState<Data | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [edit, setEdit] = useState<{ courseId: string; lessonId: string } | null>(null)
  const [eOpen, setEOpen] = useState('')
  const [eClose, setEClose] = useState('')
  const [query, setQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const load = useCallback(() => {
    fetch('/api/lesson-access').then((r) => r.json()).then((d: Data) => {
      if (Array.isArray(d?.classes) && Array.isArray(d?.lessons)) setData(d)
    }).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  // Ordered distinct units, and lessons grouped under each.
  const units = useMemo(() => {
    if (!data) return [] as string[]
    const seen: string[] = []
    for (const l of data.lessons) { const u = l.unit ?? '—'; if (!seen.includes(u)) seen.push(u) }
    return seen
  }, [data])

  // On first load, expand only units that have something open (so the page opens
  // on "where you are"), collapse the rest.
  useEffect(() => {
    if (!data || units.length === 0) return
    const next: Record<string, boolean> = {}
    for (const u of units) {
      const hasOpen = data.lessons.some((l) => (l.unit ?? '—') === u &&
        data.classes.some((c) => statusOf(data.windows[`${c.id}|${l.id}`]) === 'open'))
      next[u] = !hasOpen // collapsed = true when nothing open
    }
    // if nothing is open anywhere, expand the first unit so the page isn't all-collapsed
    if (Object.values(next).every(Boolean) && units[0]) next[units[0]] = false
    setCollapsed(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.classes.length, data?.lessons.length])

  const setWindow = async (courseId: string, lessonId: string, win: Win) => {
    const key = `${courseId}|${lessonId}`
    setBusy(key)
    await fetch(`/api/classes/${encodeURIComponent(courseId)}/windows`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, open_at: win.open_at, close_at: win.close_at }),
    }).catch(() => {})
    setData((d) => {
      if (!d) return d
      const windows = { ...d.windows }
      if (!win.open_at && !win.close_at) delete windows[key]; else windows[key] = win
      return { ...d, windows }
    })
    setBusy(null)
  }

  const toggleCell = (courseId: string, lessonId: string) => {
    if (!data) return
    const st = statusOf(data.windows[`${courseId}|${lessonId}`])
    if (st === 'open' || st === 'scheduled') setWindow(courseId, lessonId, { open_at: null, close_at: null })
    else setWindow(courseId, lessonId, { open_at: new Date().toISOString(), close_at: null })
  }

  const saveSchedule = async () => {
    if (!edit) return
    await setWindow(edit.courseId, edit.lessonId, { open_at: fromInput(eOpen), close_at: fromInput(eClose) })
    setEdit(null)
  }

  const bulkClass = async (courseId: string, action: 'open' | 'close') => {
    if (!data) return
    setBusy(`col:${courseId}`)
    for (const l of data.lessons.filter((x) => x.published)) {
      const win = action === 'open' ? { open_at: new Date().toISOString(), close_at: null } : { open_at: null, close_at: null }
      await fetch(`/api/classes/${encodeURIComponent(courseId)}/windows`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: l.id, open_at: win.open_at, close_at: win.close_at }),
      }).catch(() => {})
    }
    setBusy(null); load()
  }

  const bulkLesson = async (lessonId: string, action: 'open' | 'close') => {
    setBusy(`row:${lessonId}`)
    await fetch(`/api/lessons/${lessonId}/open-all`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    }).catch(() => {})
    setBusy(null); load()
  }

  const className = (c: ClassRow) => c.section ? c.section : c.name

  // Per-class "today" summary: how many open, the furthest open lesson, the next to open.
  const summary = (c: ClassRow): { openCount: number; lastOpen: LessonRow | null; nextClosed: LessonRow | null } => {
    let openCount = 0
    let lastOpen: LessonRow | null = null
    let nextClosed: LessonRow | null = null
    if (data) data.lessons.forEach((l) => {
      const st = statusOf(data.windows[`${c.id}|${l.id}`])
      if (st === 'open') { openCount++; lastOpen = l }
      else if (!nextClosed && (st === 'closed' || st === 'ended')) nextClosed = l
    })
    return { openCount, lastOpen, nextClosed }
  }

  const filtering = query.trim() !== '' || statusFilter !== 'all'
  const matches = (l: LessonRow) => {
    if (unitFilter !== 'all' && (l.unit ?? '—') !== unitFilter) return false
    if (query.trim() && !lessonLabel(l).toLowerCase().includes(query.trim().toLowerCase())) return false
    if (statusFilter !== 'all' && data) {
      const any = data.classes.some((c) => statusOf(data.windows[`${c.id}|${l.id}`]) === statusFilter)
      if (!any) return false
    }
    return true
  }

  return (
    <div className="max-w-7xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/teacher" className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Dashboard
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock size={20} style={{ color: 'var(--primary)' }} />
        <h1 className="text-2xl font-semibold tracking-tight">Lesson access</h1>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
        Release lessons to your classes. Use the cards to open the next lesson in a click, or the planner below to schedule dates and manage any lesson.
      </p>

      {!data ? (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
      ) : data.classes.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No classes found. Sync a roster first.</p>
      ) : (
        <>
          {/* ── TODAY RAIL ─────────────────────────────────────────── */}
          <div className="grid gap-3 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {data.classes.map((c) => {
              const s = summary(c)
              return (
                <div key={c.id} className="rounded-2xl border p-3.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-semibold text-sm truncate">{className(c)}</div>
                    <TrackBadge track={c.track} />
                  </div>
                  <div className="text-xs mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
                    {s.openCount > 0
                      ? <>Open now: <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{s.lastOpen ? lessonLabel(s.lastOpen) : '—'}</span> <span style={{ color: 'var(--success)' }}>· {s.openCount} live</span></>
                      : 'Nothing open yet.'}
                  </div>
                  {s.nextClosed ? (
                    <button onClick={() => s.nextClosed && setWindow(c.id, s.nextClosed.id, { open_at: new Date().toISOString(), close_at: null })}
                      disabled={busy === `${c.id}|${s.nextClosed.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                      <PlayCircle size={14} /> Open next: {lessonLabel(s.nextClosed).slice(0, 22)}
                    </button>
                  ) : (
                    <div className="text-center text-xs py-2" style={{ color: 'var(--muted-foreground)' }}>All lessons open ✓</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── PLANNER TOOLBAR ────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative">
              <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: 'var(--muted-foreground)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lessons…"
                className="rounded-lg border pl-7 pr-2.5 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)', minWidth: 180 }} />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', ...units] as string[]).map((u) => {
                const on = unitFilter === u
                return (
                  <button key={u} onClick={() => setUnitFilter(u)}
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: on ? 'var(--primary)' : 'var(--card)', color: on ? 'var(--primary-foreground)' : 'var(--muted-foreground)', border: `1px solid ${on ? 'transparent' : 'var(--border)'}`, cursor: 'pointer' }}>
                    {u === 'all' ? 'All units' : unitShort(u)}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {(['all', 'open', 'scheduled', 'closed'] as const).map((st) => {
                const on = statusFilter === st
                return (
                  <button key={st} onClick={() => setStatusFilter(st)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                    style={{ background: on ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'transparent', color: on ? 'var(--primary)' : 'var(--muted-foreground)', border: `1px solid ${on ? 'color-mix(in oklch, var(--primary) 40%, var(--border))' : 'var(--border)'}`, cursor: 'pointer' }}>
                    {st === 'all' ? 'Any status' : st}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span className="inline-flex items-center gap-1"><Check size={12} style={{ color: 'var(--success)' }} /> open</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} style={{ color: 'var(--reward-foreground)' }} /> scheduled</span>
            <span className="inline-flex items-center gap-1"><Lock size={12} /> closed</span>
            <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> set dates</span>
          </div>

          {/* ── PLANNER MATRIX ─────────────────────────────────────── */}
          <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'color-mix(in oklch, var(--secondary) 50%, transparent)' }}>
                  <th className="text-left text-xs font-bold uppercase tracking-wide px-3 py-2.5" style={{ color: 'var(--muted-foreground)', position: 'sticky', left: 0, background: 'var(--card)', zIndex: 2 }}>Lesson</th>
                  {data.classes.map((c) => (
                    <th key={c.id} className="px-2 py-2 text-center" style={{ minWidth: 104 }}>
                      <div className="flex items-center justify-center gap-1"><span className="text-xs font-bold">{className(c)}</span><TrackBadge track={c.track} /></div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <button onClick={() => bulkClass(c.id, 'open')} disabled={busy === `col:${c.id}`} title="Open all lessons for this class" className="grid place-items-center rounded p-0.5" style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}><DoorOpen size={13} /></button>
                        <button onClick={() => bulkClass(c.id, 'close')} disabled={busy === `col:${c.id}`} title="Close all lessons for this class" className="grid place-items-center rounded p-0.5" style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}><Lock size={12} /></button>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {units.filter((u) => unitFilter === 'all' || u === unitFilter).map((u) => {
                  const unitLessons = data.lessons.filter((l) => (l.unit ?? '—') === u && matches(l))
                  if (unitLessons.length === 0) return null
                  const isCollapsed = filtering ? false : collapsed[u]
                  return (
                    <UnitGroup key={u} unit={u} count={unitLessons.length} collapsed={!!isCollapsed} colSpan={data.classes.length + 2}
                      onToggle={() => setCollapsed((m) => ({ ...m, [u]: !m[u] }))}>
                      {!isCollapsed && unitLessons.map((l) => (
                        <tr key={l.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-3 py-2" style={{ whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--card)' }}>
                            <span className="font-medium">{lessonLabel(l)}</span>
                          </td>
                          {data.classes.map((c) => {
                            const key = `${c.id}|${l.id}`
                            const w = data.windows[key]; const st = statusOf(w); const s = STATUS_STYLE[st]
                            return (
                              <td key={c.id} className="px-2 py-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => toggleCell(c.id, l.id)} disabled={busy === key}
                                    title={st === 'open' ? 'Open — click to close' : st === 'scheduled' ? `Scheduled for ${fmt(w?.open_at ?? null)} — click to close` : 'Closed — click to open now'}
                                    className="rounded-full px-2 py-0.5 text-[11px] inline-flex items-center gap-1"
                                    style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, cursor: busy === key ? 'default' : 'pointer' }}>
                                    {st === 'open' ? <Check size={11} /> : st === 'scheduled' ? <Clock size={11} /> : <Lock size={11} />}
                                    {st === 'open' ? 'open' : st === 'scheduled' ? fmt(w?.open_at ?? null) : st === 'ended' ? 'ended' : 'closed'}
                                  </button>
                                  <button onClick={() => { setEdit({ courseId: c.id, lessonId: l.id }); setEOpen(toInput(w?.open_at ?? null)); setEClose(toInput(w?.close_at ?? null)) }}
                                    title="Schedule dates" className="grid place-items-center" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                                    <CalendarClock size={13} />
                                  </button>
                                </div>
                              </td>
                            )
                          })}
                          <td className="px-3 py-2 text-right" style={{ whiteSpace: 'nowrap' }}>
                            <button onClick={() => bulkLesson(l.id, 'open')} disabled={busy === `row:${l.id}`}
                              className="text-[11px] font-semibold inline-flex items-center gap-1 rounded-lg border px-2 py-1"
                              style={{ borderColor: 'color-mix(in oklch, var(--primary) 45%, var(--border))', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>
                              <DoorOpen size={12} /> {busy === `row:${l.id}` ? '…' : 'all'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </UnitGroup>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Schedule editor for a single cell */}
      {edit && data && (
        <div className="fixed inset-0 grid place-items-center p-4" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 50 }} onClick={() => setEdit(null)}>
          <div className="rounded-2xl border p-5 w-full max-w-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-1">Schedule access</div>
            <div className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {(() => { const l = data.lessons.find((x) => x.id === edit.lessonId); const c = data.classes.find((x) => x.id === edit.courseId); return `${l ? lessonLabel(l) : ''} — ${c ? className(c) : ''}` })()}
            </div>
            <label className="text-xs block mb-2" style={{ color: 'var(--muted-foreground)' }}>Opens
              <input type="datetime-local" value={eOpen} onChange={(e) => setEOpen(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm mt-1" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </label>
            <label className="text-xs block mb-3" style={{ color: 'var(--muted-foreground)' }}>Closes
              <input type="datetime-local" value={eClose} onChange={(e) => setEClose(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm mt-1" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </label>
            <div className="flex items-center gap-2">
              <button onClick={saveSchedule} className="text-sm font-semibold rounded-lg px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setWindow(edit.courseId, edit.lessonId, { open_at: null, close_at: null }); setEdit(null) }} className="text-sm rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--destructive)', background: 'transparent', cursor: 'pointer' }}>Close access</button>
              <button onClick={() => setEdit(null)} className="text-sm ml-auto" style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UnitGroup({ unit, count, collapsed, colSpan, onToggle, children }: {
  unit: string; count: number; collapsed: boolean; colSpan: number; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <>
      <tr>
        <td colSpan={colSpan} className="px-3 py-2" style={{ background: 'color-mix(in oklch, var(--secondary) 35%, var(--card))', borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={onToggle}>
          <div className="flex items-center gap-2">
            {collapsed ? <ChevronRight size={15} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted-foreground)' }} />}
            <span className="font-semibold text-sm">{unit}</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· {count} {count === 1 ? 'lesson' : 'lessons'}</span>
          </div>
        </td>
      </tr>
      {children}
    </>
  )
}
