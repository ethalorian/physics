'use client'
import { binderPreview, binderStepId } from '@/lib/binder-reading'
import { readingDashboardHref } from '@/lib/reading-dashboard'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useChoiceData, choiceFetch } from './shared'
import { deadlineDay, dateLabel } from '@/lib/learning-week'
import { schoolDayKey } from '@/lib/school-day'
import { choiceDueAt, requiredChoiceCount, type ChoiceEdition, type StudentChoiceList } from '@/lib/student-choice'
import s from '@/components/quizzes/Quiz.module.css'
import c from './StudentChoice.module.css'
import ChoiceCarousel from './ChoiceCarousel'
import ChoicePrintMaterials from './ChoicePrintMaterials'

export default function StudentChoiceTeacher({ classId, unitId }: { classId: string; unitId: string }) {
  const { data, error, loading, load } = useChoiceData<StudentChoiceList>('/api/student-choice-assignments')
  const [selected, setSelected] = useState(''), [edition, setEdition] = useState<ChoiceEdition | ''>(''), [date, setDate] = useState(schoolDayKey()), [month, setMonth] = useState(schoolDayKey().slice(0, 7)), [busy, setBusy] = useState(false), [saveError, setSaveError] = useState(''), [notice, setNotice] = useState('')
  const [required, setRequired] = useState(3)
  const request = useRef<{ key: string; id: string } | null>(null)
  const course = data?.courses.find(c => c.id === classId), catalog = data?.catalog.filter(p => ['all', 'auto'].includes(unitId) || p.unit === unitId) ?? []
  const packet = catalog.find(p => p.key === selected), track = edition || (course?.track === 'honors' ? 'honors' : 'cpa')
  const assignments = data?.assignments.filter(a => a.course_id === classId) ?? []
  const first = new Date(month + '-01T12:00:00Z'), start = new Date(first); start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10) })
  async function assign() { if (!packet || busy) return; setBusy(true); setSaveError(''); setNotice(''); try { if (!date) throw Error('Choose a calendar date.'); const key = JSON.stringify([classId, packet.key, track, date, required]); if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() }; await choiceFetch('/api/student-choice-assignments', { id: request.current.id, course_id: classId, packet_key: packet.key, edition: track, required_choices: required, due_at: choiceDueAt(date) }); request.current = null; await load(); setMonth(date.slice(0, 7)); setNotice('Student Choice added to the class calendar.'); setSelected('') } catch (e) { setSaveError((e as Error).message) } finally { setBusy(false) } }
  return <div className={`${s.stack} ${c.teacher}`}><header><p className={s.eyebrow}>STUDENT CHOICE</p><h2>Notes, readings and practice assignments</h2><p>Print the lesson materials or place a day on the calendar. Students browse up to ten practice options, save the number of pages you require, and bring their completed paper to you for a letter grade.</p></header>
    {(error || saveError) && <p role="alert" className={s.error}>{error || saveError} <button onClick={() => void load()}>Reload</button></p>}{loading && !data && <p role="status">Loading assignments…</p>}{notice && <p role="status" className={s.notice}>{notice}</p>}
    {data && course && <><section className={`${s.card} ${s.stack}`}><h3>Choose a day to print or assign</h3><div className={s.grid}><label className={s.field}>Student Choice day<select value={selected} onChange={e => { const next = catalog.find(p => p.key === e.target.value); setSelected(e.target.value); if (next) setRequired(n => Math.min(n, next.options.length)) }} disabled={busy || data.readOnly}><option value="">Choose a day…</option>{catalog.map(p => <option key={p.key} value={p.key}>Day {p.day} · {p.title}</option>)}</select></label><label className={s.field}>Notebook edition<select value={track} onChange={e => setEdition(e.target.value as ChoiceEdition)} disabled={busy || data.readOnly}><option value="cpa">CPA</option><option value="honors">Honors</option></select></label><label className={s.field}>Required practice pages<select value={required} onChange={e => setRequired(Number(e.target.value))} disabled={!packet || busy || data.readOnly}>{!packet && <option value={required}>Choose a day first</option>}{packet?.options.map((_, i) => i + 1).map(n => <option key={n} value={n}>{n} of {packet?.options.length}</option>)}</select></label><label className={s.field}>Calendar date<input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={busy || data.readOnly} /></label></div>
      {packet?.notes[track] && <><ChoicePrintMaterials packet={packet} edition={track} teacher />{packet.unit==='unit-1'&&<div className={s.actions}><Link className={s.link} href={binderPreview({edition:track,day:packet.day})}>Preview interactive reading</Link>{track===(course.track==='honors'?'honors':'cpa')&&<Link className={s.link} href={readingDashboardHref({view:'syllabus',courseId:classId,stepId:binderStepId({edition:track,day:packet.day})})}>Prepare separate reading and quizzes</Link>}</div>}<ChoiceCarousel key={packet.key} packet={packet} required={required} /></>}
      {packet && !packet.notes[track] && <p role="status">The original binder has no {track.toUpperCase()} notebook page for Day {packet.day}. Choose an available edition to assign.</p>}
      {!catalog.length && <p>No approved binder pages are available for this unit yet.</p>}<button className={`${s.button} ${c.assignButton}`} disabled={!packet?.notes[track] || busy || data.readOnly} onClick={() => void assign()}>{busy ? 'Assigning…' : 'Assign Student Choice'}</button></section>
      <section className={`${s.card} ${s.stack}`}><label className={s.field}>Student Choice calendar<input aria-label="Calendar month" type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value) }} /></label><div className={c.calendar} role="region" aria-label="Student Choice monthly calendar"><div className={c.week}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <strong key={d}>{d}</strong>)}</div><div className={c.days}>{days.map(day => <div className={c.day} data-outside={!day.startsWith(month)} key={day}><button className={c.date} aria-label={'Assign on ' + dateLabel(day)} aria-pressed={date === day} onClick={() => setDate(day)}>{Number(day.slice(-2))}</button>{assignments.filter(a => a.status === 'published' && deadlineDay(a.due_at) === day).map(a => <Link key={a.id} href={'/student-choice/' + a.id}>{a.title}</Link>)}</div>)}</div></div></section>
      <section className={`${s.card} ${s.stack}`}><h3>Assignments and manual reviews</h3>{!assignments.length && <p>No Student Choice assignments scheduled yet.</p>}{assignments.map(a => <Link className={s.link} key={a.id} href={'/student-choice/' + a.id}>{a.title} · {a.edition.toUpperCase()} · Choose {requiredChoiceCount(a)} of {a.available_choices ?? 6} · {dateLabel(deadlineDay(a.due_at)!)}{a.status === 'archived' ? ' · Archived' : ''} →</Link>)}</section>
    </>}
  </div>
}
