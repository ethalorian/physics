"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MathMarkdown from '@/components/MathMarkdown'
import { levelWord } from '@/components/mastery/mastery-display'
import { useClassScope } from '@/lib/use-class-scope'
import { useViewAs } from '@/lib/use-view-as'

interface Course { id: string; name: string; section: string | null }
interface Student { id: string; name: string; email: string; ratable?: boolean }
interface Grid {
  unitId: string
  units: { id: string; name: string; label?: string }[]
  targets: { id: string; statement: string; domain: string }[]
  students: Student[]
  cells: Record<string, Record<string, { value: number | null; count: number }>>
}
interface Draft { level?: 1 | 2 | 3; message: string; ratingSaved?: boolean }
const EMPTY: Draft = { message: '' }
const PHRASES = [
  'You explained your reasoning clearly.',
  'You used evidence to support your claim.',
  'Next: connect your observation to the physics idea.',
  'Next: label your quantities and check the units.',
  'Next: try a new example independently.',
]
const fieldClass = 'min-h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base'

async function readJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => {
    throw new Error(`The server returned an unexpected response (${response.status}). Reload the page and try again.`)
  })
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`)
  return data as T
}

export default function ObservationPage() {
  const { role } = useViewAs()
  const { classId, ready, setClassScope } = useClassScope()
  const [courses, setCourses] = useState<Course[]>([])
  const [grid, setGrid] = useState<Grid | null>(null)
  const [unit, setUnit] = useState('auto')
  const [targetId, setTargetId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [observed, setObserved] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [coursesError, setCoursesError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  const inFlight = useRef(false)
  const requestedStudent = useRef('')
  const requestedTarget = useRef('')
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    requestedStudent.current = query.get('student') ?? ''
    requestedTarget.current = query.get('target') ?? ''
    if (query.get('class')) setClassScope(query.get('class'))
  }, [setClassScope])
  const staff = role === 'teacher' || role === 'admin'

  useEffect(() => {
    if (!staff) return
    const controller = new AbortController()
    setCoursesError('')
    readJson<{ courses: Course[] }>('/api/teacher/courses', { signal: controller.signal })
      .then((data) => setCourses(data.courses ?? []))
      .catch((e) => { if (!controller.signal.aborted) setCoursesError(`Could not load your classes. ${e.message}`) })
    return () => controller.abort()
  }, [staff, reload])

  useEffect(() => {
    if (!ready || !staff) return
    const controller = new AbortController()
    setLoading(true)
    setGrid(null)
    setError('')
    const query = new URLSearchParams({ unit_id: unit })
    if (classId) query.set('class', classId)
    readJson<Grid>(`/api/mastery/grid?${query}`, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        setGrid(data)
        setTargetId((old) => { const wanted = requestedTarget.current || old; requestedTarget.current = ''; return data.targets.some(t => t.id === wanted) ? wanted : data.targets[0]?.id ?? '' })
        setStudentId((old) => { const wanted = requestedStudent.current || old; requestedStudent.current = ''; return data.students.some(s => s.id === wanted && s.ratable === true) ? wanted : data.students.find(s => s.ratable === true)?.id ?? '' })
      })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [ready, staff, classId, unit, reload])

  // Drafts stay attached to their student AND target, including across class changes.
  const key = JSON.stringify([studentId, targetId])
  const draft = drafts[key] ?? EMPTY
  const hasDrafts = Object.values(drafts).some((d) => d.level || d.message.trim() || d.ratingSaved)
  useEffect(() => {
    if (!hasDrafts && !saving) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasDrafts, saving])

  const students = grid?.students.filter((s) => s.ratable === true) ?? []
  const visibleStudents = students.filter((s) => s.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const student = students.find((s) => s.id === studentId)
  const target = grid?.targets.find((t) => t.id === targetId)
  const cell = grid?.cells[studentId]?.[targetId]
  const completed = students.filter((s) => observed.has(JSON.stringify([s.id, targetId]))).length
  function updateDraft(change: Partial<Draft>) {
    setDrafts((old) => ({ ...old, [key]: { ...(old[key] ?? EMPTY), ...change } }))
  }
  function nextStudent() {
    const index = students.findIndex((s) => s.id === studentId)
    const ordered = [...students.slice(index + 1), ...students.slice(0, index)]
    const next = ordered.find((s) => !observed.has(JSON.stringify([s.id, targetId]))) ?? ordered[0]
    if (next) { setStudentId(next.id); setSearch('') }
  }
  async function save(advance: boolean) {
    if (inFlight.current || !student || !target || (!draft.level && !draft.message.trim() && !draft.ratingSaved)) return
    inFlight.current = true
    setSaving(true)
    setError('')
    setNotice('')
    let ratingSaved = draft.ratingSaved === true
    try {
      if (draft.level && !ratingSaved) {
        await readJson('/api/mastery/records', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: student.id, user_email: student.email, target_id: target.id, level: draft.level, evidence_source: 'observation' }),
        })
        ratingSaved = true
        updateDraft({ ratingSaved: true })
        setObserved((old) => new Set(old).add(key))
      }
      if (draft.message.trim()) {
        await readJson('/api/feedback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: student.id, target_id: target.id, message: draft.message.trim() }),
        })
      }
      setDrafts((old) => { const copy = { ...old }; delete copy[key]; return copy })
      setNotice(`${student.name}: ${ratingSaved ? 'observation saved' : 'feedback sent'}${ratingSaved && draft.message.trim() ? ' and feedback sent' : ''}.`)
      // Reload the canonical rollup without blocking the next student or inventing an average.
      const query = new URLSearchParams({ unit_id: grid?.unitId ?? unit })
      if (classId) query.set('class', classId)
      try { setGrid(await readJson<Grid>(`/api/mastery/grid?${query}`)) }
      catch { setNotice(`${student.name}: saved. Current mastery could not refresh; reload to see the latest average.`) }
      if (advance) nextStudent()
    } catch (e) {
      setError(`${ratingSaved ? 'Rating saved. Feedback was not confirmed; your draft is kept. Retrying will send feedback only. ' : 'Save was not confirmed. Your draft is kept. Check the connection before retrying. '}${e instanceof Error ? e.message : ''}`)
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  if (!staff) return <div className="p-6">Classroom observations are available to teachers and administrators.</div>

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 pb-8 sm:p-6" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))', touchAction: 'manipulation' }}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="text-overline text-muted-foreground">Teach & grade</div><h1 className="text-title-1 flex items-center gap-2"><ClipboardCheck aria-hidden />Classroom observations</h1><p className="mt-1 text-muted-foreground">Choose a target. Notice the learning. Give a next step.</p></div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-12"><Link href="/admin/command-center">Command Center</Link></Button><Button asChild variant="outline" className="min-h-12"><Link href="/admin/control-room">Control Room</Link></Button></div>
      </header>
      <fieldset disabled={saving} className="grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="min-w-0 space-y-1 text-caption">Class<select aria-label="Class" className={fieldClass} value={classId ?? ''} onChange={(e) => { const course = courses.find((c) => c.id === e.target.value); setUnit('auto'); setSearch(''); setNotice(''); setClassScope(e.target.value || null, course?.name) }}><option value="">All my students</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}</select></label>
        <label className="min-w-0 space-y-1 text-caption">Unit<select aria-label="Unit" disabled={loading} className={fieldClass} value={unit === 'auto' ? grid?.unitId ?? 'auto' : unit} onChange={(e) => { setUnit(e.target.value); setNotice('') }}>{!grid && <option value={unit}>Loading units…</option>}{grid?.units.map((u) => <option key={u.id} value={u.id}>{u.label ?? u.name}</option>)}</select></label>
      </fieldset>
      {coursesError && <div role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{coursesError}<Button variant="outline" disabled={saving} className="ml-3 min-h-12" onClick={() => setReload((n) => n + 1)}>Retry loading classes</Button></div>}
      {error && <div role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{error}{!grid && <Button variant="outline" className="ml-3 min-h-12" onClick={() => setReload((n) => n + 1)}>Retry loading</Button>}</div>}
      <p role="status" className="text-caption min-h-5" style={{ color: 'var(--viz-up)' }}>{saving ? 'Saving… Keep this view open.' : notice}</p>
      {loading ? <p role="status">Loading your roster and mastery targets…</p> : grid && <>
        <Card className="gap-3 p-4">
          <label className="block text-caption" htmlFor="observation-target">Observation focus · stays selected as you move between students</label>
          <select id="observation-target" disabled={saving} className={fieldClass} value={targetId} onChange={(e) => { setTargetId(e.target.value); setNotice('') }}>{grid.targets.map((t, i) => <option key={t.id} value={t.id}>{i + 1}. {t.statement}</option>)}</select>
          {target ? <div><span className="text-overline text-muted-foreground">{target.domain}</span><div className="text-title-3"><MathMarkdown content={target.statement} /></div></div> : <p>No learning targets are available for this unit.</p>}
          <p className="text-caption text-muted-foreground">{completed} of {students.length} students observed on this target in this visit</p>
          <progress className="h-2 w-full" style={{ accentColor: 'var(--primary)' }} aria-label="Students observed on this target" value={completed} max={students.length || 1} />
        </Card>
        {!students.length ? <Card className="p-6">No students from your own roster are available here. Choose another class or sync your roster.</Card> : <div className="grid items-start gap-4 md:grid-cols-[minmax(180px,0.7fr)_minmax(0,1.6fr)]">
          <Card className="min-w-0 gap-3 p-3">
            <label className="text-caption" htmlFor="observation-search">Find a student</label>
            <Input id="observation-search" className="min-h-12 text-base" placeholder="Search names" value={search} disabled={saving} onChange={(e) => setSearch(e.target.value)} />
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto md:max-h-[55dvh]" aria-label="Student roster">
              {visibleStudents.map((s) => { const studentKey = JSON.stringify([s.id, targetId]); return <Button key={s.id} variant={studentId === s.id ? 'default' : 'outline'} disabled={saving} aria-pressed={studentId === s.id} className="h-auto min-h-14 w-full justify-between whitespace-normal px-3 text-left" onClick={() => { setStudentId(s.id); setNotice(''); setError('') }}><span>{s.name}{drafts[studentKey] && <span className="block text-xs">Draft</span>}</span>{observed.has(studentKey) && <Check aria-label="Observed this visit" />}</Button> })}
              {!visibleStudents.length && <p className="p-2 text-muted-foreground">No names match your search.</p>}
            </div>
          </Card>
          {student && target && <Card className="min-w-0 gap-4 p-4 sm:p-5">
            <div><div className="text-overline text-muted-foreground">Observing</div><h2 className="text-title-1">{student.name}</h2><p className="text-caption text-muted-foreground">Current mastery: {cell?.value == null ? 'No observations yet' : `${cell.value.toFixed(1)} · ${levelWord(cell.value)} · ${cell.count} observation${cell.count === 1 ? '' : 's'}`}</p></div>
            <fieldset disabled={saving || draft.ratingSaved} className="space-y-2"><legend className="mb-2 text-caption">What did you observe?</legend><div className="grid grid-cols-3 gap-2">{([1, 2, 3] as const).map((level) => <Button key={level} variant={draft.level === level ? 'default' : 'outline'} aria-pressed={draft.level === level} className="h-auto min-h-20 flex-col gap-1 px-2 text-base" onClick={() => updateDraft({ level: draft.level === level ? undefined : level })}><span className="text-title-2">{level}</span>{levelWord(level)}</Button>)}</div></fieldset>
            {draft.ratingSaved && <p className="text-caption">Rating saved. Only the remaining feedback will be sent.</p>}
            <div className="space-y-3"><label htmlFor="observation-feedback" className="block text-caption">Feedback to {student.name} <span className="text-muted-foreground">· optional</span></label><p className="text-caption text-muted-foreground">Tap a phrase to add it, then edit or use iPad keyboard dictation.</p><div className="flex flex-wrap gap-2">{PHRASES.map((phrase) => <Button key={phrase} variant="outline" disabled={saving || draft.message.length + phrase.length + 1 > 2000} className="h-auto min-h-12 whitespace-normal px-3 py-2 text-left" onClick={() => updateDraft({ message: `${draft.message}${draft.message ? '\n' : ''}${phrase}` })}>{phrase}</Button>)}</div><Textarea id="observation-feedback" className="min-h-28 text-base" maxLength={2000} disabled={saving} placeholder="Name a strength or one concrete next step…" value={draft.message} onChange={(e) => updateDraft({ message: e.target.value })} /><p className="text-caption text-muted-foreground">{draft.message.length}/2000 · Feedback appears in the student’s feedback feed.</p></div>
            <div className="sticky bottom-0 -mx-1 flex flex-wrap gap-2 border-t bg-card p-2" style={{ paddingBottom: 'max(.5rem, env(safe-area-inset-bottom))' }}>
              <Button className="min-h-14 flex-1 text-base" disabled={saving || (!draft.level && !draft.message.trim() && !draft.ratingSaved)} onClick={() => save(true)}>Save & next<ArrowRight aria-hidden /></Button>
              <Button variant="outline" className="min-h-14" disabled={saving || (!draft.level && !draft.message.trim() && !draft.ratingSaved)} onClick={() => save(false)}>Save & stay</Button>
              <Button variant="ghost" className="min-h-14" disabled={saving || students.length < 2} onClick={nextStudent}>Skip</Button>
            </div>
            <p className="text-caption text-muted-foreground">Drafts stay with each student and target while this view is open. Ratings save to the existing mastery history.</p>
          </Card>}
        </div>}
      </>}
    </div>
  )
}
