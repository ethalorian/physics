'use client'
import {FOUNDATION_SUBMISSION_GATES_PAUSED,FOUNDATION_SUBMISSION_PAUSED_NOTICE} from '@/lib/interactive-assignments/foundations/recovery'

import {hasCpaSupport} from '@/lib/interactive-assignments/foundations/cpa-discussions'
import {foundationRequest} from '@/lib/interactive-assignments/foundations/request'
import type {FoundationSaveHandle} from './FoundationExchange'
import {newSubmissionId} from '@/lib/interactive-assignments/submission-id'
import {foundationEdition} from '@/lib/interactive-assignments/foundations/core-questions'
import RevisionCycle from '@/components/review-desk/RevisionCycle'
import TransferBriefContext from './TransferBriefContext'
import TransferBriefResponses from './TransferBriefResponses'
import { TRANSFER_BRIEF_SCENES } from '@/lib/interactive-assignments/transfer-brief-scenes'
import {hasDimensionGrade,isTransferBrief,isDimensionRubric,TRANSFER_RUBRIC_SUMMARY} from '@/lib/interactive-assignments/graded-assignment'
import dynamic from 'next/dynamic'
import FoundationLanguage from './FoundationLanguage'
import FoundationExchange,{FoundationCollaboration,FoundationCollaborationStatus,FoundationGroupLobby} from './FoundationExchange'
const FoundationSlides=dynamic(()=>import('./FoundationSlides'))
import LabGradeDetails from './LabGradeDetails'
import {FOUR_DIMENSION_LAB_RUBRIC, labDimensionGrade} from '@/lib/interactive-assignments/lab-rubric'
import { type LabGrade } from '@/lib/interactive-assignments/lab-grades'
import { letterGrade } from '@/lib/assessment-results/gradebook'
import AssignmentSimulation from './AssignmentSimulation'
import {useEffect,useRef,useState} from 'react'
import {subscribePageReturn} from '@/lib/page-return'
import Link from 'next/link'
import {Play, PencilLine, RotateCcw, Eye, CalendarDays, ClipboardCheck, CircleCheck, CircleAlert, Cloud} from 'lucide-react'
import {emptyVelocityState,missingVelocityAnswers,type VelocityState} from '@/lib/interactive-assignments/velocity'
import type {Work,Review,Assignment} from '@/lib/interactive-assignments/server'
import LessonActivity from './LessonActivity'
import AssignmentWorkspace from './AssignmentWorkspace'
import {assignmentBySlug,assignmentByDay} from '@/lib/interactive-assignments/catalog'
import s from './assignment.module.css'
type Data={questionEdition?:VelocityState['foundationQuestionEdition'];locked?:boolean;prerequisites?:{id:string;title:string}[];grade?:LabGrade|null;loadedId?:string;slug?:string;reviews?:Review[];targets?:{id:string;statement:string}[];assignment?:Assignment;staff:boolean;work?:Work;review?:Review;target?:{statement:string}}
export default function VelocityAssignment({id}:{id:string}){
 const [data,setData]=useState<Data|null>(null),[state,setState]=useState(emptyVelocityState),[error,setError]=useState(''),[status,setStatus]=useState('Loading…'),[busy,setBusy]=useState(false),[submitted,setSubmitted]=useState(false),[retry,setRetry]=useState(0)
 const foundationSave=useRef<FoundationSaveHandle|null>(null)
 const latest=useRef(state),version=useRef(0),saved=useRef(''),chain=useRef<Promise<unknown>>(Promise.resolve()),submitId=useRef<string|null>(null),submitting=useRef(false),conflict=useRef(false)
 const lesson=foundationEdition(assignmentBySlug(data?.assignment?.slug??data?.slug??id)??assignmentByDay(3)!,data?.work?.state??{foundationQuestionEdition:data?.questionEdition})
 const previewEdition=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('edition')==='cpa'?'?edition=cpa':''
 const endpoint='/api/interactive-assignments/'+id+previewEdition
 useEffect(()=>{setData(null);submitId.current=null;submitting.current=false;setBusy(false);const c=new AbortController();foundationRequest(endpoint,{signal:c.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok&&!d.locked)throw Error(d.error);return d as Data}).then(d=>{const value=d.work?.state??{...emptyVelocityState(),...(d.questionEdition?{foundationQuestionEdition:d.questionEdition}:{})};latest.current=value;saved.current=JSON.stringify(value);version.current=d.work?.version??0;setState(value);setData({...d,loadedId:id});setSubmitted(d.work?.status==='submitted');conflict.current=false;setError('');setStatus(d.staff?'Teacher preview · work is not saved':d.work?'Saved to your account':'Ready to begin')}).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[endpoint,retry,id])
 function change(value:VelocityState){latest.current=value;setState(value);setStatus(data?.staff?'Teacher preview · work is not saved':'Unsaved changes');setError('')}
 function persist(submit=false){
  const task=chain.current.catch(()=>{}).then(async()=>{
   if(conflict.current)throw Error('Your saved work changed in another tab. Copy any unsaved answers before reloading saved work.')
   if(!data||data.loadedId!==id||data.staff||data.locked||submitted)return false
   const value=latest.current,serialized=JSON.stringify(value)
   if(!submit&&serialized===saved.current)return true
   setStatus(submit?'Submitting…':'Saving…')
   const r=await foundationRequest(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:version.current,state:value,...(submit?{submitId:submitId.current}: {})})})
   const result=await r.json();if(!r.ok){if(r.status===409&&result.error?.includes('changed'))conflict.current=true;throw Error(result.error??'Could not save. Your answers are still on this page.')}
   version.current=result.version;saved.current=serialized
   setStatus(JSON.stringify(latest.current)===serialized?'Saved to your account':'Unsaved changes')
   if(submit){setError('');setSubmitted(true);setStatus('Submitted to your teacher')}
   return true
  })
  chain.current=task
  return task.catch(e=>{setError(e.message);setStatus('Save needs attention');return false})
 }
 useEffect(()=>{if(!data||data.staff||submitted||submitting.current)return;const timer=setTimeout(()=>{void persist()},900);return()=>clearTimeout(timer)},[state,data,submitted]) // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(!data?.staff&&JSON.stringify(latest.current)!==saved.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[data?.staff])
 useEffect(()=>{if(data?.locked)return subscribePageReturn(()=>setRetry(n=>n+1))},[data?.locked])
 async function submit(){if(submitting.current)return;const missing=missingVelocityAnswers(latest.current,lesson.questions);if(missing.length&&!(lesson.foundation&&FOUNDATION_SUBMISSION_GATES_PAUSED)){setError('Add a response to '+missing.map(id=>{if(!lesson.foundation)return id.replace(/^r2-/,'');const part=lesson.sections.findIndex(s=>s.questions.some(q=>q.id===id));const n=lesson.sections[part].questions.findIndex(q=>q.id===id);return String(part+1)+String.fromCharCode(97+n)}).join(', ')+'. Your answers do not need to be correct to submit.');return}submitting.current=true;setBusy(true);try{if(lesson.foundation&&foundationSave.current){const check=await foundationSave.current.prepare();if(!check.ok){setError(check.message||'Check your discussion steps before submitting.');return}}submitId.current??=newSubmissionId();await persist(true)}catch{setError('Could not start this submission. Your answers are still here. Try again.')}finally{setBusy(false);submitting.current=false}}
 if(!data||data.loadedId!==id)return <main className={s.page}><h1>Interactive assignment</h1><p role={error?'alert':'status'}>{error||'Loading assignment…'}</p>{error&&<button onClick={()=>setRetry(n=>n+1)}>Retry</button>}</main>
 if(data.locked)return <main className={s.page}><Link href="/home">← My assignments</Link><header className={s.intro}><p className={s.eyebrow}>Review assignment</p>{lesson.transferBrief&&<p className={s.meta}>Transfer Brief · Transfer Task category</p>}<h1>{lesson.title}</h1></header><section className={s.part} aria-labelledby="review-locked-title"><h2 id="review-locked-title">Complete your foundation first</h2><p>This review unlocks when you submit your own foundation work. You do not need to wait for teacher grading.</p>{data.assignment?.due_on&&<p>Review due {new Date(data.assignment.due_on+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'America/New_York',month:'long',day:'numeric'})}</p>}{data.prerequisites?.map(p=><p key={p.id}><Link href={'/interactive-assignments/'+p.id}>{p.title} →</Link></p>)}<button onClick={()=>setRetry(n=>n+1)}>Check access</button></section></main>
 const complete=lesson.questions.filter(q=>state.answers[q.id]?.trim()).length
 const savedStatus=submitted||status==='Saved to your account'
 const StatusIcon=data.staff?Eye:status==='Save needs attention'?CircleAlert:savedStatus?CircleCheck:Cloud
 return <main className={`${s.page} ${s.assignmentPage}`}>{!data.staff&&data.assignment&&<RevisionCycle sourceKey={'interactive:'+data.assignment.id} submitted={submitted}/>}<header className={s.bar}><Link href={data.staff?'/admin/interactive-assignments':'/home'}>{data.staff?'← Interactive assignments':'← My assignments'}</Link><span>{lesson.unit.replace('unit-', 'Unit ')} · {lesson.simulation ? 'Simulation investigation' : lesson.title}</span>{!lesson.foundation&&<b><span translate="no">{`${complete} / ${lesson.questions.length}`}</span><span> answered</span></b>}</header>
 <div className={s.intro}>
  <p className={s.eyebrow}>{lesson.transferBrief ? 'Transfer Brief · Apply, explain, decide' : 'Student assignment · Learn, practice, explain'}</p>
  <h1>{lesson.title}</h1>
  {lesson.foundation&&<p className={s.meta}>{data.questionEdition==='cpa-v1'?'CPA · Guided questions':data.questionEdition==='honors-v1'?'Honors · Original questions':'Original questions · Existing work'}{data.staff&&<> · <a href={'/interactive-assignments/'+lesson.slug+(data.questionEdition==='cpa-v1'?'':'?edition=cpa')}>Preview {data.questionEdition==='cpa-v1'?'Honors':'CPA'}</a></>}</p>}
  {lesson.transferBrief&&<p className={s.meta}>Grade category: Transfer Task</p>}
  {lesson.transferBrief?<p>{TRANSFER_BRIEF_SCENES[lesson.transferBrief.scene].context} {TRANSFER_BRIEF_SCENES[lesson.transferBrief.scene].role}</p>:lesson.foundation?null:<ol className={s.lessonGuide} aria-label="How to use this lesson" role="list">
   <li><span className={s.guideIcon}><Play aria-hidden="true"/></span><div><strong>{lesson.transferBrief ? 'Brief' : lesson.foundation ? 'Slides' : lesson.simulation ? 'Explore' : 'Watch'}</strong><p>{lesson.transferBrief ? 'Read the scenario, data and assumptions.' : lesson.simulation ? 'Predict, change a condition, and run a trial.' : lesson.foundation ? 'Read a section of the foundational slides.' : 'Watch a section of the teaching tool.'}</p></div></li>
   <li><span className={s.guideIcon}><PencilLine aria-hidden="true"/></span><div><strong>Work</strong><p>{lesson.simulation ? 'Record your evidence and answer beside the model.' : lesson.slug==='day-3-velocity' ? 'Walk, replay, and graph your avatar’s motion in Work.' : 'Switch to Work and try the matching questions.'}</p></div></li>
   <li><span className={s.guideIcon}><RotateCcw aria-hidden="true"/></span><div><strong>Revisit</strong><p>{lesson.transferBrief ? 'Check that your evidence supports your real-world decision.' : lesson.simulation ? 'Compare trials and use the results to explain why.' : lesson.foundation ? 'Work with your chosen group at three stops, then write your own reflections.' : 'Return to the film whenever you need it.'}</p></div></li>
  </ol>}
  <div className={s.lessonMeta}>
   <p className={s.statusBadge} data-tone={data.staff?'preview':status==='Save needs attention'?'attention':savedStatus?'saved':'neutral'} role="status"><StatusIcon aria-hidden="true"/><span>{submitted?'Submitted to your teacher':lesson.foundation&&status==='Saved to your account'?'Individual answers saved':status}</span></p>
   {data.assignment?.due_on&&<p className={s.dueBadge}><CalendarDays aria-hidden="true"/><span>Due</span><time dateTime={data.assignment.due_on}>{new Date(data.assignment.due_on+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'America/New_York',weekday:'long',month:'long',day:'numeric'})}</time></p>}
  </div>
  {data.staff&&<aside className={s.teacherNote} aria-label="Teacher note"><ClipboardCheck aria-hidden="true"/><div><h2>For your mastery review</h2><p>{lesson.targetNote}</p></div></aside>}
 </div>
 <FoundationLanguage foundation={lesson.foundation} cpa={!submitted&&hasCpaSupport(data.staff,data.assignment?.courseTrack,data.questionEdition)}><FoundationCollaboration key={id} id={id} enabled={!!lesson.foundation} foundation={lesson.foundation} preview={data.staff} readOnly={submitted||busy} archived={submitted} saveHandle={foundationSave} cpa={!submitted&&hasCpaSupport(data.staff,data.assignment?.courseTrack,data.questionEdition)}>{lesson.foundation&&<FoundationGroupLobby/>}<AssignmentWorkspace resourceLabel={lesson.transferBrief?'Brief':lesson.foundation?'Slides':undefined} key={id} sampleStudent={data.staff} lesson={lesson} answers={state.answers} submitted={submitted} renderTool={lesson.transferBrief ? ()=><TransferBriefContext lesson={lesson}/> : lesson.foundation ? ()=><FoundationSlides key={lesson.foundation} foundation={lesson.foundation} sections={lesson.sections}/> : lesson.simulation ? visible => <AssignmentSimulation lesson={lesson} state={state} onChange={change} readOnly={submitted||busy} visible={visible}/> : undefined}>
 {hasDimensionGrade(lesson)&&<details className={s.feedback}><summary>How this {isTransferBrief(lesson)?'brief':'lab'} is graded</summary><p>{isTransferBrief(lesson)?TRANSFER_RUBRIC_SUMMARY:FOUR_DIMENSION_LAB_RUBRIC}</p><p>Your teacher reviews the grade and mastery separately before sharing results.</p></details>}
 {data.grade&&submitted&&<aside className={s.feedback}><h2>Released {isTransferBrief(lesson)?'Transfer Brief':'lab'} grade · {(100*data.grade.earned/data.grade.possible).toFixed(1)}% · {isDimensionRubric(data.grade.rubric_version)?labDimensionGrade(data.grade.items)?.letter:letterGrade(100*data.grade.earned/data.grade.possible)}</h2><p>{isDimensionRubric(data.grade.rubric_version)?'Lowest rubric dimension determines the grade':'Earlier question-point grade · Preserved'}</p><p>{data.grade.feedback}</p><LabGradeDetails grade={data.grade}/></aside>}
 {(data.reviews??(data.review?[data.review]:[])).map(review=><aside key={review.id} className={s.feedback}><h2>Your teacher’s feedback · {review.level} / 3</h2><p className={s.meta}>{data.targets?.find(t=>t.id===review.target_id)?.statement}</p><p>{review.feedback||'Your teacher has reviewed this assignment.'}</p><Link href="/dashboard/growth">View mastery growth →</Link></aside>)}
 {lesson.transferBrief?<TransferBriefResponses lesson={lesson} state={state} onChange={change} readOnly={submitted||busy}/>:<LessonActivity lesson={lesson} state={state} onChange={change} readOnly={submitted||busy} sectionEndActivity={lesson.foundation?index=>index<3?<FoundationExchange index={index}/>:null:undefined}/>}
 {lesson.foundation&&<FoundationCollaborationStatus questions={lesson.sections.flatMap((section,i)=>section.questions.map((q,j)=>({id:q.id,label:String(i+1)+String.fromCharCode(97+j),part:i+1,answered:!!state.answers[q.id]?.trim()})))}/>}
 <section id="assignment-submit" tabIndex={-1} aria-labelledby="assignment-submit-title" className={s.submit}>{lesson.foundation&&!submitted&&FOUNDATION_SUBMISSION_GATES_PAUSED&&<p>{FOUNDATION_SUBMISSION_PAUSED_NOTICE}</p>}<h2 id="assignment-submit-title">{submitted?'Submitted':'Turn it in'}</h2><p>{data.staff?'Teacher preview: students’ saved work will appear in your review desk.':submitted?hasDimensionGrade(lesson)?'Your teacher will review the grade and mastery suggestions before sharing your results.':'Your teacher can now review this snapshot and choose a mastery rating.':`${complete} of ${lesson.questions.length} responses entered. Submit when you have shown your thinking. You can submit answers even when you are unsure.`}</p>{error&&<aside className={s.error} role="alert"><p>{error}</p>{conflict.current?<button onClick={()=>setRetry(n=>n+1)}>Reload saved work</button>:null}</aside>}{!data.staff&&!submitted&&<div className={s.actions}><button disabled={busy} onClick={async()=>{if(lesson.foundation&&foundationSave.current&&!await foundationSave.current.save()){setError('Your discussion drafts need attention. Keep this page open and retry saving.');return}await persist()}}>Save now</button><button className={s.primary} disabled={busy} onClick={submit}>{busy?'Submitting…':'Submit to teacher'}</button></div>}{data.staff&&<Link href={lesson.simulation?'/admin/interactive-assignments/results?activity='+lesson.slug+(data.assignment?'&class='+data.assignment.course_id:''):'/admin/interactive-assignments'}>Open teacher review desk →</Link>}</section>
 </AssignmentWorkspace></FoundationCollaboration></FoundationLanguage></main>
}
