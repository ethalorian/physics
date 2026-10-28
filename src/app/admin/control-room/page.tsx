"use client"
import ClassAssignedWork from "@/components/admin/ClassAssignedWork"
import {ProblemStageDisplay} from '@/components/blocks/ProblemStageInput'
import {PROBLEM_STAGES,lessonProblemAnswer} from '@/lib/problem-response'

import { decayingAverage } from '@/data/curriculum-types'
import MasteryReviewDesk from '@/components/admin/MasteryReviewDesk'
import { filterReviewQueue, reviewItemKey, type MasteryReviewItem } from '@/lib/mastery-review-queue'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { assessmentView, assessmentCenterHref, assessmentScopeHref } from '@/lib/assessment-center'
import dynamic from 'next/dynamic'
import StudentWorkHeader from '@/components/admin/StudentWorkHeader'
import styles from './student-work.module.css'
import { useCallback, useEffect, useMemo, useRef, useState, Suspense, type CSSProperties } from 'react'
import LessonReviewQueue from '@/components/admin/LessonReviewQueue'
import { InlineMath } from '@/components/MathMarkdown'
import { toLatex } from '@/components/blocks/EquationSandbox'
import MathControlRoom from '@/components/math-spine/MathControlRoom'
import TeacherDailyMathTask from '@/components/math-spine/TeacherDailyMathTask'
import { StrokeShapes, type Stroke } from '@/lib/draw/strokes'
import { useClassScope } from '@/lib/use-class-scope'

const LessonReleasePanel = dynamic(() => import('@/components/admin/LessonReleasePanel'))
const VocabLearningBoard = dynamic(() => import('@/components/vocabulary/VocabLearningBoard'))
const PacingManager = dynamic(() => import('@/components/admin/planning/PacingManager'))
const VideoProgressDashboard = dynamic(() => import('@/components/admin/video-progress/VideoProgressDashboard'))
const QuizTeacher = dynamic(() => import('@/components/quizzes/QuizTeacher'))
const TeacherReadings = dynamic(() => import('@/components/readings/TeacherReadings'))
const LiveClassroom = dynamic(() => import('@/components/admin/LiveClassroom'))
const CourseGuide = dynamic(() => import('@/components/admin/planning/CourseGuide'))
const ChoicePlanningWorkspace = dynamic(() => import('@/components/admin/planning/ChoicePlanningWorkspace'))
const UnitPlanningWorkspace = dynamic(() => import('@/components/admin/planning/UnitPlanningWorkspace'))
const ResultsMastery = dynamic(() => import('@/components/admin/results/ResultsMastery'))
const ResultsGradebook = dynamic(() => import('@/components/admin/results/ResultsGradebook'))
const AssignmentTeacher = dynamic(() => import('@/components/interactive-assignments/AssignmentTeacher'))
const ReviewTeacher = dynamic(() => import('@/components/review-modules/ReviewTeacher'))
const VocabControlRoom = dynamic(() => import('@/components/admin/VocabControlRoom'))

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
  reviewQueue?: MasteryReviewItem[]
  lessons?: { id: string; title: string; targetIds: string[] }[]
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
// Show the actual average; color still follows the mastery band.
function recordAverage(records: RecordItem[] | undefined, target: string) { const levels = (records ?? []).filter(r => r.target_id === target).sort((a, b) => a.observed_at.localeCompare(b.observed_at)).map(r => r.level); return levels.length ? decayingAverage(levels) : null }
const averageLabel = (value: number | null | undefined) => value == null ? '–' : value.toFixed(2)



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
    <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: '100%', height: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff' }} role="img" aria-label={label}>
      <StrokeShapes strokes={strokes as Stroke[]} />
    </svg>
  )
}



