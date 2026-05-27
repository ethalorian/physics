"use client"

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { InlineMath } from '@/components/MathMarkdown'
import { toLatex } from '@/components/blocks/EquationSandbox'

// ---------------------------------------------------------------------------
// Types (mirror /api/mastery/grid and /api/mastery/student-work)
// ---------------------------------------------------------------------------
interface Target { id: string; statement: string; domain: string }
interface Student { id: string; name: string; email: string }
interface Cell { value: number | null; count: number }
interface GridData {
  unitId: string
  units: { id: string; name: string }[]
  targets: Target[]
  students: Student[]
  cells: Record<string, Record<string, Cell>>
}
interface WorkItem { lessonTitle: string; lessonId?: string | null; blockType: string | null; blockId: string; response: unknown; createdAt: string }
interface RecordItem { target_id: string; level: number; observed_at: string; evidence_source?: string | null }
interface WorkData { userId: string; unitId: string; targets: Target[]; records: RecordItem[]; work: WorkItem[] }

interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean; needsHelp: boolean }
interface LessonCol { id: string; slug: string; title: string; lessonNumber: number; targetId: string | null }
interface LessonCell { status: string; pct: number; needsGrading: boolean }
interface LessonGridData { unitId: string; lessons: LessonCol[]; students: Student[]; cells: Record<string, Record<string, LessonCell>> }

const EVIDENCE = ['observation', 'exit ticket', 'lab', 'conversation', 'quiz']

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

