"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, Check, ChevronDown, ChevronUp, Sliders, ChevronLeft, ChevronRight } from 'lucide-react'
import { useViewAs } from '@/lib/use-view-as'
import { cycleDayForDate, isSchoolDay, ROTATING_BLOCKS, droppedBlock, type RotationCalendar } from '@/lib/rotation'
import MonthCalendar, { type CalSection } from '@/components/pacing/MonthCalendar'

function LongLegend() {
  return (
    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
      <span className="inline-flex items-center gap-1"><span className="rounded px-1 font-bold text-[9px]" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>LONG</span> long block</span>
      <span className="inline-flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, border: '2px solid var(--primary)', display: 'inline-block' }} /> today</span>
    </div>
  )
}

interface Course { id: string; name: string; section: string | null; google_course_id: string | null }
interface PlanItem { index: number; title: string; lessonId: string | null; unitOrder: number; kind: 'lesson' | 'unit'; plannedDays: number; lessonNumber: number | null }
interface Schedule { start_date: string | null; meeting_days: number[]; no_school_dates: string[] }
interface PacingResult {
  notStarted: boolean; elapsed: number; totalDays: number
  plannedIndex: number | null; plannedTitle: string | null
  actualIndex: number | null; actualTitle: string | null
  actualSource: 'auto' | 'confirmed' | 'none'; deltaDays: number
  status: 'on' | 'ahead' | 'behind' | 'unknown'
}
interface UnitOpt { order: number; name: string }
interface LineupEntry { date: string; long: boolean; title: string; index: number }
interface SectionData {
  result: PacingResult; items: PlanItem[]; autoIndex: number | null; confirmed: boolean; schedule: Schedule
  block: string | null; rotationConfigured: boolean; lineup: LineupEntry[]
  units: UnitOpt[]; unitResult: PacingResult | null; unitName: string | null; unitTotalDays: number
  currentUnitOrder: number | null; unitStartDate: string | null; currentLessonId: string | null
}
const BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const STATUS: Record<PacingResult['status'], { label: string; color: string }> = {
  behind: { label: 'Behind', color: 'var(--viz-down)' },
  on: { label: 'On pace', color: 'var(--success)' },
  ahead: { label: 'Ahead', color: 'var(--primary)' },
  unknown: { label: 'No data', color: 'var(--muted-foreground)' },
}

function deltaLabel(d: number, status: PacingResult['status']): string {
  if (status === 'unknown') return '—'
  if (Math.abs(d) < 0.1) return 'on pace'
  const n = Math.abs(d) % 1 === 0 ? Math.abs(d).toString() : Math.abs(d).toFixed(1)
  return d > 0 ? `${n} days ahead` : `${n} days behind`
}

interface CalData { sections: CalSection[]; calendar: RotationCalendar }

