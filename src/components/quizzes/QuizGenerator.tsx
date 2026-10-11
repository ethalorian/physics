'use client'
import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,Sparkles} from 'lucide-react'
import type {Quiz,QuizCatalog} from '@/lib/quizzes/types'
import {QUIZ_LANGUAGE_LABELS,type QuizLanguageLevel} from '@/lib/quizzes/language'
import {generationRequest,type QuizGenerationRequest,type QuizSources} from '@/lib/quizzes/generation'
import {useQuizData} from './shared'
import s from './Quiz.module.css'

const storageKey='quiz-generation-pending'
function remember(request:QuizGenerationRequest|null){try{if(request)sessionStorage.setItem(storageKey,JSON.stringify(request));else sessionStorage.removeItem(storageKey)}catch{/* A saved draft remains available in the quiz center. */}}
export default function QuizGenerator({initialClass='',initialLesson='',onGenerated,onCancel}:{initialClass?:string;initialLesson?:string;onGenerated:(q:Quiz)=>void;onCancel:()=>void}){
 const {data:catalog,error,load}=useQuizData<QuizCatalog>('/api/quizzes/catalog')
 const [course,setCourse]=useState(initialClass),[restored,setRestored]=useState<QuizGenerationRequest|null>(null),[recovering,setRecovering]=useState(true)
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved){const valid=generationRequest(saved);setRestored(valid);setCourse(valid.course_id)}}catch{remember(null)}setRecovering(false)},[])
 return <div className={s.app}><header className={s.hero}><p className={s.eyebrow}>QUIZ STUDIO · CLAUDE</p><h1>From lesson to quiz.</h1><p>Choose what students should understand. Get a draft with fresh questions, answer keys, and scoring guidance, ready for your review.</p></header><button className={`${s.secondary} mb-4`} onClick={onCancel}><ArrowLeft size={16}/>Back to quizzes</button>
 {error&&<p className={s.error} role="alert">{error}<button className={s.secondary} onClick={()=>void load()}>Retry</button></p>}
 {!catalog||recovering?<p role="status">Loading your classes…</p>:<div className={s.stack}><section className={s.card}><label className={s.field}>Class<select value={course} disabled={!!restored} onChange={e=>setCourse(e.target.value)}><option value="">Choose your class…</option>{catalog.courses.map(c=><option key={c.id} value={c.id}>{c.name} · {c.section}</option>)}</select></label></section>
 {course&&catalog.courses.some(c=>c.id===course)?<GenerationForm key={course} course={course} initialLesson={initialLesson} restored={restored} onPending={setRestored} catalog={catalog} onGenerated={onGenerated}/>:restored?<p className={s.error}>That class is no longer available. <button className={s.secondary} onClick={()=>{remember(null);setRestored(null);setCourse('')}}>Choose another class</button></p>:<p className={s.notice}>Pick the class that will receive this quiz when you publish it.</p>}</div>}
 </div>
}

