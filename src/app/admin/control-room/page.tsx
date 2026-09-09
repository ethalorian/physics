"use client"

import MasteryReviewDesk from '@/components/admin/MasteryReviewDesk'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import LessonContextLinks from '@/components/admin/LessonContextLinks'
import LessonReviewQueue from '@/components/admin/LessonReviewQueue'
import { InlineMath } from '@/components/MathMarkdown'
import { toLatex } from '@/components/blocks/EquationSandbox'
import MathControlRoom from '@/components/math-spine/MathControlRoom'
import TeacherDailyMathTask from '@/components/math-spine/TeacherDailyMathTask'
import { StrokeShapes, type Stroke } from '@/lib/draw/strokes'
import { useClassScope } from '@/lib/use-class-scope'

// ---------------------------------------------------------------------------
// Types (mirror /api/mastery/grid and /api/mastery/student-work)
// ---------------------------------------------------------------------------
interface Target { id: string; statement: string; domain: string }
interface Student { id: string; name: string; email: string; firstName?: string | null; lastName?: string | null; ratable?: boolean }
interface Cell { value: number | null; count: number }
interface GridData {
  unitId: string
  program?: string | null
  units: { id: string; name: string; label?: string; program?: string }[]
  targets: Target[]
  students: Student[]
  cells: Record<string, Record<string, Cell>>
  pending?: Record<string, Record<string, boolean>>
}
interface WorkItem { prompt?: string | null; targetLinked?: boolean; lessonTitle: string; lessonId?: string | null; blockType: string | null; blockId: string; response: unknown; createdAt: string; responseMode?: string | null; scaffoldsUsed?: string[]; evidenceSource?: string | null; confidence?: string | null; role?: string | null }
interface RecordItem { target_id: string; level: number; observed_at: string; evidence_source?: string | null }
interface WorkData { userId: string; unitId: string; targets: Target[]; records: RecordItem[]; work: WorkItem[] }

interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean; needsHelp: boolean }