export default function PacingPage() {
  const { role } = useViewAs()
  const isAdmin = role === 'admin'
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [cal, setCal] = useState<CalData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadCal = useCallback(() => {
    fetch('/api/pacing/calendar').then((r) => r.json())
      .then((d: Partial<CalData>) => {
        // Only accept a well-formed payload; a transient error/empty response
        // must not crash the page.
        if (Array.isArray(d?.sections) && d?.calendar) setCal(d as CalData)
        else setCal(null)
      })
      .catch(() => setCal(null))
  }, [])

  // Any change that affects the calendar (rotation, master pace, a section's
  // block/start/position) refreshes the unified calendar AND every section card.
  const refresh = useCallback(() => { loadCal(); setRefreshKey((k) => k + 1) }, [loadCal])

  useEffect(() => {
    fetch('/api/courses').then((r) => r.json())
      .then((d: { courses?: Course[] }) => setCourses((d.courses ?? []).filter((c) => c.google_course_id)))
      .catch(() => setCourses([]))
  }, [])
  useEffect(() => { loadCal() }, [loadCal])

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

      {isAdmin && <RotationEditor onSaved={refresh} />}
      {isAdmin && <GuideEditor onSaved={refresh} />}

      {/* unified month calendar — all your sections at a glance */}
      {cal && cal.sections.some((s) => s.block && s.startDate) && (
        <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="font-bold" style={{ fontSize: 15 }}>This month, across your classes</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Each day shows the blocks that meet and the lesson they land on. Click a lesson to open its builder.</div>
            </div>
            <LongLegend />
          </div>
          <MonthCalendar sections={cal.sections} calendar={cal.calendar} />
        </div>
      )}

      {courses === null ? (
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading sections…</div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border p-5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}>
          No synced sections yet. Connect Google Classroom and import a roster first.
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => <SectionCard key={c.id} course={c} cal={cal} onChanged={refresh} refreshKey={refreshKey} />)}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Admin: school-wide rotation calendar
// ---------------------------------------------------------------------------
function RotationEditor({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false)
  const [anchorDate, setAnchorDate] = useState('')
  const [p1, setP1] = useState('A')
  const [noSchool, setNoSchool] = useState<string[]>([])
  const [offset, setOffset] = useState(0)
  const [newOff, setNewOff] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!open || loaded) return
    fetch('/api/pacing/rotation').then((r) => r.json()).then((d) => {
      const c = d.calendar ?? {}
      setAnchorDate(c.anchor_date ?? '')
      setP1(c.anchor_p1_block ?? 'A')
      setNoSchool(c.no_school_dates ?? [])
      setOffset(c.cycle_offset ?? 0)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [open, loaded])

  const persist = async (over: { offset?: number } = {}) => {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/pacing/rotation', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anchor_date: anchorDate || null, anchor_p1_block: p1, no_school_dates: noSchool, cycle_offset: over.offset ?? offset }),
      })
      if (res.ok) { setSaved(true); onSaved?.() }
    } finally { setSaving(false) }
  }
  const save = () => persist()
  const nudge = (delta: number) => { const next = offset + delta; setOffset(next); persist({ offset: next }) }

  // Live readout: resolve the next school day from today using the current fields.
  const cal: RotationCalendar = { anchor_date: anchorDate || null, anchor_p1_block: p1, no_school_dates: noSchool, cycle_offset: offset }
  let readout: string | null = null
  if (anchorDate) {
    const noSet = new Set(noSchool)
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    let guard = 0
    while (!isSchoolDay(d, noSet) && guard < 14) { d.setUTCDate(d.getUTCDate() + 1); guard++ }
    const cd = cycleDayForDate(cal, d)
    if (cd !== null) {
      const B = ROTATING_BLOCKS
      const order = `P1 ${B[cd]} · P2 G · P3 ${B[(cd + 1) % 6]} · P4 ${B[(cd + 2) % 6]} · P5 ${B[(cd + 3) % 6]} (long) · P6 ${B[(cd + 4) % 6]}`
      readout = `${d.toISOString().slice(0, 10)} → Day ${cd + 1}: ${order} — ${droppedBlock(cd)} drops`
    }
  }

  return (
    <div className="rounded-2xl border mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-4">
        <span className="flex items-center gap-2 font-medium"><CalendarClock size={16} style={{ color: 'var(--primary)' }} /> Rotation calendar (school-wide)</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
            6-day rotation: A G B C D E F, G fixed at period 2, period-1 block drops the next day, period 5 is the long block. Set one known reference day; the cycle advances every school weekday and pauses on no-school days.
          </p>
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label className="text-sm">
              <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Reference date</div>
              <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
            </label>
            <label className="text-sm">
              <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Period-1 block on that day</div>
              <select value={p1} onChange={(e) => setP1(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                {['A', 'B', 'C', 'D', 'E', 'F'].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
          </div>
          <div className="text-sm">
            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>No-school dates (rotation pauses)</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {noSchool.map((d) => (
                <span key={d} className="text-xs rounded-md border px-2 py-1 flex items-center gap-1" style={{ borderColor: 'var(--border)' }}>
                  {d}<button onClick={() => setNoSchool((p) => p.filter((x) => x !== d))} style={{ color: 'var(--muted-foreground)' }}>×</button>
                </span>
              ))}
              <input type="date" value={newOff} onChange={(e) => setNewOff(e.target.value)}
                className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
              <button onClick={() => { if (newOff && !noSchool.includes(newOff)) { setNoSchool((p) => [...p, newOff].sort()); setNewOff('') } }}
                className="text-xs rounded-md border px-2 py-1" style={{ borderColor: 'var(--border)' }}>Add</button>
            </div>
          </div>
          {/* nudge to make the rotation current */}
          <div className="mt-4 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
              If the live rotation has drifted (snow day, late start, assembly), nudge it until the next school day below matches reality. Offset: <b style={{ color: 'var(--foreground)' }}>{offset > 0 ? `+${offset}` : offset}</b>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => nudge(-1)} disabled={saving || !anchorDate}
                className="inline-flex items-center gap-1 text-sm rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)' }}>
                <ChevronLeft size={14} /> Back a day
              </button>
              <button onClick={() => nudge(1)} disabled={saving || !anchorDate}
                className="inline-flex items-center gap-1 text-sm rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)' }}>
                Forward a day <ChevronRight size={14} />
              </button>
            </div>
            {readout && <div className="text-xs mt-2 font-medium" style={{ color: 'var(--foreground)' }}>{readout}</div>}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button onClick={save} disabled={saving || !anchorDate}
              className="text-sm rounded-lg px-3 py-1.5 font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: saving || !anchorDate ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save rotation'}
            </button>
            {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Admin: edit the master pace
// ---------------------------------------------------------------------------
function GuideEditor({ onSaved }: { onSaved?: () => void }) {
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
      if (res.ok) { const d = await res.json(); setItems(d.items); setEdits({}); setUnitEdits({}); setSaved(true); onSaved?.() }
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
function SectionCard({ course, cal, onChanged, refreshKey }: { course: Course; cal: CalData | null; onChanged: () => void; refreshKey: number }) {
  const [data, setData] = useState<SectionData | null>(null)
  const [block, setBlock] = useState('')
  const [unitOrder, setUnitOrder] = useState<number | ''>('')
  const [unitStart, setUnitStart] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCal, setShowCal] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/pacing/section?course_id=${course.id}`).then((r) => r.json()).then((d: SectionData) => {
      if (!d || !Array.isArray(d.items)) return
      setData(d)
      setBlock(d.block ?? '')
      setUnitOrder(d.currentUnitOrder ?? '')
      setUnitStart(d.unitStartDate ?? '')
      setLessonId(d.currentLessonId ?? '')
    }).catch(() => {})
  }, [course.id])

  useEffect(() => { load() }, [load, refreshKey])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/pacing/section', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          block: block || null,
          current_unit_order: unitOrder === '' ? null : Number(unitOrder),
          unit_start_date: unitStart || null,
          current_lesson_id: lessonId || null,
        }),
      })
      load(); onChanged()
    } finally { setSaving(false) }
  }

  const ur = data?.unitResult ?? null
  const st = ur ? STATUS[ur.status] : STATUS.unknown
  const unitLessons = data && unitOrder !== ''
    ? data.items.filter((i) => i.unitOrder === Number(unitOrder) && i.kind === 'lesson')
    : []
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-bold" style={{ fontSize: 16 }}>
            {course.name}{course.section ? <span style={{ color: 'var(--muted-foreground)' }}> · {course.section}</span> : null}
            {data?.block && <span className="ml-2 text-xs rounded-md px-1.5 py-0.5 align-middle" style={{ background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>{data.block} block</span>}
          </div>
          {ur && data?.unitName ? (
            <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {ur.notStarted
                ? <>Unit hasn&apos;t started yet</>
                : <><b style={{ color: 'var(--foreground)' }}>Day {ur.elapsed} of {data.unitTotalDays}</b> in {data.unitName} — should be on <b style={{ color: 'var(--foreground)' }}>{ur.plannedTitle ?? '—'}</b>, you&apos;re on <b style={{ color: 'var(--foreground)' }}>{ur.actualTitle ?? '—'}</b></>}
            </div>
          ) : (
            <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Pick a unit, its start date, and your lesson below to see pacing.</div>
          )}
          <Link href={`/admin/classes/${course.id}`} className="inline-flex items-center gap-1 text-xs font-semibold mt-1.5" style={{ color: 'var(--primary)' }}>
            Open this class — roster &amp; details →
          </Link>
        </div>
        {ur && !ur.notStarted && (
          <div className="text-right">
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `color-mix(in oklch, ${st.color} 18%, transparent)`, color: st.color }}>{st.label}</span>
            <div className="text-sm font-medium mt-1" style={{ color: st.color }}>{deltaLabel(ur.deltaDays, ur.status)}</div>
          </div>
        )}
      </div>

      {/* Unit-centric pacing inputs */}
      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Block</div>
          <select value={block} onChange={(e) => setBlock(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle}>
            <option value="">— tag a block —</option>
            {BLOCKS.map((b) => <option key={b} value={b}>{b} block</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Current unit</div>
          <select value={unitOrder} onChange={(e) => { setUnitOrder(e.target.value === '' ? '' : Number(e.target.value)); setLessonId('') }} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle}>
            <option value="">— choose unit —</option>
            {(data?.units ?? []).map((u) => <option key={u.order} value={u.order}>{u.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Unit start date</div>
          <input type="date" value={unitStart} onChange={(e) => setUnitStart(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle} />
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Your lesson right now</div>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} disabled={unitOrder === ''} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle}>
            <option value="">{unitOrder === '' ? '— choose a unit first —' : '— select lesson —'}</option>
            {unitLessons.map((it) => <option key={it.lessonId ?? it.index} value={it.lessonId ?? ''}>{it.lessonNumber ? `D${it.lessonNumber} · ` : ''}{it.title}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: saving ? 0.6 : 1 }}>
          <Check size={14} /> {saving ? 'Saving…' : 'Confirm pacing'}
        </button>
        {data && !data.rotationConfigured && (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Tip: set the school rotation above to count this block&apos;s meeting days; otherwise weekdays are used.</span>
        )}
      </div>

      {/* this section's calendar (collapsible) */}
      {cal && block && (
        <div className="mt-4">
          <button onClick={() => setShowCal((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--primary)' }}>
            {showCal ? <ChevronUp size={15} /> : <ChevronDown size={15} />} {showCal ? 'Hide' : 'Show'} this section&apos;s calendar
          </button>
          {showCal && (
            <div className="mt-3">
              <MonthCalendar sections={cal.sections} calendar={cal.calendar} filterCourseId={course.id} compact />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
