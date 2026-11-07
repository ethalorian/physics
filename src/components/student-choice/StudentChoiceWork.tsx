'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useChoiceData, choiceFetch } from './shared'
import { deadlineDay, dateLabel } from '@/lib/learning-week'
import { choiceDueAt, choiceReviewLabel, requiredChoiceCount, type StudentChoiceDetail } from '@/lib/student-choice'
import s from '@/components/quizzes/Quiz.module.css'
import ChoiceCarousel from './ChoiceCarousel'
import ChoiceSelection from './ChoiceSelection'
import ChoicePrintMaterials from './ChoicePrintMaterials'
import ChoiceReviewRoster from './ChoiceReviewRoster'

export default function StudentChoiceWork({ id }: { id: string }) {
  const { data, error, loading, load } = useChoiceData<StudentChoiceDetail>(`/api/student-choice-assignments/${id}`)
  return <div className={s.app}>
    <Link className={s.link} href={data?.staff ? '/admin/control-room?view=choices&class=' + data.assignment.course_id : '/home'}>← {data?.staff ? 'Student Choice calendar' : 'Calendar'}</Link>
    {error && <p className={s.error} role="alert">{error} <button onClick={() => void load()}>Reload</button></p>}
    {loading && !data && <p role="status">Loading Student Choice…</p>}
    {data && <><header className={s.hero}><p className={s.eyebrow}>STUDENT CHOICE · {data.assignment.edition.toUpperCase()}</p><h1>{data.assignment.title}</h1><p>Due {dateLabel(deadlineDay(data.assignment.due_at)!)}{data.assignment.status === 'archived' ? ' · Archived' : ''}</p></header>
      {data.staff && <ChoiceReviewRoster key={id} data={data} reload={load} />}
      <section className={`${s.card} ${s.stack}`}><h2>Notes, reading and practice</h2><p>Read the lesson and complete your notebook page. Choose {requiredChoiceCount(data.assignment)} of the six practice options, complete your chosen pages on paper, and bring your work to your teacher for review.</p>
        <ChoicePrintMaterials packet={data.packet} edition={data.assignment.edition} teacher={data.staff} />
        <p><strong>Learning target:</strong> {data.packet.notes[data.assignment.edition]?.target ?? data.packet.target}</p>
        {data.packet.reference && <a className={s.link} href={data.packet.reference.path} target="_blank" rel="noopener noreferrer">View / print unit color code</a>}
        {data.staff ? <ChoiceCarousel key={data.packet.key} packet={data.packet} required={requiredChoiceCount(data.assignment)} /> : <ChoiceSelection key={id + ':' + data.assignment.version + ':' + (data.selections[0]?.version ?? 0)} required={requiredChoiceCount(data.assignment)} reload={load} id={id} packet={data.packet} selection={data.selections[0]} locked={data.readOnly || data.assignment.status === 'archived' || !!data.reviews[0] && data.reviews[0].state !== 'not_received'} />}
      </section>
      {!data.staff && <section className={`${s.card} ${s.stack} mt-4`}><h2>Teacher review</h2><p role="status">{choiceReviewLabel(data.reviews[0])}</p>{data.reviews[0]?.letter_grade && <p><strong>Letter grade: {data.reviews[0].letter_grade}</strong></p>}{data.reviews[0]?.feedback && <p className="whitespace-pre-wrap">{data.reviews[0].feedback}</p>}</section>}
      {data.staff && <Schedule key={data.assignment.version} data={data} reload={load} />}
    </>}
  </div>
}
function Schedule({ data, reload }: { data: StudentChoiceDetail; reload: () => Promise<void> }) {
  const [required, setRequired] = useState(requiredChoiceCount(data.assignment))
  const [due, setDue] = useState(deadlineDay(data.assignment.due_at) ?? ''), [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function save(status: 'published' | 'archived') { setBusy(true); setError(''); try { if (!due) throw Error('Choose a deadline.'); await choiceFetch(`/api/student-choice-assignments/${data.assignment.id}`, { action: 'schedule', due_at: choiceDueAt(due), status, required_choices: required, version: data.assignment.version }); await reload() } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }
  return <section className={`${s.card} ${s.stack} mt-4`}><h2>Assignment settings</h2>{error && <p role="alert" className={s.error}>{error}</p>}<label className={s.field}>Calendar date<input type="date" value={due} disabled={data.readOnly || busy} onChange={e => setDue(e.target.value)} /></label><label className={s.field}>Required practice pages<select value={required} disabled={data.readOnly || busy} onChange={e => setRequired(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} of 6</option>)}</select></label><p className={s.muted}>Changing the count keeps saved choices and teacher reviews. Students whose choices no longer match can update them before you receive their paper.</p><div className={s.actions}><button className={s.button} disabled={data.readOnly || busy} onClick={() => void save(data.assignment.status)}>Save assignment settings</button><button className={s.secondary} disabled={data.readOnly || busy} onClick={() => void save(data.assignment.status === 'archived' ? 'published' : 'archived')}>{data.assignment.status === 'archived' ? 'Restore assignment' : 'Archive assignment'}</button></div><p className={s.muted}>Archived assignments retain their paper records, grades and feedback.</p></section>
}
