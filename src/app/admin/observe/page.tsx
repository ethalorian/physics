"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { teachingHref } from '@/lib/teaching-navigation'
import { ArrowRight, Check, ClipboardCheck, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import ObservationFeedback from '@/components/admin/ObservationFeedback'
import MathMarkdown from '@/components/MathMarkdown'
import { levelWord } from '@/components/mastery/mastery-display'
import { useClassScope } from '@/lib/use-class-scope'
import { useViewAs } from '@/lib/use-view-as'
import styles from './observe.module.css'

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
  'Next: repeat the measurement and compare your trials.',
  'Next: change one variable and keep the others the same.',
  'Next: use a specific measurement to support your claim.',
  'Next: label both graph axes with quantities and units.',
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
  const [targetSearch, setTargetSearch] = useState('')
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [savedRatings, setSavedRatings] = useState<Record<string, number>>({})
  const [unvisitedOnly, setUnvisitedOnly] = useState(false)
  const targetPanel = useRef<HTMLElement>(null)
  const feedbackPanel = useRef<HTMLDivElement>(null)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [observed, setObserved] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dictating, setDictating] = useState(false)
  const [error, setError] = useState('')
  const [coursesError, setCoursesError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  const inFlight = useRef(false)
  const lastSave = useRef(0)
  const gridVersion = useRef(0)
  const requestedStudent = useRef('')
  const requestedTarget = useRef('')
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('unit') && !['all', 'unmapped'].includes(query.get('unit')!)) setUnit(query.get('unit')!)
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
    const version = ++gridVersion.current
    setLoading(true)
    setGrid(null)
    setError('')
    const query = new URLSearchParams({ unit_id: unit })
    if (classId) query.set('class', classId)
    readJson<Grid>(`/api/mastery/grid?${query}`, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted || version !== gridVersion.current) return
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

  const students = grid?.students.filter((s) => s.ratable === true).sort((a, b) => a.name.localeCompare(b.name)) ?? []
  const searchWords = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const visibleStudents = students.filter((s) => searchWords.every((word) => `${s.name} ${s.email}`.toLocaleLowerCase().includes(word)) && (!unvisitedOnly || !observed.has(JSON.stringify([s.id, targetId]))))
  const student = students.find((s) => s.id === studentId)
  const target = grid?.targets.find((t) => t.id === targetId)
  const visibleTargets = grid?.targets.filter(t => targetSearch.trim().toLowerCase().split(/\s+/).every(word => t.statement.toLowerCase().includes(word))) ?? []
  const cell = grid?.cells[studentId]?.[targetId]
  const completed = students.filter((s) => observed.has(JSON.stringify([s.id, targetId]))).length
  function chooseClass(id: string) {
    const course = courses.find((c) => c.id === id)
    setUnit('auto')
    setSearch('')
    setTargetSearch('')
    setNotice('')
    setClassScope(id || null, course ? `${course.name}${course.section ? ` · ${course.section}` : ''}` : null)
  }
  function chooseStudent(id: string) {
    if (inFlight.current || dictating) return
    setStudentId(id)
    setNotice('')
    setError('')
    if (window.matchMedia('(max-width: 767px)').matches) targetPanel.current?.scrollIntoView({ block: 'start' })
  }
  function chooseTarget(id: string) {
    if (inFlight.current || dictating) return
    setTargetId(id)
    setNotice('')
    setError('')
    if (window.matchMedia('(max-width: 767px)').matches) feedbackPanel.current?.scrollIntoView({ block: 'start' })
  }
  function updateDraft(change: Partial<Draft>) {
    setDrafts((old) => ({ ...old, [key]: { ...(old[key] ?? EMPTY), ...change } }))
  }
  function nextStudent() {
    const index = students.findIndex((s) => s.id === studentId)
    const ordered = [...students.slice(index + 1), ...students.slice(0, index)]
    const next = ordered.find((s) => !observed.has(JSON.stringify([s.id, targetId]))) ?? ordered[0]
    if (next) { setStudentId(next.id); setSearch(''); setError('') }
  }
  async function save(advance: boolean, level?: 1 | 2 | 3) {
    const value = level ? { ...draft, level } : draft
    if (inFlight.current || Date.now() - lastSave.current < 650 || dictating || !student || !target || (!value.level && !value.message.trim() && !value.ratingSaved)) return
    inFlight.current = true
    if (level) updateDraft({ level })
    setSaving(true)
    setError('')
    setNotice('')
    let ratingSaved = value.ratingSaved === true
    try {
      if (value.level && !ratingSaved) {
        await readJson('/api/mastery/records', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: student.id, user_email: student.email, target_id: target.id, level: value.level, evidence_source: 'observation' }),
        })
        ratingSaved = true
        updateDraft({ ratingSaved: true })
        setSavedRatings(old => ({ ...old, [key]: value.level! }))
        setObserved((old) => new Set(old).add(key))
      }
      if (value.message.trim()) {
        await readJson('/api/feedback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: student.id, target_id: target.id, message: value.message.trim() }),
        })
      }
      setObserved((old) => new Set(old).add(key))
      setDrafts((old) => { const copy = { ...old }; delete copy[key]; return copy })
      const savedNotice = `${student.name}: ${ratingSaved ? `${levelWord(value.level ?? savedRatings[key])} saved` : 'feedback sent'}${ratingSaved && value.message.trim() ? ' and feedback sent' : ''}.`
      setNotice(savedNotice)
      // Reload the canonical rollup without blocking the next student or inventing an average.
      const query = new URLSearchParams({ unit_id: grid?.unitId ?? unit })
      if (classId) query.set('class', classId)
      const version = ++gridVersion.current
      void readJson<Grid>(`/api/mastery/grid?${query}`).then(data => {
        if (version === gridVersion.current) setGrid(data)
      }).catch(() => {
        if (version === gridVersion.current) setNotice(old => old === savedNotice ? `${savedNotice} Current mastery could not refresh; reload to see the latest average.` : old)
      })
      if (advance) nextStudent()
    } catch (e) {
      setError(`${ratingSaved ? 'Rating saved. Feedback was not confirmed; your draft is kept. Retrying will send feedback only. ' : 'Save was not confirmed. Your draft is kept. Check the connection before retrying. '}${e instanceof Error ? e.message : ''}`)
    } finally {
      inFlight.current = false
      lastSave.current = Date.now()
      setSaving(false)
    }
  }

  if (!staff) return <div className="p-6">Classroom observations are available to teachers and administrators.</div>

  const busy = saving || dictating
  const savedLevel = savedRatings[key]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className="text-title-1 flex items-center gap-2"><ClipboardCheck aria-hidden />Classroom observations</h1>
        <Button asChild variant="outline" className="min-h-12"><Link href={teachingHref('live', classId ?? '', grid?.unitId ?? unit)}>Live classroom</Link></Button>
      </header>
      <fieldset disabled={busy} className={styles.scope}>
        <legend className="sr-only">Class and unit</legend>
        <div className={styles.classes} aria-label="Quick class selection">
          <Button variant={!classId ? 'default' : 'outline'} aria-pressed={!classId} className="min-h-12" onClick={() => chooseClass('')}>All my students</Button>
          {courses.map(c => <Button key={c.id} variant={classId === c.id ? 'default' : 'outline'} aria-pressed={classId === c.id} className="min-h-12" onClick={() => chooseClass(c.id)}>{c.name}{c.section ? ' · ' + c.section : ''}</Button>)}
        </div>
        <label className={styles.unit}><span className="text-caption text-muted-foreground">Unit</span><select aria-label="Unit" disabled={loading} className={fieldClass} value={unit === 'auto' ? grid?.unitId ?? 'auto' : unit} onChange={e => { setUnit(e.target.value); setTargetSearch(''); setNotice('') }}>{!grid && <option value={unit}>Loading units…</option>}{grid?.units.map(u => <option key={u.id} value={u.id}>{u.label ?? u.name}</option>)}</select></label>
      </fieldset>
      {coursesError && <div role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{coursesError}<Button variant="outline" disabled={busy} className="ml-3 min-h-12" onClick={() => setReload(n => n + 1)}>Retry loading classes</Button></div>}
      {error && <div role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{error}{!grid && <Button variant="outline" className="ml-3 min-h-12" onClick={() => setReload(n => n + 1)}>Retry loading</Button>}</div>}
      {loading ? <p role="status">Loading your roster and mastery targets…</p> : grid && <>
        {!students.length ? <Card className="p-6">No students from your own roster are available here. Choose another class or sync your roster.</Card> : <div className={styles.workspace}>
          <section className={styles.students} aria-labelledby="student-step">
            <h2 id="student-step" className={styles.step}><span>1</span>Find a student</h2>
            <div className={styles.search}>
              <Search aria-hidden size={20} />
              <Input id="observation-search" aria-label="Find a student" autoComplete="off" className="min-h-14 pl-10 text-base" placeholder="Name or email…" value={search} disabled={busy} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && visibleStudents.length) { e.preventDefault(); chooseStudent(visibleStudents[0].id) } if (e.key === 'Escape') setSearch('') }} />
              {search && <Button variant="ghost" aria-label="Clear student search" disabled={busy} className="min-h-12 px-3" onClick={() => setSearch('')}>Clear</Button>}
            </div>
            <div className="grid grid-cols-2 gap-2" aria-label="Visit filter">
              <Button variant={!unvisitedOnly ? 'secondary' : 'outline'} aria-pressed={!unvisitedOnly} disabled={busy} className="min-h-12 px-2" onClick={() => setUnvisitedOnly(false)}>Everyone</Button>
              <Button variant={unvisitedOnly ? 'secondary' : 'outline'} aria-pressed={unvisitedOnly} disabled={busy} className="min-h-12 px-2" onClick={() => setUnvisitedOnly(true)}>Still to visit</Button>
            </div>
            <div className={styles.roster} aria-label="Student roster">
              {visibleStudents.map(s => { const studentKey = JSON.stringify([s.id, targetId]); return <Button key={s.id} variant={studentId === s.id ? 'default' : 'outline'} disabled={busy} aria-pressed={studentId === s.id} className={styles.studentButton} onClick={() => chooseStudent(s.id)}><span>{s.name}{drafts[studentKey] && <span className="block text-caption">Draft</span>}</span>{observed.has(studentKey) && <Check aria-label="Observed this visit" />}</Button> })}
              {!visibleStudents.length && <p className="p-2 text-muted-foreground">{search ? 'No matching students. Try another name.' : 'Everyone has been visited on this target. Choose Everyone to revisit a student.'}</p>}
            </div>
            <p className="text-caption text-muted-foreground">{completed} / {students.length} visited on this target</p>
          </section>
          <div className={styles.workflow}>
            <section ref={targetPanel} className={styles.targets} aria-labelledby="target-step">
              <h2 id="target-step" className={styles.step}><span>2</span>Choose a target</h2>
              <div className={styles.search}>
                <Search aria-hidden size={20} />
                <Input aria-label="Find a target" autoComplete="off" className="min-h-14 pl-10 text-base" placeholder="Search targets…" value={targetSearch} disabled={busy} onChange={e => setTargetSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && visibleTargets.length) { e.preventDefault(); chooseTarget(visibleTargets[0].id) } if (e.key === 'Escape') setTargetSearch('') }} />
                {targetSearch && <Button variant="ghost" aria-label="Clear target search" disabled={busy} className="min-h-12 px-3" onClick={() => setTargetSearch('')}>Clear</Button>}
              </div>
              <div className={styles.targetList} aria-label="Learning targets">
                {visibleTargets.map(t => <Button key={t.id} variant="outline" aria-pressed={targetId === t.id} disabled={busy} className={styles.targetButton} onClick={() => chooseTarget(t.id)}>
                  <span className={styles.targetNumber}>{grid.targets.findIndex(item => item.id === t.id) + 1}</span>
                  <span className={styles.targetText}>{t.statement}</span>
                  {targetId === t.id && <Check aria-hidden />}
                </Button>)}
                {!visibleTargets.length && <p className="p-3 text-muted-foreground">{grid.targets.length ? 'No matching targets. Try another word.' : 'No learning targets are available for this unit.'}</p>}
              </div>
            </section>
            {student && target && <div ref={feedbackPanel} className={styles.ratingPanel}>
              <h2 className={styles.step}><span>3</span>Tap to rate</h2>
              <Card className={styles.ratingCard}>
                <div><h3 className="text-title-1">{student.name}</h3><p className="text-caption text-muted-foreground">Current mastery: {cell?.value == null ? 'No observations yet' : `${cell.value.toFixed(1)} · ${levelWord(cell.value)}`}</p></div>
                <div className={styles.activeTarget}><span className="text-caption font-semibold text-primary">Target {grid.targets.findIndex(t => t.id === targetId) + 1}</span><MathMarkdown content={target.statement} /></div>
                <fieldset disabled={busy || !!savedLevel || draft.ratingSaved}>
                  <legend className="mb-3 text-caption text-muted-foreground">Tap once to save{draft.message.trim() ? ' with your feedback' : ''}.</legend>
                  <div className={styles.ratings}>{([1, 2, 3] as const).map(level => <Button key={level} variant="outline" aria-label={`${level} ${levelWord(level)}`} aria-pressed={(savedLevel ?? draft.level) === level} className={styles.ratingButton} data-level={level} onClick={() => save(autoAdvance, level)}><span className="text-display">{level}</span><span className="text-title-3">{levelWord(level)}</span></Button>)}</div>
                </fieldset>
                <div role="status" className={styles.saveStatus} data-error={!!error}>{saving ? 'Saving…' : error ? (draft.ratingSaved ? 'Rating saved. Feedback needs a retry.' : 'Save not confirmed. Retry below.') : notice || (savedLevel ? `Saved · ${levelWord(savedLevel)}` : 'Ready to record an observation')}</div>
                <Button variant="outline" aria-pressed={autoAdvance} disabled={busy} className={styles.advanceToggle} onClick={() => setAutoAdvance(old => !old)}><span className={styles.checkBox} aria-hidden>{autoAdvance && <Check size={16} />}</span>Next student after rating</Button>
                <Button className="min-h-14 w-full text-base" disabled={busy || students.length < 2} onClick={nextStudent}>Next student<ArrowRight aria-hidden /></Button>
                {!!savedLevel && !draft.ratingSaved && <Button variant="ghost" disabled={busy} className="min-h-12 whitespace-normal" onClick={() => { setSavedRatings(old => { const copy = { ...old }; delete copy[key]; return copy }); setNotice('') }}>Record another observation</Button>}
                {draft.ratingSaved && <p className="text-caption">Rating saved. Retry sends only the remaining feedback.</p>}
                {(draft.level || draft.ratingSaved) && !saving && error && <Button className="min-h-14" disabled={dictating} onClick={() => save(autoAdvance)}>Retry save</Button>}
              </Card>
              <details key={key} className={styles.feedback} open={draft.message.trim() ? true : undefined}>
                <summary>Add feedback <span className="text-caption text-muted-foreground">optional</span></summary>
                <div className="space-y-3 pt-3">
                  <ObservationFeedback key={key} value={draft.message} disabled={saving} onChange={message => updateDraft({ message })} onActiveChange={setDictating} />
                  <details><summary className="min-h-12 cursor-pointer content-center text-caption">Quick feedback phrases</summary><div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto py-2">{PHRASES.map(phrase => <Button key={phrase} variant="outline" disabled={busy || draft.message.length + phrase.length + 1 > 2000 || draft.message.split('\n').includes(phrase)} className="h-auto min-h-12 max-w-full whitespace-normal px-3 py-2 text-left" onClick={() => updateDraft({ message: `${draft.message}${draft.message ? '\n' : ''}${phrase}` })}>{phrase}</Button>)}</div></details>
                  <Button variant="outline" className="min-h-14 w-full" disabled={busy || !draft.message.trim()} onClick={() => save(false)}>{draft.ratingSaved ? 'Retry feedback' : 'Send feedback'}</Button>
                </div>
              </details>
            </div>}
          </div>
        </div>}
      </>}
    </div>
  )
}
