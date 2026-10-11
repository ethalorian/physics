'use client'
import {useState} from 'react'
import Link from 'next/link'
import type {QuizQuestion,QuizTarget} from '@/lib/quizzes/types'
import type {LearningWord} from '@/lib/vocab-learning'
import type {ScopedVocabularySet} from '@/lib/vocab-scope'
import {useQuizData} from './shared'
import s from './Quiz.module.css'

export default function QuizVocabulary({courseId,defaultTarget,questionCount,onAdd}:{courseId:string;defaultTarget:string;questionCount:number;onAdd:(questions:QuizQuestion[])=>void}){
 const {data,error,loading,load}=useQuizData<{sets:ScopedVocabularySet[];words:LearningWord[];targets:QuizTarget[]}>(`/api/quizzes/vocabulary?class=${encodeURIComponent(courseId)}`)
 const [setId,setSetId]=useState(''),[wordIds,setWordIds]=useState<string[]>([]),[targetId,setTargetId]=useState(''),[message,setMessage]=useState('')
 const set=data?.sets.find(x=>x.id===setId),words=data?.words.filter(w=>w.vocabulary_set_id===setId)??[]
 const targets=(data?.targets??[]).filter(t=>set?.target_ids.length?set.target_ids.includes(t.id):true)
 const selected=words.filter(w=>wordIds.includes(w.id)),validTarget=targets.some(t=>t.id===targetId)
 const selectSet=(id:string)=>{
  setSetId(id);setWordIds((data?.words??[]).filter(w=>w.vocabulary_set_id===id).slice(0,12).map(w=>w.id));setMessage('')
  const ids=data?.sets.find(s=>s.id===id)?.target_ids??[], linked=(data?.targets??[]).filter(t=>ids.includes(t.id)),knowledge=linked.filter(t=>t.domain==='knowledge')
  setTargetId(ids.includes(defaultTarget)?defaultTarget:knowledge.length===1?knowledge[0].id:linked.length===1?linked[0].id:!ids.length?defaultTarget:'')
 }
 const add=()=>{
  if(!validTarget||selected.length<2||selected.length>12||questionCount+selected.length>30)return
  if(new Set(selected.map(w=>w.term.trim().toLowerCase())).size!==selected.length){setMessage('Choose words with different names.');return}
  onAdd(selected.map(w=>{
   const choices=[w,...selected.filter(x=>x.id!==w.id).slice(0,3)]
   for(let n=choices.length-1;n>0;n--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(n+1);[choices[n],choices[j]]=[choices[j],choices[n]]}
   return {id:crypto.randomUUID(),kind:'choice',prompt:`Which term matches this meaning?\n\n${w.definition}`,points:1,target_id:targetId,options:choices.map(x=>x.term),correct_index:choices.findIndex(x=>x.id===w.id),guide:`${w.term}: ${w.definition}`,vocabulary:[w.term]}
  }));setMessage(`Added ${selected.length} vocabulary questions. Review their answers and target below.`)
 }
 return <section className={s.vocabularyPanel} aria-labelledby="quiz-vocabulary-heading">
  <div><p className={s.eyebrow}>CLASS VOCABULARY</p><h3 id="quiz-vocabulary-heading">Words connected to this class</h3><p className={s.muted}>Choose vocabulary from an open lesson or a separate class assignment.</p></div>
  {!courseId?<p className={s.notice}>Choose the quiz’s class above to see its vocabulary.</p>:loading?<p role="status">Loading this class’s vocabulary…</p>:error?<p className={s.error} role="alert">{error} <button type="button" className={s.secondary} onClick={()=>void load()}>Retry</button></p>:!data?.sets.length?<div className={s.notice}><p>No vocabulary is available for this class yet.</p><p><Link href={`/admin/dashboard?class=${courseId}`}>Open a lesson</Link> or <Link href={`/admin/vocabulary/assign?class=${courseId}`}>assign vocabulary</Link> to make its words available here.</p></div>:<>
   <label className={s.field}>Lesson or vocabulary assignment<select value={setId} onChange={e=>selectSet(e.target.value)}><option value="">Choose lesson vocabulary…</option>{data.sets.map(set=><option key={set.id} value={set.id}>{set.lesson_title?'Lesson: ':'Assigned: '}{set.label} · {set.term_ids.length} {set.term_ids.length===1?'word':'words'}</option>)}</select></label>
   {set&&<><div className={s.notice}><strong>{set.lesson_title??'Separately assigned vocabulary'}</strong><p className={s.muted}>{set.unit_name}{set.assignment_titles.length?` · Assigned as: ${set.assignment_titles.join('; ')}`:''}</p>{set.lesson_id&&<Link href={`/admin/lessons/${set.lesson_id}?class=${courseId}`}>Open connected lesson →</Link>}</div>
    <label className={s.field}>Mastery target for these words<select value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">Choose the target to assess…</option>{targets.map(t=><option key={t.id} value={t.id}>{t.statement}</option>)}</select></label>
    {validTarget&&<p className={s.muted}>{targets.find(t=>t.id===targetId)?.statement}</p>}
    <div className={s.checklist}>{words.map(w=><label key={w.id}><input type="checkbox" checked={wordIds.includes(w.id)} onChange={e=>{setWordIds(e.target.checked?[...wordIds,w.id]:wordIds.filter(id=>id!==w.id));setMessage('')}}/><span><strong>{w.term}</strong><span className={s.wordDefinition}>{w.definition}</span></span></label>)}</div>
    <button type="button" className={s.secondary} disabled={!validTarget||selected.length<2||selected.length>12||questionCount+selected.length>30} onClick={add}>Add {selected.length} recognition questions</button>
    <p className={s.muted}>Select 2–12 words. Review the definitions and distractors, then add an application question to assess more than recognition.</p>
   </>}
  </>}
  {message&&<p role="status" className={s.notice}>{message}</p>}
 </section>
}