function ResponseView({ response, prompt }: { response: unknown; prompt?: string | null }) {
  if (response && typeof response === 'object') {
    const o = response as Record<string, unknown>
    if(o.format==='problem-workspace'){const responses=lessonProblemAnswer(o);return <div className="space-y-4">{PROBLEM_STAGES.map(k=><section key={k}><h4 className="font-semibold capitalize">{k}</h4><ProblemStageDisplay value={responses[k]} label={k.charAt(0).toUpperCase()+k.slice(1)}/></section>)}{Array.isArray(o.hintsUsed)&&o.hintsUsed.length>0&&<p className="text-xs text-muted-foreground">Hints used: {o.hintsUsed.map(String).join(', ')}. Support use is context, not a mastery penalty.</p>}</div>}
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
          {field('given', o.format === 'problem-workspace' ? 'Model · knowns and assumptions' : 'Given')}
          {Array.isArray(o.modelStrokes) && o.modelStrokes.length > 0 && <StrokesSvg strokes={o.modelStrokes as StrokeShape[]} label="Student model drawing"/>}
          {field('equation', o.format === 'problem-workspace' ? 'Plan · relationship and approach' : 'Equation')}
          {o.format === 'problem-workspace' && Array.isArray(o.hintsUsed) && o.hintsUsed.length > 0 && <p className="text-xs text-muted-foreground">Hints used: {o.hintsUsed.map(String).join(', ')}. Support use is context, not a mastery penalty.</p>}
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
              <div className="rounded-lg p-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {sandboxLines.map((l, i) => (
                  <div key={i} className="flex items-baseline gap-2" style={{ marginBottom: 2 }}>
                    <span className="text-xs" style={{ color: i === ansI ? 'var(--reward)' : 'var(--muted-foreground)' }}>{i === ansI ? '★' : `${i + 1}.`}</span>
                    <span className="text-body"><InlineMath math={i === ansI ? `\\boxed{${toLatex(l)}}` : toLatex(l)} /></span>
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
                <div key={n} className="flex items-baseline gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 2 }}>
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

export default function StudentWorkCenter() { return <Suspense fallback={<p className="p-6">Loading Teaching…</p>}><ControlRoom /></Suspense> }

function ControlRoom() {
  const params = useSearchParams(), router = useRouter()
  const view = assessmentView(params.get('view'))
  const planning = ['plan', 'choices', 'calendar', 'guide', 'live', 'access', 'tasks', 'pacing'].includes(view)
  const [planningScope, setPlanningScope] = useState<{ classId: string; units: GridData['units'] } | null>(null)
  const [planningScopeError, setPlanningScopeError] = useState('')
  const [reviewVersion, setReviewVersion] = useState(0)
  const gridRequestVersion = useRef(0)
  const [gridData, setGrid] = useState<GridData | null>(null)
  const [loadedScope, setLoadedScope] = useState<string | null>(null)
  const [unitId, setUnitId] = useState(params.get('unit') || 'unit-1')
  const [lessonFilter, setLessonFilter] = useState(params.get('lesson') ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gridError, setGridError] = useState<string | null>(null)

  const [sel, setSel] = useState<{ studentId: string; targetId: string; unitId?: string; lessonId?: string; submissionId?: string | null } | null>(null)
  const workRequestVersion = useRef(0)
  const [work, setWork] = useState<WorkData | null>(null)
  const [workLoading, setWorkLoading] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const nameFilter = params.get('q') ?? ''
  const setNameFilter = (value: string) => {
    const p = new URLSearchParams(window.location.search)
    if (value) p.set('q', value); else p.delete('q')
    window.history.replaceState(null, '', '?' + p)
  }

  // Lesson completion grading (the old Aspen gradebook flow) is retired —
  // Lessons are engagement; target, vocabulary, and math reviews live here.

  // Student-first grading: keys we've graded this session (so the queue and
  // roster shrink immediately, before the server refresh lands).
  const [gradedKeys, setGradedKeys] = useState<Set<string>>(new Set())
  const [skippedKeys, setSkippedKeys] = useState<Set<string>>(new Set())
  // Class/section scope. Aspen's gradebook is partitioned by section, so the
  // grade copy must be filterable to one class. The scope is SHARED with
  // analytics, roster, and pacing via localStorage (use-class-scope) — pick a
  // class in any of them and it carries here. The per-class deep-link
  // (?class=&label=) still wins and updates the shared scope.
  const { classId: storedClassId, classLabel, setClassScope, ready } = useClassScope()
  const classId = params.has('class') ? params.get('class') || null : storedClassId
  const [classes, setClasses] = useState<{ id: string; label: string; teacher: string | null; program: string }[]>([])
  // Admin-only teacher filter: '' = all teachers. Teachers never see the
  // dropdown (their /api/courses only returns their own classes).
  const [targetFilter, setTargetFilter] = useState(params.get('target') ?? '')
  const teacherFilter = params.get('teacher') ?? ''
  const [classError, setClassError] = useState('')
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setUnitId(sp.get('unit') || 'unit-1')
    setLessonFilter(sp.get('lesson') ?? '')
    setTargetFilter(sp.get('target') ?? '')
    if (sp.get('view') === 'app-wide') setClassScope(null, null)

    if (sp.has('class')) setClassScope(sp.get('class') || null, sp.get('label'))
  }, [setClassScope, params])
  useEffect(() => {
    fetch('/api/teaching-plans?view=classes')
      .then(async r => { if (!r.ok) throw new Error('Classes could not be loaded. Refresh to try again.'); return r.json() })
      .then((d: { courses?: { id: string; name: string; section: string | null; teacher_email?: string | null; program?: string | null }[] }) => {
        setClasses((d.courses ?? []).map((c) => ({ id: c.id, label: c.section ? `${c.name} · ${c.section}` : c.name, teacher: c.teacher_email ?? null, program: c.program ?? 'physics' })).sort((a, b) => a.label.localeCompare(b.label)))
      })
      .catch(e => setClassError(e.message))
  }, [])
  // The teacher param only matters with no class picked (the server ignores it
  // otherwise), but sending both keeps the URL an honest mirror of the UI.
  const classQuery = (classId ? `&class=${encodeURIComponent(classId)}` : '') + (teacherFilter ? `&teacher=${encodeURIComponent(teacherFilter)}` : '')
  const grid = loadedScope === classQuery && gridData?.unitId === unitId ? gridData : null
  const teachers = [...new Set(classes.map((c) => c.teacher).filter((t): t is string => Boolean(t)))].sort()
  const pickClass = (id: string) => {
    closeDrawer()
    setClassScope(id || null, id ? (classes.find(c => c.id === id)?.label ?? null) : null)
    router.push(assessmentScopeHref(params.toString(), 'class', id), { scroll: false })
  }
  const pickUnit = (id: string) => {
    closeDrawer(); setUnitId(id); setLessonFilter(''); setTargetFilter('')
    router.push(assessmentScopeHref(params.toString(), 'unit', id), { scroll: false })
  }
  const pickTeacher = (teacher: string) => {
    const p = new URLSearchParams(assessmentScopeHref(params.toString(), 'class', '').split('?')[1])
    if (teacher) p.set('teacher', teacher); else p.delete('teacher')
    setClassScope(null); closeDrawer(); router.push('?' + p, { scroll: false })
  }

  const changeLesson = (id: string) => {
    setLessonFilter(id); setTargetFilter(''); closeDrawer()
    const p = new URLSearchParams(window.location.search)
    if (id) p.set('lesson', id); else p.delete('lesson')
    p.delete('target'); p.delete('submission'); p.set('unit', unitId)
    router.push('?' + p, { scroll: false })
  }
  const loadGrid = useCallback((unit: string, quiet = false) => {
    const version = ++gridRequestVersion.current
    if (!quiet) setLoading(true)
    setGridError(null)
    fetch(`/api/mastery/grid?unit_id=${encodeURIComponent(unit)}${classQuery}`)
      .then((r) => r.json())
      .then((d: GridData & { error?: string }) => {
        if (version !== gridRequestVersion.current) return
        if (d.error) setGridError(d.error)
        else {
          setGrid(d); setLoadedScope(classQuery)
          // unit_id=auto resolved server-side to the unit this class is in.
          if (d.unitId && d.unitId !== unit) {
            setUnitId(d.unitId)
            const p = new URLSearchParams(window.location.search); p.set('unit', d.unitId)
            window.history.replaceState(null, '', '?' + p)
          }
        }
        setLoading(false)
      })
      .catch(() => { if (version === gridRequestVersion.current) { setGridError('Could not refresh target reviews. The last loaded ratings are still shown.'); setLoading(false) } })
  }, [classQuery])

  // Embedded quiz/reading reviews write mastery too; revisiting this tab must
  // pick up those ratings rather than retaining the grid from before grading.
  const invalidateGrid = useCallback(() => { gridRequestVersion.current++ }, [])
  useEffect(() => { if (ready && view !== 'assignments' && !planning) loadGrid(unitId); return invalidateGrid }, [unitId, loadGrid, view, ready, invalidateGrid, planning])
  useEffect(() => {
    if (!ready || !planning || !classId) return
    const controller = new AbortController()
    setPlanningScopeError('')
    fetch(`/api/teaching-plans?view=scope&class=${encodeURIComponent(classId)}`, { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw Error(data.error || 'Course units could not load.')
      if (controller.signal.aborted) return
      setPlanningScope(data)
      if (!data.units.some((u: { id: string }) => u.id === unitId) && data.unitId) {
        setUnitId(data.unitId)
        const next = new URLSearchParams(window.location.search); next.set('unit', data.unitId)
        router.replace('?' + next.toString(), { scroll: false })
      }
    }).catch(error => { if (!controller.signal.aborted) setPlanningScopeError(error.message) })
    return () => controller.abort()
  }, [classId, ready, planning, unitId, router])
  // Picking a class moves the unit to the one THAT class is working in — a Trades
  // or Project Physics class never sits on physics unit-1 (its program's units only).
  const classProgram = classId ? (classes.find((c) => c.id === classId)?.program ?? null) : null
  useEffect(() => {
    if (!classId || planning) return
    const unitProgram = grid?.units.find((u) => u.id === unitId)?.program
    if (classProgram && unitProgram && unitProgram !== classProgram) setUnitId('auto')
    else if (classProgram && grid && !unitProgram && unitId !== 'auto') setUnitId('auto')
  }, [classId, classProgram, planning]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQueue = useCallback((unit: string) => {
    fetch(`/api/mastery/queue?unit_id=${encodeURIComponent(unit)}${classQuery}`)
      .then((r) => r.json())
      .then((d: { queue?: QueueItem[] }) => setQueue(d.queue ?? []))
      .catch(() => {})
  }, [classQuery])
  useEffect(() => { if (ready && (view === 'mastery' || view === 'lessons')) loadQueue(unitId) }, [unitId, loadQueue, view, ready])

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
  useEffect(() => { if (ready && view === 'mastery') loadPresence() }, [loadPresence, ready, view])
  const seenTag = (gid: string) => {
    const iso = presence.get(gid)?.lastSeenAt ?? null
    return <span className="text-overline" style={{ marginLeft: 6, color: lastSeenColor(iso) }} title={iso ? `Last signed in ${new Date(iso).toLocaleString()}` : 'No recorded sign-in yet'}>{lastSeenLabel(iso)}</span>
  }

  const openCell = useCallback((studentId: string, targetId: string, context?: { unitId?: string; lessonId?: string; submissionId?: string | null }) => {
    if (grid?.students.find(s => s.id === studentId)?.ratable === false) return
    const version = ++workRequestVersion.current
    const pending = grid?.reviewQueue?.find(item => item.studentId === studentId && item.targetId === targetId && (!lessonFilter || item.lessonId === lessonFilter))
    const selectedContext: { unitId?: string; lessonId?: string; submissionId?: string | null } = context ?? pending ?? (lessonFilter ? { lessonId: lessonFilter } : {})
    setSel({ studentId, targetId, ...selectedContext }); setWork(null); setError(null); setWorkLoading(true)
    const params = new URLSearchParams({ user_id: studentId, unit_id: selectedContext.unitId ?? unitId, target_id: targetId })
    if (selectedContext.lessonId) params.set('lesson_id', selectedContext.lessonId)
    if (selectedContext.submissionId) params.set('submission_id', selectedContext.submissionId)
    fetch(`/api/mastery/student-work?${params}`)
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error ?? 'Could not load work'); return data })
      .then((data: WorkData) => { if (version === workRequestVersion.current) { setWork(data); setWorkLoading(false) } })
      .catch(e => { if (version === workRequestVersion.current) { setError(e.message); setWorkLoading(false) } })
  }, [unitId, grid, lessonFilter])
  const closeDrawer = useCallback(() => { workRequestVersion.current++; setSel(null); setWork(null) }, [])

  // Old bookmarks must not keep a removed lesson selected or make an empty
  // lesson view look as though no current student work exists.
  useEffect(() => {
    if (loading || grid?.unitId !== unitId || !lessonFilter || grid.lessons?.some(l => l.id === lessonFilter)) return
    setLessonFilter(''); setTargetFilter(''); closeDrawer()
    const p = new URLSearchParams(window.location.search)
    p.delete('lesson'); p.delete('target')
    router.replace('?' + p, { scroll: false })
  }, [loading, grid, unitId, lessonFilter, closeDrawer, router])

  useEffect(() => { closeDrawer(); setGradedKeys(new Set()); setSkippedKeys(new Set()) }, [unitId, classQuery, closeDrawer])

  // ---- student-first grading flow ------------------------------------------
  // Visible students in display order (roster order + name filter).
  const masteryStudents = useMemo(
    // Your own roster only — admin included. Other teachers' students stay in
    // the mastery grid (the data view), but never enter the grading drawer.
    () => (grid ? grid.students.filter((s) => s.ratable !== false && s.name.toLowerCase().includes(nameFilter.toLowerCase())) : []),
    [grid, nameFilter]
  )
  const rosterForView = masteryStudents
  const selectedLesson = grid?.lessons?.find(l => l.id === lessonFilter)
  const visibleTargets = (grid?.targets ?? []).filter(t => (!targetFilter || t.id === targetFilter) && (!selectedLesson || selectedLesson.targetIds.includes(t.id)))
  const reviewQueue = filterReviewQueue(loading ? [] : grid?.reviewQueue ?? [], {
    studentIds: rosterForView.map(s => s.id), targetIds: visibleTargets.map(t => t.id),
    lessonId: lessonFilter, excluded: new Set([...gradedKeys, ...skippedKeys]),
  })
  const inboxUpdated = useCallback(() => { loadGrid(unitId, true) }, [loadGrid, unitId])
  const clearEvidenceFilters = () => {
    setSkippedKeys(new Set()); setLessonFilter(''); setTargetFilter(''); closeDrawer()
    const p = new URLSearchParams(window.location.search)
    for (const key of ['q', 'lesson', 'target', 'older', 'source', 'submission']) p.delete(key)
    router.replace('?' + p, { scroll: false })
  }
  const pendingStudents = rosterForView.filter(s => reviewQueue.some(item => item.studentId === s.id))
  const totalPendingInView = reviewQueue.length
  const startGradingPending = () => {
    const first = reviewQueue[0]
    if (first) openCell(first.studentId, first.targetId, first)
  }

  // The queue is demoted to a collapsed "Priority" strip: only the truly urgent
  // (aged 48h+ or self-flagged "Not yet"). Everything else is walked by the one
  // "Grade pending" CTA, so the queue is no longer a competing second door.
  const priorityQueue = queue.filter(q => !lessonFilter && (q.aged || q.needsHelp) && reviewQueue.some(item => item.studentId === q.studentId))

  const usesUnit = view === 'mastery' || view === 'lessons' || view === 'vocabulary'
  const visibleStudents = (grid?.students ?? []).filter(s => s.name.toLowerCase().includes(nameFilter.toLowerCase()))
  const ratedCells = visibleStudents.reduce((sum, student) => sum + visibleTargets.filter(target => grid?.cells[student.id]?.[target.id]?.value != null).length, 0)
  const totalCells = visibleStudents.length * visibleTargets.length
  const gradebookPositions = useRef<Record<string, { top: number; left: number }>>({})
  const gradebookPositionKey = `${classQuery}:${unitId}:${lessonFilter}:${targetFilter}:${nameFilter}`
  const restoreGradebookPosition = useCallback((element: HTMLDivElement | null) => {
    const position = gradebookPositions.current[gradebookPositionKey]
    if (element && position) { element.scrollTop = position.top; element.scrollLeft = position.left }
  }, [gradebookPositionKey])
  const unitLabel = grid?.units.find(unit => unit.id === unitId)?.name ?? (unitId === 'auto' ? 'Current unit' : unitId)
  return (
    <div className={styles.workspace}>
      <StudentWorkHeader view={view} search={params.toString()} classId={classId}
        classLabel={classes.find(c => c.id === classId)?.label ?? classLabel}
        classes={classes} teachers={teachers} teacher={teacherFilter} onTeacherChange={pickTeacher}
        unitId={unitId} units={(planning && planningScope?.classId === classId ? planningScope.units : grid?.units) ?? [{ id: unitId, name: unitLabel }]} program={classProgram}
        onClassChange={pickClass} onUnitChange={pickUnit} onNavigate={closeDrawer} />
      {classError && <p role="alert" className="my-3 text-sm text-destructive">{classError}</p>}
      {planning && planningScopeError && <p role="alert" className="my-3 text-sm text-destructive">{planningScopeError} Refresh to retry loading course units.</p>}
      <section className={styles.content} aria-label="Current Teaching view">
      {(usesUnit || view === 'videos') && <div className={styles.filters}>
        <label>Find a student<input value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="Name…" type="search" /></label>
        {view === 'mastery' && <label>Lesson<select value={lessonFilter} onChange={e => changeLesson(e.target.value)}>
          <option value="">All lessons</option>{grid?.lessons?.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
        </select></label>}
        {(nameFilter || lessonFilter || targetFilter) && <button className={styles.clear} onClick={clearEvidenceFilters}>Clear filters</button>}
        {(view === 'mastery' || view === 'lessons') && <button className={styles.review} onClick={startGradingPending} disabled={loading || !!gridError || totalPendingInView === 0}
          title={`${pendingStudents.length} student${pendingStudents.length === 1 ? '' : 's'} with lesson target evidence awaiting review`}>
          {loading ? 'Loading reviews…' : totalPendingInView ? `Review ${totalPendingInView} lesson targets` : 'No pending lesson target reviews'}
        </button>}
      </div>}
      {(view === 'mastery' || view === 'lessons') && targetFilter && <p className={styles.filterNotice}>Filtered to one learning target. <button onClick={() => { setTargetFilter(''); const p = new URLSearchParams(window.location.search); p.delete('target'); router.replace('?' + p, { scroll: false }) }}>Show all targets</button></p>}
      {view === 'mastery' && <>
        <div className={styles.summary} aria-label="Gradebook summary">
          <div><strong>{loading || gridError ? '—' : visibleStudents.length}</strong><span>students in view</span></div>
          <div><strong>{loading || gridError ? '—' : totalPendingInView}</strong><span>lesson target reviews waiting</span></div>
          <div><strong>{loading || gridError || !totalCells ? '—' : `${Math.round(ratedCells / totalCells * 100)}%`}</strong><span>student targets rated</span></div>
        </div>
        <div className={styles.gridHeading}><div><h2>{params.get('masteryKind') === 'math' ? 'Math Spine mastery' : 'Learning-target mastery'}</h2><p>{unitLabel} · Select a cell to see the evidence and record mastery.</p></div>
          <Link href={assessmentCenterHref('lessons', null, classId, params.toString())}>Open lesson inbox →</Link>
        </div>
      </>}
      {view === 'lessons' && <>
        <LessonReviewQueue refreshVersion={reviewVersion} lessonId={lessonFilter} lessons={grid?.unitId === unitId ? grid.lessons ?? [] : []}
          targetReviews={(grid?.unitId === unitId ? grid.reviewQueue ?? [] : []).filter(item => !gradedKeys.has(reviewItemKey(item)) && grid?.students.some(student => student.id === item.studentId && student.ratable !== false))}
          visibleTargetReviews={reviewQueue.length} nameFilter={nameFilter} targetFiltered={!!targetFilter}
          onLessonChange={changeLesson} onClearFilters={clearEvidenceFilters} onDataChanged={inboxUpdated}
          onRateTarget={openCell} unitId={unitId} classQuery={classQuery}
          onReviewed={() => { loadGrid(unitId, true); loadQueue(unitId) }} renderResponse={response => <ResponseView response={response} />} />
      </>}
      {(view === 'plan' || view === 'calendar') && <UnitPlanningWorkspace classId={classId} unitId={unitId} mode={view} />}
      {view === 'choices' && <ChoicePlanningWorkspace unitId={unitId} classId={classId} classLabel={classes.find(c => c.id === classId)?.label ?? classLabel} program={classes.find(c => c.id === classId)?.program ?? null} />}
      {view === 'access' && (classId ? <LessonReleasePanel key={classId} courseId={classId} /> : <p className="py-10 text-muted-foreground">Choose a class to manage student lesson access.</p>)}
      {view === 'tasks' && (classId ? <VocabLearningBoard key={classId} classId={classId} onClassChange={pickClass} /> : <p className="py-10 text-muted-foreground">Choose a class to assign and track vocabulary tasks.</p>)}
      {view === 'pacing' && (classId ? <PacingManager key={classId} classId={classId} /> : <p className="py-10 text-muted-foreground">Choose a class to set its meeting pattern and pacing.</p>)}
      {view === 'live' && <LiveClassroom classId={classId} unitId={unitId} />}
      {view === 'guide' && (classId && !['auto', 'all', 'unmapped'].includes(unitId) ? <CourseGuide embedded /> : <p className="py-10 text-muted-foreground">Choose a class and course unit above to read its teaching guide.</p>)}
      {view === 'results' && (unitId === 'auto' && gridError ? <p role="alert">The class’s current unit could not load. <button className={styles.clear} onClick={() => pickUnit('all')}>Show results from all units</button></p> : <ResultsGradebook key={reviewVersion} classId={classId} unitId={unitId} targets={grid?.targets ?? []} onReviewLesson={openCell} onSaved={() => loadGrid(unitId, true)} />)}
      {view === 'interactive' && (classId ? <AssignmentTeacher key={classId + ':' + params.get('id')} courseId={classId} initialSlug={params.get('id') ?? undefined} initialStudent={params.get('student') ?? ''} resultsContext /> : <p>Choose a class to review interactive assignments.</p>)}
      {view === 'reviews' && (classId ? <ReviewTeacher key={classId + ':' + params.get('id') + ':' + params.get('student')} embedded classId={classId} initialSlug={params.get('id') ?? ''} initialStudent={params.get('student') ?? ''} /> : <p>Choose a class to review responses.</p>)}
      {view === 'assignments' && <ClassAssignedWork key={classId ?? 'none'} classId={classId} />}
      {view === 'videos' && <VideoProgressDashboard key={classId ?? 'none'} classId={classId} nameFilter={nameFilter} />}
      {view === 'quizzes' && <QuizTeacher embedded classId={classId} onClassChange={pickClass} />}
      {view === 'readings' && <TeacherReadings embedded classId={classId} onClassChange={pickClass} />}

      {view === 'vocabulary' && unitId !== 'auto' && <VocabControlRoom key={`${classId}:${unitId}:${teacherFilter}`} classId={classId} unitId={unitId} teacher={teacherFilter} nameFilter={nameFilter} onSaved={() => loadGrid(unitId)} />}

      {/* math spine — cross-cutting competencies + warm-up review. The daily
          math-fluency rating lives here (its own tab, not the top stack) so the
          mastery/lessons grids stay first paint. */}
      {view === 'math' && (
        <div className="mt-4">
          <details className="mb-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <summary className="text-caption" style={{ cursor: 'pointer', listStyle: 'none', padding: '10px 14px', color: 'var(--foreground)' }}>
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
      {view === 'lessons' && priorityQueue.length > 0 && (
        <details className="rounded-xl border mt-4" style={{ borderColor: 'color-mix(in oklch, var(--reward) 35%, var(--border))', background: 'color-mix(in oklch, var(--reward) 8%, transparent)' }}>
          <summary className="text-overline" style={{ cursor: 'pointer', listStyle: 'none', padding: '10px 14px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
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
                  onClick={() => { const item = reviewQueue.find(item => item.studentId === q.studentId); if (item) openCell(item.studentId, item.targetId, item) }}
                  disabled={!reviewQueue.some(item => item.studentId === q.studentId)}
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

      {usesUnit && gridError && <div role="alert" className="text-sm rounded-md px-3 py-2 my-3" style={{ background: 'var(--secondary)', color: 'var(--destructive)' }}>{gridError} <button className="min-h-11 underline" onClick={() => loadGrid(unitId, true)}>Retry target reviews</button></div>}
      {error && <div className="text-sm rounded-md px-3 py-2 my-3" style={{ background: 'var(--secondary)', color: 'var(--destructive)' }}>{error}</div>}
      {view === 'mastery' && loading && <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>Loading the grid…</p>}

      {view === 'mastery' && !loading && grid && grid.students.length === 0 && (
        <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>No students on your roster yet.</p>
      )}

      {view === 'mastery' && !loading && grid && classId && <ResultsMastery key={classId + unitId} classId={classId} unitId={unitId} students={visibleStudents} targets={visibleTargets} cells={grid.cells} pending={reviewQueue} onReviewLesson={openCell} onSaved={() => { loadGrid(unitId, true); loadQueue(unitId) }} />}
      {view === 'mastery' && !classId && !loading && grid && grid.students.length > 0 && (
        <div className={styles.gradebook} ref={restoreGradebookPosition} onScroll={e => { gradebookPositions.current[gradebookPositionKey] = { top: e.currentTarget.scrollTop, left: e.currentTarget.scrollLeft } }} tabIndex={0} role="region" aria-label="Class mastery gradebook, scroll horizontally for more targets" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <table><caption className="sr-only">Average mastery on a 1–3 scale by student and learning target. A dot marks evidence awaiting review.</caption>
            <thead>
              <tr>
                <th scope="col" className="text-caption" style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--card)', textAlign: 'left', padding: '4px 10px', color: 'var(--muted-foreground)' }}>Student</th>
                {visibleTargets.map((t, i) => (
                  <th scope="col" className={styles.targetHeading} key={t.id} title={t.statement} style={{ color: 'var(--muted-foreground)', padding: '4px 2px', minWidth: 46 }}>
                    <span>T{(grid?.targets.findIndex(target => target.id === t.id) ?? i) + 1}</span><small>{t.statement}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((s) => (
                <tr key={s.id}>
                  <th scope="row" className="text-caption" style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--card)', padding: '4px 10px', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 500 }}>{s.name}{seenTag(s.id)}</th>
                  {visibleTargets.map((t) => {
                    const c = grid.cells[s.id]?.[t.id]
                    const b = band(c?.value ?? null)
                    const average = averageLabel(c?.value)
                    return (
                      <td key={t.id} style={{ padding: 0 }}>
                        <button
                          onClick={() => openCell(s.id, t.id)}
                          title={`${s.name} · ${t.statement}${b ? ` · Average ${average} / 3 · ${levelWord(b)}` : ' · not rated'}`}
                          aria-label={`${s.name}, ${t.statement}: ${b ? `average ${average} out of 3, ${levelWord(b)}` : 'not rated'}`}
                          disabled={s.ratable === false} className={styles.masteryCell}
                          style={cellStyle(b)}
                        >
                          {average}{reviewQueue.some(item => item.studentId === s.id && item.targetId === t.id) && <span className={styles.pendingDot} aria-label="Evidence awaiting review" />}
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

      {view === 'mastery' && !classId && !loading && grid && (
        <div className="flex gap-4 flex-wrap mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center text-overline" style={{ width: 16, height: 16, borderRadius: 'var(--radius-xs)', ...cellStyle(3) }}>{'3'}</span> Got it (3)</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center text-overline" style={{ width: 16, height: 16, borderRadius: 'var(--radius-xs)', ...cellStyle(2) }}>{'2'}</span> Almost (2)</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center text-overline" style={{ width: 16, height: 16, borderRadius: 'var(--radius-xs)', ...cellStyle(1) }}>{'1'}</span> Not yet (1)</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid place-items-center text-overline" style={{ width: 16, height: 16, borderRadius: 'var(--radius-xs)', ...cellStyle(0) }}>{'–'}</span> Not rated</span>
          <span>Cells show the average on a 1–3 scale.</span>
          <span>● Corner dot = evidence awaiting review</span>
        </div>
      )}

      {view === 'mastery' && !loading && !gridError && grid && grid.students.length > 0 && visibleStudents.length === 0 && <p className={styles.filterNotice}>No students match “{nameFilter}”. <button onClick={() => setNameFilter('')}>Show all students</button></p>}
      </section>

      {sel && grid && <MasteryReviewDesk studentId={sel.studentId} targetId={sel.targetId} initialLessonId={sel.lessonId} submissionId={sel.submissionId} unitId={sel.unitId ?? unitId} students={rosterForView} targets={work?.targets ?? grid.targets} work={work} loading={workLoading} loadError={error} currentMastery={sel.unitId && sel.unitId !== unitId ? recordAverage(work?.records, sel.targetId) : grid.cells[sel.studentId]?.[sel.targetId]?.value} reviewQueue={reviewQueue} onSelect={(student, target, context) => openCell(student, target, { ...context, unitId: sel.unitId })} onClose={closeDrawer} onSaved={item => { setReviewVersion(v => v + 1); setGradedKeys(previous => new Set(previous).add(reviewItemKey(item))); loadGrid(unitId); loadQueue(unitId) }} onReturned={() => { setReviewVersion(v => v + 1); loadGrid(unitId); loadQueue(unitId) }} onSkip={item => setSkippedKeys(previous => new Set(previous).add(reviewItemKey(item)))} renderResponse={w => <ResponseView response={w.response} prompt={w.prompt}/>} />}
    </div>
  )
}