function GenerationForm({course,initialLesson,restored,onPending,catalog,onGenerated}:{course:string;initialLesson:string;restored:QuizGenerationRequest|null;onPending:(r:QuizGenerationRequest|null)=>void;catalog:QuizCatalog;onGenerated:(q:Quiz)=>void}){
 const {data,error:loadError,load}=useQuizData<QuizSources>(`/api/quizzes/generate?course_id=${encodeURIComponent(course)}`)
 const [lessonId,setLessonId]=useState(restored?.lesson_id??initialLesson),[selected,setSelected]=useState<string[]>(restored?.target_ids??[]),[unit,setUnit]=useState('')
 const [count,setCount]=useState(restored?.count??5),[format,setFormat]=useState<QuizGenerationRequest['format']>(restored?.format??'mixed'),[emphasis,setEmphasis]=useState(restored?.emphasis??'')
 const [language,setLanguage]=useState<QuizLanguageLevel>(restored?.language_level??(catalog.courses.find(c=>c.id===course)?.track==='honors'?'honors':'cpa')),[sei,setSei]=useState(restored?.sei_supports??false)
 const [busy,setBusy]=useState(false),[polling,setPolling]=useState(!!restored),[error,setError]=useState(''),[request,setRequest]=useState(restored)
 const initialized=useRef(false),done=useRef(false),generated=useRef(onGenerated)
 generated.current=onGenerated
 const finish=(q:Quiz)=>{if(done.current)return;done.current=true;remember(null);onPending(null);generated.current(q)}
 const fail=(message:string)=>{setError(message);remember(null);onPending(null);setRequest(null);setPolling(false);setBusy(false)}
 useEffect(()=>{
  if(!data||initialized.current)return
  initialized.current=true
  if(!restored&&initialLesson){const lesson=data.lessons.find(l=>l.id===initialLesson);if(lesson)setSelected(lesson.target_ids.slice(0,5));else{setLessonId('');setError('This lesson is not in this class’s current curriculum. Choose a current lesson or targets below.')}}
 },[data,initialLesson,restored])
 useEffect(()=>{
  if(!polling||!request)return
  let stopped=false,timer:ReturnType<typeof setTimeout>
  const poll=async()=>{
   try{
    const response=await fetch(`/api/quizzes/generate?id=${encodeURIComponent(request.id)}`),result=await response.json()
    if(stopped)return
    if(!response.ok){setError(result.error||'Could not recover the draft. Retry the request below.');setPolling(false);return}
    if(result.status==='ready'){finish(result.quiz);return}
    if(result.status==='failed'||result.interrupted&&!result.resumable){fail(result.error||'Generation was interrupted. You can generate a new draft.');return}
    if(result.resumable){setPolling(false);setError('Your questions are saved. Choose Resume draft to finish opening them.');return}
    timer=setTimeout(poll,2500)
   }catch{if(!stopped){setPolling(false);setError('Connection interrupted. Resume the saved request below.')}}
  }
  void poll()
  return()=>{stopped=true;clearTimeout(timer)}
 // The request ID owns this polling loop; callbacks read current props through a ref.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[polling,request])
 async function generate(){
  if(busy||polling)return
  const next=request??{id:crypto.randomUUID(),course_id:course,lesson_id:lessonId||null,target_ids:[...selected].sort(),count,format,emphasis,language_level:language,sei_supports:sei}
  setBusy(true);setError('');setRequest(next);remember(next);onPending(next)
  try{
   const response=await fetch('/api/quizzes/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)})
   const result=await response.json()
   if(!response.ok){if(result.failed||[400,403,422,503].includes(response.status))fail(result.error);else setError(result.error||'Could not finish. Resume this draft to try again.');return}
   if(result.quiz)finish(result.quiz);else setPolling(true)
  }catch{setError('Connection interrupted. Resume this request to check for your saved draft.')}
  finally{setBusy(false)}
 }
 if(!data)return <section className={s.card}>{loadError?<p role="alert">{loadError}<button className={s.secondary} onClick={()=>void load()}>Retry</button></p>:<p role="status">Loading current lessons and targets…</p>}</section>
 const lesson=data.lessons.find(l=>l.id===lessonId)
 const targets=lesson?data.targets.filter(t=>lesson.target_ids.includes(t.id)):data.targets.filter(t=>!unit||t.unit_id===unit)
 const frozen=busy||polling||!!request
 return <div className={s.builder}><section className={`${s.card} ${s.stack}`}>
 <fieldset disabled={frozen||catalog.readOnly} className={s.stack}><div><p className={s.eyebrow}>1 · CHOOSE THE SCOPE</p><h2>What are you checking?</h2></div>
 <label className={s.field}>Lesson<select value={lessonId} onChange={e=>{setLessonId(e.target.value);setSelected(data.lessons.find(l=>l.id===e.target.value)?.target_ids.slice(0,count)??[])}}><option value="">Targets only · choose below</option>{data.lessons.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
 {lesson?<p className={s.muted}>Uses the lesson’s written content, video summary, and linked targets. Questions stay within what this lesson teaches.</p>:<label className={s.field}>Filter targets by unit<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="">All units</option>{catalog.units.filter(u=>u.program===catalog.courses.find(c=>c.id===course)?.program).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
 <fieldset className={s.stack}><legend className={s.field}>Learning targets · {selected.length} selected</legend><div className={s.generationTargets}>{targets.map(t=><label className={s.option} key={t.id}><input type="checkbox" checked={selected.includes(t.id)} disabled={!selected.includes(t.id)&&selected.length>=Math.min(count,8)} onChange={e=>setSelected(e.target.checked?[...selected,t.id]:selected.filter(id=>id!==t.id))}/><span>{t.statement}</span></label>)}</div>{!targets.length&&<p className={s.notice}>No mastery targets are linked here yet. Choose targets only or another lesson.</p>}{selected.some(id=>!targets.some(t=>t.id===id))&&<div className={s.chips}>{data.targets.filter(t=>selected.includes(t.id)&&!targets.some(v=>v.id===t.id)).map(t=><button type="button" className={s.secondary} key={t.id} onClick={()=>setSelected(selected.filter(id=>id!==t.id))}>Remove: {t.statement}</button>)}</div>}</fieldset>
 <div><p className={s.eyebrow}>2 · SHAPE THE QUIZ</p><div className={s.two}><label className={s.field}>Questions<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[3,5,8,10].map(n=><option key={n} value={n}>{n} questions</option>)}</select></label><label className={s.field}>Question format<select value={format} onChange={e=>setFormat(e.target.value as QuizGenerationRequest['format'])}><option value="mixed">Choice + written reasoning</option><option value="choice">Multiple choice</option><option value="written">Explanations & worked problems</option></select></label></div></div>
 <label className={s.field}>Quiz language level<select value={language} onChange={e=>setLanguage(e.target.value as QuizLanguageLevel)}><option value="cpa">CPA · Grade 6 reading</option><option value="honors">Honors · Grade 9 reading</option></select><span className={s.muted}>Defaults to this section’s track. You can assign either version to CPA or Honors. Physics targets stay the same.</span></label>
 <label className={s.toggle}><input type="checkbox" checked={sei} onChange={e=>setSei(e.target.checked)}/><span>Add SEI language supports</span></label><p className={s.muted}>Optional chunked directions, word support, and neutral sentence starters, without giving away the physics. Off by default.</p>
 <label className={s.field}>Anything to emphasize? (optional)<textarea rows={3} maxLength={1000} placeholder="For example: focus on signs and direction; include a common misconception." value={emphasis} onChange={e=>setEmphasis(e.target.value)}/></label>
 </fieldset></section><aside className={`${s.card} ${s.aside} ${s.stack}`}><div><p className={s.eyebrow}>READY FOR YOUR REVIEW</p><h2>{count} questions</h2><p className={s.badge}>{QUIZ_LANGUAGE_LABELS[language]}</p><p>{sei?'SEI supports included':'SEI supports off'}</p><p>{selected.length} mastery target{selected.length===1?'':'s'}</p></div><p className={s.muted}>Includes answer keys, model responses, and partial-credit guidance. Review the wording for the chosen reading level before publishing.</p><p className={s.muted}>Student submissions appear in Student Center → Quizzes for grades and mastery ratings.</p>
 {!data.configured&&<p className={s.error} role="alert">Claude needs an API key configured on the server before generation is available.</p>}
 {error&&<p className={s.error} role="alert">{error}</p>}{error&&request&&!busy&&!polling&&<button className={s.secondary} onClick={()=>{remember(null);onPending(null);setRequest(null);setError('')}}>Start a new draft</button>}
 <button className={s.button} disabled={busy||polling||catalog.readOnly||!data.configured||!selected.length||selected.length>count} onClick={()=>void generate()}><Sparkles size={17}/>{busy||polling?'Creating your draft…':request?'Resume draft':'Generate quiz draft'}</button>
 {(busy||polling)&&<p className={s.muted} role="status">Claude is writing and checking the questions. This can take a minute. The completed draft is saved in your quiz center.</p>}
 <p className={s.muted}>Saved as a draft. Students receive it when you publish. Only lesson content, targets, and your directions are sent to Claude.</p></aside></div>
}
