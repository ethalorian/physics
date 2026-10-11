'use client'
import Link from 'next/link'
import {useCallback,useEffect,useRef,useState} from 'react'
import {useRouter} from 'next/navigation'
import type {QuizDetail,QuizAnswers,QuizWork} from '@/lib/quizzes/types'
import {gradeLabel} from '@/lib/quizzes/types'
import {QuestionInput,QuestionPrompt,AnswerDisplay,QuizFeedback,answerComplete,dueLabel,quizFetch,useQuizData} from './shared'
import s from './Quiz.module.css'
import QuizContent from './QuizContent'
export default function QuizStudentWork({id}:{id:string}){const {data,error,loading,load}=useQuizData<QuizDetail>(`/api/quizzes/${id}`);return <div className={s.app}>{error&&<div role="alert" className={s.error}>{error}<button className={s.secondary} onClick={()=>void load()}>Try again</button></div>}{loading&&!data&&<p role="status">Loading your quiz…</p>}{data?.staff?<Link className={s.link} href={`/admin/quizzes?id=${id}`}>Open teacher review →</Link>:data&&<QuizSession key={`${id}:${data.work[0]?.submission_id??'draft'}:${data.work[0]?.state??'new'}`} data={data} reload={load}/>}</div>}
export function QuizSession({data,reload}:{data:QuizDetail;reload:()=>Promise<void>}){
 const {quiz,targets}=data,initial=data.work[0],router=useRouter()
 const [answers,setAnswers]=useState<QuizAnswers>(initial?.answers??{}),[index,setIndex]=useState(0),[review,setReview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState(initial?'All changes saved':'Your answers save as you work'),[revision,setRevision]=useState(0)
 const current=useRef(answers),saved=useRef(JSON.stringify(answers)),version=useRef(initial?.version??0),saving=useRef<Promise<void>|null>(null),mounted=useRef(true),submitRequest=useRef<string|null>(null),heading=useRef<HTMLHeadingElement>(null)
 const locked=quiz.status!=='published'||initial?.state==='submitted'||initial?.state==='graded'
 const submission=data.submissions.find(s=>s.id===initial?.submission_id),latestReview=data.reviews.find(r=>r.submission_id===submission?.id)
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 const flush=useCallback(async()=>{
  if(locked)return
  if(saving.current){await saving.current;return flush()}
  if(JSON.stringify(current.current)===saved.current)return
  const run=async()=>{
   if(mounted.current){setError('');setStatus('Saving…')}
   while(JSON.stringify(current.current)!==saved.current){
    const snapshot=current.current,serial=JSON.stringify(snapshot)
    const r=await quizFetch<{work:QuizWork}>(`/api/quizzes/${quiz.id}`,{action:'save',version:version.current,request_id:crypto.randomUUID(),answers:snapshot})
    version.current=r.work.version;saved.current=serial
   }
   if(mounted.current)setStatus('All changes saved')
  }
  saving.current=run();try{await saving.current}catch(e){if(mounted.current){setError((e as Error).message);setStatus('Not saved yet · keep this page open')}throw e}finally{saving.current=null}
 },[locked,quiz.id])
 useEffect(()=>{if(!revision||locked)return;const timer=setTimeout(()=>{void flush().catch(()=>{})},900);return()=>clearTimeout(timer)},[revision,flush,locked])
 useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(JSON.stringify(current.current)!==saved.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[])
 function change(id:string,value:QuizAnswers[string]){if(locked)return;const next={...current.current,[id]:value};current.current=next;submitRequest.current=null;setAnswers(next);setRevision(n=>n+1);setStatus('Unsaved changes')}
 function go(i:number){setReview(false);setIndex(i);requestAnimationFrame(()=>heading.current?.scrollIntoView({block:'start',behavior:'auto'}))}
 async function submit(){if(busy)return;setBusy(true);setError('');try{await flush();submitRequest.current??=crypto.randomUUID();await quizFetch(`/api/quizzes/${quiz.id}`,{action:'submit',version:version.current,request_id:submitRequest.current,answers:current.current});setStatus('Submitted for teacher review');await reload()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function leave(){setBusy(true);try{await flush();router.push('/quizzes')}catch{}finally{setBusy(false)}}
 const completed=quiz.questions.filter(q=>answerComplete(q,answers)).length,question=quiz.questions[index]
 return <><div className={`${s.row} ${s.toolbar}`}><button className={s.secondary} disabled={busy} onClick={()=>void leave()}>← All quizzes</button><span className={s.muted} role="status">{locked?(initial?.state==='graded'?'Grade returned':initial?.state==='submitted'?'Submitted · waiting for your teacher':'Quiz closed'):status}</span></div>
 <header className={s.hero}><p className={s.eyebrow}>SHOW WHAT YOU UNDERSTAND</p><h1>{quiz.title}</h1><QuizContent content={quiz.instructions}/><div className="mt-4"><span>{quiz.questions.length} questions · {quiz.questions.reduce((n,q)=>n+q.points,0)} points · {dueLabel(quiz.due_at)}</span></div></header>
 <details className={`${s.card} mb-4`}><summary>Learning targets for this quiz</summary>{targets.map(t=><div key={t.id} className={s.foot}><QuizContent content={t.statement}/></div>)}<p className={s.muted}>Your quiz grade and mastery ratings are separate. Your teacher decides what this evidence demonstrates.</p></details>
 {error&&<div role="alert" className={s.error}>{error}<button className={s.secondary} disabled={busy} onClick={()=>void flush().catch(()=>{})}>Retry saving</button></div>}
 {latestReview&&<div className="mb-4"><QuizFeedback review={latestReview} targets={targets}/></div>}
 {initial?.state==='submitted'&&<p role="status" className={`${s.notice} mb-4`}>Submitted. Your answers are saved and locked for review. Your teacher will return your grade and feedback here.</p>}
 {initial?.state==='returned'&&<p className={`${s.notice} mb-4`}>Your teacher requested a revision. Use the feedback, update your answers, and submit again. Earlier attempts stay in your history.</p>}
 {locked?<div className={s.stack}>{quiz.questions.map((q,i)=><section className={s.card} key={q.id}><QuestionPrompt question={q} index={i} showChoices/><div className="mt-4"><AnswerDisplay question={q} value={answers[q.id]}/></div>{latestReview?.decision==='graded'&&<><p className={s.foot}>Points: {q.kind==='choice'?(answers[q.id]===String(submission?.snapshot.questions.find(x=>x.id===q.id)?.correct_index)?q.points:0):latestReview.scores[q.id]} / {q.points}</p>{latestReview.question_notes[q.id]&&<div className={s.notice}><QuizContent content={latestReview.question_notes[q.id]}/></div>}<details className={s.history}><summary>Answer guide</summary><div className={s.answerGuide}><QuizContent content={submission?.snapshot.questions.find(x=>x.id===q.id)?.guide}/></div></details></>}</section>)}</div>:<>
 <div className={`${s.row} mb-3`}><strong>{completed} of {quiz.questions.length} answered</strong><button className={s.secondary} onClick={()=>setReview(p=>!p)}>{review?'Back to question':'Review before submitting'}</button></div><progress className={s.progress} value={completed} max={quiz.questions.length} aria-label="Questions answered"/>
 <nav className={`${s.questionNav} mb-4`} aria-label="Quiz questions">{quiz.questions.map((q,i)=><button key={q.id} disabled={busy} aria-label={`Question ${i+1}${answerComplete(q,answers)?' · answered':''}`} aria-current={!review&&i===index?'step':undefined} data-complete={answerComplete(q,answers)} onClick={()=>go(i)}>{i+1}</button>)}</nav>
 {review?<section className={`${s.card} ${s.stack}`}><h2>Review your responses</h2>{quiz.questions.map((q,i)=><div key={q.id}><div className={s.row}><p><strong>Question {i+1}</strong> · {answerComplete(q,answers)?'Answered':'Needs an answer'}</p><button className={s.secondary} onClick={()=>go(i)}>Edit question {i+1}</button></div><AnswerDisplay question={q} value={answers[q.id]}/></div>)}<p className={s.notice}>Submitting locks this attempt for your teacher’s review. It does not automatically change mastery.</p><button className={s.button} disabled={busy||completed!==quiz.questions.length} onClick={()=>void submit()}>{busy?'Submitting…':'Submit quiz for review'}</button></section>:question&&<section key={question.id} className={`${s.card} ${s.stack} ${s.question}`}><h2 ref={heading} tabIndex={-1}>Question {index+1}</h2><QuestionPrompt question={question} index={index}/><QuestionInput question={question} value={answers[question.id]} disabled={busy} onChange={v=>change(question.id,v)}/><div className={s.row}><button className={s.secondary} disabled={busy||index===0} onClick={()=>go(index-1)}>Previous</button><button className={s.button} disabled={busy} onClick={()=>index===quiz.questions.length-1?setReview(true):go(index+1)}>{index===quiz.questions.length-1?'Review & submit':'Next question'}</button></div></section>}
 <div className={`${s.row} ${s.foot}`}><button className={s.secondary} disabled={busy} onClick={()=>void flush().catch(()=>{})}>Save now</button><p className={s.muted}>Your teacher scores the physics. Minor grammar or spelling errors do not reduce a conceptual score.</p></div></>}
 {data.submissions.length>0&&<details className={`${s.card} ${s.history}`}><summary>Attempt history · {data.submissions.length}</summary><div className={s.stack}>{data.submissions.map((sub,i)=>{const r=data.reviews.find(r=>r.submission_id===sub.id);return <details key={sub.id}><summary>Attempt {data.submissions.length-i} · {new Date(sub.submitted_at).toLocaleString()} · {r?gradeLabel(r):'Awaiting review'}</summary>{r&&<div className={s.notice}><QuizContent content={r.note}/></div>}{sub.snapshot.questions.map((q,n)=><div className={s.foot} key={q.id}><QuestionPrompt question={q} index={n} showChoices/><AnswerDisplay question={q} value={sub.answers[q.id]}/></div>)}</details>})}</div></details>}
 </>
}
