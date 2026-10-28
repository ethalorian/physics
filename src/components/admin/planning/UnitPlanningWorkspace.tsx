'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { useSequenceDateConfirmation } from '@/components/admin/useSequenceDateConfirmation'
import { DateChangeCancelled } from '@/lib/sequence-date-change'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, FlaskConical, GripVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { canChangeAssessmentScope, useAssessmentReviewGuard } from '@/components/admin/useAssessmentReviewGuard'
import ClassAssignedWork, { WorkEditor } from '@/components/admin/ClassAssignedWork'
import type { ClassWorkItem } from '@/lib/class-work'
import { useClassWork } from '@/components/admin/useClassWork'
import { plannerDay, shiftDay } from '@/lib/reading-planner'
import { assignedActivity, assignmentSettingsHref, planChanges } from '@/lib/teaching-plans/model'
import { workIsAssigned } from '@/lib/class-work'
import type { PlanActivity, PlanStep, PlanningClass, PlanningData, TeachingSlot } from '@/lib/teaching-plans/types'
import { matchesLibrary, readingTags } from '@/lib/activity-library'
import SavedUnitSequences from './SavedUnitSequences'
import CalendarSequencePicker from './CalendarSequencePicker'
import AssignmentIdentity from '@/components/AssignmentIdentity'
import { sourcePresentation, sourceTitle, sourceTypeOptions, matchesSourceType } from '@/lib/assignment-source-presentation'
import { teachingWeek, teachingWeeks, unassignCalendarAssignment, type CalendarAssignment } from '@/lib/teaching-calendar'
import s from './UnitPlanningWorkspace.module.css'

const labelDay = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
type Edit = { courseId: string; stepId?: string; action: 'apply' | 'step' }

export default function UnitPlanningWorkspace({ classId, unitId, mode }: { classId: string | null; unitId: string; mode: 'plan' | 'calendar' }) {
  if (!classId) return <div className={s.empty}><BookOpen size={28} /><h2>Start with a class</h2><p>Choose a class above to assemble its unit and compare the pace of your other sections.</p></div>
  if (['auto', 'all', 'unmapped'].includes(unitId)) return <div className={s.empty}><h2>Choose a unit</h2><p>Select a course unit above to open its shared sequence.</p></div>
  return <Workspace key={classId + ':' + unitId} classId={classId} unitId={unitId} mode={mode} />
}

