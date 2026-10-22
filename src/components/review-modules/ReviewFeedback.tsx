'use client'
import { useCallback,useEffect,useState } from 'react'
import type { ReviewManifest } from '@/lib/review-modules/state'
import s from './review.module.css'
type Feedback={percent:number;summary:string;next_step:string;items:{id:string;score:number;feedback:string;overridden:boolean}[]}
export default function ReviewFeedback({slug,manifest}:{slug:string;manifest:ReviewManifest}){
 const [score,setScore]=useState<Feedback|null>(null),[status,setStatus]=useState('queued'),[error,setError]=useState(false)
 const load=useCallback(async()=>{try{const r=await fetch('/api/review-modules/'+slug+'/score',{cache:'no-store'});if(!r.ok)throw Error();const x=await r.json();setScore(x.score);setStatus(x.status);setError(false)}catch{setError(true)}},[slug])
 useEffect(()=>{void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load()},15000);return()=>clearInterval(timer)},[load])
 return <section className={s.feedback} aria-label="Your review score"><div><strong>{score?`${score.percent}% · Your review score`:'Your review is submitted'}</strong><p role="status">{score?'Your written answers were scored with Claude. Your teacher can review and adjust the result.':error?'Your work is saved. Score updates are temporarily unavailable.':status==='error'?'Your work is saved. Your teacher can retry the scoring.':'Your work is saved. Your score and feedback will appear here when scoring finishes.'}</p></div>{score&&<details><summary>See feedback on your responses</summary><p>{score.summary}</p><p><strong>Next step:</strong> {score.next_step}</p>{score.items.map(i=><article key={i.id}><h2>{manifest.fields.find(f=>f.id===i.id)?.label??i.id}<span>{i.score}/4{i.overridden?' · Teacher adjusted':''}</span></h2><p>{i.feedback}</p></article>)}</details>}</section>
}
