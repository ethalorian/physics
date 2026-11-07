'use client'
import { useState } from 'react'
import { etfChapter, etfPages } from '@/data/etf-original/source'
import { validateReading, type ReadingAssignment } from '@/lib/textbook-assignments'
import { dueDateDraft, dueDateValue } from '@/lib/assignment-due-input'
import AssignmentDueInput from '@/components/ui/assignment-due-input'
import { Button } from '@/components/ui/button'
import { readingFetch } from './ReadingShared'
import { useAssignmentLeaveGuard } from '@/hooks/useAssignmentLeaveGuard'
import type { ReadingComposerProps } from './ReadingComposer'
import styles from './readings.module.css'
export default function EtfReadingComposer({initial,catalog,onSaved,onCancel}:ReadingComposerProps) {
  const [draft,setDraft]=useState(initial), [due,setDue]=useState(dueDateDraft(initial.due_at))
  const [error,setError]=useState(''),[busy,setBusy]=useState(false)
  const canLeave=useAssignmentLeaveGuard(JSON.stringify(draft)!==JSON.stringify(initial)||JSON.stringify(due)!==JSON.stringify(dueDateDraft(initial.due_at)))
  const c=etfChapter(draft.chapter,draft.section_ids)!
  const courses=catalog.courses.filter(course=>course.program==='trades')
  const targets=catalog.targets.filter(t=>t.program==='trades')
  async function save(status:'draft'|'published') {
    setBusy(true);setError('')
    try {
      if(status==='published'&&!due.date)throw Error('Choose the date for the class calendar.')
      const value=validateReading({...draft,status,due_at:dueDateValue(due)})
      const result=await readingFetch<{assignment:ReadingAssignment}>('/api/readings',{method:'POST',body:JSON.stringify(value)})
      onSaved(result.assignment)
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  return <main className={styles.stack}><p>Engineering the Future · Chapter {c.number}</p><h1 className="text-title-1">{c.title}</h1><p>Printed pp. {etfPages(c)} · <a className="underline" href={'/textbook/interactive/etf/'+c.number} target="_blank" rel="noopener noreferrer">Preview interactive reading</a></p><fieldset className={styles.stack} disabled={busy||catalog.readOnly}>
    <label className={styles.field}>Class<select disabled={initial.version>0} value={draft.course_id} onChange={e=>setDraft({...draft,course_id:e.target.value})}>{courses.map(course=><option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
    <label className={styles.field}>Assignment title<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
    <label className={styles.field}>Reading directions<textarea value={draft.instructions} onChange={e=>setDraft({...draft,instructions:e.target.value})}/></label>
    {draft.questions.map((q,i)=><div key={q.id} className={styles.stack}><label className={styles.field}>Collected question {i+1}<textarea value={q.prompt} onChange={e=>setDraft({...draft,questions:draft.questions.map(old=>old.id===q.id?{...old,prompt:e.target.value}:old)})}/></label><label className={styles.field}>Learning target<select value={q.target_id} onChange={e=>setDraft({...draft,questions:draft.questions.map(old=>old.id===q.id?{...old,target_id:e.target.value}:old)})}><option value="">Choose a target</option>{targets.map(t=><option key={t.id} value={t.id}>{t.statement}</option>)}</select></label></div>)}
    <AssignmentDueInput value={due} onChange={setDue}/><div className={styles.actions}><Button variant="outline" onClick={()=>void save('draft')}>Save draft</Button><Button onClick={()=>void save('published')}>Publish reading</Button></div></fieldset>
    <Button variant="ghost" disabled={busy} onClick={()=>{if(canLeave())onCancel()}}>Back to readings</Button>{error&&<p role="alert">{error}</p>}</main>
}
