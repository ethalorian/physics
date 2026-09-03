"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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
  units: { id: string; name: string; label?: string; program?: string }[]
  targets: Target[]
  students: Student[]
  cells: Record<string, Record<string, Cell>>
  pending?: Record<string, Record<string, boolean>>
}
interface WorkItem { lessonTitle: string; lessonId?: string | null; blockType: string | null; blockId: string; response: unknown; createdAt: string }
interface RecordItem { target_id: string; level: number; observed_at: string; evidence_source?: string | null }
interface WorkData { userId: string; unitId: string; targets: Target[]; records: RecordItem[]; work: WorkItem[] }

interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean; needsHelp: boolean }

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
// Colorblind-safe shape encoding of the band, so color is never the only signal.
// ●=Got it(3) · ◐=Almost(2) · ○=Not yet(1) · –=not rated(0).
const bandGlyph = (b: 0 | 1 | 2 | 3) => (b === 3 ? '●' : b === 2 ? '◐' : b === 1 ? '○' : '–')

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
    <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: '100%', height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} role="img" aria-label={label}>
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
  const [grid, setGrid] = useState<GridData | null>(null)
  const [unitId, setUnitId] = useState('unit-1')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sel, setSel] = useState<{ studentId: string; targetId: string } | null>(null)
  const [work, setWork] = useState<WorkData | null>(null)
  const [workLoading, setWorkLoading] = useState(false)
  const [evidence, setEvidence] = useState('observation')
  const [saving, setSaving] = useState(false)
  // Written feedback (one-way note to the student, lands in their bell + growth page)
  const [fbText, setFbText] = useState('')
  const [fbGeneral, setFbGeneral] = useState(false)
  const [fbSending, setFbSending] = useState(false)
  const [fbSent, setFbSent] = useState(false)
  const [fbHistory, setFbHistory] = useState<{ id: string; message: string; created_at: string }[]>([])
  const [suggestion, setSuggestion] = useState<{ level: number; rationale: string } | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [nameFilter, setNameFilter] = useState('')
  const [comparison, setComparison] = useState<{ studentAvg: number | null; globalAvg: number | null; nStudents: number; lessonTitle: string | null } | null>(null)
  // Lesson completion grading (the old Aspen gradebook flow) is retired —
  // lessons are engagement, mastery is the grade. Views: targets + math spine.
  const [view, setView] = useState<'mastery' | 'math'>('mastery')
  // Student-first grading: keys we've graded this session (so the queue and
  // roster shrink immediately, before the server refresh lands).
  const [gradedKeys, setGradedKeys] = useState<Set<string>>(new Set())
  // Between students we pause on a gate so your eyes land before the next swap.
  const [nextStudentGate, setNextStudentGate] = useState<{ id: string; name: string } | null>(null)
  // Class/section scope. Aspen's gradebook is partitioned by section, so the
  // grade copy must be filterable to one class. The scope is SHARED with
  // analytics, roster, and pacing via localStorage (use-class-scope) — pick a
  // class in any of them and it carries here. The per-class deep-link
  // (?class=&label=) still wins and updates the shared scope.
  const { classId, classLabel, setClassScope } = useClassScope()
  const [classes, setClasses] = useState<{ id: string; label: string; teacher: string | null }[]>([])
  // Admin-only teacher filter: '' = all teachers. Teachers never see the
  // dropdown (their /api/courses only returns their own classes).
  const [teacherFilter, setTeacherFilter] = useState('')
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const deepLinked = sp.get('class')
    if (deepLinked) setClassScope(deepLinked, sp.get('label'))
  }, [setClassScope])
  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((d: { courses?: { id: string; name: string; section: string | null; teacher_email?: string | null }[] }) => {
        setClasses((d.courses ?? []).map((c) => ({ id: c.id, label: c.section ? `${c.name} · ${c.section}` : c.name, teacher: c.teacher_email ?? null })))
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
    // The grading drawer is YOUR roster only — admin included.
    if (grid?.students.find((s) => s.id === studentId)?.ratable === false) return
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
  }, [unitId, grid])

  const closeDrawer = () => { setSel(null); setWork(null); setSuggestion(null); setComparison(null); setNextStudentGate(null) }
  // A feedback draft belongs to one student — never carry it to the next.
  const fbStudentRef = useRef<string | null>(null)
  useEffect(() => {
    if (sel?.studentId !== fbStudentRef.current) {
      fbStudentRef.current = sel?.studentId ?? null
      setFbText(''); setFbGeneral(false); setFbSent(false); setFbHistory([])
      if (sel?.studentId) {
      // Timely feedback builds on what you last said — pull this student's
      // recent notes so the next one continues the conversation.
      fetch(`/api/feedback?user_id=${sel.studentId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.feedback) setFbHistory(d.feedback.slice(0, 3)) })
        .catch(() => setFbHistory([]))
      }
    }
  }, [sel?.studentId])

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
    // In-flight guard: key auto-repeat or a fast double-tap must never write
    // two records for one intended rating.
    if (saving) return
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

  const sendFeedback = async () => {
    const msg = fbText.trim()
    if (!msg || !sel || fbSending) return
    setFbSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sel.studentId, message: msg, target_id: fbGeneral ? null : sel.targetId }),
      })
      if (!res.ok) throw new Error('send failed')
      setFbText('')
      setFbSent(true)
      setTimeout(() => setFbSent(false), 2500)
    } catch {
      setError('Could not send the feedback')
    } finally {
      setFbSending(false)
    }
  }

  const selStudent = grid && sel ? grid.students.find((s) => s.id === sel.studentId) : null
  const selTarget = grid && sel ? grid.targets.find((t) => t.id === sel.targetId) : null
  const selHistory = work && sel ? work.records.filter((r) => r.target_id === sel.targetId) : []

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

  const openPendingCell = useCallback((sid: string, exclude?: string) => {
    const cells = pendingCellsFor(sid, exclude)
    if (cells.length === 0) return false
    openCell(sid, cells[0].targetId)
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
    if (first) openCell(first.id, pendingCellsFor(first.id)[0]?.targetId)
  }, [pendingStudents, pendingCellsFor, openCell])

  // Keyboard-first grading: 1/2/3 rate (mastery); Esc closes. Number keys are
  // ignored while typing in a field.
  useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => {
      if (nextStudentGate) return // gate owns the keyboard while it's up
      const el = document.activeElement
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')
      if (e.key === 'Escape') {
        // Mid-draft Escape must not close the drawer and eat the feedback text.
        if (typing && el.tagName === 'TEXTAREA') { (el as HTMLElement).blur(); return }
        closeDrawer(); return
      }
      if (typing) return
      // e.repeat = the key is being HELD (OS auto-repeat) — one press, one rating.
      if (e.repeat || saving) return
      if (selStudent?.ratable === false) return // view-only (another teacher's student)
      if (e.key === '1' || e.key === '2' || e.key === '3') { e.preventDefault(); saveRating(Number(e.key) as 1 | 2 | 3) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, nextStudentGate, saving])

  // Inter-student gate: any key (or Continue) advances to the next student;
  // Esc closes instead. One keystroke per student, giving your eyes a beat.
  // GRACE PERIOD: saves land async, so the gate can appear mid-keystroke — a
  // 1/2/3 aimed at the previous student must not silently advance (or close)
  // the gate. Ignore held-key repeats and anything in the first 400ms.
  useEffect(() => {
    if (!nextStudentGate) return
    const armedAt = Date.now()
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || Date.now() - armedAt < 400) return
      e.preventDefault()
      if (e.key === 'Escape') { setNextStudentGate(null); closeDrawer(); return }
      const g = nextStudentGate
      setNextStudentGate(null)
      openPendingCell(g.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextStudentGate, openPendingCell])

  // The queue is demoted to a collapsed "Priority" strip: only the truly urgent
  // (aged 48h+ or self-flagged "Not yet"). Everything else is walked by the one
  // "Grade pending" CTA, so the queue is no longer a competing second door.
  const priorityQueue = queue.filter((q) => q.aged || q.needsHelp)

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* toolbar — title · tabs · scope · unit · filter · one CTA on a single
          compact line, so the grid is the first paint on a laptop */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <h1 className="text-xl font-semibold tracking-tight" style={{ marginRight: 4 }}>Class mastery</h1>
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
          {(grid?.units ?? [{ id: 'unit-1', name: 'Unit 1' }]).map((u) => (
            <option key={u.id} value={u.id}>{u.label ?? u.name}</option>
          ))}
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

      {/* scrim + drawer */}
      {sel && (
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }} />
          <aside
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(1200px, 94vw)', zIndex: 100,
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
              <div className="font-bold" style={{ fontSize: 18 }}>{selStudent?.name}</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)', marginTop: 2 }}>{selTarget?.statement}</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: 4, textTransform: 'capitalize' }}>{selTarget?.domain}</div>
              {/* Progress lives in the roster rail (and the between-students gate) — no
                  redundant header counts. */}
            </div>

            {/* two columns: evidence on the left; grading + written feedback —
                the teacher's two acts — always in view on the right. */}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, minWidth: 0, borderRight: '1px solid var(--border)' }}>
              {/* submitted work — first, right under the header (the thing being judged) */}
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

              {/* this student vs. the class — collapsed below the work */}
              {comparison && (comparison.studentAvg !== null || comparison.globalAvg !== null) && (
                <details className="mb-5">
                  <summary style={{ cursor: 'pointer', listStyle: 'none', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted-foreground)', padding: '6px 0' }}>This lesson · mastery vs. class</summary>
                  {(() => {
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
                </details>
              )}

              {/* rating history — collapsed below the work */}
              <details className="mb-5">
                  <summary style={{ cursor: 'pointer', listStyle: 'none', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted-foreground)', padding: '6px 0' }}>Rating history</summary>
                  {selHistory.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
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
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No prior ratings on this target.</p>
                  )}
                </details>
            </div>

            {/* action column — rate, then say something useful about it.
                View-only when this student is on another teacher's roster. */}
            <div style={{ width: 380, flexShrink: 0, padding: '16px 20px', overflowY: 'auto', background: 'color-mix(in oklch, var(--secondary) 18%, transparent)' }}>
              {selStudent?.ratable === false ? (
                <p className="text-sm rounded-lg px-3 py-2.5" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                  View only — this student is on another teacher&apos;s roster. Their teacher records the ratings.
                </p>
              ) : (<>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold">Your mastery rating</span>
                <button
                  onClick={suggestRating}
                  disabled={suggesting || !work || work.work.length === 0}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                  style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}
                  title="Ask Claude to suggest a rating"
                >
                  {suggesting ? 'Asking…' : '✨ Suggest'}
                </button>
              </div>
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
              {/* Written feedback — one-way note to the student (Stiggins: name a
                  strength against the target, then the next step). Sends on its
                  own; rating keys stay untouched while typing. */}
              <div className="mt-4 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <span className="text-base font-bold">✎ Written feedback</span>
                  {fbSent && <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>Sent ✓</span>}
                </div>
                <div className="px-3 pb-3 pt-2">
                  <div className="flex gap-1.5 mb-1.5">
                    {['Strength: ', 'Next step: '].map((stem) => (
                      <button key={stem} type="button" onClick={() => setFbText((t) => (t ? t.replace(/\s*$/, '\n') : '') + stem)}
                        className="rounded-full px-3 py-1.5 text-sm font-semibold" style={{ border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--foreground)', cursor: 'pointer' }}>
                        + {stem.replace(': ', '')}
                      </button>
                    ))}
                    <label className="ml-auto flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={fbGeneral} onChange={(e) => setFbGeneral(e.target.checked)} /> General note
                    </label>
                  </div>
                  <textarea
                    value={fbText}
                    onChange={(e) => setFbText(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder={fbGeneral ? `A note to ${selStudent?.name?.split(' ')[0] ?? 'this student'}…` : `Feedback on “${selTarget?.statement?.slice(0, 60) ?? 'this target'}…”`}
                    className="w-full rounded-lg px-3 py-2.5" 
                    style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', fontSize: 15, lineHeight: 1.5 }}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {fbGeneral ? 'General note' : 'On this target'} · lands in their bell + growth page
                    </span>
                    <button type="button" onClick={sendFeedback} disabled={fbSending || !fbText.trim()}
                      className="rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                      {fbSending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                  {fbHistory.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Your recent notes to them</div>
                      {fbHistory.map((f) => (
                        <div key={f.id} className="text-xs rounded-md px-2.5 py-1.5 mb-1.5" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                          <span style={{ whiteSpace: 'pre-wrap' }}>{f.message.length > 160 ? f.message.slice(0, 160) + '…' : f.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </>)}
            </div>
            </div>
            {nextStudentGate && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'color-mix(in oklch, var(--card) 94%, transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>✓ {selStudent?.name ?? 'Student'} — all done</div>
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
