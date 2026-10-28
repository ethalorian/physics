'use client'
import RevisionCycle from '@/components/review-desk/RevisionCycle'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { useAssignmentLeaveGuard } from '@/hooks/useAssignmentLeaveGuard'
import { Button } from '@/components/ui/button'
import type { ReviewManifest, ReviewState } from '@/lib/review-modules/state'
import s from './review.module.css'
import { assignmentTimingLabel } from '@/lib/student-dashboard'
import ReviewFeedback from './ReviewFeedback'

type Loaded = { title:string;due_on?:string|null;closes_at?:string|null; locked:boolean; staff?:boolean; manifest?:ReviewManifest; html?:string; work?:{state:ReviewState;version:number;status:string;submitted_at?:string} }
export default function ReviewAssignment({slug}:{slug:string}) {
 const {status}=useSession()
 const [data,setData]=useState<Loaded|null>(null),[error,setError]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[saveStatus,setSaveStatus]=useState(''),[missing,setMissing]=useState<{label:string;screen:number}[]>([]),[completed,setCompleted]=useState(0)
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef<ReviewState|null>(null),version=useRef(0),saved=useRef(''),flight=useRef<Promise<boolean>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),halted=useRef(false)
 useAssignmentLeaveGuard(!data?.staff && data?.work?.status!=='submitted' && ['Unsaved changes','Saving…','Not saved','Submitting…'].includes(saveStatus))
 const endpoint='/api/review-modules/'+slug
 const load=useCallback(async()=>{
  setError('')
  try{const r=await fetch(endpoint,{cache:'no-store'});const body=await r.json();if(!r.ok)throw Error(body.error||'Could not load this assignment.');setData(body);if(body.work){latest.current=body.work.state;version.current=body.work.version;saved.current=JSON.stringify(body.work.state);setCompleted(Object.values(body.work.state.responses||{}).filter(v=>String(v).trim()).length);halted.current=false;setSaveStatus(body.work.status==='submitted'?'Submitted':'All changes saved')}}catch(e){setError(e instanceof Error?e.message:'Could not load this assignment.')}
 },[endpoint])
 useEffect(()=>{if(status==='authenticated')void load()},[status,load])
 const persist=useCallback(async(action:'save'|'submit'='save'):Promise<boolean>=>{
  if(flight.current){const ok=await flight.current;if(!ok)return false;return persist(action)}
  if(!latest.current||data?.staff||data?.work?.status==='submitted'||halted.current)return false
  const snapshot=JSON.stringify(latest.current)
  if(action==='save'&&snapshot===saved.current)return true
  setSaveStatus(action==='submit'?'Submitting…':'Saving…');setError('')
  const task=(async()=>{
   try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,version:version.current,state:JSON.parse(snapshot)})});const body=await r.json();if(!r.ok){if(r.status===409||r.status===403)halted.current=true;if(body.missing)setMissing(body.missing);throw Error(body.error||'Could not save your work.')}
    version.current=body.version;saved.current=snapshot;setMissing([])
    if(action==='submit'){setData(d=>d&&d.work?{...d,work:{...d.work,status:'submitted',submitted_at:body.submitted_at}}:d);setSaveStatus('Submitted');frame.current?.contentWindow?.postMessage({type:'review:init',state:latest.current,readOnly:true},location.origin)}else setSaveStatus(JSON.stringify(latest.current)===snapshot?'All changes saved':'Unsaved changes')
    return true
   }catch(e){setError(e instanceof Error?e.message:'Your work has not saved. Keep this page open and retry.');setSaveStatus('Not saved');return false}
  })();flight.current=task;const ok=await task;flight.current=null
  if(ok&&action==='save'&&JSON.stringify(latest.current)!==saved.current)return persist('save')
  return ok
 },[data?.staff,data?.work?.status,endpoint])
 useEffect(()=>{
  const receive=(e:MessageEvent)=>{
   if(e.source!==frame.current?.contentWindow||e.origin!==location.origin)return
   if(e.data?.type==='review:ready'){frame.current?.contentWindow?.postMessage({type:'review:init',state:latest.current,readOnly:data?.work?.status==='submitted'},location.origin);return}
   if(e.data?.type!=='review:change'||!e.data.state)return
   if(data?.staff||data?.work?.status==='submitted')return
   latest.current=e.data.state;setCompleted(Object.values(e.data.state.responses||{}).filter(v=>typeof v==='string'&&v.trim()).length);setSaveStatus('Unsaved changes')
   if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void persist(),800)
  }
  window.addEventListener('message',receive)
  const leave=(e:BeforeUnloadEvent)=>{if(!data?.staff&&data?.work?.status!=='submitted'&&JSON.stringify(latest.current)!==saved.current){e.preventDefault();e.returnValue=''}}
  window.addEventListener('beforeunload',leave)
  return()=>{window.removeEventListener('message',receive);window.removeEventListener('beforeunload',leave);if(timer.current)clearTimeout(timer.current)}
 },[data?.staff,data?.work?.status,persist])
 async function unlock(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'unlock',code})});const body=await r.json();if(!r.ok)throw Error(body.error);setCode('');await load()}catch(e){setError(e instanceof Error?e.message:'Could not unlock.')}finally{setBusy(false)}}
 async function submit(){setBusy(true);if(timer.current)clearTimeout(timer.current);await persist('submit');setBusy(false)}
 if(status==='unauthenticated')return <section className={s.gate}><p className={s.eyebrow}>Unit 1 · Review assignment</p><h1>Sign in to save your work</h1><p>Use your school account, then enter the review code from your teacher.</p><Button onClick={()=>signIn('google',{callbackUrl:'/review/'+slug})}>Sign in with Google</Button></section>
 if(!data)return <section className={s.gate}><h1>Review assignment</h1><p role={error?'alert':'status'}>{error||'Loading your assignment…'}</p>{error&&<Button onClick={load}>Try again</Button>}</section>
 if(data.locked)return <section className={s.gate}><p className={s.eyebrow}>Teacher code required</p><h1>{data.title}</h1>{data.closes_at&&<p>{assignmentTimingLabel({due:data.due_on??null,closesAt:data.closes_at})}</p>}<p>Enter the code your teacher gave your class. Your responses and self-checks will save to your account.</p><form onSubmit={unlock}><label htmlFor="review-code">Class review code</label><input id="review-code" type="password" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={80} value={code} onChange={e=>setCode(e.target.value)} required/><Button disabled={busy}>{busy?'Checking…':'Open assignment'}</Button></form>{error&&<p role="alert">{error}</p>}<Link href="/home">Back to my assignments</Link></section>
 return <div className={s.assignment}>{!data.staff&&<RevisionCycle sourceKey={'review:'+slug} submitted={data.work?.status==='submitted'}/>}<header className={s.bar}><div><Link href={data.staff?'/admin/review-modules':'/home'}>{data.staff?'← Teacher reviews':'← My assignments'}</Link><h1>{data.title}</h1>{data.closes_at&&<p>{assignmentTimingLabel({due:data.due_on??null,closesAt:data.closes_at})}</p>}<p role="status">{data.staff?'Teacher preview · responses are not saved':`${completed} of ${data.manifest?.fields.length} responses · ${saveStatus}`}</p></div>{!data.staff&&data.work?.status!=='submitted'&&<div className={s.actions}><Button variant="outline" onClick={()=>persist()} disabled={busy}>Save now</Button><Button onClick={submit} disabled={busy}>{busy?'Submitting…':'Submit assignment'}</Button></div>}{data.work?.status==='submitted'&&<strong>Submitted to your teacher</strong>}</header>
 {error&&<div role="alert" className={s.error}><p>{error}</p>{missing.length>0&&<details open><summary>Responses to finish</summary><ul>{missing.map((f,i)=><li key={i}><button onClick={()=>{if(latest.current)frame.current?.contentWindow?.postMessage({type:'review:init',state:{...latest.current,i:f.screen},readOnly:false},location.origin)}}>Screen {f.screen+1}: {f.label}</button></li>)}</ul></details>}{!halted.current&&<Button variant="outline" onClick={()=>persist()}>Retry saving</Button>}</div>}
 {!data.staff&&data.work?.status==='submitted'&&data.manifest&&<ReviewFeedback slug={slug} manifest={data.manifest}/>}
 <iframe ref={frame} title={data.title} srcDoc={data.html} className={s.frame} style={busy?{pointerEvents:"none"}:undefined}/></div>
}
