'use client'
import AssignmentSimulation from './AssignmentSimulation'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {Play, PencilLine, RotateCcw, Eye, CalendarDays, ClipboardCheck, CircleCheck, CircleAlert, Cloud} from 'lucide-react'
import {emptyVelocityState,missingVelocityAnswers,type VelocityState} from '@/lib/interactive-assignments/velocity'
import type {Work,Review,Assignment} from '@/lib/interactive-assignments/server'
import LessonActivity from './LessonActivity'
import AssignmentWorkspace from './AssignmentWorkspace'
import {assignmentBySlug,assignmentByDay} from '@/lib/interactive-assignments/catalog'
import s from './assignment.module.css'
type Data={loadedId?:string;slug?:string;reviews?:Review[];targets?:{id:string;statement:string}[];assignment?:Assignment;staff:boolean;work?:Work;review?:Review;target:{statement:string}}
export default function VelocityAssignment({id}:{id:string}){
 const [data,setData]=useState<Data|null>(null),[state,setState]=useState(emptyVelocityState),[error,setError]=useState(''),[status,setStatus]=useState('Loading…'),[busy,setBusy]=useState(false),[submitted,setSubmitted]=useState(false),[retry,setRetry]=useState(0)
 const latest=useRef(state),version=useRef(0),saved=useRef(''),chain=useRef<Promise<unknown>>(Promise.resolve()),submitId=useRef<string|null>(null),submitting=useRef(false),conflict=useRef(false)
 const lesson=assignmentBySlug(data?.assignment?.slug??data?.slug??id)??assignmentByDay(3)!
 const endpoint='/api/interactive-assignments/'+id
 useEffect(()=>{setData(null);submitId.current=null;submitting.current=false;setBusy(false);const c=new AbortController();fetch(endpoint,{signal:c.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d as Data}).then(d=>{const value=d.work?.state??emptyVelocityState();latest.current=value;saved.current=JSON.stringify(value);version.current=d.work?.version??0;setState(value);setData({...d,loadedId:id});setSubmitted(d.work?.status==='submitted');conflict.current=false;setError('');setStatus(d.staff?'Teacher preview · work is not saved':d.work?'Saved to your account':'Ready to begin')}).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[endpoint,retry,id])
 function change(value:VelocityState){latest.current=value;setState(value);setStatus(data?.staff?'Teacher preview · work is not saved':'Unsaved changes');setError('')}
 function persist(submit=false){
  const task=chain.current.catch(()=>{}).then(async()=>{
   if(!data||data.loadedId!==id||data.staff||submitted||conflict.current)return false
   const value=latest.current,serialized=JSON.stringify(value)
   if(!submit&&serialized===saved.current)return true
   setStatus(submit?'Submitting…':'Saving…')
   const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:version.current,state:value,...(submit?{submitId:submitId.current}: {})})})
   const result=await r.json();if(!r.ok){if(r.status===409)conflict.current=true;throw Error(result.error??'Could not save. Your answers are still on this page.')}
   version.current=result.version;saved.current=serialized
   setStatus(JSON.stringify(latest.current)===serialized?'Saved to your account':'Unsaved changes')
   if(submit){setSubmitted(true);setStatus('Submitted to your teacher')}
   return true
  })
  chain.current=task
  return task.catch(e=>{setError(e.message);setStatus('Save needs attention');return false})
 }
 useEffect(()=>{if(!data||data.staff||submitted||submitting.current)return;const timer=setTimeout(()=>{void persist()},900);return()=>clearTimeout(timer)},[state,data,submitted]) // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(!data?.staff&&JSON.stringify(latest.current)!==saved.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[data?.staff])
 async function submit(){const missing=missingVelocityAnswers(latest.current,lesson.questions);if(missing.length){setError('Add a response to '+missing.join(', ')+'. Your answers do not need to be correct to submit.');return}submitting.current=true;setBusy(true);submitId.current??=crypto.randomUUID();await persist(true);setBusy(false);submitting.current=false}
 if(!data||data.loadedId!==id)return <main className={s.page}><h1>Interactive assignment</h1><p role={error?'alert':'status'}>{error||'Loading assignment…'}</p>{error&&<button onClick={()=>setRetry(n=>n+1)}>Retry</button>}</main>
 const complete=lesson.questions.filter(q=>state.answers[q.id]?.trim()).length
 const savedStatus=submitted||status==='Saved to your account'
 const StatusIcon=data.staff?Eye:status==='Save needs attention'?CircleAlert:savedStatus?CircleCheck:Cloud
 return <main className={`${s.page} ${s.assignmentPage}`}><header className={s.bar}><Link href={data.staff?'/admin/interactive-assignments':'/home'}>{data.staff?'← Interactive assignments':'← My assignments'}</Link><span>{lesson.unit.replace('unit-', 'Unit ')} · {lesson.simulation ? 'Simulation investigation' : lesson.title}</span><b><span translate="no">{`${complete} / ${lesson.questions.length}`}</span><span> answered</span></b></header>
 <div className={s.intro}>
  <p className={s.eyebrow}>Student assignment · Learn, practice, explain</p>
  <h1>{lesson.title}</h1>
  <ol className={s.lessonGuide} aria-label="How to use this lesson" role="list">
   <li><span className={s.guideIcon}><Play aria-hidden="true"/></span><div><strong>{lesson.simulation ? 'Explore' : 'Watch'}</strong><p>{lesson.simulation ? 'Predict, change a condition, and run a trial.' : 'Watch a section of the teaching tool.'}</p></div></li>
   <li><span className={s.guideIcon}><PencilLine aria-hidden="true"/></span><div><strong>Work</strong><p>{lesson.simulation ? 'Record your evidence and answer beside the model.' : lesson.slug==='day-3-velocity' ? 'Walk, replay, and graph your avatar’s motion in Work.' : 'Switch to Work and try the matching questions.'}</p></div></li>
   <li><span className={s.guideIcon}><RotateCcw aria-hidden="true"/></span><div><strong>Revisit</strong><p>{lesson.simulation ? 'Compare trials and use the results to explain why.' : 'Return to the film whenever you need it.'}</p></div></li>
  </ol>
  <div className={s.lessonMeta}>
   <p className={s.statusBadge} data-tone={data.staff?'preview':status==='Save needs attention'?'attention':savedStatus?'saved':'neutral'} role="status"><StatusIcon aria-hidden="true"/><span>{submitted?'Submitted to your teacher':status}</span></p>
   {data.assignment?.due_on&&<p className={s.dueBadge}><CalendarDays aria-hidden="true"/><span>Due</span><time dateTime={data.assignment.due_on}>{new Date(data.assignment.due_on+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'America/New_York',weekday:'long',month:'long',day:'numeric'})}</time></p>}
  </div>
  {data.staff&&<aside className={s.teacherNote} aria-label="Teacher note"><ClipboardCheck aria-hidden="true"/><div><h2>For your mastery review</h2><p>{lesson.targetNote}</p></div></aside>}
 </div>
 <AssignmentWorkspace key={id} sampleStudent={data.staff} lesson={lesson} answers={state.answers} submitted={submitted} renderTool={lesson.simulation ? visible => <AssignmentSimulation lesson={lesson} state={state} onChange={change} readOnly={submitted||busy} visible={visible}/> : undefined}>
 {(data.reviews??(data.review?[data.review]:[])).map(review=><aside key={review.id} className={s.feedback}><h2>Your teacher’s feedback · {review.level} / 3</h2><p className={s.meta}>{data.targets?.find(t=>t.id===review.target_id)?.statement}</p><p>{review.feedback||'Your teacher has reviewed this assignment.'}</p><Link href="/dashboard/growth">View mastery growth →</Link></aside>)}
 {error&&<aside className={s.error} role="alert"><p>{error}</p>{conflict.current?<button onClick={()=>setRetry(n=>n+1)}>Reload saved work</button>:<button onClick={()=>persist()}>Retry saving</button>}</aside>}
 <LessonActivity lesson={lesson} state={state} onChange={change} readOnly={submitted||busy}/>
 <section id="assignment-submit" tabIndex={-1} aria-labelledby="assignment-submit-title" className={s.submit}><h2 id="assignment-submit-title">{submitted?'Submitted':'Turn it in'}</h2><p>{data.staff?'Teacher preview: students’ saved work will appear in your review desk.':submitted?'Your teacher can now review this snapshot and choose a mastery rating.':`${complete} of ${lesson.questions.length} responses entered. Submit when you have shown your thinking. You can submit answers even when you are unsure.`}</p>{!data.staff&&!submitted&&<div className={s.actions}><button disabled={busy} onClick={()=>persist()}>Save now</button><button className={s.primary} disabled={busy} onClick={submit}>{busy?'Submitting…':'Submit to teacher'}</button></div>}{data.staff&&<Link href={lesson.simulation?'/admin/interactive-assignments/results?activity='+lesson.slug+(data.assignment?'&class='+data.assignment.course_id:''):'/admin/interactive-assignments'}>Open teacher review desk →</Link>}</section>
 </AssignmentWorkspace></main>
}
