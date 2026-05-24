"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, CalendarClock, Check, ChevronDown, ChevronUp, Sliders } from 'lucide-react'
import { getUserRole } from '@/lib/permissions'

interface Course { id: string; name: string; section: string | null; google_course_id: string | null }
interface PlanItem { index: number; title: string; lessonId: string | null; unitOrder: number; kind: 'lesson' | 'unit'; plannedDays: number }
interface Schedule { start_date: string | null; meeting_days: number[]; no_school_dates: string[] }
interface PacingResult {
  notStarted: boolean; elapsed: number; totalDays: number
  plannedIndex: number | null; plannedTitle: string | null
  actualIndex: number | null; actualTitle: string | null
  actualSource: 'auto' | 'confirmed' | 'none'; deltaDays: number
  status: 'on' | 'ahead' | 'behind' | 'unknown'
}
interface SectionData { result: PacingResult; items: PlanItem[]; autoIndex: number | null; confirmed: boolean; schedule: Schedule }

const STATUS: Record<PacingResult['status'], { label: string; color: string }> = {
  behind: { label: 'Behind', color: '#C08B8B' },
  on: { label: 'On pace', color: 'var(--success)' },
  ahead: { label: 'Ahead', color: 'var(--primary)' },
  unknown: { label: 'No data', color: 'var(--muted-foreground)' },
}
const WEEKDAYS = [{ d: 1, l: 'Mon' }, { d: 2, l: 'Tue' }, { d: 3, l: 'Wed' }, { d: 4, l: 'Thu' }, { d: 5, l: 'Fri' }, { d: 6, l: 'Sat' }, { d: 0, l: 'Sun' }]

function deltaLabel(d: number, status: PacingResult['status']): string {
  if (status === 'unknown') return '—'
  if (Math.abs(d) < 0.1) return 'on pace'
  const n = Math.abs(d) % 1 === 0 ? Math.abs(d).toString() : Math.abs(d).toFixed(1)
  return d > 0 ? `${n} days ahead` : `${n} days behind`
}

