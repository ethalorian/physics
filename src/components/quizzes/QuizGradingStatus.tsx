'use client'
import { nextTimeText } from '@/lib/teacher-feedback'
import {useEffect,useState} from 'react'
import type {QuizDetail} from '@/lib/quizzes/types'
import {quizFetch} from './shared'
import s from './Quiz.module.css'
export default function QuizGradingStatus({data,submissionId,onReady,onFill}:{data:QuizDetail;submissionId?:string;onReady:()=>Promise<void>;onFill?:()=>void}){
 const [activeAction,setActiveAction]=useState<'retry'|'check'|'feedback'|null>(null),[notice,setNotice]=useState(''),[error,setError]=useState(''),[retryVersion,setRetryVersion]=useState<string|null>(null)
 const busy=activeAction!==null
 const ai=data.ai?.find(a=>a.submission_id===submissionId),ready=ai?.status==='ready'&&ai.result
 useEffect(()=>{
  if(retryVersion===null)return
  if(ai?.status==='ready'||ai?.status==='error'&&ai.updated_at!==retryVersion){setRetryVersion(null);return}
  const timer=setInterval(()=>{if(document.visibilityState==='visible')void onReady()},5000)
  return()=>clearInterval(timer)
 },[retryVersion,ai?.status,ai?.updated_at,onReady])
 const pending=data.ai?.filter(a=>data.work.some(w=>w.submission_id===a.submission_id&&w.state==='submitted'))??[]
 async function run(action:'retry'|'check'|'feedback'){
  setActiveAction(action);setError('');setNotice('')
  try{const r=await quizFetch<{message?:string}>(`/api/quizzes/${data.quiz.id}/grading`,{action,submission_id:submissionId});setNotice(r.message??'Analysis requested. Your saved work is unchanged.');if(action==='retry')setRetryVersion(ai?.updated_at??'');await onReady()}catch(e){setError((e as Error).message)}finally{setActiveAction(null)}
 }
 if(data.worksheet)return <section className={`${s.card} ${s.stack}`} aria-label="Answer-key scoring"><h3>Answer-key scoring</h3><p>Multiple-choice points are calculated from the saved answer key. Review the responses, add feedback, and choose a separate mastery decision for each target before releasing results.</p></section>
 return <section className={`${s.card} ${s.stack}`} aria-label="Claude grading"><div className={s.row}><h3>Claude grading</h3><span className={s.badge}>{ready?'Claude draft · Private':ai?.status==='processing'?'Analyzing submission':ai?.status==='queued'?'Queued':ai?.status==='error'?'Needs attention':'Automatic on submission'}</span></div>
 <p className={s.muted}>Claude suggests scores, mastery ratings and feedback. Scores fill automatically. You choose which mastery suggestions and feedback to use before release.</p>
 {data.claudeConfigured===false&&<p className={s.error}>The Claude API connection needs attention. Submitted work is saved.</p>}
 {ready&&<><p>{ready.summary}</p><p><strong>Next time:</strong> {nextTimeText(ready.next_step)}</p>{ready.items.some(i=>i.confidence==='low')&&<p className={s.notice}>Claude flagged uncertain scoring. Inspect the marked answers before returning the grade.</p>}{onFill&&<button type="button" className={s.secondary} disabled={data.readOnly||busy} onClick={onFill}>Fill missing automatic scores</button>}</>}
 {ai?.status==='error'&&<p className={s.error}>{ai.error??'Analysis could not finish. Retry or review the work yourself.'}</p>}
 {!submissionId&&<p>{pending.filter(a=>a.status==='ready').length} scored · {pending.filter(a=>a.status==='queued'||a.status==='processing').length} analyzing · {pending.filter(a=>a.status==='error').length} need attention</p>}
 <div className={s.actions}>{data.ai?.some(a=>a.status==='ready'&&data.work.some(w=>w.submission_id===a.submission_id&&w.state==='submitted'))&&<button type="button" className={s.secondary} disabled={busy||data.readOnly} onClick={()=>void run('feedback')}>{activeAction==='feedback'?'Refreshing feedback…':"Refresh this quiz’s AI feedback in my style"}</button>}{submissionId&&(ai?.status==='error'||ai?.status==='queued'||ai?.status==='processing'&&!!ai.locked_until&&Date.parse(ai.locked_until)<Date.now())&&<button type="button" disabled={busy||data.readOnly} className={s.secondary} onClick={()=>void run('retry')}>Retry Claude analysis</button>}<button type="button" className={s.secondary} disabled={busy||data.readOnly} onClick={()=>void run('check')}>{activeAction==='check'?'Checking…':'Check Claude connection'}</button></div>
 {notice&&<p role="status" className={s.notice}>{notice}</p>}{error&&<p role="alert" className={s.error}>{error}</p>}
 </section>
}
