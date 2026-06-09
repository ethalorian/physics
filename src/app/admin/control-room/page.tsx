"use client"

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { InlineMath } from '@/components/MathMarkdown'
import { toLatex } from '@/components/blocks/EquationSandbox'
import MathControlRoom from '@/components/math-spine/MathControlRoom'
import { StrokeShapes, type Stroke } from '@/lib/draw/strokes'

// ---------------------------------------------------------------------------
// Types (mirror /api/mastery/grid and /api/mastery/student-work)
// ---------------------------------------------------------------------------
interface Target { id: string; statement: string; domain: string }
interface Student { id: string; name: string; email: string; firstName?: string | null; lastName?: string | null }
interface Cell { value: number | null; count: number }
interface GridData {
  unitId: string
  units: { id: string; name: string }[]
  targets: Target[]
  students: Student[]
  cells: Record<string, Record<string, Cell>>
  pending?: Record<string, Record<string, boolean>>
}
interface WorkItem { lessonTitle: string; lessonId?: string | null; blockType: string | null; blockId: string; response: unknown; createdAt: string }
interface RecordItem { target_id: string; level: number; observed_at: string; evidence_source?: string | null }
interface WorkData { userId: string; unitId: string; targets: Target[]; records: RecordItem[]; work: WorkItem[] }

interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean; needsHelp: boolean }
interface LessonCol { id: string; slug: string; title: string; lessonNumber: number; targetId: string | null }
interface LessonCell { status: string; pct: number; needsGrading: boolean; gradePct: number | null }
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
    <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: 420, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} role="img" aria-label={label}>
      <StrokeShapes strokes={strokes as Stroke[]} />
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

  const [sel, setSel] = useState<{ studentId: string; targetId: string; lesson?: { id: string; title: string; number: number } } | null>(null)
  const [gbPercent, setGbPercent] = useState('')
  const [gbSuggestion, setGbSuggestion] = useState<{ percent: number; rationale: string } | null>(null)
  const [gbBusy, setGbBusy] = useState(false)
  const [gbStats, setGbStats] = useState<{ studentLessonPct: number | null; studentUnitAvg: number | null; classDayAvg: number | null; classUnitAvg: number | null; completionPct: number | null; unitLessons: number; studentGraded: number } | null>(null)
  const [work, setWork] = useState<WorkData | null>(null)
  const [workLoading, setWorkLoading] = useState(false)
  const [evidence, setEvidence] = useState('observation')
  const [saving, setSaving] = useState(false)
  const [suggestion, setSuggestion] = useState<{ level: number; rationale: string } | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [nameFilter, setNameFilter] = useState('')
  const [comparison, setComparison] = useState<{ studentAvg: number | null; globalAvg: number | null; nStudents: number; lessonTitle: string | null } | null>(null)
  const [view, setView] = useState<'mastery' | 'lessons' | 'math'>('mastery')
  // Student-first grading: keys we've graded this session (so the queue and
  // roster shrink immediately, before the server refresh lands).
  const [gradedKeys, setGradedKeys] = useState<Set<string>>(new Set())
  // Between students we pause on a gate so your eyes land before the next swap.
  const [nextStudentGate, setNextStudentGate] = useState<{ id: string; name: string } | null>(null)
  const [lessonGrid, setLessonGrid] = useState<LessonGridData | null>(null)
  const [sortMode, setSortMode] = useState<'last' | 'first'>('last') // Aspen sorts by last name
  const [copyLessonId, setCopyLessonId] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  // Class/section scope. Aspen's gradebook is partitioned by section, so the
  // grade copy must be filterable to one class. Seeded from the per-class
  // deep-link (?class=&label=) and switchable here via the picker.
  const [classId, setClassId] = useState<string | null>(null)
  const [classLabel, setClassLabel] = useState<string | null>(null)
  const [classes, setClasses] = useState<{ id: string; label: string }[]>([])
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setClassId(sp.get('class'))
    setClassLabel(sp.get('label'))
  }, [])
  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((d: { courses?: { id: string; name: string; section: string | null }[] }) => {
        setClasses((d.courses ?? []).map((c) => ({ id: c.id, label: c.section ? `${c.name} · ${c.section}` : c.name })))
      })
      .catch(() => {})
  }, [])
  const classQuery = classId ? `&class=${encodeURIComponent(classId)}` : ''
  const pickClass = (id: string) => {
    setClassId(id || null)
    setClassLabel(id ? (classes.find((c) => c.id === id)?.label ?? null) : null)
  }

  const loadGrid = useCallback((unit: string) => {
    setLoading(true)
    fetch(`/api/mastery/grid?unit_id=${encodeURIComponent(unit)}${classQuery}`)
      .then((r) => r.json())
      .then((d: GridData & { error?: string }) => {
        if (d.error) setError(d.error)
        else setGrid(d)
        setLoading(false)
      })
      .catch(() => { setError('Could not load the grid'); setLoading(false) })
  }, [classQuery])

  useEffect(() => { loadGrid(unitId) }, [unitId, loadGrid])

  const loadQueue = useCallback((unit: string) => {
    fetch(`/api/mastery/queue?unit_id=${encodeURIComponent(unit)}${classQuery}`)
      .then((r) => r.json())
      .then((d: { queue?: QueueItem[] }) => setQueue(d.queue ?? []))
      .catch(() => {})
  }, [classQuery])
  useEffect(() => { loadQueue(unitId) }, [unitId, loadQueue])

  const loadLessonGrid = useCallback((unit: string) => {
    fetch(`/api/mastery/lesson-grid?unit_id=${encodeURIComponent(unit)}${classQuery}`)
      .then((r) => r.json())
      .then((d: LessonGridData & { error?: string }) => { if (!d.error) setLessonGrid(d) })
      .catch(() => {})
  }, [classQuery])
  useEffect(() => { loadLessonGrid(unitId) }, [unitId, loadLessonGrid])

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

  const openCell = useCallback((studentId: string, targetId: string, lesson?: { id: string; title: string; number: number }) => {
    setSel({ studentId, targetId, lesson })
    setWork(null)
    setSuggestion(null)
    setComparison(null)
    setGbSuggestion(null)
    setGbStats(null)
    setGbPercent(lesson ? String(lessonGrid?.cells?.[studentId]?.[lesson.id]?.gradePct ?? '') : '')
    setWorkLoading(true)
    fetch(`/api/mastery/student-work?user_id=${encodeURIComponent(studentId)}&unit_id=${encodeURIComponent(unitId)}&target_id=${encodeURIComponent(targetId)}`)
      .then((r) => r.json())
      .then((d: WorkData) => { setWork(d); setWorkLoading(false) })
      .catch(() => setWorkLoading(false))
    if (lesson) {
      // Gradebook-mode analytics: this student's lesson %, unit avg, and the
      // class averages (scoped to the active class/section).
      fetch(`/api/gradebook/drawer-stats?user_id=${encodeURIComponent(studentId)}&lesson_id=${encodeURIComponent(lesson.id)}&unit_id=${encodeURIComponent(unitId)}${classQuery}`)
        .then((r) => r.json())
        .then((d) => { if (!d.error) setGbStats(d) })
        .catch(() => {})
    } else {
      fetch(`/api/mastery/lesson-comparison?user_id=${encodeURIComponent(studentId)}&target_id=${encodeURIComponent(targetId)}`)
        .then((r) => r.json())
        .then((d: { studentAvg: number | null; globalAvg: number | null; nStudents: number; lessonTitle: string | null }) => setComparison(d))
        .catch(() => {})
    }
  }, [unitId, lessonGrid, classQuery])

  const closeDrawer = () => { setSel(null); setWork(null); setSuggestion(null); setComparison(null); setGbSuggestion(null); setGbStats(null); setGbPercent(''); setNextStudentGate(null) }

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
      // Student-first: clear this student's pending work before the next student.
      const gradedKey = `m:${sel.studentId}:${sel.targetId}`
      setGradedKeys((prev) => new Set(prev).add(gradedKey))
      advanceStudentFirst(sel.studentId, gradedKey)
    } catch {
      setError('Could not save the rating')
    } finally {
      setSaving(false)
    }
  }

  // --- gradebook (completion tab): suggest + save a percentage ----------------
  const suggestGradebook = async () => {
    if (!work || !sel?.lesson) return
    setGbBusy(true)
    const workText = work.work.map((w) => `${w.blockType ? `(${w.blockType}) ` : ''}${workToText(w.response)}`).join('\n')
    const completionPct = lessonGrid?.cells?.[sel.studentId]?.[sel.lesson.id]?.pct ?? null
    try {
      const res = await fetch('/api/gradebook/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonTitle: sel.lesson.title, completionPct, work: workText }),
      })
      const d = await res.json()
      if (res.ok) { setGbSuggestion({ percent: d.percent, rationale: d.rationale }); setGbPercent(String(d.percent)) }
      else setGbSuggestion({ percent: -1, rationale: d.error ?? 'Could not suggest a score' })
    } catch { setGbSuggestion({ percent: -1, rationale: 'Could not reach the AI assist' }) }
    finally { setGbBusy(false) }
  }

  const saveGradebook = async (override?: number) => {
    if (!sel?.lesson || !lessonGrid) return
    const raw = override ?? Number(gbPercent)
    const pct = Math.max(0, Math.min(100, Math.round(raw)))
    if (!Number.isFinite(pct)) return
    const student = lessonGrid.students.find((s) => s.id === sel.studentId)
    setGbBusy(true)
    try {
      await fetch('/api/gradebook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sel.studentId, user_email: student?.email ?? null, student_name: student?.name ?? null,
          item_type: 'lesson', item_id: sel.lesson.id, item_title: sel.lesson.title, score: pct, max_score: 100, status: 'graded', graded_at: new Date().toISOString() }),
      })
      loadLessonGrid(unitId)
      // Student-first: clear this student's pending lessons before the next student.
      const gradedKey = `l:${sel.studentId}:${sel.lesson.id}`
      setGradedKeys((prev) => new Set(prev).add(gradedKey))
      advanceStudentFirst(sel.studentId, gradedKey)
    } catch { setError('Could not save the score') }
    finally { setGbBusy(false) }
  }

  const selStudent = grid && sel ? grid.students.find((s) => s.id === sel.studentId) : null
  const selTarget = grid && sel ? grid.targets.find((t) => t.id === sel.targetId) : null
  const selHistory = work && sel ? work.records.filter((r) => r.target_id === sel.targetId) : []

  // --- Aspen X2 ordering: Aspen lists students by LAST name, so the grid + copy
  // must match that order for column paste to line up row-for-row. Prefer the
  // stored last_name/first_name (set authoritatively on each Classroom import);
  // fall back to splitting the full name only when those are missing.
  const sortKey = (s: Student) => {
    const parts = s.name.trim().split(/\s+/)
    // Fallback: first token = first name, the rest = surname (Aspen files
    // compound surnames under the first surname). Prefer stored values.
    const last = (s.lastName || parts.slice(1).join(' ') || s.name).toLowerCase()
    const first = (s.firstName || parts[0] || s.name).toLowerCase()
    return sortMode === 'last' ? `${last} ${first}` : `${first} ${last}`
  }
  const sortedStudents = useMemo(() => {
    if (!lessonGrid) return []
    const visible = lessonGrid.students.filter((s) => s.name.toLowerCase().includes(nameFilter.toLowerCase()))
    return [...visible].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonGrid, nameFilter, sortMode])

  // ---- student-first grading flow ------------------------------------------
  // Visible students in the active view's display order (mastery uses roster
  // order + name filter; lessons uses the last/first-name sort).
  const masteryStudents = useMemo(
    () => (grid ? grid.students.filter((s) => s.name.toLowerCase().includes(nameFilter.toLowerCase())) : []),
    [grid, nameFilter]
  )
  const rosterForView = view === 'lessons' ? sortedStudents : masteryStudents

  type PendingCell = { targetId: string; lesson?: { id: string; title: string; number: number } }
  // A student's still-pending cells in the active view, newest grades excluded.
  const pendingCellsFor = useCallback((sid: string, exclude?: string): PendingCell[] => {
    if (view === 'lessons') {
      if (!lessonGrid) return []
      return lessonGrid.lessons
        .filter((l) => l.targetId && lessonGrid.cells?.[sid]?.[l.id]?.needsGrading
          && `l:${sid}:${l.id}` !== exclude && !gradedKeys.has(`l:${sid}:${l.id}`))
        .map((l) => ({ targetId: l.targetId as string, lesson: { id: l.id, title: l.title, number: l.lessonNumber } }))
    }
    if (!grid) return []
    return grid.targets
      .filter((t) => grid.pending?.[sid]?.[t.id]
        && `m:${sid}:${t.id}` !== exclude && !gradedKeys.has(`m:${sid}:${t.id}`))
      .map((t) => ({ targetId: t.id }))
  }, [view, grid, lessonGrid, gradedKeys])

  const studentPendingCount = useCallback((sid: string) => pendingCellsFor(sid).length, [pendingCellsFor])

  const pendingStudents = useMemo(
    () => rosterForView.filter((s) => studentPendingCount(s.id) > 0),
    [rosterForView, studentPendingCount]
  )
  const totalPendingInView = useMemo(
    () => pendingStudents.reduce((n, s) => n + studentPendingCount(s.id), 0),
    [pendingStudents, studentPendingCount]
  )

  const openPendingCell = useCallback((sid: string, exclude?: string) => {
    const cells = pendingCellsFor(sid, exclude)
    if (cells.length === 0) return false
    openCell(sid, cells[0].targetId, cells[0].lesson)
    return true
  }, [pendingCellsFor, openCell])

  // After a save: stay on this student until their pending work is cleared,
  // then jump to the next student (display order, wrapping) who still has
  // pending. Students with nothing pending are skipped.
  const advanceStudentFirst = useCallback((sid: string, gradedKey: string) => {
    if (openPendingCell(sid, gradedKey)) return // same student still has pending work
    const idx = rosterForView.findIndex((s) => s.id === sid)
    const order = [...rosterForView.slice(idx + 1), ...rosterForView.slice(0, Math.max(0, idx))]
    const next = order.find((s) => pendingCellsFor(s.id, gradedKey).length > 0)
    // Pause on the gate before swapping students; null closes when none are left.
    if (next) setNextStudentGate({ id: next.id, name: next.name })
    else closeDrawer()
  }, [openPendingCell, rosterForView, pendingCellsFor])

  // "Grade pending" launcher: open the first pending student's first pending cell.
  const startGradingPending = useCallback(() => {
    setGradedKeys(new Set())
    const first = pendingStudents[0]
    if (first) openCell(first.id, pendingCellsFor(first.id)[0]?.targetId, pendingCellsFor(first.id)[0]?.lesson)
  }, [pendingStudents, pendingCellsFor, openCell])

  // Keyboard-first grading: 1/2/3 rate (mastery); 1–6 set presets + Enter saves
  // (lessons); Esc closes. Number keys are ignored while typing in a field.
  useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => {
      if (nextStudentGate) return // gate owns the keyboard while it's up
      const el = document.activeElement
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')
      if (e.key === 'Escape') { closeDrawer(); return }
      if (!sel.lesson) {
        if (typing) return
        if (e.key === '1' || e.key === '2' || e.key === '3') { e.preventDefault(); saveRating(Number(e.key) as 1 | 2 | 3) }
        return
      }
      // Enter saves whatever's typed in the box (for odd values like 85).
      if (e.key === 'Enter') { if (gbPercent !== '' && !gbBusy) { e.preventDefault(); saveGradebook() } return }
      // One numpad press grades and advances: tens digit, 0 → 100 (full credit).
      if (!typing && !gbBusy && /^[0-9]$/.test(e.key)) {
        e.preventDefault()
        const n = Number(e.key)
        const pct = n === 0 ? 100 : n * 10
        setGbPercent(String(pct))
        saveGradebook(pct)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, gbPercent, nextStudentGate, gbBusy])

  // Inter-student gate: any key (or Continue) advances to the next student;
  // Esc closes instead. One keystroke per student, giving your eyes a beat.
  useEffect(() => {
    if (!nextStudentGate) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      if (e.key === 'Escape') { setNextStudentGate(null); closeDrawer(); return }
      const g = nextStudentGate
      setNextStudentGate(null)
      openPendingCell(g.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextStudentGate, openPendingCell])

  const copyToClipboard = (text: string, what: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 1800)
    }).catch(() => setError('Could not copy to clipboard'))
  }
  const copyColumn = (kind: 'grades' | 'names') => {
    if (!lessonGrid) return
    const lines = sortedStudents.map((s) => {
      if (kind === 'names') return s.name
      const pct = lessonGrid.cells[s.id]?.[copyLessonId]?.gradePct
      return pct != null ? String(pct) : ''
    })
    copyToClipboard(lines.join('\n'), kind)
  }

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* class-scope banner (when opened from a specific class) */}
      {classId && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border px-4 py-2.5 mb-3"
          style={{ borderColor: 'color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'color-mix(in oklch, var(--primary) 10%, var(--card))' }}>
          <span className="text-sm font-medium">
            Scoped to <strong>{classLabel || 'one class'}</strong> — grades you copy match this Aspen section.
          </span>
          <button onClick={() => pickClass('')} className="text-sm font-semibold" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>View all my students</button>
        </div>
      )}
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
          {classes.length > 0 && (
            <select
              value={classId ?? ''}
              onChange={(e) => pickClass(e.target.value)}
              title="Scope to one class/section — Aspen partitions the gradebook by section"
              className="rounded-lg text-sm px-3 py-2"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
            >
              <option value="">All my students</option>
              {classes.map((c) => (
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
            {(grid?.units ?? [{ id: 'unit-1', name: 'Unit 1' }]).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* tabs: mastery (targets) vs lessons (completion) */}
      <div className="flex gap-2 mt-4">
        {([['mastery', 'Mastery (targets)'], ['lessons', 'Lessons (completion)'], ['math', 'Math (spine)']] as const).map(([v, label]) => {
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

      {/* student-first grading launcher */}
      {view !== 'math' && (
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            onClick={startGradingPending}
            disabled={totalPendingInView === 0}
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: totalPendingInView ? 'pointer' : 'default' }}
          >
            Grade pending{totalPendingInView ? ` · ${totalPendingInView}` : ''}
          </button>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {totalPendingInView
              ? `${pendingStudents.length} student${pendingStudents.length === 1 ? '' : 's'} with work to grade — all of one student, then the next.`
              : 'Nothing pending to grade in this view.'}
          </span>
        </div>
      )}

      {/* math spine — cross-cutting competencies + warm-up review */}
      {view === 'math' && (
        <div className="mt-4">
          <MathControlRoom classId={classId} />
        </div>
      )}

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
                  onClick={() => { if (!openPendingCell(q.studentId) && grid && grid.targets[0]) openCell(q.studentId, grid.targets[0].id) }}
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
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--card)', fontSize: 13, fontWeight: 500, padding: '4px 10px', whiteSpace: 'nowrap' }}>{s.name}{seenTag(s.id)}</td>
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
          {/* Copy to Aspen X2 — paste a whole column of grades into the gradebook */}
          <div className="rounded-xl border mt-4 p-3 flex items-center gap-3 flex-wrap" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <span className="text-sm font-semibold">Copy to Aspen X2</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Sort</span>
            <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['last', 'first'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSortMode(m)}
                  className="text-xs px-2.5 py-1.5 font-medium"
                  style={{ background: sortMode === m ? 'var(--primary)' : 'transparent', color: sortMode === m ? 'var(--primary-foreground)' : 'var(--foreground)', border: 'none', cursor: 'pointer' }}
                >
                  {m === 'last' ? 'Last name' : 'First name'}
                </button>
              ))}
            </div>
            <select
              value={copyLessonId}
              onChange={(e) => setCopyLessonId(e.target.value)}
              className="rounded-lg text-sm px-3 py-2"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
            >
              <option value="">Choose a day…</option>
              {lessonGrid.lessons.map((l) => (
                <option key={l.id} value={l.id}>{`D${l.lessonNumber} — ${l.title}`}</option>
              ))}
            </select>
            <button
              onClick={() => copyColumn('grades')}
              disabled={!copyLessonId}
              className="text-sm font-semibold px-3 py-2 rounded-lg"
              style={{ background: copyLessonId ? 'var(--primary)' : 'var(--secondary)', color: copyLessonId ? 'var(--primary-foreground)' : 'var(--muted-foreground)', border: 'none', cursor: copyLessonId ? 'pointer' : 'default' }}
            >
              {copied === 'grades' ? 'Copied ✓' : 'Copy grades'}
            </button>
            <button
              onClick={() => copyColumn('names')}
              className="text-sm font-medium px-3 py-2 rounded-lg"
              style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              {copied === 'names' ? 'Copied ✓' : 'Copy names'}
            </button>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)', flexBasis: '100%' }}>
              Rows are in <strong>{sortMode === 'last' ? 'last-name' : 'first-name'}</strong> order to match your Aspen roster — paste straight down the column. Ungraded days come through as a blank cell. Use <em>Copy names</em> first to confirm the rows line up.
            </span>
          </div>
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
                {sortedStudents.map((s) => (
                  <tr key={s.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--card)', fontSize: 13, fontWeight: 500, padding: '4px 10px', whiteSpace: 'nowrap' }}>{s.name}{seenTag(s.id)}</td>
                    {lessonGrid.lessons.map((l) => {
                      const c = lessonGrid.cells[s.id]?.[l.id]
                      const st = c?.status ?? 'not_started'
                      const bg = st === 'completed' ? 'color-mix(in oklch, var(--success) 22%, var(--card))'
                        : st === 'in_progress' ? 'color-mix(in oklch, var(--reward) 22%, var(--card))'
                        : 'var(--secondary)'
                      const mark = c?.gradePct != null ? `${c.gradePct}` : st === 'completed' ? '✓' : st === 'in_progress' ? '·' : ''
                      const clickable = !!l.targetId
                      return (
                        <td key={l.id} style={{ padding: 0 }}>
                          <button
                            onClick={() => { if (l.targetId) openCell(s.id, l.targetId, { id: l.id, title: l.title, number: l.lessonNumber }) }}
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
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, maxWidth: '96vw', zIndex: 50,
              background: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'row',
              boxShadow: '-20px 0 50px -20px color-mix(in oklch, var(--foreground) 40%, transparent)',
            }}
          >
            {/* roster rail — pending students; greyed when done, click to jump */}
            <div style={{ width: 168, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                {pendingStudents.length > 0 ? `${pendingStudents.length} to grade` : 'All graded'}
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                {rosterForView.map((s) => {
                  const count = studentPendingCount(s.id)
                  const done = count === 0
                  const active = sel?.studentId === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => { if (!done) openPendingCell(s.id) }}
                      disabled={done}
                      title={s.name}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                        padding: '7px 12px', border: 'none', borderLeft: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
                        background: active ? 'color-mix(in oklch, var(--primary) 12%, transparent)' : 'transparent',
                        color: 'var(--foreground)', opacity: done ? 0.45 : 1, cursor: done ? 'default' : 'pointer',
                      }}
                    >
                      <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}{seenTag(s.id)}</span>
                      {done ? (
                        <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 12 }}>✓</span>
                      ) : (
                        <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--primary)' : 'var(--secondary)', color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>{count}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* content column */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={closeDrawer} style={{ float: 'right', border: 'none', background: 'transparent', color: 'var(--muted-foreground)', fontSize: 20, cursor: 'pointer' }}>×</button>
              <div className="font-bold" style={{ fontSize: 18 }}>{selStudent?.name ?? lessonGrid?.students.find((s) => s.id === sel?.studentId)?.name}</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)', marginTop: 2 }}>{sel?.lesson ? `Day ${sel.lesson.number} — ${sel.lesson.title}` : selTarget?.statement}</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: 4, textTransform: sel?.lesson ? 'none' : 'capitalize' }}>{sel?.lesson ? 'Gradebook score · completion' : selTarget?.domain}</div>
              {sel && (
                <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span><b style={{ color: 'var(--foreground)' }}>{studentPendingCount(sel.studentId)}</b> left for this student</span>
                  <span>·</span>
                  <span><b style={{ color: 'var(--foreground)' }}>{pendingStudents.length}</b> student{pendingStudents.length === 1 ? '' : 's'} with work left</span>
                </div>
              )}
            </div>

            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
              {/* this student vs. the class on this lesson (same decaying-avg rollup as the grid) */}
              {!sel.lesson && comparison && (comparison.studentAvg !== null || comparison.globalAvg !== null) && (() => {
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

              {/* gradebook analytics (completion mode) */}
              {sel.lesson && gbStats && (() => {
                const pctStr = (v: number | null) => (v == null ? '—' : `${Math.round(v)}%`)
                const bar = (v: number | null) => `${v == null ? 0 : Math.max(4, Math.min(100, v))}%`
                const dayDelta = gbStats.studentLessonPct != null && gbStats.classDayAvg != null ? gbStats.studentLessonPct - gbStats.classDayAvg : null
                const deltaColor = dayDelta == null ? 'var(--muted-foreground)' : dayDelta >= 1 ? 'var(--success)' : dayDelta <= -1 ? 'oklch(0.62 0.16 25)' : 'var(--muted-foreground)'
                const deltaText = dayDelta == null ? '' : Math.abs(dayDelta) < 1 ? 'at class avg' : `${dayDelta > 0 ? '+' : ''}${Math.round(dayDelta)} vs class`
                const rows: { label: string; v: number | null; c: string }[] = [
                  { label: 'This day · student', v: gbStats.studentLessonPct, c: 'var(--primary)' },
                  { label: 'This day · class', v: gbStats.classDayAvg, c: 'var(--muted-foreground)' },
                  { label: 'Unit avg · student', v: gbStats.studentUnitAvg, c: 'var(--primary)' },
                  { label: 'Unit avg · class', v: gbStats.classUnitAvg, c: 'var(--muted-foreground)' },
                ]
                return (
                  <div className="rounded-lg px-3 py-2.5 mb-5" style={{ background: 'var(--secondary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Gradebook · this day vs unit</span>
                      {dayDelta != null && <span className="text-xs font-bold" style={{ color: deltaColor }}>{deltaText}</span>}
                    </div>
                    {rows.map((row) => (
                      <div key={row.label} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs shrink-0" style={{ width: 110, color: 'var(--foreground)' }}>{row.label}</span>
                        <span className="flex-1 rounded-full" style={{ height: 8, background: 'var(--card)', overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: bar(row.v), background: row.c, borderRadius: 9999 }} />
                        </span>
                        <span className="text-sm font-bold shrink-0" style={{ width: 42, textAlign: 'right', color: 'var(--foreground)' }}>{pctStr(row.v)}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 flex-wrap mt-2">
                      <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '0.5px solid var(--border)' }}>
                        Lesson completion {pctStr(gbStats.completionPct)}
                      </span>
                      <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '0.5px solid var(--border)' }}>
                        {gbStats.studentGraded}/{gbStats.unitLessons} days graded
                      </span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>Gradebook % toward the letter grade — class figures use the selected class/section.</p>
                  </div>
                )
              })()}

              {/* rating history (mastery only) */}
              {!sel.lesson && <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>Rating history</div>}
              {!sel.lesson && (selHistory.length > 0 ? (
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
              ))}

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
              {!sel.lesson && (<>
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
                Keys <b>1 · 2 · 3</b> rate and advance. Finishes this student&apos;s pending work, then moves to the next student.
              </p>
              </>)}

              {sel.lesson && (<>
                <div className="text-sm font-semibold mb-2">Gradebook score</div>
                <button
                  onClick={suggestGradebook}
                  disabled={gbBusy || !work || work.work.length === 0}
                  className="w-full mb-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                  style={{ borderColor: 'color-mix(in oklch, var(--primary) 40%, var(--border))', color: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}
                >
                  {gbBusy ? 'Asking Claude…' : '✨ Suggest a % (Claude)'}
                </button>
                {gbSuggestion && (
                  <div className="mb-2 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}>
                    {gbSuggestion.percent >= 0 ? (<><b>Claude suggests: {gbSuggestion.percent}%</b> — {gbSuggestion.rationale}<div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Your call — adjust and save.</div></>) : (<span style={{ color: 'var(--muted-foreground)' }}>{gbSuggestion.rationale}</span>)}
                  </div>
                )}
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map((p) => {
                    const key = p === 100 ? '0' : String(p / 10)
                    return (
                      <button key={p} onClick={() => { setGbPercent(String(p)); if (!gbBusy) saveGradebook(p) }}
                        title={`Key ${key} → ${p}%`}
                        className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                        style={{ borderColor: 'var(--border)', background: gbPercent === String(p) ? 'var(--primary)' : 'var(--card)', color: gbPercent === String(p) ? 'var(--primary-foreground)' : 'var(--foreground)' }}>{p}</button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={100} value={gbPercent} onChange={(e) => setGbPercent(e.target.value)}
                    placeholder="0–100" className="rounded-lg border px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', width: 90 }} />
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>%</span>
                  <button onClick={() => saveGradebook()} disabled={gbBusy || gbPercent === ''}
                    className="flex-1 rounded-xl font-bold disabled:opacity-50" style={{ padding: '10px 0', fontSize: 13, background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    Save score
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  Numpad grades and advances — the key is the tens digit (<b>9</b>=90, <b>8</b>=80 … <b>1</b>=10), <b>0</b>=100. Type an odd value (e.g. 85) in the box + <b>Enter</b>. Finishes this student&apos;s pending work, then moves to the next student.
                </p>
              </>)}
            </div>
            {nextStudentGate && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'color-mix(in oklch, var(--card) 94%, transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>✓ {selStudent?.name ?? lessonGrid?.students.find((s) => s.id === sel?.studentId)?.name ?? 'Student'} — all done</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)' }}>Next: {nextStudentGate.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                  {studentPendingCount(nextStudentGate.id)} to grade · {pendingStudents.length} student{pendingStudents.length === 1 ? '' : 's'} left
                </div>
                <button
                  onClick={() => { const g = nextStudentGate; setNextStudentGate(null); openPendingCell(g.id) }}
                  style={{ marginTop: 4, background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Continue →
                </button>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>or press any key · Esc to close</div>
              </div>
            )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