// Flatten a captured block response to a short text blob for the AI assist.
function workToText(r: unknown): string {
  if (r && typeof r === 'object') {
    const o = r as Record<string, unknown>
    if ('given' in o || 'equation' in o || 'work' in o || 'answer' in o || 'workStrokes' in o || 'sandbox' in o) {
      const parts = ['given', 'equation', 'work', 'answer'].filter((k) => o[k]).map((k) => `${k}: ${o[k]}`)
      const sb = o.sandbox && typeof o.sandbox === 'object' ? (o.sandbox as { lines?: unknown[] }) : null
      if (sb && Array.isArray(sb.lines) && sb.lines.length > 0) parts.push(`work & answer: ${sb.lines.map(String).join(' | ')}`)
      if (Array.isArray(o.workStrokes) && o.workStrokes.length > 0) parts.push('work & answer: [handwritten — see drawing]')
      return parts.join('; ')
    }
    if ('pattern' in o || 'interpret' in o) {
      return [o.pattern ? `pattern: ${o.pattern}` : '', o.interpret ? `interpret: ${o.interpret}` : ''].filter(Boolean).join('; ')
    }
    if ('lines' in o && Array.isArray(o.lines)) return `sandbox: ${(o.lines as unknown[]).map(String).join(' | ')}`
    if ('strokes' in o) return '[drawing]'
    return JSON.stringify(o)
  }
  return String(r ?? '')
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

type StrokeShape = { color?: string; points?: { x: number; y: number }[] }
function StrokesSvg({ strokes, label }: { strokes: StrokeShape[]; label: string }) {
  if (!strokes || strokes.length === 0) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>[empty drawing]</p>
  return (
    <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: 420, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} role="img" aria-label={label}>
      {strokes.map((s, i) => {
        const pts = (s.points ?? []).map((p) => `${p.x},${p.y}`).join(' ')
        if (!pts) return null
        return <polyline key={i} points={pts} fill="none" stroke={s.color || '#2D2A4A'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      })}
    </svg>
  )
}

function ResponseView({ response }: { response: unknown }) {
  if (response && typeof response === 'object') {
    const o = response as Record<string, unknown>
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
      return (
        <div>
          {field('given', 'Given')}
          {field('equation', 'Equation')}
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
  const [grid, setGrid] = useState<GridData | null>(null)
  const [unitId, setUnitId] = useState('unit-1')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sel, setSel] = useState<{ studentId: string; targetId: string } | null>(null)
  const [work, setWork] = useState<WorkData | null>(null)
  const [workLoading, setWorkLoading] = useState(false)
  const [evidence, setEvidence] = useState('observation')
  const [saving, setSaving] = useState(false)
  const [suggestion, setSuggestion] = useState<{ level: number; rationale: string } | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [nameFilter, setNameFilter] = useState('')
  const [comparison, setComparison] = useState<{ studentAvg: number | null; globalAvg: number | null; nStudents: number; lessonTitle: string | null } | null>(null)
  const [view, setView] = useState<'mastery' | 'lessons'>('mastery')
  const [lessonGrid, setLessonGrid] = useState<LessonGridData | null>(null)

  const loadGrid = useCallback((unit: string) => {
    setLoading(true)
    fetch(`/api/mastery/grid?unit_id=${encodeURIComponent(unit)}`)
      .then((r) => r.json())
      .then((d: GridData & { error?: string }) => {
        if (d.error) setError(d.error)
        else setGrid(d)
        setLoading(false)
      })
      .catch(() => { setError('Could not load the grid'); setLoading(false) })
  }, [])

  useEffect(() => { loadGrid(unitId) }, [unitId, loadGrid])

  const loadQueue = useCallback((unit: string) => {
    fetch(`/api/mastery/queue?unit_id=${encodeURIComponent(unit)}`)
      .then((r) => r.json())
      .then((d: { queue?: QueueItem[] }) => setQueue(d.queue ?? []))
      .catch(() => {})
  }, [])
  useEffect(() => { loadQueue(unitId) }, [unitId, loadQueue])

  const loadLessonGrid = useCallback((unit: string) => {
    fetch(`/api/mastery/lesson-grid?unit_id=${encodeURIComponent(unit)}`)
      .then((r) => r.json())
      .then((d: LessonGridData & { error?: string }) => { if (!d.error) setLessonGrid(d) })
      .catch(() => {})
  }, [])
  useEffect(() => { loadLessonGrid(unitId) }, [unitId, loadLessonGrid])

  const openCell = useCallback((studentId: string, targetId: string) => {
    setSel({ studentId, targetId })
    setWork(null)
    setSuggestion(null)
    setComparison(null)
    setWorkLoading(true)
    fetch(`/api/mastery/student-work?user_id=${encodeURIComponent(studentId)}&unit_id=${encodeURIComponent(unitId)}&target_id=${encodeURIComponent(targetId)}`)
      .then((r) => r.json())
      .then((d: WorkData) => { setWork(d); setWorkLoading(false) })
      .catch(() => setWorkLoading(false))
    fetch(`/api/mastery/lesson-comparison?user_id=${encodeURIComponent(studentId)}&target_id=${encodeURIComponent(targetId)}`)
      .then((r) => r.json())
      .then((d: { studentAvg: number | null; globalAvg: number | null; nStudents: number; lessonTitle: string | null }) => setComparison(d))
      .catch(() => {})
  }, [unitId])

  const closeDrawer = () => { setSel(null); setWork(null); setSuggestion(null); setComparison(null) }

  const suggestRating = async () => {
    if (!work || !selTarget) return
    setSuggesting(true)
    const workText = work.work
      .map((w) => `${w.lessonTitle}${w.blockType ? ` (${w.blockType})` : ''}: ${workToText(w.response)}`)
      .join('\n')
    try {
      const res = await fetch('/api/mastery/suggest-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatement: selTarget.statement, work: workText }),
      })
      const d = await res.json()
      if (res.ok) setSuggestion({ level: d.level, rationale: d.rationale })
      else setSuggestion({ level: 0, rationale: d.error ?? 'Could not suggest a rating' })
    } catch {
      setSuggestion({ level: 0, rationale: 'Could not reach the AI assist' })
    } finally {
      setSuggesting(false)
    }
  }

  const saveRating = async (level: 1 | 2 | 3) => {
    if (!sel || !grid) return
    const student = grid.students.find((s) => s.id === sel.studentId)
    setSaving(true)
    try {
      await fetch('/api/mastery/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sel.studentId, user_email: student?.email ?? null, target_id: sel.targetId, level, evidence_source: evidence }),
      })
      // Refresh the grid + queue so the cell and queue reflect the new rating.
      loadGrid(unitId)
      loadQueue(unitId)
      loadLessonGrid(unitId)
      // Column-first: advance to the next student on the SAME target.
      const idx = grid.students.findIndex((s) => s.id === sel.studentId)
      const next = grid.students[idx + 1]
      if (next) openCell(next.id, sel.targetId)
      else closeDrawer()
    } catch {
      setError('Could not save the rating')
    } finally {
      setSaving(false)
    }
  }

  const selStudent = grid && sel ? grid.students.find((s) => s.id === sel.studentId) : null
  const selTarget = grid && sel ? grid.targets.find((t) => t.id === sel.targetId) : null
  const selHistory = work && sel ? work.records.filter((r) => r.target_id === sel.targetId) : []

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Class mastery</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Tap any cell to open that student&apos;s work and rate it. These scores drive each student&apos;s Retry lane.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Filter students…"
            className="rounded-lg text-sm px-3 py-2"
            style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', width: 160 }}
          />
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="rounded-lg text-sm px-3 py-2"
            style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
          >
            {(grid?.units ?? [{ id: 'unit-1', name: 'Unit 1' }]).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* tabs: mastery (targets) vs lessons (completion) */}
      <div className="flex gap-2 mt-4">
        {([['mastery', 'Mastery (targets)'], ['lessons', 'Lessons (completion)']] as const).map(([v, label]) => {
          const active = view === v
          const toGrade = v === 'lessons' && lessonGrid
            ? Object.values(lessonGrid.cells).reduce((sum, row) => sum + Object.values(row).filter((c) => c.needsGrading).length, 0)
            : 0
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
            </button>
          )
        })}
      </div>

      {/* grading queue — most urgent first */}
      {view === 'mastery' && queue.length > 0 && (
        <div className="rounded-xl border mt-4 p-4" style={{ borderColor: 'color-mix(in oklch, var(--reward) 35%, var(--border))', background: 'color-mix(in oklch, var(--reward) 8%, transparent)' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Needs grading · {queue.length}</div>
          <div className="flex flex-col gap-1.5">
            {queue.map((q) => (
              <div key={q.studentId} className="flex items-center gap-3 flex-wrap rounded-lg px-3 py-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <span className="text-sm font-semibold flex-1" style={{ minWidth: '8rem' }}>{q.name}</span>
                {q.aged && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--destructive) 16%, transparent)', color: 'var(--destructive)' }}>48h+ waiting</span>}
                {q.needsHelp && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--reward) 26%, transparent)', color: 'var(--reward-foreground)' }}>self: Not yet</span>}
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{q.count} item{q.count === 1 ? '' : 's'} · waiting {q.oldestAgeHours}h</span>
                <button
                  onClick={() => { if (grid && grid.targets[0]) openCell(q.studentId, grid.targets[0].id) }}
                  disabled={!grid || grid.targets.length === 0}
                  className="text-xs font-bold rounded-lg px-3 py-1.5 disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  Grade →
                </button>
              </div>
            ))}
          </div>
        </div>
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
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--card)', fontSize: 13, fontWeight: 500, padding: '4px 10px', whiteSpace: 'nowrap' }}>{s.name}</td>
                  {grid.targets.map((t) => {
                    const c = grid.cells[s.id]?.[t.id]
                    const b = band(c?.value ?? null)
                    return (
                      <td key={t.id} style={{ padding: 0 }}>
                        <button
                          onClick={() => openCell(s.id, t.id)}
                          title={`${s.name} · ${t.statement}`}
                          className="grid place-items-center font-bold"
                          style={{ width: 40, height: 38, borderRadius: 9, fontSize: 13, cursor: 'pointer', ...cellStyle(b) }}
                        >
                          {b === 0 ? '–' : b}
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
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(3) }} /> Got it (3)</span>
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(2) }} /> Almost (2)</span>
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(1) }} /> Not yet (1)</span>
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(0) }} /> Not rated</span>
          <span style={{ marginLeft: 'auto' }}>Columns are learning targets — hover a header for the full statement.</span>
        </div>
      )}

      {/* LESSONS (completion) tab */}
      {view === 'lessons' && lessonGrid && lessonGrid.students.length > 0 && (
        <>
          <div className="rounded-xl border mt-4 overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 6, padding: 8 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--card)', textAlign: 'left', padding: '4px 10px', fontSize: 12, color: 'var(--muted-foreground)' }}>Student</th>
                  {lessonGrid.lessons.map((l) => (
                    <th key={l.id} title={l.title} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', padding: '4px 2px', minWidth: 40 }}>
                      D{l.lessonNumber}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessonGrid.students.filter((s) => s.name.toLowerCase().includes(nameFilter.toLowerCase())).map((s) => (
                  <tr key={s.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--card)', fontSize: 13, fontWeight: 500, padding: '4px 10px', whiteSpace: 'nowrap' }}>{s.name}</td>
                    {lessonGrid.lessons.map((l) => {
                      const c = lessonGrid.cells[s.id]?.[l.id]
                      const st = c?.status ?? 'not_started'
                      const bg = st === 'completed' ? 'color-mix(in oklch, var(--success) 22%, var(--card))'
                        : st === 'in_progress' ? 'color-mix(in oklch, var(--reward) 22%, var(--card))'
                        : 'var(--secondary)'
                      const mark = st === 'completed' ? '✓' : st === 'in_progress' ? '·' : ''
                      const clickable = !!l.targetId
                      return (
                        <td key={l.id} style={{ padding: 0 }}>
                          <button
                            onClick={() => { if (l.targetId) openCell(s.id, l.targetId) }}
                            disabled={!clickable}
                            title={`${s.name} · D${l.lessonNumber} ${l.title}${c?.needsGrading ? ' · work to grade' : ''}`}
                            className="grid place-items-center font-bold"
                            style={{ position: 'relative', width: 38, height: 36, borderRadius: 9, fontSize: 14, color: 'var(--foreground)', background: bg, border: '0.5px solid var(--border)', cursor: clickable ? 'pointer' : 'default' }}
                          >
                            {mark}
                            {c?.needsGrading && <span style={{ position: 'absolute', top: 3, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--destructive)' }} />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 flex-wrap mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, background: 'color-mix(in oklch, var(--success) 22%, var(--card))', border: '0.5px solid var(--border)' }} /> Done</span>
            <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, background: 'color-mix(in oklch, var(--reward) 22%, var(--card))', border: '0.5px solid var(--border)' }} /> In progress</span>
            <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, background: 'var(--secondary)', border: '0.5px solid var(--border)' }} /> Not started</span>
            <span className="inline-flex items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--destructive)' }} /> Work to grade</span>
            <span style={{ marginLeft: 'auto' }}>Columns are day-lessons — tap a cell to open that student&apos;s work and grade it.</span>
          </div>
        </>
      )}
      {view === 'lessons' && lessonGrid && lessonGrid.students.length === 0 && (
        <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>No students on your roster yet.</p>
      )}

      {/* scrim + drawer */}
      {sel && (
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }} />
          <aside
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '92vw', zIndex: 50,
              background: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
              boxShadow: '-20px 0 50px -20px color-mix(in oklch, var(--foreground) 40%, transparent)',
            }}
          >
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={closeDrawer} style={{ float: 'right', border: 'none', background: 'transparent', color: 'var(--muted-foreground)', fontSize: 20, cursor: 'pointer' }}>×</button>
              <div className="font-bold" style={{ fontSize: 18 }}>{selStudent?.name}</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)', marginTop: 2 }}>{selTarget?.statement}</div>
              {selTarget && <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: 4, textTransform: 'capitalize' }}>{selTarget.domain}</div>}
            </div>

            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
              {/* this student vs. the class on this lesson (same decaying-avg rollup as the grid) */}
              {comparison && (comparison.studentAvg !== null || comparison.globalAvg !== null) && (() => {
                const s = comparison.studentAvg, g = comparison.globalAvg
                const bar = (v: number | null) => `${v === null ? 0 : Math.max(4, (v / 3) * 100)}%`
                const delta = s !== null && g !== null ? s - g : null
                const deltaColor = delta === null ? 'var(--muted-foreground)' : delta >= 0.05 ? 'var(--success)' : delta <= -0.05 ? 'oklch(0.62 0.16 25)' : 'var(--muted-foreground)'
                const deltaText = delta === null ? '' : Math.abs(delta) < 0.05 ? 'at class average' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} vs class`
                return (
                  <div className="rounded-lg px-3 py-2.5 mb-5" style={{ background: 'var(--secondary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>This lesson · mastery vs. class</span>
                      {delta !== null && <span className="text-xs font-bold" style={{ color: deltaColor }}>{deltaText}</span>}
                    </div>
                    {[{ label: 'This student', v: s, c: 'var(--primary)' }, { label: `Class avg${comparison.nStudents ? ` (${comparison.nStudents})` : ''}`, v: g, c: 'var(--muted-foreground)' }].map((row) => (
                      <div key={row.label} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs shrink-0" style={{ width: 96, color: 'var(--foreground)' }}>{row.label}</span>
                        <span className="flex-1 rounded-full" style={{ height: 8, background: 'var(--card)', overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: bar(row.v), background: row.c, borderRadius: 9999 }} />
                        </span>
                        <span className="text-sm font-bold shrink-0" style={{ width: 34, textAlign: 'right', color: 'var(--foreground)' }}>{row.v === null ? '—' : row.v.toFixed(1)}</span>
                      </div>
                    ))}
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Decaying-average rollup on a 1–3 scale, across this lesson&apos;s targets.</p>
                  </div>
                )
              })()}

              {/* rating history */}
              <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>Rating history</div>
              {selHistory.length > 0 ? (
                <div className="flex flex-col gap-1.5 mb-5">
                  {selHistory.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm rounded-md px-3 py-1.5" style={{ background: 'var(--secondary)' }}>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">{fmtDate(r.observed_at)}</span>
                        {r.evidence_source && (
                          <span className="truncate text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '0.5px solid var(--border)' }}>
                            {r.evidence_source}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0" style={{ fontWeight: 700 }}>{levelWord(r.level)} ({r.level})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>No prior ratings on this target.</p>
              )}

              {/* submitted work */}
              <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>Work for this target&apos;s lesson</div>
              {workLoading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading work…</p>}
              {!workLoading && work && work.work.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No work captured yet for this target&apos;s lesson.</p>
              )}
              {!workLoading && work && work.work.map((w) => (
                <div key={`${w.lessonTitle}-${w.blockId}`} className="rounded-lg border p-3 mb-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--secondary) 40%, transparent)' }}>
                  <div className="text-xs mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    {w.lessonTitle}{w.blockType ? ` · ${w.blockType}` : ''} · {fmtDate(w.createdAt)}
                  </div>
                  <ResponseView response={w.response} />
                </div>
              ))}
            </div>

            {/* rater */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <div className="text-sm font-semibold mb-2">Your mastery rating</div>
              <button
                onClick={suggestRating}
                disabled={suggesting || !work || work.work.length === 0}
                className="w-full mb-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: 'color-mix(in oklch, var(--primary) 40%, var(--border))', color: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}
              >
                {suggesting ? 'Asking Claude…' : '✨ Suggest a rating (Claude)'}
              </button>
              {suggestion && (
                <div className="mb-2 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}>
                  {suggestion.level >= 1 && suggestion.level <= 3 ? (
                    <>
                      <b>Claude suggests: {levelWord(suggestion.level)} ({suggestion.level})</b> — {suggestion.rationale}
                      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Your call — tap a level to record it.</div>
                    </>
                  ) : (
                    <span style={{ color: 'var(--muted-foreground)' }}>{suggestion.rationale}</span>
                  )}
                </div>
              )}
              <div className="rounded-lg px-3 py-2 mb-2" style={{ background: 'color-mix(in oklch, var(--secondary) 50%, transparent)', border: '0.5px dashed var(--border)' }}>
                <label htmlFor="evidence-src" className="block text-xs font-semibold mb-1" style={{ color: 'var(--secondary-foreground)' }}>
                  Evidence for this rating
                </label>
                <div className="flex items-center gap-2">
                  <select id="evidence-src" value={evidence} onChange={(e) => setEvidence(e.target.value)} className="flex-1 text-sm rounded-md px-2 py-1.5" style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                    {EVIDENCE.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Tags the rating you save below — it&apos;s not a filter.</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    disabled={saving}
                    onClick={() => saveRating(lvl as 1 | 2 | 3)}
                    className="flex-1 rounded-xl font-bold"
                    style={{
                      padding: '12px 0', fontSize: 13, cursor: 'pointer', border: '1.5px solid var(--border)',
                      background: lvl === 1 ? 'color-mix(in oklch, var(--destructive) 12%, transparent)' : lvl === 2 ? 'color-mix(in oklch, var(--reward) 22%, transparent)' : 'color-mix(in oklch, var(--success) 14%, transparent)',
                      color: lvl === 1 ? 'var(--destructive)' : lvl === 2 ? 'var(--reward-foreground)' : 'var(--success)',
                      boxShadow: suggestion && suggestion.level === lvl ? '0 0 0 2px var(--primary)' : undefined,
                    }}
                  >
                    {lvl} · {levelWord(lvl)}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Saving advances to the next student on this target.
              </p>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
