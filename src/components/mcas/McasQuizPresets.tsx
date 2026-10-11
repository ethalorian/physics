'use client'
import {useState} from 'react'
import type {QuizQuestion,QuizTarget} from '@/lib/quizzes/types'
import s from './Mcas.module.css'
interface Preset {id:string;title:string;focus:string;questions:{targetSlug:string;question:QuizQuestion}[]}
export default function McasQuizPresets({targets,onChoose}:{targets:QuizTarget[];onChoose:(title:string,questions:QuizQuestion[])=>void}){
 const [presets,setPresets]=useState<Preset[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 async function load(){if(presets.length||busy)return;setBusy(true);setError('');try{const r=await fetch('/api/mcas/catalog?presets=1');const d=await r.json();if(!r.ok)throw Error(d.error??'Could not load quiz drafts.');setPresets(d.presets)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <details className={s.panel} onToggle={e=>{if(e.currentTarget.open)void load()}}><summary>Start with a prepared MCAS quiz</summary><p className={s.notice}>Three short quizzes follow the current motion lessons. Historical answer guides are independently worked teaching drafts; review all keys and scoring criteria before publishing.</p>{busy&&<p role="status">Loading quiz drafts…</p>}{error&&<p role="alert">{error} <button type="button" onClick={()=>void load()}>Retry quiz drafts</button></p>}<div className={s.items}>{presets.map(p=>{const missing=p.questions.some(q=>!targets.some(t=>t.slug===q.targetSlug));return <article className={s.item} key={p.id}><strong>{p.title}</strong><p>{p.focus}</p><p>{p.questions.length} questions · {p.questions.filter(q=>q.question.kind==='problem').length} open response</p>{missing&&<p>One or more learning targets are unavailable in this class.</p>}<button type="button" disabled={missing} onClick={()=>onChoose(p.title,p.questions.map(({targetSlug,question})=>({...question,id:crypto.randomUUID(),target_id:targets.find(t=>t.slug===targetSlug)!.id})))}>Use {p.title.replace('MCAS · ','')} draft</button></article>})}</div></details>
}
