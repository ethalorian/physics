'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, FlaskConical, GripVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { canChangeAssessmentScope, useAssessmentReviewGuard } from '@/components/admin/useAssessmentReviewGuard'
import ClassAssignedWork from '@/components/admin/ClassAssignedWork'
import { useClassWork } from '@/components/admin/useClassWork'
import { calendarDays, plannerDay, shiftDay } from '@/lib/reading-planner'
import { assignedActivity, assignmentSettingsHref, kindLabel, planChanges } from '@/lib/teaching-plans/model'
import { workIsAssigned } from '@/lib/class-work'
import type { PlanActivity, PlanStep, PlanningClass, PlanningData, TeachingSlot } from '@/lib/teaching-plans/types'
import { activityLabels, matchesLibrary, readingTags } from '@/lib/activity-library'
import SavedUnitSequences from './SavedUnitSequences'
import s from './UnitPlanningWorkspace.module.css'

const labelDay = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
type Edit = { courseId: string; stepId?: string; action: 'apply' | 'step' }
async function request(body: unknown) {
  const response = await fetch('/api/teaching-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json()
  if (!response.ok) throw Error(data.error || 'Could not save this change.')
  return data
}

export default function UnitPlanningWorkspace({ classId, unitId, mode }: { classId: string | null; unitId: string; mode: 'plan' | 'calendar' }) {
  if (!classId) return <div className={s.empty}><BookOpen size={28} /><h2>Start with a class</h2><p>Choose a class above to assemble its unit and compare the pace of your other sections.</p></div>
  if (['auto', 'all', 'unmapped'].includes(unitId)) return <div className={s.empty}><h2>Choose a unit</h2><p>Select a course unit above to open its shared sequence.</p></div>
  return <Workspace key={classId + ':' + unitId} classId={classId} unitId={unitId} mode={mode} />
}

function Workspace({ classId, unitId, mode }: { classId: string; unitId: string; mode: 'plan' | 'calendar' }) {
  const router = useRouter(), search = useSearchParams()
  const [editingSequence, setEditingSequence] = useState(search.get('edit') === 'sequence')
  const editorHeading = useRef<HTMLHeadingElement>(null)
  const [data, setData] = useState<PlanningData | null>(null), [steps, setSteps] = useState<PlanStep[]>([])
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [savedLibrary,setSavedLibrary]=useState(false)
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
  const assigned = (work.data?.items ?? []).filter(workIsAssigned)
  const availableAssigned = data ? [...new Map(assigned.map(item => assignedActivity(item, data.catalog)).filter((a): a is PlanActivity => !!a && a.unitIds.includes(unitId) && !steps.some(st => st.activityKey === a.key)).map(a => [a.key, a])).values()].slice(0, Math.max(0, 100 - steps.length)) : []
  async function mutate(body: Record<string, unknown>, message: string) {
    if (saving.current || locked) return false
    saving.current = true; setBusy(true); setError(''); setNotice('')
    try {
      await request({ unitId, classId, ...body }); await load(); await work.load(); setNotice(message); return true
    } catch (e) { setError((e as Error).message); return false }
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
  const add = (a: PlanActivity) => { setSteps(previous => [...previous, { id: crypto.randomUUID(), activityKey: a.key, title: a.title, kind: a.kind, purpose: '', notes: '', optional: false }]); setNotice(`Added ${a.title} to the draft sequence.`) }
  if (loading && !data) return <p role="status" className={s.empty}>Loading activities and class schedules…</p>
  return <div className={s.root}>
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
          {!steps.length && <div className={s.empty}><FlaskConical size={30} /><h3>What will students experience in this unit?</h3><p>Browse simulations, interactive assignments, readings, quizzes, videos, and practice. Add an activity to start your sequence.</p><button className={s.primary} disabled={locked} onClick={() => { setEditingSequence(true); setLibrary(true) }}><Plus size={16} /> Browse activities</button></div>}
          {steps.map((step, index) => {
            const activity = data.catalog.find(a => a.key === step.activityKey)
            const native = (work.data?.items ?? []).find(item => assignedActivity(item, data.catalog)?.key === step.activityKey)
            const inClass = selectedClass?.state?.steps.some(st => st.id === step.id)
            return <article key={step.id} className={s.step}>
              <div className={s.number}>{String(index + 1).padStart(2, '0')}</div>
              <div className={s.stepBody}><div className={s.meta}><span>{activityLabels[activity?.format??step.kind]??kindLabel[step.kind]}</span>{activity?.readingTag && <span className={s.readingTag}>{activity.readingTag}</span>}{activity?.minutes && <span>{activity.minutes} min</span>}{step.optional && <span>Optional</span>}{!activity && <span>Source unavailable</span>}</div><h3>{step.title}</h3>
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
        <TeachingCalendar course={selectedClass} data={data} work={work} disabled={locked || dirty} onPlace={place} onEdit={setEdit} />
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
  const items = data.catalog.filter(a=>matchesLibrary(a,{query,kind:kind==='all'?'':kind,unit:scope==='all'?'':scope==='unit'?data.unitId:scope,target,readingTag},data.targets))
  return <section aria-label="Activity library">
    <div className={s.libraryFilters}><label><span>Search activities</span><div><Search size={16} /><input type="search" placeholder="Motion, friction, a learning target…" value={query} onChange={e => setQuery(e.target.value)} /></div></label><label>Type<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">All types</option>{Object.entries({...kindLabel,'interactive-reading':'Interactive reading','graphic-novel':'Graphic novel response'}).filter(([key]) => key !== 'reading').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Reading tag<select value={readingTag} onChange={e => setReadingTag(e.target.value)}><option value="">All tags</option>{readingTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}</select></label><label>Browse<select value={scope} onChange={e => setScope(e.target.value)}><option value="unit">This unit</option><option value="all">All available activities</option><option value="unmapped">No unit mapping</option>{[...new Set(data.catalog.flatMap(a=>a.unitIds))].filter(id=>id!==data.unitId).sort().map(id=><option key={id} value={id}>{id.replace('unit-','Unit ')}</option>)}</select></label><label>Learning target<select value={target} onChange={e => setTarget(e.target.value)}><option value="">All targets</option>{data.targets.filter(t => scope==='all'||scope==='unmapped'||t.unit_id===(scope==='unit'?data.unitId:scope)).map(t => <option key={t.id} value={t.id}>{t.statement}</option>)}</select></label></div>
    <p className={s.subtle}>Interactive readings are tagged CPA (Hewitt) or OpenStax.</p>
    <p className={s.subtle}>{items.length} activities · {steps.length} in your sequence</p>
    <div className={s.catalog}>{items.map(a => {
      const added = steps.some(step => step.activityKey === a.key)
      return <article key={a.key} className={s.activity}><div className={s.activityIcon}>{a.kind === 'simulation' ? <FlaskConical size={22} /> : <BookOpen size={22} />}</div><div><div className={s.meta}><span>{activityLabels[a.format??a.kind]??kindLabel[a.kind]}</span>{a.readingTag && <span className={s.readingTag}>{a.readingTag}</span>}{a.minutes && <span>{a.minutes} min</span>}<span>{a.availability}</span></div><h3>{a.title}</h3><p>{a.description}</p><details><summary>Questions & learning targets</summary><TargetList activity={a} data={data} />{a.prompts.length > 0 ? <ol className={s.prompts}>{a.prompts.map((p, i) => <li key={i}>{p}</li>)}</ol> : <p className={s.subtle}>Open the activity to inspect its full content.</p>}</details></div><div className={s.activityActions}><button className={added ? '' : s.primary} disabled={disabled || added} onClick={() => onAdd(a)}>{added ? <Check size={16} /> : <Plus size={16} />}{added ? 'In sequence' : 'Add'}</button><Link href={a.href} target="_blank" rel="noopener noreferrer">Preview</Link><Teach activity={a} /></div></article>
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
      <div className={s.paceKey}>Class / current experience</div>{columns.length ? columns.map((step, index) => <div key={step.id} className={s.paceKey} title={step.title}>{index < shared.length ? String(index + 1).padStart(2, '0') : 'Prior'}</div>) : <div className={s.paceKey}>Sequence</div>}
      {data.classes.map(course => {
        const state = course.state, current = state?.steps.find(st => st.id === state.current_step_id)
        const scheduled = state?.steps.filter(st => !!state.meetings[st.id]) ?? []
        const next = scheduled.map(st => ({ step: st, slot: state!.meetings[st.id] })).filter(item => item.slot.date >= today).sort((a, b) => a.slot.date.localeCompare(b.slot.date) || a.slot.block.localeCompare(b.slot.block))[0]
        return <div key={course.id} className={s.paceRow}>
          <div className={s.classSummary}><strong>{course.label}</strong><p>{current ? current.title : 'Teaching position not confirmed'}</p><small>{next ? `Next: ${labelDay(next.slot.date)} · ${next.step.title}` : 'No upcoming teaching time planned'}</small><div><span>{state ? `Using v${state.plan_version}` : 'No sequence applied'}</span><button disabled={disabled || !data.plan || !shared.length || state?.plan_version === data.plan.version} onClick={() => onEdit({ action: 'apply', courseId: course.id })}>{state ? state.plan_version === data.plan?.version ? 'Up to date' : 'Review update' : 'Use sequence'}</button></div>{course.scheduleIssue && <small className={s.warningText}>{course.scheduleIssue} <Link href={'/admin/control-room?view=pacing&class=' + course.id}>Pacing &amp; meeting pattern</Link></small>}</div>
          {columns.length ? columns.map(step => {
            const own = state?.steps.find(st => st.id === step.id), slot = state?.meetings[step.id], confirmed = state?.current_step_id === step.id
            return <div key={step.id} className={s.paceCell}><button className={confirmed ? s.confirmed : slot ? s.scheduled : s.unplanned} disabled={disabled || !own} aria-label={`${course.label}: ${step.title}${confirmed ? ', confirmed teaching position' : slot ? ', planned ' + labelDay(slot.date) : ', not scheduled'}`} title={step.title} onClick={() => onEdit({ action: 'step', courseId: course.id, stepId: step.id })}>{confirmed ? <Check size={17} /> : slot ? <CalendarDays size={15} /> : '·'}</button><small>{slot ? labelDay(slot.date) : own ? '—' : ''}</small></div>
          }) : <div className={s.paceCell}>—</div>}
        </div>
      })}
    </div></div>
  </section>
}

function TeachingCalendar({ course, data, work, disabled, onPlace, onEdit }: { course: PlanningClass; data: PlanningData; work: ReturnType<typeof useClassWork>; disabled: boolean; onPlace: (id: string, slot: TeachingSlot | null) => Promise<boolean>; onEdit: (e: Edit) => void }) {
  const today = plannerDay(new Date()), [month, setMonth] = useState(today.slice(0, 7) + '-01'), [selected, setSelected] = useState('')
  const [monthMeetings, setMonthMeetings] = useState<{ month: string; meetings: PlanningClass['meetings']; issue: string | null } | null>(null), [meetingError, setMeetingError] = useState(''), [retry, setRetry] = useState(0)
  useEffect(() => {
    const abort = new AbortController(), days = calendarDays(month)
    setMeetingError('')
    void fetch(`/api/teaching-plans?view=meetings&class=${encodeURIComponent(course.id)}&unit=${encodeURIComponent(data.unitId)}&from=${days[0]}&through=${days[days.length - 1]}`, { signal: abort.signal }).then(async response => { const reply = await response.json(); if (!response.ok) throw Error(reply.error || 'Could not load the class meetings.'); if (!abort.signal.aborted) setMonthMeetings({ month, ...reply }) }).catch(error => { if (!abort.signal.aborted) setMeetingError(error.message) })
    return () => abort.abort()
  }, [course.id, data.unitId, month, retry])
  const ready = monthMeetings?.month === month && !meetingError
  const issue = monthMeetings?.issue || course.scheduleIssue
  const state = course.state, steps = state?.steps ?? data.plan?.steps ?? [], canDrag = !disabled && !!data.plan, canPlace = canDrag && !issue && !!ready
  const canUnassign = canDrag && !!work.data && !work.error && !work.data.warnings.length && !work.data.readOnly
  const canRemove = (id: string) => canUnassign && !!state?.meetings[id]
  const remove = (id: string) => { if (canRemove(id)) { setSelected(''); void onPlace(id, null) } }
  const pointer = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null), suppressClick = useRef(false)
  const [dragging, setDragging] = useState(false), [over, setOver] = useState(''), [point, setPoint] = useState({ x: 0, y: 0 })
  const calendarRef = useRef<HTMLElement>(null)
  const navigateMonth = (delta: number) => { const date = new Date(month + 'T12:00:00Z'); date.setUTCMonth(date.getUTCMonth() + delta); setMonth(date.toISOString().slice(0, 10)) }
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
  return <section ref={calendarRef} className={s.calendar} aria-label="Teaching calendar" onKeyDown={event => { if (event.key === 'Escape') { suppressClick.current = true; endDrag(); setSelected('') } }}>
    {work.error && <p className={s.error} role="alert">Other assignment deadlines could not load. <button onClick={() => void work.load()}>Retry deadlines</button></p>}
    {!!work.data?.warnings.length && <details className={s.warning}><summary>Some assignment deadlines could not load</summary>{work.data.warnings.map(w => <p key={w}>{w}</p>)}</details>}
    {!steps.length && <div className={s.empty}><h3>Build your course sequence</h3><p>Add activities in Plan, then drag them onto this calendar to assign them.</p><Link href={'/admin/control-room?view=plan&class=' + course.id + '&unit=' + data.unitId}>Build sequence</Link></div>}
    {course.scheduleIssue && <p className={s.warning}>{course.scheduleIssue} <Link href={'/admin/control-room?view=pacing&class=' + course.id}>Set the meeting pattern</Link></p>}
    {meetingError && <p role="alert" className={s.error}>{meetingError} <button onClick={() => setRetry(n => n + 1)}>Retry meetings</button></p>}
    {!ready && !meetingError && <p role="status" className={s.subtle}>Loading this month’s class meetings…</p>}
    <>
      <div className={s.calendarHeading}><div><h3>Assign from your course sequence</h3><p>Drag an activity onto a class day to assign it, due that day. Drag a scheduled card to another day to move it, or to Unassign to take it off the calendar.</p></div><div className={s.month}><button aria-label="Previous month" onClick={() => navigateMonth(-1)}><ChevronLeft size={18} /></button><strong>{new Date(month + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong><button aria-label="Next month" onClick={() => navigateMonth(1)}><ChevronRight size={18} /></button><button onClick={() => setMonth(today.slice(0, 7) + '-01')}>Today</button></div></div>
      <div className={s.calendarTools}><div className={s.shelf} aria-label="Course sequence activities">{steps.map((step, i) => <button key={step.id} draggable={false} disabled={!canPlace} aria-pressed={selected === step.id} onPointerDown={e => pointerStart(e, step.id)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } setSelected(selected === step.id ? '' : step.id) }}><GripVertical size={14} data-drag-handle /><span>{i + 1}. {step.title}<small>{state?.meetings[step.id] ? `Scheduled ${labelDay(state.meetings[step.id].date)}` : 'Drag to assign'}</small></span></button>)}</div>
        <button className={s.unassignDrop} data-teaching-drop={canUnassign ? 'unassign' : undefined} data-over={over === 'unassign' && canRemove(pointer.current?.id ?? '') || undefined} disabled={!canUnassign} onClick={() => remove(selected)} aria-label="Unassign selected activity"><ArrowLeft size={18} /><span><strong>Unassign</strong><small>{selected && canRemove(selected) ? 'Return selected activity to the sequence' : 'Drag a scheduled card here'}</small></span></button>
      </div>
      {dragging && <div className={s.dragGhost} style={{ left: point.x + 14, top: point.y + 14 }}>{over === 'unassign' && canRemove(pointer.current?.id ?? '') ? 'Drop to unassign · student work stays saved' : 'Drop on a class day to assign'}</div>}
      {selected && <p role="status" className={s.notice}>Choose a class day for {steps.find(st => st.id === selected)?.title}. It will be assigned and due that day.{canRemove(selected) && ' Or choose Unassign to take it off the calendar.'} <button onClick={() => setSelected('')}>Cancel placement</button></p>}
      <div className={s.calendarScroll}><div className={s.calendarGrid}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className={s.weekday}>{day}</div>)}
        {calendarDays(month).map(day => {
          const meetings = ready ? monthMeetings.meetings.filter(m => m.date === day) : [], planned = steps.filter(st => state?.meetings[st.id]?.date === day)
          const shownKeys = new Set(planned.map(st => st.activityKey))
          const deadlines = data.assignments.filter(a => a.course_id === course.id && a.due_on === day && !shownKeys.has('interactive:' + a.slug))
          const otherDeadlines = (work.data?.items ?? []).filter(item => item.kind !== 'interactive' && !shownKeys.has(assignedActivity(item, data.catalog)?.key ?? '') && (item.access === 'open' || item.access === 'scheduled') && item.dueAt && (item.dateOnly ? item.dueAt : plannerDay(item.dueAt)) === day)
          return <div key={day} data-teaching-drop={canPlace && meetings.length === 1 ? day + '|' + meetings[0].block : undefined} data-over={over.startsWith(day + '|') || undefined} className={`${s.day} ${day === today ? s.today : ''} ${day.slice(0, 7) !== month.slice(0, 7) ? s.otherMonth : ''}`}><span className={s.dayNumber}>{Number(day.slice(-2))}</span>
            {meetings.map(slot => <button key={slot.block} className={s.meeting} disabled={!canPlace} data-teaching-drop={day + '|' + slot.block} data-over={over === day + '|' + slot.block || undefined} onClick={() => selectDrop(selected, slot)} aria-label={`Place activity on ${labelDay(day)}, ${slot.block} block`}>{slot.block} block{slot.long ? ' · long' : ''}</button>)}
            {!meetings.length && <small className={s.noMeeting}>{ready ? issue ? 'Schedule needs setup' : 'No class meeting' : 'Loading meetings'}</small>}
            {planned.map(st => {
              const item = (work.data?.items ?? []).find(i => assignedActivity(i, data.catalog)?.key === st.activityKey)
              const dueHere = item?.dueAt && (item.dateOnly ? item.dueAt : plannerDay(item.dueAt)) === day && (item.access === 'open' || item.access === 'scheduled')
              return <button key={st.id} className={s.plannedCard} draggable={false} disabled={!canDrag} onPointerDown={e => pointerStart(e, st.id)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } onEdit({ action: 'step', courseId: course.id, stepId: st.id }) }}><GripVertical size={14} data-drag-handle /><span>{st.title}<small>{state!.meetings[st.id].block} block · {dueHere ? 'Assigned · due ' + labelDay(day) : 'Teaching plan · select to assign'}</small></span></button>
            })}
            {deadlines.map(a => <div className={s.deadline} key={a.id}><span>Due</span> {data.catalog.find(item => item.key === 'interactive:' + a.slug)?.title ?? a.slug}</div>)}
            {otherDeadlines.map(item => <Link className={s.deadline} key={item.id} href={item.href}><span>Due</span> {item.title}</Link>)}
          </div>
        })}
      </div></div>
      <p className={s.subtle}>Activities are due on the day you choose, at 11:59 PM Eastern. Reading quizzes keep their existing unlock and scheduling rules. Use Student choice to offer a menu instead of assigning work to the whole class.</p>
    </>
    <details className={s.assignedWork}><summary>All assigned work & access settings</summary><p>Manage existing assignments through their original access and grading settings.</p><ClassAssignedWork classId={course.id} resource={work} /></details>
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
  return <Dialog open onOpenChange={open => { if (!open && !disabled && (!dirty || window.confirm('Discard unsaved class activity changes?'))) onClose() }}><DialogContent className={s.dialog} onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => { if (disabled) e.preventDefault() }}><DialogTitle>{edit.action === 'apply' ? 'Use the saved sequence' : step?.title}</DialogTitle><DialogDescription>{course.label}</DialogDescription>{error && <p className={s.error} role="alert">{error}</p>}
    {edit.action === 'apply' ? <><p>Apply version {data.plan?.version} to this class: {changes.added} added, {changes.removed} removed{changes.reordered ? ', order changed' : ''}.</p><p>Existing meetings stay attached to matching steps. Removed steps leave this class plan. Student assignments, deadlines, responses, and grades remain in their original systems.</p><button className={s.primary} disabled={disabled} onClick={() => void onSave({ action: 'apply' })}>Apply version {data.plan?.version}</button></> : step && <>
      <div className={s.editorTabs} role="group" aria-label="Class activity settings">{(['meeting', 'assignment', 'position'] as const).map(key => <button key={key} aria-pressed={key === tab} onClick={() => setTab(key)}>{key === 'meeting' ? 'Assign & schedule' : key === 'assignment' ? 'More settings' : 'Teaching position'}</button>)}</div>
      {tab === 'meeting' && <><p>Choose a class day. This assigns the activity to this class, due that day at 11:59 PM Eastern. You can also drag it from the course sequence onto the calendar.</p><label>Class meeting<select disabled={disabled || !!course.scheduleIssue} value={slot} onChange={e => setSlot(e.target.value)}><option value="">Choose a class day…</option>{options.map(m => <option key={m.date + m.block} value={JSON.stringify(m)}>{labelDay(m.date)} · {m.block} block</option>)}</select></label>{course.scheduleIssue && <p className={s.warning}>{course.scheduleIssue}</p>}<button className={s.primary} disabled={disabled || !!course.scheduleIssue || !slot} onClick={() => void onSave({ action: 'schedule', stepId: step.id, slot: JSON.parse(slot) })}>Assign & schedule</button>{onUnassign && <button disabled={disabled} onClick={() => void onUnassign()}>Unassign from calendar</button>}</>}
      {tab === 'assignment' && (activity?.scheduling === 'interactive' ? <form className={s.editorForm} onSubmit={event => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get('dueOn') ?? ''); void onSave({ action: 'assign', stepId: step.id, dueOn: value || null, expectedId: assignment?.id ?? null, expectedDue: assignment?.due_on ?? null }) }}><p>{assignment ? 'This class already has this assignment. Updating its deadline keeps the same student work and grading.' : 'Make this activity available to the class in the interactive assignment system. Its existing Claude assessment and teacher mastery review stay in place.'}</p><label>Student due date<input name="dueOn" type="date" value={due} disabled={disabled} onChange={e => setDue(e.target.value)} /></label><small>A calendar date assigns this activity. Clear its date to unassign it; student work stays saved.</small><button type="submit" className={s.primary} disabled={disabled}>{due ? 'Assign on calendar' : 'Unassign activity'}</button></form> : <><p>{activity?.courseId && activity.courseId !== course.id ? 'This activity comes from another section. Open this class’s settings to use its existing copy or prepare one with the native assignment tools.' : activity?.availability ?? 'This source could not load. Retry before changing its assignment.'}</p><p>Use the original assignment settings for access, audiences, linked reading activities, and supported dates.</p>{activity && <Link href={assignmentSettingsHref(activity, course.id)}>Open assignment settings for this class</Link>}</>)}
      {tab === 'position' && <><p>Mark this as the experience you are currently teaching. This is a teacher confirmation, separate from student completion and mastery.</p>{state?.confirmed_at && <p className={s.subtle}>Last confirmed {new Date(state.confirmed_at).toLocaleDateString()}.</p>}<button className={s.primary} disabled={disabled} onClick={() => void onSave({ action: 'position', stepId: step.id })}>We are teaching this now</button></>}
    </>}
  </DialogContent></Dialog>
}