export default function PacingPage() {
  const { data: session } = useSession()
  const isAdmin = getUserRole(session?.user?.email) === 'admin'
  const [courses, setCourses] = useState<Course[] | null>(null)

  useEffect(() => {
    fetch('/api/courses').then((r) => r.json())
      .then((d: { courses?: Course[] }) => setCourses((d.courses ?? []).filter((c) => c.google_course_id)))
      .catch(() => setCourses([]))
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center justify-between mb-4">
        <Link href="/admin/home" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft size={15} /> Command center
        </Link>
        {isAdmin && (
          <Link href="/admin/pacing/overview" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
            All sections overview →
          </Link>
        )}
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{
        border: '1px solid color-mix(in oklch, var(--primary) 30%, var(--border))',
        background: 'radial-gradient(90% 140% at 92% -20%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 55%), var(--card)',
      }}>
        <div className="flex items-center gap-2 mb-1">
          <CalendarClock size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Pacing tracker</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Map each section to the calendar</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Set each section&apos;s calendar, then track where it is against the suggested pace. The app detects position from student work; you confirm or nudge it.
        </p>
      </div>

      {isAdmin && <GuideEditor />}

      {courses === null ? (
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading sections…</div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border p-5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}>
          No synced sections yet. Connect Google Classroom and import a roster first.
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => <SectionCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Admin: edit the master pace
// ---------------------------------------------------------------------------
function GuideEditor() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<PlanItem[] | null>(null)
  const [units, setUnits] = useState<{ order_index: number; name: string; allotted_days: number | null }[]>([])
  const [edits, setEdits] = useState<Record<string, number>>({}) // lessonId -> days
  const [unitEdits, setUnitEdits] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open || items) return
    fetch('/api/pacing/plan').then((r) => r.json()).then((d) => { setItems(d.items); setUnits(d.units ?? []) }).catch(() => {})
  }, [open, items])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      const lessons = Object.entries(edits).map(([id, planned_days]) => ({ id, planned_days }))
      const unitsBody = Object.entries(unitEdits).map(([order_index, allotted_days]) => ({ order_index: Number(order_index), allotted_days }))
      const res = await fetch('/api/pacing/plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessons, units: unitsBody }) })
      if (res.ok) { const d = await res.json(); setItems(d.items); setEdits({}); setUnitEdits({}); setSaved(true) }
    } finally { setSaving(false) }
  }

  const dirty = Object.keys(edits).length > 0 || Object.keys(unitEdits).length > 0

  return (
    <div className="rounded-2xl border mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-4">
        <span className="flex items-center gap-2 font-medium"><Sliders size={16} style={{ color: 'var(--primary)' }} /> Master pace (planned days)</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Auto-distributed from unit allotted days. Adjust per lesson as you learn how long things really take; units without lessons yet use their unit total.
          </p>
          {items === null ? (
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</div>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {items.map((it) => it.kind === 'lesson' ? (
                <div key={it.index} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 truncate">{it.title}</span>
                  <input type="number" min={0} step={0.5} defaultValue={it.plannedDays}
                    onChange={(e) => setEdits((p) => ({ ...p, [it.lessonId as string]: Number(e.target.value) }))}
                    className="w-20 rounded-md border px-2 py-1 text-right" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
                  <span className="text-xs w-10" style={{ color: 'var(--muted-foreground)' }}>days</span>
                </div>
              ) : (
                <div key={it.index} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 truncate" style={{ color: 'var(--muted-foreground)' }}>{it.title} <em>(no lessons yet)</em></span>
                  <input type="number" min={0} step={1}
                    defaultValue={units.find((u) => u.order_index === it.unitOrder)?.allotted_days ?? it.plannedDays}
                    onChange={(e) => setUnitEdits((p) => ({ ...p, [it.unitOrder]: Number(e.target.value) }))}
                    className="w-20 rounded-md border px-2 py-1 text-right" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
                  <span className="text-xs w-10" style={{ color: 'var(--muted-foreground)' }}>days</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button onClick={save} disabled={!dirty || saving}
              className="text-sm rounded-lg px-3 py-1.5 font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: !dirty || saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save pace'}
            </button>
            {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-section tracker
// ---------------------------------------------------------------------------
function SectionCard({ course }: { course: Course }) {
  const [data, setData] = useState<SectionData | null>(null)
  const [startDate, setStartDate] = useState('')
  const [meetingDays, setMeetingDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [noSchool, setNoSchool] = useState<string[]>([])
  const [newOff, setNewOff] = useState('')
  const [posIndex, setPosIndex] = useState<number | ''>('')
  const [savingSched, setSavingSched] = useState(false)
  const [savingPos, setSavingPos] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/pacing/section?course_id=${course.id}`).then((r) => r.json()).then((d: SectionData) => {
      setData(d)
      setStartDate(d.schedule.start_date ?? '')
      setMeetingDays(d.schedule.meeting_days ?? [1, 2, 3, 4, 5])
      setNoSchool(d.schedule.no_school_dates ?? [])
      const cur = d.result.actualIndex
      setPosIndex(cur ?? '')
    }).catch(() => {})
  }, [course.id])

  useEffect(() => { load() }, [load])

  const saveSchedule = async () => {
    setSavingSched(true)
    try {
      await fetch('/api/pacing/schedule', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id, start_date: startDate || null, meeting_days: meetingDays, no_school_dates: noSchool }),
      })
      load()
    } finally { setSavingSched(false) }
  }

  const confirmPosition = async () => {
    if (posIndex === '' || !data) return
    const item = data.items.find((i) => i.index === posIndex)
    if (!item) return
    setSavingPos(true)
    try {
      await fetch('/api/pacing/section', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id, current_lesson_id: item.lessonId, current_unit_order: item.lessonId ? null : item.unitOrder }),
      })
      load()
    } finally { setSavingPos(false) }
  }

  const toggleDay = (d: number) => setMeetingDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort())
  const st = data ? STATUS[data.result.status] : STATUS.unknown

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-bold" style={{ fontSize: 16 }}>{course.name}{course.section ? <span style={{ color: 'var(--muted-foreground)' }}> · {course.section}</span> : null}</div>
          {data && (
            <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {data.result.notStarted ? 'Not started yet' : <>Should be on <b style={{ color: 'var(--foreground)' }}>{data.result.plannedTitle ?? '—'}</b> · on <b style={{ color: 'var(--foreground)' }}>{data.result.actualTitle ?? '—'}</b>{data.result.actualSource === 'auto' ? ' (auto)' : ''}</>}
            </div>
          )}
        </div>
        {data && (
          <div className="text-right">
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `color-mix(in oklch, ${st.color} 18%, transparent)`, color: st.color }}>{st.label}</span>
            <div className="text-sm font-medium mt-1" style={{ color: st.color }}>{deltaLabel(data.result.deltaDays, data.result.status)}</div>
          </div>
        )}
      </div>

      {/* schedule */}
      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Start date</div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
        </label>
        <div className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Meeting days</div>
          <div className="flex flex-wrap gap-1">
            {WEEKDAYS.map((w) => (
              <button key={w.d} onClick={() => toggleDay(w.d)}
                className="text-xs rounded-md border px-2 py-1" style={{ borderColor: 'var(--border)', background: meetingDays.includes(w.d) ? 'var(--primary)' : 'var(--card)', color: meetingDays.includes(w.d) ? 'var(--primary-foreground, white)' : 'var(--foreground)' }}>
                {w.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* no-school dates */}
      <div className="mt-3 text-sm">
        <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>No-school dates</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {noSchool.map((d) => (
            <span key={d} className="text-xs rounded-md border px-2 py-1 flex items-center gap-1" style={{ borderColor: 'var(--border)' }}>
              {d}
              <button onClick={() => setNoSchool((p) => p.filter((x) => x !== d))} style={{ color: 'var(--muted-foreground)' }}>×</button>
            </span>
          ))}
          <input type="date" value={newOff} onChange={(e) => setNewOff(e.target.value)}
            className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
          <button onClick={() => { if (newOff && !noSchool.includes(newOff)) { setNoSchool((p) => [...p, newOff].sort()); setNewOff('') } }}
            className="text-xs rounded-md border px-2 py-1" style={{ borderColor: 'var(--border)' }}>Add</button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={saveSchedule} disabled={savingSched}
          className="text-sm rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)' }}>{savingSched ? 'Saving…' : 'Save calendar'}</button>
      </div>

      {/* confirm position */}
      {data && (
        <div className="mt-4 pt-4 border-t flex items-end gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <label className="text-sm flex-1 min-w-[220px]">
            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Where are you right now?</div>
            <select value={posIndex} onChange={(e) => setPosIndex(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
              <option value="">— select lesson —</option>
              {data.items.map((it) => <option key={it.index} value={it.index}>{it.kind === 'unit' ? `${it.title} (unit)` : it.title}</option>)}
            </select>
          </label>
          <button onClick={confirmPosition} disabled={savingPos || posIndex === ''}
            className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: savingPos || posIndex === '' ? 0.6 : 1 }}>
            <Check size={14} /> Confirm position
          </button>
          {data.confirmed
            ? <span className="text-xs" style={{ color: 'var(--success)' }}>Confirmed</span>
            : data.autoIndex != null && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>auto-detected</span>}
        </div>
      )}
    </div>
  )
}
