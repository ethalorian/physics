'use client'
import { useAssessmentReviewGuard } from '@/components/admin/useAssessmentReviewGuard'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { checkpointScore, checkpointStatus, type CheckpointQuestion, type StoredCheckpointAttempt } from '@/lib/vocab-checkpoint'
import type { VocabMasteryTask } from '@/lib/vocab-mastery'
import { checkpointRequest } from './CheckpointWork'
import { CheckpointResult } from './CheckpointStudent'
import CheckpointScene from './CheckpointScene'
import s from './checkpoint.module.css'

interface Data { students:{studentId:string;name:string}[];attempts:StoredCheckpointAttempt[];questions:CheckpointQuestion[];words:string[] }
const labels=['No evidence','Limited','Developing','Mostly clear','Precise']
const statuses=['Not started','In progress','Needs scoring','Ready to release','Graded']
export default function CheckpointTeacher({tasks,nameFilter,onSaved,onMastery,initialTaskId,initialStudentId}: {tasks:VocabMasteryTask[];classId:string|null;unitId:string;nameFilter:string;onSaved:()=>Promise<void>;onMastery:(task:string,student:string)=>void;initialTaskId?:string;initialStudentId?:string}) {
 const [taskId,setTaskId]=useState(initialTaskId??''),[data,setData]=useState<Data|null>(null),[screen,setScreen]=useState<'dashboard'|'review'>(initialStudentId?'review':'dashboard')
 const [studentId,setStudentId]=useState(initialStudentId??''),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[index,setIndex]=useState(0),[autoNext,setAutoNext]=useState(!initialStudentId)
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[note,setNote]=useState('')
 const saving=useRef(false),generation=useRef(0),heading=useRef<HTMLHeadingElement>(null)
 const task=tasks.find(t=>t.id===taskId)??tasks[0]
 const selectedTaskId=task?.id
 const load=useCallback(async()=>{
  const gen=++generation.current
  if(!selectedTaskId){setData(null);return}
  setLoading(true);setError('')
  try{const r=await fetch(`/api/vocab/checkpoints?task_id=${selectedTaskId}`),d=await r.json();if(!r.ok)throw new Error(d.error);if(gen===generation.current)setData(d)}catch(e){if(gen===generation.current)setError((e as Error).message)}finally{if(gen===generation.current)setLoading(false)}
 },[selectedTaskId])
 useEffect(()=>{void load();return()=>{
  // Invalidate the request generation counter; this is not a DOM ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  generation.current++
 }},[load])
 const students=data?.students.slice().sort((a,b)=>a.name.localeCompare(b.name)).filter(a=>(!initialStudentId||a.studentId===initialStudentId)&&a.name.toLowerCase().includes(`${nameFilter}`.toLowerCase())&&a.name.toLowerCase().includes(query.toLowerCase())).map(st=>{
  const attempts=data.attempts.filter(a=>a.user_id===st.studentId).map(a=>({...a,name:st.name,knowledge:task?.progress.find(p=>p.studentId===st.studentId)?.review?.level as 1|2|3|null??null}))
  const latest=attempts[0]
  const best=attempts.filter(a=>a.released).sort((a,b)=>checkpointScore(b.questions,b).points!-checkpointScore(a.questions,a).points!)[0]
  return {...st,attempts,latest,best,status:latest?checkpointStatus(latest.questions,latest):'Not started'}
 })??[]
 const student=students.find(st=>st.studentId===studentId),attempt=student?.latest
 const questions=attempt?.questions??[],writing=questions.filter(q=>q.part==='explain'),current=writing[index]
 const score=attempt?checkpointScore(questions,attempt):null
 const savedNote=current&&attempt?attempt.notes[current.id]??'':''
 useAssessmentReviewGuard(busy || note !== savedNote)
 useEffect(()=>{setNote(savedNote);heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start'})},[attempt?.id,current?.id,savedNote])
 function open(id:string){const a=data?.attempts.find(a=>a.user_id===id);setStudentId(id);setIndex(Math.max(0,a?.questions.filter(q=>q.part==='explain').findIndex(q=>a.scores[q.id]===undefined)??0));setScreen('review');setError('');setNotice('')}
 async function mutate(action:string,payload:Record<string,unknown>={}) {
  if(!attempt||!task||saving.current)return
  saving.current=true;setBusy(true);setError('')
  try{
   const updated=await checkpointRequest({task_id:task.id,student_id:attempt.user_id,attempt_id:attempt.id,version:attempt.version,action,...payload})
   setData(d=>d&&({...d,attempts:[updated,...d.attempts.filter(a=>a.id!==updated.id)]}))
   if(action==='score'){setNotice(`Saved ${payload.points}/4 for ${student?.name}.`);if(autoNext&&index===0)setIndex(1)}
   if(action==='release'){setNotice(`Grade released to ${student?.name}.`);await onSaved()}
  }catch(e){setError((e as Error).message)}finally{saving.current=false;setBusy(false)}
 }
 return <section className={s.app} aria-label="Vocabulary checkpoints">
 <div className={s.pageHeading}><div><p className={s.eyebrow}>CONTROL ROOM / VOCABULARY</p><h2 className="text-title-1">Earlier checkpoint records</h2><p>Review existing responses and grades. Create new vocabulary assessments in Quizzes.</p></div>{!initialStudentId&&<Button size="lg" asChild><Link href="/admin/control-room?view=quizzes">Create vocabulary quiz</Link></Button>}</div>
 <div className={s.tableTools}><label className={s.field}>Checkpoint<select value={task?.id??''} disabled={busy} onChange={e=>{setTaskId(e.target.value);setData(null);setScreen('dashboard');setNotice('')}}><option value="" disabled>Choose checkpoint…</option>{tasks.map(t=><option key={t.id} value={t.id}>{t.title} · {t.courseLabel}{t.active?'':' · Archived'}</option>)}</select></label><Button size="lg" variant="outline" disabled={busy||loading} onClick={()=>{void load();void onSaved()}}>Refresh</Button>{!initialStudentId&&screen!=='dashboard'&&<Button size="lg" variant="outline" disabled={busy} onClick={()=>setScreen('dashboard')}>Back to dashboard</Button>}</div>
 {error&&<p role="alert" className={s.guidance}>{error}</p>}<p role="status">{notice||(loading?'Loading checkpoint progress…':'')}</p>
 {!task&&<Card className={s.paddedCard}><h3 className="text-title-2">No earlier checkpoint records</h3><p>Use Quizzes to create a vocabulary quiz for your class.</p></Card>}
 {task&&data&&screen==='dashboard'&&<>
 <div className={s.stats}>{[{n:students.length,label:'Assigned',value:'all'},...['Needs scoring','Ready to release','Graded'].map(value=>({n:students.filter(st=>st.status===value).length,label:value,value}))].map(c=><Button key={c.value} variant="outline" className={s.stat} aria-pressed={filter===c.value} onClick={()=>setFilter(c.value)}><strong>{c.n}</strong><span>{c.label}</span></Button>)}</div>
 <Card className={s.dashboardCard}><div className={s.tableHeading}><div><h3 className="text-title-2">{task.title}</h3><p>{task.term_ids.length} words · 10 questions · 20 points{task.due_on?` · Due ${task.due_on}`:''}</p></div><Button size="lg" disabled={!students.some(st=>st.status==='Needs scoring')} onClick={()=>open(students.find(st=>st.status==='Needs scoring')!.studentId)}>Grade next <ArrowRight/></Button></div>
 <div className={s.tableTools}><label className={s.search}><Search size={18}/><input aria-label="Find checkpoint student" placeholder="Find a student…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className={s.inlineField}>Show<select aria-label="Checkpoint status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Everyone</option>{statuses.map(v=><option key={v}>{v}</option>)}</select></label></div>
 <div className={s.tableScroll} tabIndex={0} role="region" aria-label="Checkpoint grades"><table><thead><tr><th>Student</th><th>Status</th><th>Auto / 12</th><th>Explain / 8</th><th>Quiz grade</th><th>Knowledge</th><th>Review</th></tr></thead><tbody>{students.filter(st=>filter==='all'||st.status===filter).map(st=>{const a=st.latest,c=a?checkpointScore(a.questions,a):null;return <tr key={st.studentId}><th>{st.name}{a&&a.number>1&&<small>Attempt {a.number}</small>}</th><td><span className={`${s.badge} ${st.status==='Graded'?s.positive:st.status==='Needs scoring'?s.attention:''}`}>{st.status}</span></td><td>{a?.submitted?c!.autoPoints:'—'}</td><td>{a?.submitted?(c!.pending?`${2-c!.pending}/2 scored`:c!.writtenPoints):'—'}</td><td><strong>{st.best?`${checkpointScore(st.best.questions,st.best).percent}%`:'—'}</strong>{a?.submitted&&!a.released&&c?.complete&&<small>{c.percent}% draft</small>}{a&&a.number>1&&st.best&&<small>Best released</small>}</td><td>{task.progress.find(p=>p.studentId===st.studentId)?.review?.level??'Unrated'}</td><td><Button size="lg" variant="outline" disabled={!a?.submitted||loading} onClick={()=>open(st.studentId)}>{st.status==='Graded'?'View':st.status==='Ready to release'?'Release':'Grade'}</Button></td></tr>})}</tbody></table></div>
 {!students.filter(st=>filter==='all'||st.status===filter).length&&<p className={s.empty}>No students match this view.</p>}<p className={s.tableFoot}>Final grades appear after release. Reassessments retain the higher released score. Unscored work stays pending.</p></Card></>}
 {task&&student&&attempt&&screen==='review'&&<div className={s.reviewLayout}><aside className={s.roster}><h3>Students</h3>{students.map(st=><Button size="lg" key={st.studentId} className={s.rosterButton} variant="outline" aria-pressed={st.studentId===studentId} disabled={busy||!st.latest?.submitted} onClick={()=>open(st.studentId)}><strong>{st.name}</strong><span>{st.status}</span></Button>)}</aside><div className={s.stack}>
 <div className={s.between}><div><p className={s.eyebrow}>GRADING VOCABULARY</p><h3 ref={heading} tabIndex={-1} className="text-title-1">{student.name}</h3></div><label className={s.toggle}><input type="checkbox" checked={autoNext} onChange={e=>setAutoNext(e.target.checked)}/> Next explanation after scoring</label></div>
 {attempt.released?<><div className={s.actions}><Button size="lg" onClick={()=>onMastery(task.id,student.studentId)}>Rate Knowledge mastery <ArrowRight/></Button><Button size="lg" variant="outline" asChild><Link href="/admin/control-room?view=quizzes">Create reassessment in Quizzes</Link></Button></div><CheckpointResult state={{title:task.title}} gradeLabel={attempt.number>1?'This attempt':'Quiz grade'} attempt={attempt} questions={questions}/></>:current&&<>
 <div className={s.actions}>{writing.map((q,i)=><Button key={q.id} size="lg" variant="outline" aria-pressed={i===index} disabled={busy} onClick={()=>setIndex(i)}>Explanation {i+1} · {attempt.scores[q.id]===undefined?'Not scored':`${attempt.scores[q.id]}/4`}</Button>)}</div>
 <Card className={s.paddedCard}><h4 className="text-title-2">{current.prompt}</h4>{current.scene&&<details className={s.support}><summary>Show question diagram</summary><CheckpointScene kind={current.scene}/></details>}<div className={s.response}><span>Student response</span><p>{attempt.answers[current.id]}</p></div><details className={s.support}><summary>Answer guide & scoring rubric</summary><p>{current.explanation}</p><p><strong>Meaning (0–2):</strong> 0 incorrect or absent; 1 partly accurate; 2 accurate.</p><p><strong>Application (0–2):</strong> 0 no valid connection; 1 partial connection; 2 specific, correct connection.</p><p>Add both parts for the score below. Score understanding; do not deduct for minor grammar or spelling.</p></details>
 <details className={s.support}><summary>Add feedback (optional)</summary><label className={s.field}>Feedback (saved with your score)<textarea value={note} maxLength={2000} rows={2} disabled={busy} onChange={e=>setNote(e.target.value)}/></label></details>
 <div className={s.scoreButtons}>{labels.map((label,n)=><Button key={n} variant="outline" disabled={busy||!task.active} aria-pressed={attempt.scores[current.id]===n} onClick={()=>void mutate('score',{question_id:current.id,points:n,note})}><strong>{n}</strong><span>{label}</span></Button>)}</div>
 </Card><Card className={s.releaseCard}><div><h4 className="text-title-2">{score?.complete?`${score.percent}% · ${score.points}/20`:'Quiz grade pending'}</h4><p>{score?.autoPoints}/12 automatic · {score?.pending?`${score.pending} explanation${score.pending===1?'':'s'} to score`:`${score?.writtenPoints}/8 explanations`}</p></div><Button size="lg" disabled={busy||!score?.complete||!task.active||note!==(attempt.notes[current.id]??'')} onClick={()=>void mutate('release')}>Release grade <ArrowRight/></Button></Card>
 <details className={s.support}><summary>Automatic questions & responses</summary>{questions.filter(q=>q.part!=='explain').map(q=><div key={q.id}><strong>{q.prompt}</strong><p>Answer: {q.options?.[Number(attempt.answers[q.id])]} · {attempt.answers[q.id]===String(q.answer)?q.points:0}/{q.points}</p><p>{q.explanation}</p></div>)}</details></>}
 {student.attempts.length>1&&<details className={s.support}><summary>Attempt history</summary>{student.attempts.map(a=><p key={a.id}>Attempt {a.number}: {a.released?`${checkpointScore(a.questions,a).percent}% released ${new Date(a.released_at!).toLocaleDateString()}`:checkpointStatus(a.questions,a)}</p>)}</details>}
 <Button size="lg" variant="outline" disabled={busy||!students.some(st=>st.studentId!==studentId&&st.status==='Needs scoring')} onClick={()=>open(students.find(st=>st.studentId!==studentId&&st.status==='Needs scoring')!.studentId)}>Next student to grade <ArrowRight/></Button>
 </div></div>}
 </section>
}
