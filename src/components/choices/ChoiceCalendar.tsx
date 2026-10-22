'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { dateLabel } from '@/lib/learning-week'
import { schoolDayKey } from '@/lib/school-day'
import { choiceStepDate, sourceKey, type ChoiceOption, type ChoiceSection } from '@/lib/choice-calendar'
import type { ChoiceSnapshot } from '@/lib/choice-calendar-server'
import ChoiceSectionEditor from './ChoiceSectionEditor'
import ChoiceStudentPlanner from './ChoiceStudentPlanner'
import { ChoiceGradebook, ChoiceLabManager, labTime, type ChoiceAction } from './ChoiceTeacher'
import s from './ChoiceCalendar.module.css'

interface Props { data: ChoiceSnapshot | null; loading: boolean; error: boolean; refresh: () => void; dates: string[]; courseId: string | null }
export default function ChoiceCalendar({ data, loading, error, refresh, dates, courseId }: Props) {
  const [sectionId, setSectionId] = useState(''), [focus, setFocus] = useState(''), [tab, setTab] = useState<'calendar' | 'labs' | 'grades'>('calendar')
  const [creating, setCreating] = useState(false), [editing, setEditing] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [saveError, setSaveError] = useState('')
  const inFlight = useRef(false), detail = useRef<HTMLElement>(null)
  const section = data?.sections.find(sec => sec.id === sectionId) ?? data?.sections[0]
  const userId = data?.staff ? '' : data?.roster[0]?.id ?? ''
  const progress = section ? data?.progress[userId]?.[section.id] : undefined
  const selected = section?.options.find(o => o.id === focus), disabled = busy || !!data?.readOnly
  const save: ChoiceAction = async body => {
    if (inFlight.current) return null
    inFlight.current = true; setBusy(true); setNotice(''); setSaveError('')
    try {
      const response = await fetch('/api/choice-calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw Error(result.error ?? 'Could not save. Please try again.')
      if (body.action !== 'suggest-groups') { refresh(); setNotice(result.requested ? 'Your teacher has received the swap request. Your work and reservation remain until it is approved.' : 'Saved.'); }
      return result
    } catch (e) { setSaveError((e as Error).message); return null }
    finally { inFlight.current = false; setBusy(false) }
  }
  const open = (id: string) => { setFocus(id); requestAnimationFrame(() => detail.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })) }
  const schedule = (id: string, day: string | null, stepId?: string) => { if (!section || disabled) return; void save({ action: stepId ? 'plan-step' : 'select', section_id: section.id, option_id: id, step_id: stepId, planned_on: day }) }
  const remove = (id: string) => { if (!section || disabled) return; void save({ action: 'remove', section_id: section.id, option_id: id }) }
  const card = (option: ChoiceOption, available: boolean) => {
    const state = progress?.options.find(o => o.option.id === option.id), selection = data?.selections.find(v => v.section_id === section?.id && v.option_id === option.id && v.user_id === userId)
    const booking = data?.bookings.find(b => b.section_id === section?.id && b.option_id === option.id && b.user_id === userId), slot = data?.slots.find(s => s.id === booking?.slot_id)
    return <article key={option.id} className={s.card} data-complete={state?.completed}>
      <span className={s.badge}>{state?.completed ? 'Choice complete' : option.category}{selection?.swap_requested ? ' · Swap requested' : ''}</span><strong>{option.title}</strong>
      {slot && <span className={s.badge}>{labTime(slot.starts_at)} · Group {slot.group_number}</span>}
      {!!state?.pendingQuizzes && <span className={s.badge}>{state.pendingQuizzes} attached quiz{state.pendingQuizzes === 1 ? '' : 'zes'} tracked separately</span>}
      <button className={s.button} onClick={() => open(option.id)}>{data?.staff ? 'View activity or sequence' : available ? option.lab ? 'Choose lab time' : 'Choose & plan' : 'Open choice'}</button>
    </article>
  }
  if (error) return <section className={s.panel} aria-label="Student choice"><p role="alert">The student choice calendar couldn’t load.</p><button className={s.button} onClick={refresh}>Retry choice calendar</button></section>
  if (!data) return loading ? <p className={s.empty} role="status">Loading student choices…</p> : null
  if (!data.courses.length || (!data.staff && !data.sections.length)) return null
  return <section className={s.panel} aria-label="Student choice calendar">
    <header className={s.heading}><div><h2>Student choice</h2><p className={s.muted}>Plan your activities and instructor lab time.</p></div><div className={s.actions}>{data.staff && <button className={s.button} disabled={disabled || !courseId} onClick={() => { setEditing(false); setCreating(true) }}>New choice section</button>}<button className={s.button} disabled={busy} onClick={refresh}>Refresh choices</button></div></header>
    {data.readOnly && <p className={s.notice}>Viewing only. Return to your own teacher account to make changes.</p>}
    {saveError && <p role="alert" className={s.error}>{saveError}</p>}{notice && <p role="status" className={s.notice}>{notice}</p>}
    {(creating || editing) && courseId ? <ChoiceSectionEditor key={editing ? section?.id : courseId} courseId={courseId} initial={editing ? section : undefined} busy={busy} onCancel={() => { setCreating(false); setEditing(false) }} onSave={async body => { const result = await save(body); if (result) { setCreating(false); setEditing(false); setSectionId(String(result.id)); return true } return false }} /> : section ? <>
      <div className={s.fields}><label>Choice section<select value={section.id} onChange={e => { setSectionId(e.target.value); setFocus('') }}>{data.sections.map(sec => <option key={sec.id} value={sec.id}>{sec.title}{sec.published ? '' : sec.published_at ? ' · Paused' : ' · Draft'}</option>)}</select></label><div><strong>Complete {section.required_count} of {section.options.length}</strong><p className={s.muted}>Due {labTime(section.due_at)} · Extra choices welcome</p>{Object.entries(section.category_minimums).filter(([, count]) => count > 0).map(([category, count]) => <p className={s.muted} key={category}>Include at least {count} {category} choice{count === 1 ? '' : 's'}.</p>)}</div></div>
      {data.staff ? <div className={s.row}><div className={s.tabs} aria-label="Choice views">{(['calendar', 'labs', 'grades'] as const).map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t === 'calendar' ? 'Choices' : t === 'labs' ? 'Lab calendar & groups' : 'Choice gradebook'}</button>)}</div><button className={s.button} disabled={disabled} onClick={() => setEditing(true)}>Edit section</button><button className={s.button} disabled={disabled} onClick={() => void save({ action: 'publish', section_id: section.id, published: !section.published })}>{section.published ? 'Pause availability' : 'Publish choices'}</button></div> : progress && <><div className={s.row}><strong>{progress.completed}/{section.required_count} completed</strong><span className={s.muted}>{progress.pendingQuizzes ? `${progress.pendingQuizzes} attached quizzes still due separately` : 'Attached quizzes tracked separately'}</span><button className={s.button} onClick={() => setTab(tab === 'grades' ? 'calendar' : 'grades')}>{tab === 'grades' ? 'Back to calendar' : 'My choice grades'}</button></div><div className={s.progress} role="progressbar" aria-label="Choice completion" aria-valuemin={0} aria-valuemax={section.required_count} aria-valuenow={Math.min(progress.completed, section.required_count)}><span style={{ width: `${Math.min(100, progress.completed / section.required_count * 100)}%` }} /></div></>}
      {tab === 'grades' ? <ChoiceGradebook section={section} data={{ ...data, readOnly: data.readOnly || !data.staff }} save={save} busy={busy} /> : data.staff ? tab === 'labs' ? <ChoiceLabManager key={section.id} section={section} data={data} save={save} busy={busy} /> : <div className={s.bank}>{section.options.map(o => card(o, true))}<p className={s.muted}>Opens {labTime(section.opens_at)}. Students schedule their own dates within this window. Use Lab calendar & groups to add sessions, and Choice gradebook to review work or approve swaps.</p></div> : <>
        <ChoiceStudentPlanner key={section.id} section={section} data={data} userId={userId} dates={dates} disabled={disabled} open={open} schedule={schedule} remove={remove}/>

      </>}
      {selected && tab === 'calendar' && <section className={s.detail} ref={detail}><div className={s.heading}><h3>{selected.title}</h3><button className={s.button} onClick={() => setFocus('')}>Close details</button></div>
        {!data.staff && <div className={s.fields}>{!selected.lab && selected.steps.filter(s=>!s.followUp).length === 1 && <label>Plan a work date<input type="date" min={schoolDayKey(new Date(section.opens_at))} max={schoolDayKey(new Date(section.due_at))} disabled={disabled} value={choiceStepDate(selected, data.selections.find(v => v.section_id === section.id && v.option_id === selected.id && v.user_id === userId), selected.steps.find(s=>!s.followUp)?.id ?? '') ?? ''} onChange={e => { if (e.target.value) schedule(selected.id, e.target.value, selected.steps.find(s=>!s.followUp)?.id) }} /></label>}<div className={s.actions}><button className={s.button} disabled={disabled} onClick={() => void save({ action: 'select', section_id: section.id, option_id: selected.id, planned_on: null })}>Choose now · Plan later</button><button className={s.button} disabled={disabled} onClick={() => remove(selected.id)}>Remove or request swap</button></div></div>}
        <p className={s.muted}>Work on these activities in any order. Attached quizzes unlock after their associated assignment is submitted.</p><ol className={s.stepList}>{selected.steps.map((step) => { const evidence = data.evidence[userId]?.[sourceKey(step)], chosen = progress?.options.find(o => o.option.id === selected.id)?.selected; const ready = !data.staff && chosen && (step.followUp && step.prerequisite ? !!data.evidence[userId]?.[step.prerequisite]?.submitted : true); return <li key={step.id}><strong>{step.title}</strong> <span className={s.muted}>{step.followUp ? 'Attached quiz · tracked separately' : 'Activity step'}{evidence?.submitted ? ' · Submitted' : ''}</span>{!data.staff && !step.followUp && (selected.lab || selected.steps.filter(s=>!s.followUp).length > 1) && <label className={s.field}>Plan {step.title}<input type="date" min={schoolDayKey(new Date(section.opens_at))} max={schoolDayKey(new Date(section.due_at))} disabled={disabled} value={choiceStepDate(selected, data.selections.find(v=>v.section_id===section.id && v.option_id===selected.id && v.user_id===userId), step.id) ?? ''} onChange={e=>schedule(selected.id,e.target.value || null,step.id)}/></label>}{(ready || data.staff) ? <Link className={s.button} href={step.href}>Open {step.followUp ? 'quiz' : 'activity'}</Link> : <p className={s.muted}>{chosen ? 'Submit the attached assignment to unlock this quiz.' : 'Choose this activity to begin.'}</p>}</li> })}</ol>
        {selected.lab && <div className={s.slots}><h3>Book instructor lab time</h3>{!data.staff && data.bookings.some(b => b.section_id === section.id && b.option_id === selected.id && b.user_id === userId) && <button className={s.button} disabled={disabled} onClick={() => void save({ action: 'cancel-booking', section_id: section.id, option_id: selected.id })}>Cancel reservation · Keep choice</button>}{data.slots.filter(slot => slot.section_id === section.id && slot.option_id === selected.id).map(slot => <div className={s.slot} key={slot.id}><div><strong>{labTime(slot.starts_at)} · Group {slot.group_number}</strong><p className={s.muted}>{slot.capacity - slot.booked} seats available · {Math.round((Date.parse(slot.ends_at) - Date.parse(slot.starts_at)) / 60000)} minutes</p></div>{!data.staff && <button className={s.button} disabled={disabled || slot.mine || slot.booked >= slot.capacity || Date.parse(slot.starts_at) <= Date.now()} onClick={() => void save({ action: 'book', section_id: section.id, option_id: selected.id, slot_id: slot.id })}>{slot.mine ? 'Reserved' : slot.booked >= slot.capacity ? 'Full' : 'Reserve seat'}</button>}</div>)}{!data.slots.some(slot => slot.section_id === section.id && slot.option_id === selected.id) && <p className={s.muted}>The teacher hasn’t opened lab sessions for this choice yet. You can choose the lab now and book when a session becomes available.</p>}</div>}
      </section>}
    </> : <p className={s.empty}>Create a choice section to offer activities and instructor-led labs.</p>}
  </section>
}
