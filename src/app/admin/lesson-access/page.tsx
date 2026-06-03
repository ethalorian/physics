"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, DoorOpen, Lock, Clock, Check, CalendarClock } from 'lucide-react'

interface ClassRow { id: string; name: string; section: string | null }
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

export default function LessonAccessPage() {
  const [data, setData] = useState<Data | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [edit, setEdit] = useState<{ courseId: string; lessonId: string } | null>(null)
  const [eOpen, setEOpen] = useState('')
  const [eClose, setEClose] = useState('')

  const load = useCallback(() => {
    fetch('/api/lesson-access').then((r) => r.json()).then((d: Data) => {
      if (Array.isArray(d?.classes) && Array.isArray(d?.lessons)) setData(d)
    }).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  // Write one cell's window via the existing per-class endpoint.
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

  // Per-class bulk (loop the published lessons).
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

  // Per-lesson across all classes (reuses the open-all endpoint).
  const bulkLesson = async (lessonId: string, action: 'open' | 'close') => {
    setBusy(`row:${lessonId}`)
    await fetch(`/api/lessons/${lessonId}/open-all`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    }).catch(() => {})
    setBusy(null); load()
  }

  const cellStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)' }
  const className = (c: ClassRow) => c.section ? `${c.section}` : c.name

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/teacher" className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Dashboard
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock size={18} style={{ color: 'var(--primary)' }} />
        <h1 className="text-2xl font-semibold tracking-tight">Lesson access</h1>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        These are the published lessons you can release to your classes. Tap a cell to open or close a lesson now,
        or hit the calendar icon to set open and close dates. New lessons appear here once they’re published.
      </p>

      {!data ? (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
      ) : data.classes.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No classes found. Sync a roster first.</p>
      ) : (
        <div className="rounded-2xl border overflow-x-auto" style={cellStyle}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'color-mix(in oklch, var(--secondary) 50%, transparent)' }}>
                <th className="text-left text-xs font-bold uppercase tracking-wide px-3 py-2.5" style={{ color: 'var(--muted-foreground)', position: 'sticky', left: 0, background: 'var(--card)' }}>Lesson</th>
                {data.classes.map((c) => (
                  <th key={c.id} className="px-2 py-2 text-center" style={{ minWidth: 96 }}>
                    <div className="text-xs font-bold">{className(c)}</div>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <button onClick={() => bulkClass(c.id, 'open')} disabled={busy === `col:${c.id}`} className="text-[10px] underline" style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>open all</button>
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <button onClick={() => bulkClass(c.id, 'close')} disabled={busy === `col:${c.id}`} className="text-[10px] underline" style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}>close all</button>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.lessons.map((l, i) => (
                <tr key={l.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <td className="px-3 py-2" style={{ whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--card)' }}>
                    <span className="font-medium">{l.lesson_number ? `D${l.lesson_number} · ` : ''}{l.title}</span>
                  </td>
                  {data.classes.map((c) => {
                    const key = `${c.id}|${l.id}`
                    const w = data.windows[key]
                    const st = statusOf(w)
                    const s = STATUS_STYLE[st]
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
                    {l.published ? (
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => bulkLesson(l.id, 'open')} disabled={busy === `row:${l.id}`}
                          className="text-[11px] font-semibold inline-flex items-center gap-1 rounded-lg border px-2 py-1"
                          style={{ borderColor: 'color-mix(in oklch, var(--primary) 45%, var(--border))', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>
                          <DoorOpen size={12} /> {busy === `row:${l.id}` ? '…' : 'open everywhere'}
                        </button>
                        <button onClick={() => bulkLesson(l.id, 'close')} disabled={busy === `row:${l.id}`}
                          className="text-[11px] underline" style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}>close</button>
                      </div>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>publish first</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule editor for a single cell */}
      {edit && data && (
        <div className="fixed inset-0 grid place-items-center p-4" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 50 }} onClick={() => setEdit(null)}>
          <div className="rounded-2xl border p-5 w-full max-w-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-1">Schedule access</div>
            <div className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {(() => { const l = data.lessons.find((x) => x.id === edit.lessonId); const c = data.classes.find((x) => x.id === edit.courseId); return `${l ? (l.lesson_number ? `D${l.lesson_number} · ` : '') + l.title : ''} — ${c ? className(c) : ''}` })()}
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