// value (1..3 float) -> band 1/2/3 (0 = not rated)
function band(v: number | null): 0 | 1 | 2 | 3 {
  if (v == null) return 0
  if (v >= 2.5) return 3
  if (v >= 1.5) return 2
  return 1
}
function cellStyle(b: 0 | 1 | 2 | 3): CSSProperties {
  if (b === 3) return { background: 'color-mix(in oklch, var(--success) 80%, transparent)', color: '#fff' }
  if (b === 2) return { background: 'color-mix(in oklch, var(--reward) 75%, transparent)', color: 'var(--reward-foreground)' }
  if (b === 1) return { background: 'color-mix(in oklch, var(--destructive) 72%, transparent)', color: '#fff' }
  return { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px dashed var(--border)' }
}
const levelWord = (l: number) => (l === 1 ? 'Not yet' : l === 2 ? 'Almost' : 'Got it')
// Colorblind-safe shape encoding of the band, so color is never the only signal.
// ●=Got it(3) · ◐=Almost(2) · ○=Not yet(1) · –=not rated(0).
const bandGlyph = (b: 0 | 1 | 2 | 3) => (b === 3 ? '●' : b === 2 ? '◐' : b === 1 ? '○' : '–')



// "Last signed in" for the roster: friendly relative time + recency color.
function lastSeenLabel(iso: string | null): string {
  if (!iso) return 'never'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60000) return 'now'
  const m = Math.floor(ms / 60000); if (m < 60) return `${m}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function lastSeenColor(iso: string | null): string {
  if (!iso) return 'var(--muted-foreground)'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 24 * 3600000) return 'var(--success)'
  if (ms < 7 * 24 * 3600000) return 'var(--reward-foreground)'
  return 'var(--muted-foreground)'
}

type StrokeShape = { color?: string; points?: { x: number; y: number }[] }
function StrokesSvg({ strokes, label }: { strokes: StrokeShape[]; label: string }) {
  if (!strokes || strokes.length === 0) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>[empty drawing]</p>
  return (
    <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: '100%', height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} role="img" aria-label={label}>
      <StrokeShapes strokes={strokes as Stroke[]} />
    </svg>
  )
}



function ResponseView({ response, prompt }: { response: unknown; prompt?: string | null }) {
  if (response && typeof response === 'object') {
    const o = response as Record<string, unknown>
    // SEI captures: { text | strokes, mode } and the inline question { optionId, explain }.
    if ('text' in o && typeof o.text === 'string' && !('given' in o)) return <div><p className="text-sm whitespace-pre-wrap">{o.text}</p>{Array.isArray(o.strokes) && o.strokes.length > 0 && <StrokesSvg strokes={o.strokes as StrokeShape[]} label="Student drawing" />}</div>
    if (('optionId' in o || 'explain' in o) && !('given' in o)) {
      const option = prompt?.split('\n').find(line => line.trim().startsWith(`${String(o.optionId)}: `))?.trim()
      return (
        <div className="text-sm">
          {o.optionId ? <div><b style={{ color: 'var(--secondary-foreground)' }}>Selected answer:</b> {option ?? `Option ${String(o.optionId)} (answer text unavailable)`}</div> : null}
          {o.explain ? <div style={{ whiteSpace: 'pre-wrap' }}><b style={{ color: 'var(--secondary-foreground)' }}>Student’s explanation:</b> {String(o.explain)}</div> : null}
        </div>
      )
    }
    const isGewa = 'given' in o || 'equation' in o || 'work' in o || 'answer' in o || 'workStrokes' in o || 'sandbox' in o
    if (isGewa) {
      const field = (k: string, label: string) =>
        o[k] != null && String(o[k]).trim() !== '' ? (
          <div className="text-sm" style={{ marginBottom: 4 }}>
            <b style={{ color: 'var(--secondary-foreground)' }}>{label}:</b> {String(o[k])}
          </div>
        ) : null
      const ws = Array.isArray(o.workStrokes) ? (o.workStrokes as StrokeShape[]) : null
      const sandbox = o.sandbox && typeof o.sandbox === 'object' ? (o.sandbox as { lines?: unknown[]; answerIndex?: number }) : null
      const sandboxLines = sandbox && Array.isArray(sandbox.lines) ? sandbox.lines.map(String).filter((l) => l.trim()) : []
      const ansI = sandbox && typeof sandbox.answerIndex === 'number' ? sandbox.answerIndex : -1
      const steps = Array.isArray(o.steps) ? (o.steps as unknown[]).map(String).filter(Boolean) : []
      const convs = Array.isArray(o.conversions) ? (o.conversions as unknown[]).map(String).filter(Boolean) : []
      const verdict = o.autoCheck === 'match' ? 'match' : o.autoCheck === 'mismatch' ? 'mismatch' : o.autoCheck === 'unknown' ? 'unknown' : null
      return (
        <div>
          {verdict && (
            <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 mb-2" style={{
              background: verdict === 'match' ? 'color-mix(in oklch, var(--success) 15%, transparent)' : verdict === 'mismatch' ? 'color-mix(in oklch, var(--destructive) 12%, transparent)' : 'var(--secondary)',
              color: verdict === 'match' ? 'var(--success)' : verdict === 'mismatch' ? 'var(--destructive)' : 'var(--muted-foreground)',
            }}>
              {verdict === 'match' ? '✓ answer matches the equation' : verdict === 'mismatch' ? '✗ answer doesn\u2019t match the equation' : '— not auto-checkable (teacher judges)'}
            </span>
          )}
          {field('given', 'Given')}
          {field('equation', 'Equation')}
          {steps.length > 0 && (
            <div className="text-sm" style={{ marginBottom: 4 }}>
              <b style={{ color: 'var(--secondary-foreground)' }}>Algebra trail ({steps.length} move{steps.length > 1 ? 's' : ''}):</b>
              <ol style={{ margin: '2px 0 0', paddingLeft: 18 }}>
                {steps.map((st, i) => <li key={i} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{st}</li>)}
              </ol>
            </div>
          )}
          {convs.length > 0 && (
            <div className="text-sm" style={{ marginBottom: 4 }}>
              <b style={{ color: 'var(--secondary-foreground)' }}>Unit conversions:</b>
              <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
                {convs.map((cv, i) => <li key={i} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{cv}</li>)}
              </ul>
            </div>
          )}
          {field('work', 'Work')}
          {field('answer', 'Answer')}
          {sandboxLines.length > 0 && (
            <div className="mt-1.5">
              <div className="text-sm" style={{ marginBottom: 4 }}><b style={{ color: 'var(--secondary-foreground)' }}>Work &amp; Answer:</b></div>
              <div className="rounded-lg p-2" style={{ background: 'var(--card)', border: '0.5px solid var(--border)' }}>
                {sandboxLines.map((l, i) => (
                  <div key={i} className="flex items-baseline gap-2" style={{ marginBottom: 2 }}>
                    <span className="text-xs" style={{ color: i === ansI ? 'var(--reward)' : 'var(--muted-foreground)' }}>{i === ansI ? '★' : `${i + 1}.`}</span>
                    <span style={{ fontSize: 16 }}><InlineMath math={i === ansI ? `\\boxed{${toLatex(l)}}` : toLatex(l)} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ws && ws.length > 0 && (
            <div className="mt-1.5">
              <div className="text-sm" style={{ marginBottom: 4 }}><b style={{ color: 'var(--secondary-foreground)' }}>Handwritten work:</b></div>
              <StrokesSvg strokes={ws} label="Student handwritten work" />
            </div>
          )}
        </div>
      )
    }
    // concept_exercise (textbook reader + auto-graded exercise)
    if ('answers' in o && o.answers && typeof o.answers === 'object' && ('results' in o || 'summary' in o || 'submitted' in o)) {
      const answers = o.answers as Record<string, unknown>
      const results = (o.results && typeof o.results === 'object' ? o.results : {}) as Record<string, { correct?: boolean; needsReview?: boolean; answered?: boolean }>
      const summary = (o.summary && typeof o.summary === 'object' ? o.summary : null) as { autoCorrect?: number; autoTotal?: number; reviewCount?: number } | null
      const fmt = (v: unknown): string => Array.isArray(v) ? v.map(String).join(' / ') : String(v ?? '')
      const nums = Object.keys(answers).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b)
      return (
        <div className="text-sm">
          {summary && (
            <div className="mb-2" style={{ color: 'var(--secondary-foreground)' }}>
              <b style={{ color: 'var(--success)' }}>{summary.autoCorrect ?? 0}/{summary.autoTotal ?? 0}</b> auto-checked correct
              {summary.reviewCount ? <span style={{ color: 'var(--muted-foreground)' }}> · {summary.reviewCount} written answer{summary.reviewCount === 1 ? '' : 's'} to review</span> : null}
            </div>
          )}
          <div className="flex flex-col gap-1">
            {nums.map((n) => {
              const r = results[String(n)]
              const badge = !r ? null
                : r.needsReview ? <span style={{ color: 'var(--muted-foreground)' }}>✎ review</span>
                : r.correct ? <span style={{ color: 'var(--success)' }}>✓</span>
                : <span style={{ color: 'var(--destructive)' }}>✗</span>
              const val = fmt(answers[String(n)])
              return (
                <div key={n} className="flex items-baseline gap-2" style={{ borderBottom: '0.5px solid var(--border)', paddingBottom: 2 }}>
                  <span className="shrink-0" style={{ color: 'var(--muted-foreground)', minWidth: 22 }}>{n}.</span>
                  <span className="flex-1" style={{ color: val.trim() ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{val.trim() || '—'}</span>
                  <span className="shrink-0 text-xs">{badge}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    if ('lines' in o && Array.isArray(o.lines)) {
      const lines = (o.lines as unknown[]).map(String)
      if (lines.length === 0) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>[empty sandbox]</p>
      return (
        <div className="text-sm" style={{ fontFamily: 'Georgia, serif' }}>
          {lines.map((l, i) => (
            <div key={i} style={{ marginBottom: 2 }}><span style={{ color: 'var(--muted-foreground)', marginRight: 6 }}>{i + 1}.</span>{l}</div>
          ))}
        </div>
      )
    }
    if ('strokes' in o) {
      const strokes = Array.isArray(o.strokes) ? (o.strokes as StrokeShape[]) : []
      return <StrokesSvg strokes={strokes} label="Student drawing" />
    }
    if ('pattern' in o || 'interpret' in o) {
      return (
        <div className="text-sm">
          {o.pattern != null && <div style={{ marginBottom: 4 }}><b>Pattern:</b> {String(o.pattern)}</div>}
          {o.interpret != null && <div><b>Interpretation:</b> {String(o.interpret)}</div>}
        </div>
      )
    }
    return <pre className="text-xs" style={{ whiteSpace: 'pre-wrap', color: 'var(--muted-foreground)' }}>{JSON.stringify(o, null, 2)}</pre>
  }
  if (typeof response === 'string') return <p className="text-sm">{response}</p>
  return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{String(response)}</p>
}

export default function ControlRoomPage() {
  const gridRequestVersion = useRef(0)
  const [grid, setGrid] = useState<GridData | null>(null)
  const [unitId, setUnitId] = useState('unit-1')
  const [lessonFilter, setLessonFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sel, setSel] = useState<{ studentId: string; targetId: string } | null>(null)
  const workRequestVersion = useRef(0)
  const [work, setWork] = useState<WorkData | null>(null)
  const [workLoading, setWorkLoading] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [nameFilter, setNameFilter] = useState('')

  // Lesson completion grading (the old Aspen gradebook flow) is retired —
  // lessons are engagement, mastery is the grade. Views: targets + math spine.
  const [view, setView] = useState<'mastery' | 'math'>('mastery')
  // Student-first grading: keys we've graded this session (so the queue and
  // roster shrink immediately, before the server refresh lands).
  const [gradedKeys, setGradedKeys] = useState<Set<string>>(new Set())
  // Class/section scope. Aspen's gradebook is partitioned by section, so the
  // grade copy must be filterable to one class. The scope is SHARED with
  // analytics, roster, and pacing via localStorage (use-class-scope) — pick a
  // class in any of them and it carries here. The per-class deep-link
  // (?class=&label=) still wins and updates the shared scope.
  const { classId, classLabel, setClassScope } = useClassScope()
  const [classes, setClasses] = useState<{ id: string; label: string; teacher: string | null; program: string }[]>([])
  // Admin-only teacher filter: '' = all teachers. Teachers never see the
  // dropdown (their /api/courses only returns their own classes).
  const [teacherFilter, setTeacherFilter] = useState('')
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('unit')) setUnitId(sp.get('unit')!)
    setLessonFilter(sp.get('lesson') ?? '')
    const deepLinked = sp.get('class')
    if (deepLinked) setClassScope(deepLinked, sp.get('label'))
  }, [setClassScope])
  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((d: { courses?: { id: string; name: string; section: string | null; teacher_email?: string | null; program?: string | null }[] }) => {
        setClasses((d.courses ?? []).map((c) => ({ id: c.id, label: c.section ? `${c.name} · ${c.section}` : c.name, teacher: c.teacher_email ?? null, program: c.program ?? 'physics' })))
      })
      .catch(() => {})
  }, [])
  // The teacher param only matters with no class picked (the server ignores it
  // otherwise), but sending both keeps the URL an honest mirror of the UI.
  const classQuery = (classId ? `&class=${encodeURIComponent(classId)}` : '') + (teacherFilter ? `&teacher=${encodeURIComponent(teacherFilter)}` : '')
  const teachers = [...new Set(classes.map((c) => c.teacher).filter((t): t is string => Boolean(t)))].sort()
  const visibleClasses = teacherFilter ? classes.filter((c) => c.teacher === teacherFilter) : classes
  const teacherName = (email: string) => email.split('@')[0].replace(/[._]/g, ' ')
  const pickClass = (id: string) => {
    setClassScope(id || null, id ? (classes.find((c) => c.id === id)?.label ?? null) : null)
  }

  const loadGrid = useCallback((unit: string) => {
    const version = ++gridRequestVersion.current
    setLoading(true)
    setError(null)
    fetch(`/api/mastery/grid?unit_id=${encodeURIComponent(unit)}${classQuery}`)
      .then((r) => r.json())
      .then((d: GridData & { error?: string }) => {
        if (version !== gridRequestVersion.current) return
        if (d.error) setError(d.error)
        else {
          setGrid(d)
          // unit_id=auto resolved server-side to the unit this class is in.
          if (d.unitId && d.unitId !== unit) setUnitId(d.unitId)
        }
        setLoading(false)
      })
      .catch(() => { if (version === gridRequestVersion.current) { setError('Could not load the grid'); setLoading(false) } })
  }, [classQuery])

  useEffect(() => { loadGrid(unitId) }, [unitId, loadGrid])
  // Picking a class moves the unit to the one THAT class is working in — a Trades
  // or Project Physics class never sits on physics unit-1 (its program's units only).
  const classProgram = classId ? (classes.find((c) => c.id === classId)?.program ?? null) : null
  useEffect(() => {
    if (!classId) return
    const unitProgram = grid?.units.find((u) => u.id === unitId)?.program
    if (classProgram && unitProgram && unitProgram !== classProgram) setUnitId('auto')
    else if (classProgram && grid && !unitProgram && unitId !== 'auto') setUnitId('auto')
  }, [classId, classProgram]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQueue = useCallback((unit: string) => {
    fetch(`/api/mastery/queue?unit_id=${encodeURIComponent(unit)}${classQuery}`)
      .then((r) => r.json())
      .then((d: { queue?: QueueItem[] }) => setQueue(d.queue ?? []))
      .catch(() => {})
  }, [classQuery])
  useEffect(() => { loadQueue(unitId) }, [unitId, loadQueue])

  // Per-student "last signed in" for the roster (so each student shows when they
  // were last active, right in the grids).
  const [presence, setPresence] = useState<Map<string, { lastLoginAt: string | null; lastSeenAt: string | null }>>(new Map())
  const loadPresence = useCallback(() => {
    const url = '/api/roster/last-login' + (classQuery ? '?' + classQuery.slice(1) : '')
    fetch(url)
      .then((r) => r.json())
      .then((d: { presence?: { gid: string; lastLoginAt: string | null; lastSeenAt: string | null }[] }) => {
        const m = new Map<string, { lastLoginAt: string | null; lastSeenAt: string | null }>()
        for (const p of d.presence ?? []) m.set(p.gid, { lastLoginAt: p.lastLoginAt, lastSeenAt: p.lastSeenAt })
        setPresence(m)
      })
      .catch(() => {})
  }, [classQuery])
  useEffect(() => { loadPresence() }, [loadPresence])
  const seenTag = (gid: string) => {
    const iso = presence.get(gid)?.lastSeenAt ?? null
    return <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 6, color: lastSeenColor(iso) }} title={iso ? `Last signed in ${new Date(iso).toLocaleString()}` : 'No recorded sign-in yet'}>{lastSeenLabel(iso)}</span>
  }

  const openCell = useCallback((studentId: string, targetId: string) => {
    if (grid?.students.find(s => s.id === studentId)?.ratable === false) return
    const version = ++workRequestVersion.current
    setSel({ studentId, targetId }); setWork(null); setError(null); setWorkLoading(true)
    fetch(`/api/mastery/student-work?user_id=${encodeURIComponent(studentId)}&unit_id=${encodeURIComponent(unitId)}&target_id=${encodeURIComponent(targetId)}`)
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error ?? 'Could not load work'); return data })
      .then((data: WorkData) => { if (version === workRequestVersion.current) { setWork(data); setWorkLoading(false) } })
      .catch(e => { if (version === workRequestVersion.current) { setError(e.message); setWorkLoading(false) } })
  }, [unitId, grid])
  const closeDrawer = useCallback(() => { workRequestVersion.current++; setSel(null); setWork(null) }, [])

  // ---- student-first grading flow ------------------------------------------
  // Visible students in display order (roster order + name filter).
  const masteryStudents = useMemo(
    // Your own roster only — admin included. Other teachers' students stay in
    // the mastery grid (the data view), but never enter the grading drawer.
    () => (grid ? grid.students.filter((s) => s.ratable !== false && s.name.toLowerCase().includes(nameFilter.toLowerCase())) : []),
    [grid, nameFilter]
  )
  const rosterForView = masteryStudents

  type PendingCell = { targetId: string }
  // A student's still-pending target cells, newest grades excluded.
  const pendingCellsFor = useCallback((sid: string, exclude?: string): PendingCell[] => {
    if (!grid) return []
    // View-only students (not on YOUR roster) never enter the grading walk.
    if (grid.students.find((s) => s.id === sid)?.ratable === false) return []
    return grid.targets
      .filter((t) => grid.pending?.[sid]?.[t.id]
        && `m:${sid}:${t.id}` !== exclude && !gradedKeys.has(`m:${sid}:${t.id}`))
      .map((t) => ({ targetId: t.id }))
  }, [grid, gradedKeys])

  const studentPendingCount = useCallback((sid: string) => pendingCellsFor(sid).length, [pendingCellsFor])

  const pendingStudents = useMemo(
    () => rosterForView.filter((s) => studentPendingCount(s.id) > 0),
    [rosterForView, studentPendingCount]
  )
  const totalPendingInView = useMemo(
    () => pendingStudents.reduce((n, s) => n + studentPendingCount(s.id), 0),
    [pendingStudents, studentPendingCount]
  )

  // "Grade pending" launcher: open the first pending student's first pending cell.
  const startGradingPending = useCallback(() => {
    setGradedKeys(new Set())
    const first = pendingStudents[0]
    if (first) openCell(first.id, pendingCellsFor(first.id)[0]?.targetId)
  }, [pendingStudents, pendingCellsFor, openCell])

  // The queue is demoted to a collapsed "Priority" strip: only the truly urgent
  // (aged 48h+ or self-flagged "Not yet"). Everything else is walked by the one
  // "Grade pending" CTA, so the queue is no longer a competing second door.
  const priorityQueue = queue.filter((q) => q.aged || q.needsHelp)

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <LessonContextLinks courseId={classId} lessonId={lessonFilter} unitId={unitId} /><LessonReviewQueue lessonId={lessonFilter} onClearLesson={() => setLessonFilter('')} onRateTarget={openCell} unitId={unitId} classQuery={classQuery} onReviewed={() => { loadGrid(unitId); loadQueue(unitId) }} renderResponse={(response) => <ResponseView response={response} />} />
      {/* toolbar — title · tabs · scope · unit · filter · one CTA on a single
          compact line, so the grid is the first paint on a laptop */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <h1 className="text-xl font-semibold tracking-tight" style={{ marginRight: 4 }}>Class mastery</h1>
        <Button asChild variant="outline" className="min-h-12"><Link href="/admin/xp-terms">Term XP requirements</Link></Button>
        <Button asChild variant="outline" className="min-h-12"><Link href="/admin/observe">Classroom observations</Link></Button>
        {/* tabs: mastery (targets) vs lessons (completion) vs math (spine); the
            active tab carries its keyboard contract so the scheme is visible
            before the drawer opens */}
        {([['mastery', 'Mastery (targets)', 'keys 1·2·3 rate'], ['math', 'Math (spine)', '']] as const).map(([v, label, hint]) => {
          const active = view === v
          const toGrade = 0
          return (
            <button key={v} onClick={() => setView(v)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ border: '1px solid var(--border)', background: active ? 'var(--primary)' : 'var(--card)', color: active ? 'var(--primary-foreground)' : 'var(--foreground)' }}>
              {label}
              {toGrade > 0 && (
                <span className="inline-flex items-center justify-center"
                  style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, fontSize: 11, fontWeight: 700,
                    background: active ? 'var(--primary-foreground)' : 'var(--destructive)',
                    color: active ? 'var(--primary)' : 'white' }}>
                  {toGrade}
                </span>
              )}
              {active && hint && (
                <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85, paddingLeft: 8, borderLeft: '1px solid color-mix(in oklch, var(--primary-foreground) 35%, transparent)', whiteSpace: 'nowrap' }}>
                  {hint}
                </span>
              )}
            </button>
          )
        })}
        <span className="flex-1" style={{ minWidth: 4 }} />
        <input
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Filter students…"
          className="rounded-lg text-sm px-3 py-2"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', width: 150 }}
        />
        {teachers.length > 1 && (
          <select
            value={teacherFilter}
            onChange={(e) => {
              const t = e.target.value
              setTeacherFilter(t)
              // A class belonging to another teacher can't stay scoped.
              if (t && classId && classes.find((c) => c.id === classId)?.teacher !== t) pickClass('')
            }}
            title="Monitor one teacher's classes (admin)"
            className="rounded-lg text-sm px-3 py-2"
            style={{ border: `1px solid ${teacherFilter ? 'color-mix(in oklch, var(--primary) 45%, var(--border))' : 'var(--border)'}`, background: 'var(--card)', color: 'var(--foreground)', textTransform: 'capitalize' }}
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t} value={t}>{teacherName(t)}</option>
            ))}
          </select>
        )}
        {classes.length > 0 && (
          <select
            value={classId ?? ''}
            onChange={(e) => pickClass(e.target.value)}
            title={classId
              ? `Scoped to ${classLabel || 'one class'}`
              : 'Scope to one class/section'}
            className="rounded-lg text-sm px-3 py-2"
            style={{ border: `1px solid ${classId ? 'color-mix(in oklch, var(--primary) 45%, var(--border))' : 'var(--border)'}`, background: 'var(--card)', color: 'var(--foreground)' }}
          >
            <option value="">{teacherFilter ? `All of ${teacherName(teacherFilter)}’s students` : teachers.length > 1 ? 'All students' : 'All my students'}</option>
            {teachers.length > 1 && !teacherFilter
              ? teachers.map((t) => (
                  <optgroup key={t} label={teacherName(t)}>
                    {classes.filter((c) => c.teacher === t).map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </optgroup>
                ))
              : visibleClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
          </select>
        )}
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="rounded-lg text-sm px-3 py-2"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
        >
          {unitId === 'auto' && <option value="auto">Finding this class’s unit…</option>}
          {(() => {
            const all = grid?.units ?? [{ id: 'unit-1', name: 'Unit 1', program: 'physics' }]
            // A scoped class sees only its program's units; unscoped, group by program.
            const list = classProgram ? all.filter((u) => (u.program ?? 'physics') === classProgram) : all
            const programs = [...new Set(list.map((u) => u.program ?? 'physics'))]
            const label = (p: string) => (p === 'trades' ? 'Trades Physics' : p === 'projects' ? 'Project Physics (MVP)' : 'Physics')
            if (programs.length <= 1) return list.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)
            return programs.map((p) => (
              <optgroup key={p} label={label(p)}>
                {list.filter((u) => (u.program ?? 'physics') === p).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </optgroup>
            ))
          })()}
        </select>
        {/* the single launcher — every pending cell is walked from here */}
        {view !== 'math' && (
          <button
            onClick={startGradingPending}
            disabled={totalPendingInView === 0}
            title={totalPendingInView
              ? `${pendingStudents.length} student${pendingStudents.length === 1 ? '' : 's'} with work to grade — all of one student, then the next.`
              : 'Nothing pending to grade in this view.'}
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: totalPendingInView ? 'pointer' : 'default' }}
          >
            {totalPendingInView ? `Grade ${totalPendingInView} pending` : 'Grade pending'}
          </button>
        )}
      </div>

      {/* math spine — cross-cutting competencies + warm-up review. The daily
          math-fluency rating lives here (its own tab, not the top stack) so the
          mastery/lessons grids stay first paint. */}
      {view === 'math' && (
        <div className="mt-4">
          <details className="mb-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
              Daily math-fluency rating
            </summary>
            <div style={{ padding: '0 14px 14px' }}><TeacherDailyMathTask /></div>
          </details>
          <MathControlRoom classId={classId} teacher={teacherFilter || null} />
          {/* Check Lab — repair bench for the instant answer checker (admin) */}
          <a href="/admin/check-lab" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            🧪 Check Lab — answers the instant checker missed →
          </a>
        </div>
      )}

      {/* Priority strip — demoted + collapsed; only aged 48h+ or self-flagged
          "Not yet". The full pending set is walked by "Grade pending" above. */}
      {view === 'mastery' && priorityQueue.length > 0 && (
        <details className="rounded-xl border mt-4" style={{ borderColor: 'color-mix(in oklch, var(--reward) 35%, var(--border))', background: 'color-mix(in oklch, var(--reward) 8%, transparent)' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
            Priority · {priorityQueue.length} aged or flagged
          </summary>
          <div className="flex flex-col gap-1.5" style={{ padding: '0 14px 14px' }}>
            {priorityQueue.map((q) => (
              <div key={q.studentId} className="flex items-center gap-3 flex-wrap rounded-lg px-3 py-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <span className="text-sm font-semibold flex-1" style={{ minWidth: '8rem' }}>{q.name}</span>
                {q.aged && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--destructive) 16%, transparent)', color: 'var(--destructive)' }}>48h+ waiting</span>}
                {q.needsHelp && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--reward) 26%, transparent)', color: 'var(--reward-foreground)' }}>self: Not yet</span>}
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{q.count} item{q.count === 1 ? '' : 's'} · waiting {q.oldestAgeHours}h</span>
                <button
                  onClick={() => { const target = pendingCellsFor(q.studentId)[0]?.targetId ?? grid?.targets[0]?.id; if (target) openCell(q.studentId, target) }}
                  disabled={!grid || grid.targets.length === 0}
                  className="text-xs font-bold rounded-lg px-3 py-1.5 disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  Grade →
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {error && <div className="text-sm rounded-md px-3 py-2 my-3" style={{ background: 'var(--secondary)', color: 'var(--destructive)' }}>{error}</div>}
      {loading && <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>Loading the grid…</p>}

      {view === 'mastery' && !loading && grid && grid.students.length === 0 && (
        <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>No students on your roster yet.</p>
      )}

      {view === 'mastery' && !loading && grid && grid.students.length > 0 && (
        <div className="rounded-xl border mt-4 overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 6, padding: 8 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--card)', textAlign: 'left', padding: '4px 10px', fontSize: 12, color: 'var(--muted-foreground)' }}>Student</th>
                {grid.targets.map((t, i) => (
                  <th key={t.id} title={t.statement} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', padding: '4px 2px', minWidth: 46 }}>
                    T{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.students.filter((s) => s.name.toLowerCase().includes(nameFilter.toLowerCase())).map((s) => (
                <tr key={s.id}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--card)', fontSize: 13, fontWeight: 500, padding: '4px 10px', whiteSpace: 'nowrap' }}>{s.name}{seenTag(s.id)}</td>
                  {grid.targets.map((t) => {
                    const c = grid.cells[s.id]?.[t.id]
                    const b = band(c?.value ?? null)
                    return (
                      <td key={t.id} style={{ padding: 0 }}>
                        <button
                          onClick={() => openCell(s.id, t.id)}
                          title={`${s.name} · ${t.statement}${b ? ` · ${levelWord(b)} (${b})` : ' · not rated'}`}
                          aria-label={`${s.name}, ${t.statement}: ${b ? `${levelWord(b)} (${b})` : 'not rated'}`}
                          className="grid place-items-center font-bold"
                          style={{ width: 40, height: 38, borderRadius: 9, fontSize: 15, cursor: 'pointer', ...cellStyle(b) }}
                        >
                          {bandGlyph(b)}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'mastery' && !loading && grid && (
        <div className="flex gap-4 flex-wrap mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center" style={{ width: 16, height: 16, borderRadius: 4, fontSize: 11, fontWeight: 700, ...cellStyle(3) }}>{bandGlyph(3)}</span> Got it (3)</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center" style={{ width: 16, height: 16, borderRadius: 4, fontSize: 11, fontWeight: 700, ...cellStyle(2) }}>{bandGlyph(2)}</span> Almost (2)</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center" style={{ width: 16, height: 16, borderRadius: 4, fontSize: 11, fontWeight: 700, ...cellStyle(1) }}>{bandGlyph(1)}</span> Not yet (1)</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center" style={{ width: 16, height: 16, borderRadius: 4, fontSize: 11, fontWeight: 700, ...cellStyle(0) }}>{bandGlyph(0)}</span> Not rated</span>
          <span style={{ marginLeft: 'auto' }}>Cells show shape + color — hover a cell for the level, a header for the target.</span>
        </div>
      )}

      {/* Lesson-completion gradebook removed — lessons are engagement, mastery is the grade. */}

      {sel && grid && <MasteryReviewDesk studentId={sel.studentId} targetId={sel.targetId} unitId={unitId} students={rosterForView} targets={grid.targets} work={work} loading={workLoading} loadError={error} onSelect={openCell} onClose={closeDrawer} onSaved={() => { loadGrid(unitId); loadQueue(unitId) }} pendingCount={studentPendingCount} renderResponse={w => <ResponseView response={w.response} prompt={w.prompt}/>} />}
    </div>
  )
}
