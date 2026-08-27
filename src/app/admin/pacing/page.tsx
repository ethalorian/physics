"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Check, ChevronDown, ChevronUp, Sliders, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react'
import { useViewAs } from '@/lib/use-view-as'
import { useClassScope } from '@/lib/use-class-scope'
import { cycleDayForDate, isSchoolDay, ROTATING_BLOCKS, droppedBlock, ALL_BLOCKS, type RotationCalendar, type WeekPattern, type CountMode } from '@/lib/rotation'
import MonthCalendar, { type CalSection } from '@/components/pacing/MonthCalendar'

function LongLegend() {
  return (
    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
      <span className="inline-flex items-center gap-1"><span className="rounded px-1 font-bold text-[9px]" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>LONG</span> long block</span>
      <span className="inline-flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, border: '2px solid var(--primary)', display: 'inline-block' }} /> today</span>
    </div>
  )
}

interface Course { id: string; name: string; section: string | null; google_course_id: string | null; program?: 'physics' | 'trades' }
interface PlanItem { index: number; title: string; lessonId: string | null; unitId: string; unitOrder: number; kind: 'lesson' | 'unit'; plannedDays: number; plannedWeight?: number; lessonNumber: number | null; core?: boolean }
interface CutItem { lessonId: string | null; title: string; lessonNumber: number | null; plannedDays: number }
type Program = 'physics' | 'trades'
const PROGRAM_LABEL: Record<Program, string> = { physics: 'Physics', trades: 'Trades' }
interface PacingResult {
  notStarted: boolean; elapsed: number; totalDays: number
  plannedIndex: number | null; plannedTitle: string | null
  actualIndex: number | null; actualTitle: string | null
  actualSource: 'auto' | 'confirmed' | 'none'; deltaDays: number
  status: 'on' | 'ahead' | 'behind' | 'unknown'
}
interface UnitOpt { id: string; name: string; allottedDays: number | null; defaultStartDate: string | null }
interface LineupEntry { date: string; block?: string; long: boolean; title: string; index: number }
interface SectionData {
  program: Program; items: PlanItem[]; confirmed: boolean
  block: string | null; blocks: string[]; weekPattern: WeekPattern; onWeekAnchor: string | null; countMode: CountMode; nextOnWeek: string | null; thisWeekOn: boolean
  rotationConfigured: boolean; lineup: LineupEntry[]
  units: UnitOpt[]; unitResult: PacingResult | null; unitName: string | null; unitTotalDays: number
  currentUnitId: string | null; unitStartDate: string | null; currentLessonId: string | null
  autoLessonId: string | null; autoUnitId: string | null; autoTitle: string | null
  deficitDays: number; suggestedCuts: CutItem[]; flexAhead: number
}

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
  // Class scope is shared across the power-tools (Control Room, analytics,
  // roster) via localStorage — picking a class here carries to the other tools.
  const { classId: scopeClassId, setClassScope } = useClassScope()
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

  // The effective class scope: only applied while it matches one of this
  // teacher's synced sections — otherwise show everything without clobbering
  // the stored scope (it still applies on the other tools).
  const scopedCourse = (courses ?? []).find((c) => c.id === scopeClassId) ?? null
  const coursesInView = scopedCourse ? [scopedCourse] : (courses ?? [])

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {/* Shared class scope — the same selection drives the Control Room, analytics, and roster. */}
        <select
          value={scopedCourse?.id ?? ''}
          onChange={(e) => {
            const id = e.target.value
            const c = (courses ?? []).find((x) => x.id === id)
            setClassScope(id || null, c ? `${c.name}${c.section ? ' · ' + c.section : ''}` : null)
          }}
          title="Scope to one class/section — carries across the Control Room, analytics, and roster"
          className="text-sm rounded-lg border px-2.5 py-1.5"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
        >
          <option value="">All classes</option>
          {(courses ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>
          ))}
        </select>
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
          <MonthCalendar sections={cal.sections} calendar={cal.calendar} filterCourseId={scopedCourse?.id} />
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
          {coursesInView.map((c) => <SectionCard key={c.id} course={c} cal={cal} onChanged={refresh} refreshKey={refreshKey} />)}
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
  const [program, setProgram] = useState<Program>('physics')
  const [items, setItems] = useState<PlanItem[] | null>(null)
  const [units, setUnits] = useState<{ id: string; order_index: number; name: string; allotted_days: number | null; default_start_date: string | null }[]>([])
  const [edits, setEdits] = useState<Record<string, number>>({}) // lessonId -> weight (planned_days)
  const [unitEdits, setUnitEdits] = useState<Record<string, number>>({}) // unitId -> window days
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadPlan = useCallback((p: Program) => {
    setItems(null)
    fetch(`/api/pacing/plan?program=${p}`).then((r) => r.json()).then((d) => { setItems(d.items ?? []); setUnits(d.units ?? []) }).catch(() => setItems([]))
  }, [])
  useEffect(() => { if (open) loadPlan(program) }, [open, program, loadPlan])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      const lessons = Object.entries(edits).map(([id, planned_days]) => ({ id, planned_days }))
      const unitsBody = Object.entries(unitEdits).map(([id, allotted_days]) => ({ id, allotted_days }))
      const res = await fetch('/api/pacing/plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ program, lessons, units: unitsBody }) })
      if (res.ok) { const d = await res.json(); setItems(d.items); setUnits(d.units ?? []); setEdits({}); setUnitEdits({}); setSaved(true); onSaved?.() }
    } finally { setSaving(false) }
  }
  // Group items by unit so each unit's window sits above its lessons.
  const byUnit = new Map<string, PlanItem[]>()
  for (const it of items ?? []) { const arr = byUnit.get(it.unitId) ?? []; arr.push(it); byUnit.set(it.unitId, arr) }

  const dirty = Object.keys(edits).length > 0 || Object.keys(unitEdits).length > 0

  return (
    <div className="rounded-2xl border mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-4">
        <span className="flex items-center gap-2 font-medium"><Sliders size={16} style={{ color: 'var(--primary)' }} /> Master pace (planned days)</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <select value={program} onChange={(e) => { setProgram(e.target.value as Program); setEdits({}); setUnitEdits({}) }}
              className="text-sm rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
              {(Object.keys(PROGRAM_LABEL) as Program[]).map((p) => <option key={p} value={p}>{PROGRAM_LABEL[p]}</option>)}
            </select>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {items ? `${units.reduce((n, u) => n + (u.allotted_days ?? 0), 0)} window days · ${items.filter((i) => i.kind === 'lesson').length} lessons` : ''}
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Each unit&apos;s <b>window</b> is its span on the school calendar (lessons + lab overrun, reassessment and revision). Lessons share the window in proportion to their <b>weight</b> — a 2-day lab gets weight 2. &ldquo;On pace&rdquo; already includes the buffer. <b>FLEX</b> lessons are the ones no transfer task depends on — they&apos;re what a behind section is told to cut first.
          </p>
          {items === null ? (
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</div>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {units.map((u) => {
                const its = byUnit.get(u.id) ?? []
                const lessons = its.filter((i) => i.kind === 'lesson')
                return (
                  <div key={u.id} className="mb-2">
                    <div className="flex items-center gap-3 text-sm rounded-lg px-2 py-1.5" style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}>
                      <span className="flex-1 truncate font-semibold">{u.name}</span>
                      {u.default_start_date && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>starts {u.default_start_date}</span>}
                      <input type="number" min={0} step={1} defaultValue={u.allotted_days ?? 0}
                        onChange={(e) => setUnitEdits((p) => ({ ...p, [u.id]: Number(e.target.value) }))}
                        className="w-20 rounded-md border px-2 py-1 text-right" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
                      <span className="text-xs w-14" style={{ color: 'var(--muted-foreground)' }}>window</span>
                    </div>
                    {lessons.length === 0 && <div className="text-xs px-2 py-1" style={{ color: 'var(--muted-foreground)' }}><em>No lessons yet — the window is one placeholder item.</em></div>}
                    {lessons.map((it) => (
                      <div key={it.index} className="flex items-center gap-3 text-sm pl-4 pr-2">
                        <span className="flex-1 truncate" style={{ color: it.core === false ? 'var(--muted-foreground)' : 'var(--foreground)' }}>{it.lessonNumber ? `D${it.lessonNumber} · ` : ''}{it.title}{it.core === false && <span className="ml-1.5 text-[9px] font-semibold rounded px-1 align-middle" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>FLEX</span>}</span>
                        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>≈ {it.plannedDays.toFixed(1)}d</span>
                        <input type="number" min={0} step={0.5} defaultValue={it.plannedWeight ?? 1}
                          onChange={(e) => setEdits((p) => ({ ...p, [it.lessonId as string]: Number(e.target.value) }))}
                          className="w-20 rounded-md border px-2 py-1 text-right" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
                        <span className="text-xs w-14" style={{ color: 'var(--muted-foreground)' }}>weight</span>
                      </div>
                    ))}
                  </div>
                )
              })}
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
  const [program, setProgram] = useState<Program>('physics')
  const [blocks, setBlocks] = useState<string[]>([])
  const [weekPattern, setWeekPattern] = useState<WeekPattern>('every')
  const [onWeekAnchor, setOnWeekAnchor] = useState('')
  const [unitId, setUnitId] = useState('')
  const [unitStart, setUnitStart] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showCal, setShowCal] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/pacing/section?course_id=${course.id}`).then((r) => r.json()).then((d: SectionData) => {
      if (!d || !Array.isArray(d.items)) return
      setData(d)
      setProgram(d.program ?? 'physics')
      setBlocks(d.blocks ?? (d.block ? [d.block] : []))
      setWeekPattern(d.weekPattern ?? 'every')
      setOnWeekAnchor(d.onWeekAnchor ?? '')
      setUnitId(d.currentUnitId ?? '')
      setUnitStart(d.unitStartDate ?? '')
      setLessonId(d.currentLessonId ?? '')
    }).catch(() => {})
  }, [course.id])

  useEffect(() => { load() }, [load, refreshKey])

  // Changing the program empties the unit fields — the old unit no longer
  // exists in the new plan. The server re-sends the right unit list.
  const changeProgram = async (p: Program) => {
    setProgram(p); setUnitId(''); setLessonId(''); setUnitStart('')
    await fetch('/api/pacing/section', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: course.id, program: p, current_unit_id: null, current_lesson_id: null, unit_start_date: null }),
    }).catch(() => {})
    load(); onChanged()
  }

  // Picking a unit pre-fills its planned start from the school calendar; the
  // teacher can override.
  const pickUnit = (id: string) => {
    setUnitId(id); setLessonId('')
    const u = data?.units.find((x) => x.id === id)
    if (u?.defaultStartDate) setUnitStart(u.defaultStartDate)
    else if (!id) setUnitStart('')
  }

  const save = async () => {
    setSaving(true); setErr(null)
    try {
      const res = await fetch('/api/pacing/section', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          blocks,
          week_pattern: weekPattern,
          on_week_anchor: weekPattern === 'alternate' ? (onWeekAnchor || null) : null,
          current_unit_id: unitId || null,
          unit_start_date: unitStart || null,
          current_lesson_id: lessonId || null,
        }),
      })
      if (!res.ok) { const b = await res.json().catch(() => null) as { error?: string } | null; setErr(b?.error ?? 'Could not save') }
      load(); onChanged()
    } finally { setSaving(false) }
  }

  const ur = data?.unitResult ?? null
  const st = ur ? STATUS[ur.status] : STATUS.unknown
  const unitLessons = data && unitId
    ? data.items.filter((i) => i.unitId === unitId && i.kind === 'lesson')
    : []
  const unitOpt = data?.units.find((u) => u.id === unitId) ?? null
  // Student work points at a lesson in this unit that isn't the one confirmed.
  const suggestion = data && data.autoLessonId && data.autoUnitId === unitId && data.autoLessonId !== lessonId
    ? unitLessons.find((i) => i.lessonId === data.autoLessonId) ?? null
    : null
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-bold" style={{ fontSize: 16 }}>
            {course.name}{course.section ? <span style={{ color: 'var(--muted-foreground)' }}> · {course.section}</span> : null}
            {data && data.blocks.length > 0 && <span className="ml-2 text-xs rounded-md px-1.5 py-0.5 align-middle" style={{ background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>{data.blocks.join('+')} block{data.blocks.length > 1 ? 's' : ''}{data.weekPattern === 'alternate' ? ' · alternating weeks' : ''}</span>}
            {data && <span className="ml-2 text-xs rounded-md px-1.5 py-0.5 align-middle" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>{PROGRAM_LABEL[data.program]}</span>}
          </div>
          {ur && data?.unitName ? (
            <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {ur.notStarted
                ? <>{data.unitName} starts {data.unitStartDate ?? '—'} · {data.unitTotalDays}-day window</>
                : <><b style={{ color: 'var(--foreground)' }}>Day {ur.elapsed} of {data.unitTotalDays}</b> in {data.unitName} — should be on <b style={{ color: 'var(--foreground)' }}>{ur.plannedTitle ?? '—'}</b>, you&apos;re on <b style={{ color: 'var(--foreground)' }}>{ur.actualTitle ?? '—'}</b>{ur.actualSource === 'auto' && ur.actualTitle ? <span> (from student work — confirm below)</span> : null}</>}
            </div>
          ) : (
            <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Pick a unit, its start date, and your lesson below to see pacing.</div>
          )}
          {ur && ur.status === 'behind' && data && (
            <div className="mt-2 rounded-xl px-3 py-2 text-sm" style={{ background: 'color-mix(in oklch, var(--viz-down) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--viz-down) 30%, var(--border))' }}>
              {data.suggestedCuts.length > 0 ? (
                <>
                  <span style={{ color: 'var(--viz-down)' }} className="font-semibold">Behind by {deltaLabel(ur.deltaDays, ur.status).replace(' behind', '')}.</span>{' '}
                  To get back on the window without touching anything the transfer task needs, cut:{' '}
                  {data.suggestedCuts.map((c, k) => (
                    <span key={c.lessonId ?? k}>
                      {k > 0 ? ', ' : ''}<b>{c.lessonNumber ? `D${c.lessonNumber}` : c.title}</b>
                      <span style={{ color: 'var(--muted-foreground)' }}> {c.lessonNumber ? c.title.replace(/^Day \d+ — /, '') : ''}</span>
                    </span>
                  ))}
                  {data.flexAhead > data.suggestedCuts.length && <span style={{ color: 'var(--muted-foreground)' }}> ({data.flexAhead - data.suggestedCuts.length} more flex day{data.flexAhead - data.suggestedCuts.length === 1 ? '' : 's'} left in the unit)</span>}
                </>
              ) : (
                <>
                  <span style={{ color: 'var(--viz-down)' }} className="font-semibold">Behind by {deltaLabel(ur.deltaDays, ur.status).replace(' behind', '')}</span>{' '}
                  and no flex days remain ahead in this unit — every remaining lesson feeds the transfer task. The choice is now which core lesson to compress, or to let the unit run into the next window.
                </>
              )}
            </div>
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
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Program</div>
          <select value={program} onChange={(e) => changeProgram(e.target.value as Program)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle}>
            {(Object.keys(PROGRAM_LABEL) as Program[]).map((p) => <option key={p} value={p}>{PROGRAM_LABEL[p]}</option>)}
          </select>
        </label>
        <div className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Meets in</div>
          <div className="flex flex-wrap gap-1">
            {ALL_BLOCKS.map((b) => {
              const on = blocks.includes(b)
              return (
                <button key={b} type="button" onClick={() => setBlocks((bs) => (on ? bs.filter((x) => x !== b) : [...bs, b].sort()))}
                  aria-pressed={on} title={`${b} block`}
                  className="text-xs font-semibold rounded-md border px-2 py-1"
                  style={{ borderColor: on ? 'var(--primary)' : 'var(--border)', background: on ? 'var(--primary)' : 'var(--card)', color: on ? 'var(--primary-foreground)' : 'var(--muted-foreground)', cursor: 'pointer' }}>
                  {b}
                </button>
              )
            })}
          </div>
        </div>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Weeks</div>
          <select value={weekPattern} onChange={(e) => setWeekPattern(e.target.value as WeekPattern)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle}>
            <option value="every">Every week</option>
            <option value="alternate">Alternating weeks (MVP)</option>
          </select>
        </label>
        {weekPattern === 'alternate' && (
          <label className="text-sm">
            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>First academic week (any day in it)</div>
            <input type="date" value={onWeekAnchor} onChange={(e) => setOnWeekAnchor(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle} />
          </label>
        )}
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Current unit</div>
          <select value={unitId} onChange={(e) => pickUnit(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle}>
            <option value="">— choose unit —</option>
            {(data?.units ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Unit start date{unitOpt?.defaultStartDate && unitStart !== unitOpt.defaultStartDate ? <span> · planned {unitOpt.defaultStartDate}</span> : null}</div>
          <input type="date" value={unitStart} onChange={(e) => setUnitStart(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle} />
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Your lesson right now</div>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} disabled={!unitId} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={fieldStyle}>
            <option value="">{!unitId ? '— choose a unit first —' : '— select lesson —'}</option>
            {unitLessons.map((it) => <option key={it.lessonId ?? it.index} value={it.lessonId ?? ''}>{it.lessonNumber ? `D${it.lessonNumber} · ` : ''}{it.title}{it.core === false ? ' · flex' : ''}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: saving ? 0.6 : 1 }}>
          <Check size={14} /> {saving ? 'Saving…' : 'Confirm pacing'}
        </button>
        {suggestion && (
          <button onClick={() => setLessonId(suggestion.lessonId ?? '')} className="inline-flex items-center gap-1.5 text-xs rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--primary)' }} title="Student work in this section has reached this lesson">
            <Wand2 size={13} /> Student work says {suggestion.lessonNumber ? `D${suggestion.lessonNumber}` : suggestion.title} — use it
          </button>
        )}
        {err && <span className="text-xs" style={{ color: 'var(--destructive)' }}>{err}</span>}
        {data && data.weekPattern === 'alternate' && !data.onWeekAnchor && (
          <span className="text-xs" style={{ color: 'var(--reward-foreground)' }}>Alternating weeks needs this section&apos;s first academic week — until it&apos;s set, every week counts.</span>
        )}
        {data && data.weekPattern === 'alternate' && data.onWeekAnchor && (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>This week is {data.thisWeekOn ? 'an academic week' : 'a shop week'}{data.nextOnWeek && !data.thisWeekOn ? ` · back ${data.nextOnWeek}` : ''} · counting {data.countMode === 'sessions' ? 'sessions (one per day; B+C = a long session)' : 'meetings (each block is a lesson)'}.</span>
        )}
        {data && !data.rotationConfigured && (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Tip: set the school rotation above to count this block&apos;s meeting days; otherwise weekdays are used.</span>
        )}
      </div>

      {/* this section's calendar (collapsible) */}
      {cal && blocks.length > 0 && (
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