function Workspace({ classId, unitId, mode }: { classId: string; unitId: string; mode: 'plan' | 'calendar' }) {
  const dateRequest = useSequenceDateConfirmation()
  const router = useRouter(), search = useSearchParams()
  const [editingSequence, setEditingSequence] = useState(search.get('edit') === 'sequence')
  const editorHeading = useRef<HTMLHeadingElement>(null)
  const [data, setData] = useState<PlanningData | null>(null), [steps, setSteps] = useState<PlanStep[]>([])
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [savedLibrary,setSavedLibrary]=useState(false)
  const [choosingSequence, setChoosingSequence] = useState(false)
  const [library, setLibrary] = useState(false), [edit, setEdit] = useState<Edit | null>(null)
  const controller = useRef<AbortController | null>(null), saving = useRef(false)
  const work = useClassWork(classId)
  const hasData = data !== null
  const dirty = JSON.stringify(steps) !== JSON.stringify(data?.plan?.steps ?? [])
  useAssessmentReviewGuard(dirty || busy)
  const load = useCallback(async () => {
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/teaching-plans?class=${encodeURIComponent(classId)}&unit=${encodeURIComponent(unitId)}&from=${shiftDay(plannerDay(new Date()), -35)}`, { signal: abort.signal })
      const next = await response.json()
      if (!response.ok) throw Error(next.error || 'Could not load the unit plan.')
      if (!abort.signal.aborted) { setData(next); setSteps(next.plan?.steps ?? []) }
    } catch (e) { if (!abort.signal.aborted) setError((e as Error).message) }
    finally { if (!abort.signal.aborted) setLoading(false) }
  }, [classId, unitId])
  useEffect(() => { void load(); return () => controller.current?.abort() }, [load])
  useEffect(() => {
    if (editingSequence && hasData && mode === 'plan') { editorHeading.current?.focus(); editorHeading.current?.scrollIntoView({ block: 'start' }) }
  }, [editingSequence, hasData, mode])
  const locked = busy || loading || !!data?.readOnly
  const selectedClass = data?.classes.find(c => c.id === classId)
  useEffect(() => {
    if (search.get('useSequence') !== '1' || !data || loading || data.readOnly || mode !== 'calendar') return
    if (data.plan) setEdit({ action: 'apply', courseId: classId })
    const query = new URLSearchParams(search.toString()); query.delete('useSequence')
    router.replace('/admin/control-room?' + query.toString(), { scroll: false })
  }, [search, data, loading, mode, classId, router])
  const assigned = (work.data?.items ?? []).filter(workIsAssigned)
  const availableAssigned = data ? [...new Map(assigned.map(item => assignedActivity(item, data.catalog)).filter((a): a is PlanActivity => !!a && a.unitIds.includes(unitId) && !steps.some(st => st.activityKey === a.key)).map(a => [a.key, a])).values()].slice(0, Math.max(0, 100 - steps.length)) : []
  async function mutate(body: Record<string, unknown>, message: string) {
    if (saving.current || locked) return false
    saving.current = true; setBusy(true); setError(''); setNotice('')
    try {
      await dateRequest.send('/api/teaching-plans', { unitId, classId, ...body }); await load(); await work.load(); setNotice(message); return true
    } catch (e) { if (!(e instanceof DateChangeCancelled)) setError((e as Error).message); return false }
    finally { saving.current = false; setBusy(false) }
  }
  function openSequenceEditor(targetUnit = unitId) {
    if (locked) return
    if (targetUnit !== unitId) {
      if (!canChangeAssessmentScope()) return
      const query = new URLSearchParams(search.toString())
      query.set('view', 'plan'); query.set('class', classId); query.set('unit', targetUnit); query.set('edit', 'sequence')
      router.push('/admin/control-room?' + query.toString())
    } else { setEditingSequence(true); setLibrary(false) }
    setSavedLibrary(false)
  }
  function chooseCalendarSequence(targetUnit: string) {
    if (locked || !canChangeAssessmentScope()) return
    setChoosingSequence(false)
    if (targetUnit === unitId) { setEdit({ action: 'apply', courseId: classId }); return }
    const query = new URLSearchParams(search.toString())
    query.set('view', 'calendar'); query.set('class', classId); query.set('unit', targetUnit); query.set('useSequence', '1'); query.delete('edit')
    router.push('/admin/control-room?' + query.toString())
  }
  const saveSequence = () => mutate({ action: 'draft', version: data?.plan?.version ?? 0, steps }, 'Sequence changes saved. Use “Review update” to apply this version to a class.')
  const finishEditing = () => { setSteps(data?.plan?.steps ?? []); setEditingSequence(false); setLibrary(false); setError(''); setNotice(dirty ? 'Unsaved sequence changes discarded.' : '') }
  function change(id: string, values: Partial<PlanStep>) { setSteps(previous => previous.map(p => p.id === id ? { ...p, ...values } : p)) }
  function move(id: string, amount: number) { setSteps(previous => { const next = [...previous], from = next.findIndex(p => p.id === id), to = from + amount; if (to < 0 || to >= next.length) return previous; [next[from], next[to]] = [next[to], next[from]]; return next }) }
  async function place(stepId: string, slot: TeachingSlot | null) {
    const state = selectedClass?.state
    if (!data?.plan || dirty) return false
    if (!slot && (!work.data || work.error || work.data.warnings.length || work.data.readOnly)) { setError('Reload assigned work before unassigning this activity.'); return false }
    const step = state?.steps.find(st => st.id === stepId)
    const item = work.data?.items.find(i => assignedActivity(i, data.catalog)?.key === step?.activityKey)
    const expected = item ? { sourceId: item.sourceId, dueAt: item.dueAt, version: item.version ?? null, opensAt: item.opensAt ?? null, closesAt: item.closesAt ?? null } : null
    return mutate({ action: slot ? 'schedule' : 'unassign', version: state?.version ?? 0, planVersion: state?.plan_version ?? data.plan.version, stepId, slot, ...(!slot ? { expected } : {}) }, slot ? `Assigned to ${selectedClass?.label} · due ${labelDay(slot.date)}. Calendar saved.` : 'Activity unassigned and returned to the sequence. Student work and grades stay saved.')
  }
  async function removeDeadline(assignment: CalendarAssignment) {
    if (saving.current || locked || assignment.course_id !== classId) return false
    saving.current = true; setBusy(true); setError(''); setNotice('')
    try {
      await unassignCalendarAssignment(assignment)
      await load(); await work.load()
      setNotice('Removed from this class’s calendar. Linked activities were unassigned together; student work and grades stay saved.')
      return true
    } catch (e) { setError((e as Error).message); return false }
    finally { saving.current = false; setBusy(false) }
  }
  const add = (a: PlanActivity) => { setSteps(previous => [...previous, { id: crypto.randomUUID(), activityKey: a.key, title: a.title, kind: a.kind, purpose: '', notes: '', optional: false }]); setNotice(`Added ${a.title} to the draft sequence.`) }
  if (loading && !data) return <p role="status" className={s.empty}>Loading activities and class schedules…</p>
  return <div className={s.root}>
    {dateRequest.confirmation}
    {error && <div className={s.error} role="alert">{error} <button disabled={busy || dirty} onClick={() => void load()}>Reload saved plan</button>{dirty && <small>Your draft is still here. Copy any changes you want to keep before discarding it to reload.</small>}</div>}
    {notice && <p role="status" className={s.notice}>{notice}</p>}
    {data && <>
      {data.readOnly && <p className={s.notice}>Teacher preview. Plans and student deadlines are read-only.</p>}
      {data.warnings.length > 0 && <details className={s.warning}><summary>Some library sources could not load</summary>{data.warnings.map(w => <p key={w}>{w}</p>)}</details>}
      <div className={s.heading}>
        <div><p className={s.eyebrow}>{mode === 'calendar' ? 'CLASS CALENDAR' : library ? 'ACTIVITY LIBRARY' : editingSequence ? 'EDIT SEQUENCE' : 'SHARED UNIT SEQUENCE'}</p><h2 ref={editorHeading} tabIndex={-1}>{data.unitName}</h2><p>{library ? 'Explore the available experiences. Add the ones that belong in your unit.' : mode === 'calendar' ? `${selectedClass?.label} · teaching meetings and student deadlines` : editingSequence ? 'Add or remove activities, change their order, and update your teaching notes.' : 'Build the learning story once. Teach it at the right pace for each class.'}</p></div>
        {mode === 'plan' && <div className={s.actions}>
          <button disabled={locked} onClick={()=>setSavedLibrary(true)}>Saved sequences</button>
          {!editingSequence && !library && <button className={s.primary} disabled={locked} onClick={() => openSequenceEditor()}><Pencil size={16} /> Edit sequence</button>}
          {library ? <button onClick={() => setLibrary(false)}><ArrowLeft size={16} /> Back to sequence <span>{steps.length}</span></button> : <button disabled={locked} onClick={() => { setEditingSequence(true); setLibrary(true) }}><Plus size={17} /> Add activities</button>}
          {(editingSequence || dirty) && <button className={s.primary} disabled={locked || !dirty} onClick={() => void saveSequence()}>{busy ? 'Saving…' : dirty ? data.plan ? 'Save changes' : 'Save sequence' : 'Saved'}</button>}
          {editingSequence && <button disabled={locked} onClick={finishEditing}>{dirty ? 'Cancel changes' : 'Done editing'}</button>}
        </div>}
      </div>
      {savedLibrary&&<SavedUnitSequences classId={classId} catalog={data.catalog} used={steps.map(s=>s.activityKey)} onClose={()=>setSavedLibrary(false)} onEdit={openSequenceEditor} onAdd={items=>{setSteps(old=>[...old,...items.map(s=>({...s,id:crypto.randomUUID()}))]);setSavedLibrary(false);setEditingSequence(true);setLibrary(false);setNotice('Saved activities added to your draft. Review and save the sequence.')}}/>}
      {dirty && <div className={s.draft}><span>Unsaved sequence · class plans stay unchanged</span><button disabled={locked} onClick={() => { setSteps(data.plan?.steps ?? []); setNotice('Draft changes discarded.') }}>Discard draft changes</button></div>}
      {mode === 'plan' && (library ? <ActivityLibrary data={data} steps={steps} disabled={locked || steps.length >= 100} onAdd={add} /> : <>
        {!editingSequence && <><Pacing data={data} disabled={locked || dirty} onEdit={setEdit} />
        <div className={s.connections}>
          <div><strong>{work.data ? `${assigned.length} assigned activities in ${selectedClass?.label}` : work.error ? 'Assignment inventory unavailable' : 'Loading existing assignments…'}</strong><p>Your existing assignments keep their student work, grading, and deadlines. Bring matching activities into this unit’s draft.</p></div>
          {availableAssigned.length > 0 && <button disabled={locked || !!work.data?.warnings.length} onClick={() => { setSteps(previous => [...previous, ...availableAssigned.map(a => ({ id: crypto.randomUUID(), activityKey: a.key, title: a.title, kind: a.kind, purpose: '', notes: '', optional: false }))]); setNotice(`Added ${availableAssigned.length} existing activities to the draft. Review the order, then save the sequence.`) }}>Add assigned work ({availableAssigned.length})</button>}
          <Link href={`/admin/control-room?view=calendar&class=${classId}&unit=${unitId}`}>Open calendar & deadlines</Link>
          {work.error && <p role="alert">Assignment inventory could not load. <button onClick={() => void work.load()}>Retry</button></p>}
        </div></>}
        <div className={s.sequenceHeading}><h2>Unit sequence</h2><span>{steps.length} experiences · edit the purpose, order, and teaching notes</span></div>
        <div className={s.sequence}>
          {!steps.length && <div className={s.empty}><FlaskConical size={30} /><h3>What will students experience in this unit?</h3><p>Browse simulations, interactive assignments, readings, paper worksheets with paired quizzes, videos, and practice. Add an activity to start your sequence.</p><button className={s.primary} disabled={locked} onClick={() => { setEditingSequence(true); setLibrary(true) }}><Plus size={16} /> Browse activities</button></div>}
          {steps.map((step, index) => {
            const activity = data.catalog.find(a => a.key === step.activityKey)
            const native = (work.data?.items ?? []).find(item => assignedActivity(item, data.catalog)?.key === step.activityKey)
            const inClass = selectedClass?.state?.steps.some(st => st.id === step.id)
            return <article key={step.id} className={s.step}>
              <div className={s.number}>{String(index + 1).padStart(2, '0')}</div>
              <div className={s.stepBody}><div className={s.meta}><span>{sourcePresentation(activity ?? step).label}</span>{activity?.readingTag && <span className={s.readingTag}>{activity.readingTag}</span>}{activity?.minutes && <span>{activity.minutes} min</span>}{step.optional && <span>Optional</span>}{!activity && <span>Source unavailable</span>}</div><h3>{sourcePresentation(activity ?? step).title}</h3><p className={s.subtle}>{sourcePresentation(activity ?? step).day ? `Course day ${sourcePresentation(activity ?? step).day} · ` : ''}{sourcePresentation(activity ?? step).thinking}</p>
                <label className={s.purpose}><span className={s.srOnly}>Purpose of {step.title}</span><input disabled={locked} value={step.purpose} maxLength={300} onChange={e => change(step.id, { purpose: e.target.value })} placeholder="What should this experience help students understand?" /></label>
                <p className={s.assignmentStatus}>{native?.dueAt && (native.access === 'open' || native.access === 'scheduled') ? 'Assigned · due ' + labelDay(native.dateOnly ? native.dueAt : plannerDay(native.dueAt)) : 'Drag onto the class calendar to assign'}{!inClass && ' · Not yet in this class’s plan'}</p><details className={s.stepDetails}><summary>Notes & connections</summary><label>Teaching notes<textarea value={step.notes} maxLength={2000} disabled={locked} onChange={e => change(step.id, { notes: e.target.value })} /></label><label className={s.check}><input type="checkbox" checked={step.optional} disabled={locked} onChange={e => change(step.id, { optional: e.target.checked })} /> Optional experience</label>{activity && <TargetList activity={activity} data={data} />}</details>
              </div>
              <div className={s.stepActions}>{activity && <><Link href={activity.href} target="_blank" rel="noopener noreferrer">Preview</Link><Teach activity={activity} /></>}<button disabled={locked || dirty || !data.plan} onClick={() => setEdit(inClass ? { action: 'step', courseId: classId, stepId: step.id } : { action: 'apply', courseId: classId })}>{inClass ? 'Assign & schedule' : 'Use in this class'}</button><div className={s.reorder}><button aria-label={`Move ${step.title} earlier`} disabled={locked || index === 0} onClick={() => move(step.id, -1)}><ArrowUp size={16} /></button><button aria-label={`Move ${step.title} later`} disabled={locked || index === steps.length - 1} onClick={() => move(step.id, 1)}><ArrowDown size={16} /></button><button aria-label={`Remove ${step.title} from draft`} disabled={locked} onClick={() => setSteps(previous => previous.filter(p => p.id !== step.id))}><Trash2 size={15} /></button></div></div>
            </article>
          })}
        </div>
        {editingSequence && <div className={s.sequenceFooter}><p>{dirty ? 'Unsaved changes' : 'Sequence saved'} · Class calendars update when you apply the saved version.</p><div className={s.actions}><button disabled={locked} onClick={finishEditing}>{dirty ? 'Cancel changes' : 'Done editing'}</button><button className={s.primary} disabled={locked || !dirty} onClick={() => void saveSequence()}>{busy ? 'Saving…' : data.plan ? 'Save changes' : 'Save sequence'}</button></div></div>}
      </>)}
      {mode === 'calendar' && selectedClass && <>
        <TeachingCalendar key={classId + ":" + unitId} saveError={error} course={selectedClass} data={data} work={work} disabled={locked || dirty} onRefresh={load} onPlace={place} onUnassignDeadline={removeDeadline} onEdit={setEdit} onChangeSequence={() => setChoosingSequence(true)} />
        {choosingSequence && <CalendarSequencePicker catalog={data.catalog} classId={classId} classLabel={selectedClass.label} unitId={unitId} currentCount={(selectedClass.state?.steps ?? data.plan?.steps ?? []).length} onChoose={chooseCalendarSequence} onClose={() => setChoosingSequence(false)} />}
      </>}
      {edit && <PlanEditor key={edit.courseId + ':' + edit.stepId + ':' + edit.action} edit={edit} data={data} disabled={locked} onClose={() => setEdit(null)} error={error} onUnassign={edit.courseId === classId && !!selectedClass?.state?.meetings[edit.stepId ?? ''] && !!work.data && !work.error && !work.data.warnings.length && !work.data.readOnly ? async () => { if (await place(edit.stepId!, null)) setEdit(null) } : undefined} onSave={async body => {
        const course = data.classes.find(c => c.id === edit.courseId)!
        const saved = await mutate({ classId: course.id, version: course.state?.version ?? 0, planVersion: edit.action === 'apply' ? data.plan?.version ?? 0 : course.state?.plan_version ?? 0, ...body }, body.action === 'schedule' ? 'Assigned to the class and due on the selected day.' : body.action === 'assign' ? 'Student assignment saved in the original interactive assignment system.' : body.action === 'position' ? 'Teaching position confirmed. Student grades and deadlines are unchanged.' : body.action === 'apply' ? 'Saved sequence applied to this class. Existing student assignments are unchanged.' : 'Teaching time removed. The student assignment remains available in Assigned work.')
        if (saved) setEdit(null)
      }} />}
    </>}
  </div>
}

function Teach({ activity }: { activity: PlanActivity }) {
  if (!activity.teach.length) return null
  return <details className={s.teach}><summary>Teach</summary><div>{activity.teach.map(link => <Link key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</Link>)}</div></details>
}
function TargetList({ activity, data }: { activity: PlanActivity; data: PlanningData }) {
  const targets = data.targets.filter(t => activity.targetIds.includes(t.id))
  return targets.length ? <ul className={s.targets}>{targets.map(t => <li key={t.id}>{t.statement}</li>)}</ul> : <p className={s.subtle}>No course learning-target mapping is available for this activity.</p>
}
function ActivityLibrary({ data, steps, disabled, onAdd }: { data: PlanningData; steps: PlanStep[]; disabled: boolean; onAdd: (a: PlanActivity) => void }) {
  const [query, setQuery] = useState(''), [kind, setKind] = useState('all'), [scope, setScope] = useState('all'), [target, setTarget] = useState(''), [readingTag, setReadingTag] = useState('')
  const items = data.catalog.filter(a=>matchesSourceType(a,kind)&&matchesLibrary({...a,title:a.title+' '+sourceTitle(a)+' '+sourcePresentation(a).thinking},{query,kind:'',unit:scope==='all'?'':scope==='unit'?data.unitId:scope,target,readingTag},data.targets))
  return <section aria-label="Activity library">
    <div className={s.libraryFilters}><label><span>Search activities</span><div><Search size={16} /><input type="search" placeholder="Motion, friction, a learning target…" value={query} onChange={e => setQuery(e.target.value)} /></div></label><label>Type<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">All types</option>{sourceTypeOptions(data.catalog).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Reading tag<select value={readingTag} onChange={e => setReadingTag(e.target.value)}><option value="">All tags</option>{readingTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}</select></label><label>Browse<select value={scope} onChange={e => setScope(e.target.value)}><option value="unit">This unit</option><option value="all">All available activities</option><option value="unmapped">No unit mapping</option>{[...new Set(data.catalog.flatMap(a=>a.unitIds))].filter(id=>id!==data.unitId).sort().map(id=><option key={id} value={id}>{id.replace('unit-','Unit ')}</option>)}</select></label><label>Learning target<select value={target} onChange={e => setTarget(e.target.value)}><option value="">All targets</option>{data.targets.filter(t => scope==='all'||scope==='unmapped'||t.unit_id===(scope==='unit'?data.unitId:scope)).map(t => <option key={t.id} value={t.id}>{t.statement}</option>)}</select></label></div>
    <p className={s.subtle}>Interactive readings are tagged CPA (Hewitt) or OpenStax.</p>
    <p className={s.subtle}>{items.length} activities · {steps.length} in your sequence</p>
    <div className={s.catalog}>{items.map(a => {
      const added = steps.some(step => step.activityKey === a.key)
      return <article key={a.key} className={s.activity}><div className={s.activityIcon}>{a.kind === 'simulation' ? <FlaskConical size={22} /> : <BookOpen size={22} />}</div><div><div className={s.meta}><span>{sourcePresentation(a).label}</span>{a.readingTag && <span className={s.readingTag}>{a.readingTag}</span>}{a.minutes && <span>{a.minutes} min</span>}<span>{a.availability}</span></div><h3>{sourcePresentation(a).title}</h3><p>{sourcePresentation(a).day ? `Course day ${sourcePresentation(a).day} · ` : ''}{sourcePresentation(a).thinking}</p><p>{a.description}</p><details><summary>Questions & learning targets</summary><TargetList activity={a} data={data} />{a.prompts.length > 0 ? <ol className={s.prompts}>{a.prompts.map((p, i) => <li key={i}>{p}</li>)}</ol> : <p className={s.subtle}>Open the activity to inspect its full content.</p>}</details></div><div className={s.activityActions}><button className={added ? '' : s.primary} disabled={disabled || added} onClick={() => onAdd(a)}>{added ? <Check size={16} /> : <Plus size={16} />}{added ? 'In sequence' : 'Add'}</button><Link href={a.href} target="_blank" rel="noopener noreferrer">Preview</Link><Teach activity={a} /></div></article>
    })}</div>
    {!items.length && <div className={s.empty}><h3>No activities match these filters</h3><button onClick={() => { setQuery(''); setKind('all'); setScope('all'); setTarget(''); setReadingTag('') }}>Browse all available activities</button></div>}
  </section>
}

function Pacing({ data, disabled, onEdit }: { data: PlanningData; disabled: boolean; onEdit: (edit: Edit) => void }) {
  const shared = data.plan?.steps ?? [], today = plannerDay(new Date())
  const columns = [...shared]
  for (const course of data.classes) for (const step of course.state?.steps ?? []) if (!columns.some(s => s.id === step.id)) columns.push(step)
  return <section className={s.pacing} aria-label="Class pacing">
    <div className={s.sectionHeading}><div><p className={s.eyebrow}>SAME UNIT · EACH CLASS’S PACE</p><h2>Where your classes are</h2><p>Filled markers show your confirmed teaching position. Outlined markers show planned meetings.</p></div><span className={s.version}>{data.plan ? `Shared version ${data.plan.version}` : 'Save a sequence to begin'}</span></div>
    <div className={s.paceScroll}><div className={s.paceGrid} style={{ gridTemplateColumns: `minmax(230px, 1.5fr) repeat(${Math.max(columns.length, 1)}, minmax(52px, 1fr))` }}>
      <div className={s.paceKey}>Class / current experience</div>{columns.length ? columns.map((step, index) => <div key={step.id} className={s.paceKey} title={sourceTitle(data.catalog.find(a => a.key === step.activityKey) ?? step)}>{index < shared.length ? String(index + 1).padStart(2, '0') : 'Prior'}</div>) : <div className={s.paceKey}>Sequence</div>}
      {data.classes.map(course => {
        const state = course.state, current = state?.steps.find(st => st.id === state.current_step_id)
        const scheduled = state?.steps.filter(st => !!state.meetings[st.id]) ?? []
        const next = scheduled.map(st => ({ step: st, slot: state!.meetings[st.id] })).filter(item => item.slot.date >= today).sort((a, b) => a.slot.date.localeCompare(b.slot.date) || a.slot.block.localeCompare(b.slot.block))[0]
        return <div key={course.id} className={s.paceRow}>
          <div className={s.classSummary}><strong>{course.label}</strong><p>{current ? sourceTitle(data.catalog.find(a => a.key === current.activityKey) ?? current) : 'Teaching position not confirmed'}</p><small>{next ? `Next: ${labelDay(next.slot.date)} · ${sourceTitle(data.catalog.find(a => a.key === next.step.activityKey) ?? next.step)}` : 'No upcoming teaching time planned'}</small><div><span>{state ? `Using v${state.plan_version}` : 'No sequence applied'}</span><button disabled={disabled || !data.plan || !shared.length || state?.plan_version === data.plan.version} onClick={() => onEdit({ action: 'apply', courseId: course.id })}>{state ? state.plan_version === data.plan?.version ? 'Up to date' : 'Review update' : 'Use sequence'}</button></div>{course.scheduleIssue && <small className={s.warningText}>{course.scheduleIssue} <Link href={'/admin/control-room?view=pacing&class=' + course.id}>Pacing &amp; meeting pattern</Link></small>}</div>
          {columns.length ? columns.map(step => {
            const own = state?.steps.find(st => st.id === step.id), slot = state?.meetings[step.id], confirmed = state?.current_step_id === step.id
            return <div key={step.id} className={s.paceCell}><button className={confirmed ? s.confirmed : slot ? s.scheduled : s.unplanned} disabled={disabled || !own} aria-label={`${course.label}: ${step.title}${confirmed ? ', confirmed teaching position' : slot ? ', planned ' + labelDay(slot.date) : ', not scheduled'}`} title={sourceTitle(data.catalog.find(a => a.key === step.activityKey) ?? step)} onClick={() => onEdit({ action: 'step', courseId: course.id, stepId: step.id })}>{confirmed ? <Check size={17} /> : slot ? <CalendarDays size={15} /> : '·'}</button><small>{slot ? labelDay(slot.date) : own ? '—' : ''}</small></div>
          }) : <div className={s.paceCell}>—</div>}
        </div>
      })}
    </div></div>
  </section>
}

function TeachingCalendar({ course, data, work, disabled, saveError, onPlace, onUnassignDeadline, onEdit, onChangeSequence, onRefresh }: { course: PlanningClass; data: PlanningData; work: ReturnType<typeof useClassWork>; disabled: boolean; saveError: string; onPlace: (id: string, slot: TeachingSlot | null) => Promise<boolean>; onUnassignDeadline: (assignment: CalendarAssignment) => Promise<boolean>; onEdit: (e: Edit) => void; onChangeSequence: () => void; onRefresh: () => Promise<void> }) {
  const today = plannerDay(new Date()), [week, setWeek] = useState(() => teachingWeek(today)[0]), [selected, setSelected] = useState('')
  const [weekCount, setWeekCount] = useState<1 | 2>(2)
  const weeks = teachingWeeks(week, weekCount), through = weeks[weekCount - 1][6]
  const [weekMeetings, setWeekMeetings] = useState<{ week: string; through: string; meetings: PlanningClass['meetings']; issue: string | null } | null>(null), [meetingError, setMeetingError] = useState(''), [retry, setRetry] = useState(0)
  useEffect(() => {
    const abort = new AbortController()
    setMeetingError('')
    void fetch(`/api/teaching-plans?view=meetings&class=${encodeURIComponent(course.id)}&unit=${encodeURIComponent(data.unitId)}&from=${week}&through=${through}`, { signal: abort.signal }).then(async response => { const reply = await response.json(); if (!response.ok) throw Error(reply.error || 'Could not load the class meetings.'); if (!abort.signal.aborted) setWeekMeetings({ week, through, meetings: reply.meetings, issue: reply.scheduleIssue ?? reply.issue ?? null }) }).catch(error => { if (!abort.signal.aborted) setMeetingError(error.message) })
    return () => abort.abort()
  }, [course.id, data.unitId, week, through, retry])
  const ready = weekMeetings?.week === week && weekMeetings.through === through && !meetingError
  const issue = weekMeetings?.issue || course.scheduleIssue
  const state = course.state, steps = state?.steps ?? data.plan?.steps ?? [], canDrag = !disabled && !!data.plan, canPlace = canDrag && !issue && !!ready
  const canUnassign = canDrag && !!work.data && !work.error && !work.data.warnings.length && !work.data.readOnly
  const canRemove = (id: string) => canUnassign && !!state?.meetings[id]
  const remove = (id: string) => { if (canRemove(id)) { setSelected(''); void onPlace(id, null) } }
  const pointer = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null), suppressClick = useRef(false)
  const [dragging, setDragging] = useState(false), [over, setOver] = useState(''), [point, setPoint] = useState({ x: 0, y: 0 })
  const calendarRef = useRef<HTMLElement>(null)
  const [dayDetails, setDayDetails] = useState<string | null>(null)
  const [dateEdit, setDateEdit] = useState<ClassWorkItem | null>(null)
  const [removal, setRemoval] = useState<{ step?: PlanStep; assignment?: CalendarAssignment } | null>(null)
  const removalSource = removal?.step ? data.catalog.find(a => a.key === removal.step!.activityKey) ?? removal.step : removal?.assignment ? data.catalog.find(a => a.key === 'interactive:' + removal.assignment!.slug) ?? { kind: 'interactive', sourceId: removal.assignment.slug, title: removal.assignment.slug } : null
  async function confirmRemoval() {
    if (disabled || !removal) return
    const removed = removal.assignment ? await onUnassignDeadline(removal.assignment) : removal.step ? await onPlace(removal.step.id, null) : false
    if (removed) { setRemoval(null); setSelected('') }
  }
  const selectDrop = (id: string, slot: TeachingSlot) => { if (canPlace && steps.some(st => st.id === id)) { setSelected(''); void onPlace(id, slot) } }
  const targetAt = (event: PointerEvent<HTMLButtonElement>) => {
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-teaching-drop]')
    return element && calendarRef.current?.contains(element) ? element.dataset.teachingDrop ?? '' : ''
  }
  const endDrag = () => { pointer.current = null; setDragging(false); setOver('') }
  function pointerStart(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (!canDrag || event.button !== 0 || event.pointerType === 'touch' && !(event.target as Element).closest('[data-drag-handle]')) return
    suppressClick.current = false; pointer.current = { id, x: event.clientX, y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = pointer.current
    if (!current || !canDrag || !current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 7) return
    event.preventDefault(); current.moved = true; setDragging(true); setPoint({ x: event.clientX, y: event.clientY }); setOver(targetAt(event))
  }
  function pointerEnd(event: PointerEvent<HTMLButtonElement>) {
    const current = pointer.current, target = targetAt(event); endDrag()
    if (current?.moved) { suppressClick.current = true; if (target === 'unassign') remove(current.id); else if (target) { const [date, block] = target.split('|'); selectDrop(current.id, { date, block }) } }
  }
  function renderDay(day: string, detail = false) {
          const meetings = ready ? weekMeetings.meetings.filter(m => m.date === day) : [], planned = steps.filter(st => {
            if (!state?.meetings[st.id]) return false
            const item = work.data?.items.find(i => assignedActivity(i, data.catalog)?.key === st.activityKey)
            const date = item?.sequenceRole && item.dueAt && (item.access === 'open' || item.access === 'scheduled') ? item.dateOnly ? item.dueAt : plannerDay(item.dueAt) : state.meetings[st.id].date
            return date === day
          })
          const shownKeys = new Set(planned.map(st => st.activityKey))
          const deadlines = data.assignments.filter(a => a.course_id === course.id && a.due_on === day && !shownKeys.has('interactive:' + a.slug))
          const otherDeadlines = (work.data?.items ?? []).filter(item => item.kind !== 'interactive' && !shownKeys.has(assignedActivity(item, data.catalog)?.key ?? '') && (item.access === 'open' || item.access === 'scheduled') && item.dueAt && (item.dateOnly ? item.dueAt : plannerDay(item.dueAt)) === day)
          return <div key={day} data-teaching-drop={canPlace && meetings.length === 1 ? day + '|' + meetings[0].block : undefined} data-over={over.startsWith(day + '|') || undefined} id={detail ? undefined : 'teaching-day-' + day} className={`${s.day} ${detail ? s.dayDetail : ''} ${selected ? s.placing : ''} ${day === today ? s.today : ''}`}><div className={s.dayHeading}><h4 className={s.dayNumber}><button type="button" className={s.dayOpen} onClick={() => setDayDetails(day)} disabled={detail} aria-label={'View assignments for ' + new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {weekday:'long',month:'short',day:'numeric',timeZone:'UTC'})}><time dateTime={day} aria-current={day === today ? 'date' : undefined}><span>{new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</span><strong>{labelDay(day)}</strong></time></button></h4>
            {meetings.map(slot => <button key={slot.block} className={s.meeting} disabled={!canPlace} data-teaching-drop={day + '|' + slot.block} data-over={over === day + '|' + slot.block || undefined} onClick={() => selectDrop(selected, slot)} aria-label={`Place activity on ${labelDay(day)}, ${slot.block} block`}>{slot.block} block{slot.long ? ' · long' : ''}</button>)}
            {!meetings.length && <small className={s.noMeeting}>{ready ? issue ? 'Schedule needs setup' : 'No class meeting' : 'Loading meetings'}</small>}</div>{!detail && <button className={s.dayCount} onClick={() => setDayDetails(day)} aria-label={'View ' + (planned.length + deadlines.length + otherDeadlines.length) + ' assignments for ' + labelDay(day)}><strong>{planned.length + deadlines.length + otherDeadlines.length}</strong><span>items</span></button>}<div className={s.dayActivities}>
            {!planned.length && !deadlines.length && !otherDeadlines.length && <p className={s.emptyDay}>No activities scheduled</p>}
            {planned.map(st => {
              const item = (work.data?.items ?? []).find(i => assignedActivity(i, data.catalog)?.key === st.activityKey)
              const dueHere = item?.dueAt && (item.dateOnly ? item.dueAt : plannerDay(item.dueAt)) === day && (item.access === 'open' || item.access === 'scheduled')
              return <article key={st.id} className={s.scheduledCard}><button className={s.plannedCard} draggable={false} disabled={!canDrag} onPointerDown={e => pointerStart(e, st.id)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } setDayDetails(null); onEdit({ action: 'step', courseId: course.id, stepId: st.id }) }}><GripVertical size={14} data-drag-handle /><span><AssignmentIdentity source={data.catalog.find(a => a.key === st.activityKey) ?? st} layout="card"/><small>{state!.meetings[st.id].date === day ? state!.meetings[st.id].block + ' block · ' : ''}{dueHere ? 'Assigned · due ' + labelDay(day) : 'Teaching plan · select to assign'}</small></span></button><div className={s.cardActions}><button className={s.moveAction} disabled={!canPlace} aria-pressed={selected === st.id} onClick={() => { setDayDetails(null); setSelected(st.id) }} aria-label={'Move ' + sourceTitle(data.catalog.find(a => a.key === st.activityKey) ?? st)}><CalendarDays size={13} aria-hidden="true"/>Move</button>{item?.canEditDue && item.sequenceRole && <button className={s.moveAction} disabled={disabled} onClick={() => { setDayDetails(null); setDateEdit(item) }} aria-label={'Edit date for ' + sourceTitle(item)}>Edit date</button>}<button className={s.removeAction} disabled={!canRemove(st.id)} onClick={() => { setDayDetails(null); setRemoval({ step: st }) }} aria-label={'Remove ' + sourceTitle(data.catalog.find(a => a.key === st.activityKey) ?? st) + ' from calendar'} title="Remove from calendar"><Trash2 size={13} aria-hidden="true"/>Remove</button></div></article>
            })}
            {deadlines.map(a => {
              const activity = data.catalog.find(item => item.key === 'interactive:' + a.slug), title = activity?.title ?? a.slug, editable = work.data?.items.find(item => item.kind === 'interactive' && item.sourceId === a.slug && item.canEditDue)
              return <article className={s.scheduledCard} key={a.id}><Link className={s.deadline} href={activity?.href ?? '/interactive-assignments/' + a.slug} target="_blank" rel="noopener noreferrer" aria-label={`Student preview: ${title} (opens in a new tab)`}><AssignmentIdentity source={activity ?? {kind:'interactive',sourceId:a.slug,title}} layout="card"/><small>Due {labelDay(day)}</small></Link>{editable && <button className={s.removeAction} disabled={disabled} onClick={() => { setDayDetails(null); setDateEdit(editable) }} aria-label={'Edit date for ' + sourceTitle(editable)}>Edit date</button>}<button className={s.removeAction} disabled={disabled} onClick={() => { setDayDetails(null); setRemoval({ assignment: a }) }} aria-label={'Remove ' + sourceTitle(activity ?? {kind:'interactive',sourceId:a.slug,title}) + ' from calendar'} title="Remove from calendar"><Trash2 size={13} aria-hidden="true"/>Remove</button></article>
            })}
            {otherDeadlines.map(item => <article className={s.scheduledCard} key={item.id}><Link className={s.deadline} href={item.href}><AssignmentIdentity source={item} layout="card"/><small>Due {labelDay(day)}</small></Link>{item.canEditDue && item.sequenceRole && <button className={s.removeAction} disabled={disabled} onClick={() => { setDayDetails(null); setDateEdit(item) }} aria-label={'Edit date for ' + sourceTitle(item)}>Edit date</button>}</article>)}
            </div>
          </div>
  }
  return <section ref={calendarRef} className={s.calendar} aria-label="Teaching calendar" onKeyDown={event => { if (event.key === 'Escape') { suppressClick.current = true; endDrag(); setSelected('') } }}>
    {work.error && <p className={s.error} role="alert">Other assignment deadlines could not load. <button onClick={() => void work.load()}>Retry deadlines</button></p>}
    {!!work.data?.warnings.length && <details className={s.warning}><summary>Some assignment deadlines could not load</summary>{work.data.warnings.map(w => <p key={w}>{w}</p>)}</details>}
    {!steps.length && <div className={s.empty}><h3>Build your course sequence</h3><p>Add activities in Plan, then drag them onto this calendar to assign them.</p><Link href={'/admin/control-room?view=plan&class=' + course.id + '&unit=' + data.unitId}>Build sequence</Link></div>}
    {course.scheduleIssue && <p className={s.warning}>{course.scheduleIssue} <Link href={'/admin/control-room?view=pacing&class=' + course.id}>Set the meeting pattern</Link></p>}
    {meetingError && <p role="alert" className={s.error}>{meetingError} <button onClick={() => setRetry(n => n + 1)}>Retry meetings</button></p>}
    {!ready && !meetingError && <p role="status" className={s.subtle}>Loading calendar meetings…</p>}
    <>
      <div className={s.calendarHeading}><div><h3>Assign from your course sequence</h3><p>Drag an activity to a class block, or choose Move and then its new block. Open a date to read its cards in a larger view.</p></div><div className={s.calendarNavigation}><div className={s.viewSwitch} role="group" aria-label="Calendar view"><button type="button" aria-pressed={weekCount === 1} onClick={() => { setDayDetails(null); setWeekCount(1) }}>1 week</button><button type="button" aria-pressed={weekCount === 2} onClick={() => { setDayDetails(null); setWeekCount(2) }}>2 weeks</button></div><div className={s.month}><button aria-label="Previous week" onClick={() => setWeek(shiftDay(week, -7))}><ChevronLeft size={18} /></button><strong>{labelDay(week)} – {labelDay(through)}</strong><button aria-label="Next week" onClick={() => setWeek(shiftDay(week, 7))}><ChevronRight size={18} /></button><button onClick={() => setWeek(teachingWeek(today)[0])}>This week</button></div></div></div>
      <div className={s.sequenceControls}><p><strong>{data.unitName}</strong><span>{steps.length} activities in {course.label}’s sequence</span></p><button type="button" disabled={disabled} onClick={() => { setSelected(''); onChangeSequence() }}>Change sequence</button></div>
      {state && data.plan && state.plan_version !== data.plan.version && <div className={s.notice}><p>This class is using an earlier sequence with {steps.length} activities. The saved sequence has {data.plan.steps.length}.</p><button type="button" disabled={disabled} onClick={() => { setSelected(''); onEdit({ action: 'apply', courseId: course.id }) }}>Use saved sequence</button></div>}
      <div className={s.calendarTools}><details className={s.sequencePicker}><summary>Choose an activity from the sequence ({steps.length})</summary><div className={s.shelf} aria-label="Course sequence activities">{steps.map((step, i) => <button key={step.id} draggable={false} disabled={!canPlace} aria-pressed={selected === step.id} onPointerDown={e => pointerStart(e, step.id)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } setSelected(selected === step.id ? '' : step.id) }}><GripVertical size={14} data-drag-handle /><span><span className={s.sequenceNumber}>Step {i + 1}</span><AssignmentIdentity source={data.catalog.find(a => a.key === step.activityKey) ?? step} layout="card"/><small>{state?.meetings[step.id] ? `Scheduled ${labelDay(state.meetings[step.id].date)}` : 'Drag to assign'}</small></span></button>)}</div></details>
        <button className={s.unassignDrop} data-teaching-drop={canUnassign ? 'unassign' : undefined} data-over={over === 'unassign' && canRemove(pointer.current?.id ?? '') || undefined} disabled={!canUnassign} onClick={() => remove(selected)} aria-label="Unassign selected activity"><ArrowLeft size={18} /><span><strong>Unassign</strong><small>{selected && canRemove(selected) ? 'Return selected activity to the sequence' : 'Drag a scheduled card here'}</small></span></button>
      </div>
      {dragging && <div className={s.dragGhost} style={{ left: point.x + 14, top: point.y + 14 }}>{over === 'unassign' && canRemove(pointer.current?.id ?? '') ? 'Drop to unassign · student work stays saved' : 'Drop on a class day to assign'}</div>}
      {selected && <p role="status" className={`${s.notice} ${s.placementNotice}`}>Choose a class block for {steps.find(st => st.id === selected)?.title}. You can choose either visible week or navigate to another week. It will be assigned and due that day.{canRemove(selected) && ' Or choose Unassign to take it off the calendar.'} <button onClick={() => setSelected('')}>Cancel placement</button></p>}
      <p className={s.smallCalendarHint}>{selected ? 'Tap a day, then choose a class block to move the activity.' : 'Tap a day to read its assignments.'}</p>
      <div className={s.calendarWeeks} role="region" aria-label={weekCount === 2 ? 'Teaching two-week calendar' : 'Teaching week calendar'}>
        {weeks.map(days => <section key={days[0]} aria-label={'Week of ' + labelDay(days[0])}><h4 className={s.weekLabel}>{labelDay(days[0])} – {labelDay(days[6])}</h4><div className={s.calendarGrid}>{days.map(day => renderDay(day))}</div></section>)}
      </div>
      <p className={s.subtle}>Activities are due on the day you choose, at 11:59 PM Eastern. New discussions schedule their review and quiz three school days later. For existing linked activities, review the dates and confirm either an individual date override or the normal linked spacing. Spacing skips weekends and saved no-school dates. Removing either lesson unassigns the whole group while preserving student work. Worksheet quizzes follow the next Monday, Wednesday, or Friday, keeping any later quiz spacing when moved. Reading quizzes keep their existing unlock and scheduling rules. Use Student choice to offer a menu instead of assigning work to the whole class.</p>
    </>
    {dateEdit && <WorkEditor edit={{ item: dateEdit, action: 'due' }} classId={course.id} onClose={() => setDateEdit(null)} onSaved={async () => { setDateEdit(null); await Promise.all([work.load(), onRefresh()]) }} />}
    {dayDetails && <Dialog open onOpenChange={open => { if (!open) setDayDetails(null) }}><DialogContent className={`${s.dialog} ${s.dayDialog}`}><DialogTitle>Assignments · {labelDay(dayDetails)}</DialogTitle><DialogDescription>{course.label} · Full assignment titles and thinking prompts</DialogDescription>{renderDay(dayDetails, true)}</DialogContent></Dialog>}
    {removal && removalSource && <Dialog open onOpenChange={open => { if (!open && !disabled) setRemoval(null) }}><DialogContent className={s.dialog}><DialogTitle>Remove from calendar?</DialogTitle><DialogDescription>Remove this assignment from {course.label}. Linked activities are unassigned together. Saved student work and grades are kept.</DialogDescription><AssignmentIdentity source={removalSource} layout="card"/>{saveError && <p className={s.error} role="alert">{saveError}</p>}<div className={s.actions}><button disabled={disabled} onClick={() => setRemoval(null)}>Cancel</button><button className={s.primary} disabled={disabled} onClick={() => void confirmRemoval()}>{disabled ? 'Removing…' : 'Remove from calendar'}</button></div></DialogContent></Dialog>}
    <details className={s.assignedWork}><summary>All assigned work & access settings</summary><p>Manage existing assignments through their original access and grading settings.</p><ClassAssignedWork classId={course.id} resource={work} onChanged={onRefresh} /></details>
  </section>
}

function PlanEditor({ edit, data, disabled, error, onClose, onSave, onUnassign }: { edit: Edit; data: PlanningData; disabled: boolean; error: string; onClose: () => void; onUnassign?: () => Promise<void>; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const course = data.classes.find(c => c.id === edit.courseId)!, state = course.state, step = state?.steps.find(st => st.id === edit.stepId)
  const activity = data.catalog.find(a => a.key === step?.activityKey), assignment = data.assignments.find(a => a.course_id === course.id && 'interactive:' + a.slug === step?.activityKey)
  const [tab, setTab] = useState<'meeting' | 'assignment' | 'position'>('meeting'), [slot, setSlot] = useState(state?.meetings[step?.id ?? ''] ? JSON.stringify(state.meetings[step!.id]) : ''), [due, setDue] = useState(assignment?.due_on ?? '')
  const changes = planChanges(state?.steps ?? [], data.plan?.steps ?? [])
  const currentSlot = state?.meetings[step?.id ?? ''], options = course.meetings.map(m => ({ date: m.date, block: m.block }))
  const dirty = due !== (assignment?.due_on ?? '') || slot !== (currentSlot ? JSON.stringify(currentSlot) : '')
  useAssessmentReviewGuard(dirty)
  if (currentSlot && !options.some(o => o.date === currentSlot.date && o.block === currentSlot.block)) options.unshift(currentSlot)
  return <Dialog open onOpenChange={open => { if (!open && !disabled && (!dirty || window.confirm('Discard unsaved class activity changes?'))) onClose() }}><DialogContent className={s.dialog} onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => { if (disabled) e.preventDefault() }}><DialogTitle>{edit.action === 'apply' ? 'Use the saved sequence' : step ? sourceTitle(activity ?? step) : ''}</DialogTitle><DialogDescription>{course.label}</DialogDescription>{error && <p className={s.error} role="alert">{error}</p>}
    {edit.action === 'apply' ? <><p><strong>{data.unitName}</strong> · {data.plan?.steps.length} activities</p><p>Replace this class’s carousel with saved version {data.plan?.version}: {changes.added} added, {changes.removed} removed{changes.reordered ? ', order changed' : ''}.</p><p>Existing meetings stay attached to matching steps. Student assignments, deadlines, responses, and grades stay saved. Other classes keep their current sequence.</p><div className={s.actions}><button type="button" disabled={disabled} onClick={onClose}>Cancel</button><button type="button" className={s.primary} disabled={disabled} onClick={() => void onSave({ action: 'apply' })}>Use sequence in {course.label}</button></div></> : step && <>
      <div className={s.editorTabs} role="group" aria-label="Class activity settings">{(['meeting', 'assignment', 'position'] as const).map(key => <button key={key} aria-pressed={key === tab} onClick={() => setTab(key)}>{key === 'meeting' ? 'Assign & schedule' : key === 'assignment' ? 'More settings' : 'Teaching position'}</button>)}</div>
      {tab === 'meeting' && <><p>Choose a class day. This assigns the activity to this class, due that day at 11:59 PM Eastern. You can also drag it from the course sequence onto the calendar.</p>{activity?.kind === 'worksheet' && <p>A paper worksheet also assigns its paired quiz on the next Monday, Wednesday, or Friday. Moving it keeps any later quiz spacing. Unassigning withdraws both and preserves saved work.</p>}<label>Class meeting<select disabled={disabled || !!course.scheduleIssue} value={slot} onChange={e => setSlot(e.target.value)}><option value="">Choose a class day…</option>{options.map(m => <option key={m.date + m.block} value={JSON.stringify(m)}>{labelDay(m.date)} · {m.block} block</option>)}</select></label>{course.scheduleIssue && <p className={s.warning}>{course.scheduleIssue}</p>}<button className={s.primary} disabled={disabled || !!course.scheduleIssue || !slot} onClick={() => void onSave({ action: 'schedule', stepId: step.id, slot: JSON.parse(slot) })}>Assign & schedule</button>{onUnassign && <button disabled={disabled} onClick={() => void onUnassign()}>Unassign from calendar</button>}</>}
      {tab === 'assignment' && (activity?.scheduling === 'interactive' ? <form className={s.editorForm} onSubmit={event => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get('dueOn') ?? ''); void onSave({ action: 'assign', stepId: step.id, dueOn: value || null, expectedId: assignment?.id ?? null, expectedDue: assignment?.due_on ?? null }) }}><p>{assignment ? 'This class already has this assignment. Updating its deadline keeps the same student work and grading.' : 'Make this activity available to the class in the interactive assignment system. Its existing Claude assessment and teacher mastery review stay in place.'}</p><label>Student due date<input name="dueOn" type="date" value={due} disabled={disabled} onChange={e => setDue(e.target.value)} /></label><small>A calendar date assigns this activity. Clear its date to unassign it; student work stays saved.</small><button type="submit" className={s.primary} disabled={disabled}>{due ? 'Assign on calendar' : 'Unassign activity'}</button></form> : <><p>{activity?.courseId && activity.courseId !== course.id ? 'This activity comes from another section. Open this class’s settings to use its existing copy or prepare one with the native assignment tools.' : activity?.availability ?? 'This source could not load. Retry before changing its assignment.'}</p><p>Use the original assignment settings for access, audiences, linked reading activities, and supported dates.</p>{activity && <Link href={assignmentSettingsHref(activity, course.id)}>Open assignment settings for this class</Link>}</>)}
      {tab === 'position' && <><p>Mark this as the experience you are currently teaching. This is a teacher confirmation, separate from student completion and mastery.</p>{state?.confirmed_at && <p className={s.subtle}>Last confirmed {new Date(state.confirmed_at).toLocaleDateString()}.</p>}<button className={s.primary} disabled={disabled} onClick={() => void onSave({ action: 'position', stepId: step.id })}>We are teaching this now</button></>}
    </>}
  </DialogContent></Dialog>
}
