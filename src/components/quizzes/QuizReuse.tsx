'use client'
import {useRef,useState} from 'react'
import type {Quiz,QuizCatalog} from '@/lib/quizzes/types'
import {quizFetch,useQuizData} from './shared'
import QuizLanguageBadges from './QuizLanguageBadges'
import s from './Quiz.module.css'
export default function QuizReuse({quiz,initialCourseId='',onCopied,onClose}:{quiz:Quiz;initialCourseId?:string;onCopied:(quiz:Quiz)=>void;onClose:()=>void}){
 const {data,error:loadError}=useQuizData<QuizCatalog>('/api/quizzes/catalog')
 const [course,setCourse]=useState(initialCourseId),[busy,setBusy]=useState(false),[error,setError]=useState(''),request=useRef(crypto.randomUUID()),running=useRef(false)
 const program=data?.courses.find(c=>c.id===quiz.course_id)?.program
 const destination=data?.courses.find(c=>c.id===course&&c.program===program)
 const selected=destination?.id??''
 async function save(){if(!destination||running.current)return;running.current=true;setBusy(true);setError('');try{const result=await quizFetch<{quiz:Quiz}>('/api/quizzes/reuse',{id:request.current,source_id:quiz.id,course_id:destination.id});onCopied(result.quiz)}catch(e){setError((e as Error).message)}finally{setBusy(false);running.current=false}}
 return <section className={`${s.card} ${s.stack} mb-4`} aria-label="Reuse saved quiz"><h2>Use this quiz in another section</h2><QuizLanguageBadges quiz={quiz}/><p className={s.muted}>The quiz’s language level and SEI supports stay the same in the new section.</p><p>The saved questions, answers, points, and mastery targets carry over. Choose students and a due date in the new draft before publishing.</p>{(error||loadError)&&<p role="alert" className={s.error}>{error||loadError}</p>}<label className={s.field}>Destination section<select disabled={busy||!data} value={selected} onChange={e=>{setCourse(e.target.value);request.current=crypto.randomUUID();setError('')}}><option value="">Choose a section…</option>{data?.courses.filter(c=>c.program===program).map(c=><option key={c.id} value={c.id}>{c.name} · {c.section}</option>)}</select></label>{destination&&<p className={s.notice}>New draft for <strong>{destination.name} · {destination.section}</strong>. The original quiz and its submissions stay in their section.</p>}<p className={s.muted}>Matching quiz versions appear together in Results & comparisons. Editing a question, target, instructions, or scoring guide creates a separate comparison version.</p><div className={s.actions}><button className={s.button} disabled={!destination||busy} onClick={()=>void save()}>{busy?'Saving…':'Save class draft'}</button><button className={s.secondary} disabled={busy} onClick={onClose}>Cancel</button></div></section>
}
