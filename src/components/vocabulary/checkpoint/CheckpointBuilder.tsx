'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { validateCheckpointQuestions, type CheckpointQuestion } from '@/lib/vocab-checkpoint'
import type { LearningWord } from '@/lib/vocab-learning'
import type {ScopedVocabularySet} from '@/lib/vocab-scope'
import s from './checkpoint.module.css'

interface Catalog {
 courses: {id:string;name:string;section:string;program:string}[]
 sets: ScopedVocabularySet[]
 words: LearningWord[]
 targets: {id:string;statement:string;program:string;unit_id:string}[]
 enrollments: {course_id:string;student_id:string;students:{id:string;name:string}|{id:string;name:string}[]}[]
}
export function CheckpointQuestionEditor({ questions, words, onChange, disabled=false }: {questions:CheckpointQuestion[];words:string[];onChange:(questions:CheckpointQuestion[])=>void;disabled?:boolean}) {
 const update=(id:string,patch:Partial<CheckpointQuestion>)=>onChange(questions.map(q=>q.id===id?{...q,...patch}:q))
 return <div>{questions.map((q,i)=><details className={s.questionDetail} key={q.id} open={!q.prompt||undefined}><summary><span>{i+1}. {q.words.join(' · ')}</span><span>{q.part} · {q.points} pt</span></summary><fieldset disabled={disabled} className={s.stack}>
  <label className={s.field}>Question {i+1}<textarea rows={3} value={q.prompt} maxLength={1500} onChange={e=>update(q.id,{prompt:e.target.value})}/></label>
  <fieldset><legend>Words assessed</legend><div className={s.chips}>{words.map(w=><label key={w}><input type="checkbox" checked={q.words.includes(w)} onChange={e=>update(q.id,{words:e.target.checked?[...q.words,w]:q.words.filter(x=>x!==w)})}/> {w}</label>)}</div></fieldset>
  {q.options&&<fieldset><legend>Answer choices · select the correct one</legend>{q.options.map((o,n)=><label key={n} className={s.option}><input type="radio" name={`correct-${q.id}`} aria-label={`Correct choice ${n+1} for question ${i+1}`} checked={q.answer===n} onChange={()=>update(q.id,{answer:n})}/><input aria-label={`Question ${i+1} choice ${n+1}`} value={o} maxLength={500} onChange={e=>update(q.id,{options:q.options!.map((v,j)=>j===n?e.target.value:v)})}/></label>)}</fieldset>}
  <label className={s.field}>Answer guide (teacher only until grade release)<textarea rows={3} maxLength={2000} value={q.explanation??''} onChange={e=>update(q.id,{explanation:e.target.value})}/></label>
  {q.part==='explain'&&<label className={s.field}>Sentence starter (optional)<input value={q.frame??''} maxLength={500} onChange={e=>update(q.id,{frame:e.target.value})}/></label>}
  {q.scene&&<Button size="lg" variant="outline" onClick={()=>update(q.id,{scene:undefined})}>Remove motion diagram</Button>}
 </fieldset></details>)}</div>
}
export default function CheckpointBuilder({ classId,unitId,onCancel,onAssigned }: {classId:string|null;unitId:string;onCancel:()=>void;onAssigned:(id:string)=>void}) {
 const [catalog,setCatalog]=useState<Catalog|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const [course,setCourse]=useState(classId??''),[target,setTarget]=useState(''),[setId,setSetId]=useState(''),[terms,setTerms]=useState<string[]>([])
 const [title,setTitle]=useState('Vocabulary checkpoint'),[due,setDue]=useState(''),[note,setNote]=useState('Show what you understand. Use precise vocabulary in short, clear explanations. Meaning and application count; minor spelling errors do not cost points.')
 const [audience,setAudience]=useState<string[]>([]),[individual,setIndividual]=useState(false)
 const [questions,setQuestions]=useState<CheckpointQuestion[]>([]),[approved,setApproved]=useState(false)
 const saving=useRef(false)
 useEffect(()=>{let active=true;fetch('/api/vocab/catalog').then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);if(active)setCatalog(d)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 const allowedWords=catalog?.words.filter(w=>catalog.sets.some(set=>set.access[course]?.includes(w.id)))??[]
 const selected=allowedWords.filter(w=>terms.includes(w.id))??[]
 const classProgram=catalog?.courses.find(c=>c.id===course)?.program??'physics'
 const changeQuestions=(q:CheckpointQuestion[])=>{setQuestions(q);setApproved(false)}
 async function buildDraft() {
  setBusy(true);setError('')
  try {const r=await fetch('/api/vocab/checkpoints',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({term_ids:terms})});const d=await r.json();if(!r.ok)throw new Error(d.error);changeQuestions(d.questions)}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function assign() {
  if(saving.current)return
  try {
   validateCheckpointQuestions(questions,selected.map(w=>w.term))
   if(!course||!target||!approved||individual&&!audience.length)throw new Error('Choose a class, target and students, then confirm your question review.')
   saving.current=true;setBusy(true);setError('')
   const r=await fetch('/api/vocab/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({course_ids:[course],student_ids:individual?audience:[],term_ids:terms,target_id:target,title,due_on:due,note,task_kind:'quiz',quiz_format:'checkpoint',min_checks:1,threshold:80,check_mode:'recognition',questions})})
   const d=await r.json();if(!r.ok)throw new Error(d.error)
   onAssigned(d.task_ids[0])
  }catch(e){setError((e as Error).message)}finally{saving.current=false;setBusy(false)}
 }
 return <section className={s.app}><div className={s.pageHeading}><div><p className={s.eyebrow}>ASSIGN VOCABULARY</p><h2 className="text-title-1">A checkpoint, ready to teach.</h2><p>The words students practiced. Fresh situations that show understanding.</p></div><Button size="lg" variant="outline" disabled={busy} onClick={onCancel}>Back to checkpoints</Button></div>
 {error&&<p role="alert" className={s.guidance}>{error}</p>}{!catalog?<p>Loading your classes and word sets…</p>:<fieldset disabled={busy} className={s.setupGrid}><div className={s.stack}>
 <Card className={s.paddedCard}><h3 className="text-title-2">Assignment details</h3><label className={s.field}>Title<input value={title} maxLength={200} onChange={e=>setTitle(e.target.value)}/></label><div className={s.twoColumns}><label className={s.field}>Class<select value={course} disabled={Boolean(classId)} onChange={e=>{setCourse(e.target.value);setTarget('');setAudience([]);setSetId('');setTerms([]);changeQuestions([])}}><option value="">Choose class…</option>{catalog.courses.map(c=><option key={c.id} value={c.id}>{c.name} · {c.section}</option>)}</select></label><label className={s.field}>Due date (optional)<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label></div>
 <label className={s.field}>Knowledge target<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose target…</option>{catalog.targets.filter(t=>(t.program??'physics')===classProgram&&t.unit_id===unitId).sort((a,b)=>Number(b.unit_id===unitId)-Number(a.unit_id===unitId)).map(t=><option key={t.id} value={t.id}>{t.unit_id} · {t.statement}</option>)}</select></label>
 <label className={s.field}>Student instructions<textarea value={note} rows={3} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label>
 <label className={s.toggle}><input type="checkbox" checked={individual} onChange={e=>setIndividual(e.target.checked)}/> Choose individual students (otherwise everyone in this class)</label>
 {individual&&<div className={s.chips}>{catalog.enrollments.filter(e=>e.course_id===course).map(e=><label key={e.student_id}><input type="checkbox" checked={audience.includes(e.student_id)} onChange={event=>setAudience(p=>event.target.checked?[...p,e.student_id]:p.filter(id=>id!==e.student_id))}/>{(Array.isArray(e.students)?e.students[0]:e.students)?.name}</label>)}</div>}
 </Card>
 <Card className={s.paddedCard}><h3 className="text-title-2">Your word set</h3><label className={s.field}>Word set<select value={setId} onChange={e=>{setSetId(e.target.value);setTerms(allowedWords.filter(w=>w.vocabulary_set_id===e.target.value).slice(0,12).map(w=>w.id));changeQuestions([])}}><option value="">Choose published word set…</option>{catalog.sets.filter(v=>v.course_ids.includes(course)).map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
 <p>Select 4–12 words. Every selected word must be assessed.</p><div className={s.chips}>{allowedWords.filter(w=>w.vocabulary_set_id===setId).map(w=><label key={w.id}><input type="checkbox" checked={terms.includes(w.id)} onChange={e=>{setTerms(p=>e.target.checked?[...p,w.id]:p.filter(id=>id!==w.id));changeQuestions([])}}/>{w.term}</label>)}</div>
 <Button size="lg" disabled={selected.length<4||selected.length>12||new Set(selected.map(w=>w.term.toLowerCase())).size!==selected.length} onClick={()=>void buildDraft()}>Load quiz questions</Button></Card>
 {!!questions.length&&<Card className={s.paddedCard}><h3 className="text-title-2">Review & edit questions</h3><p>{questions.every(q=>q.prompt.trim())?'All 10 questions are written, including answer keys and scoring guides. Review and edit before assigning.':'This selection uses a custom template. Complete the blank interpretation questions and review the answer choices and scoring guides before assigning.'}</p><CheckpointQuestionEditor questions={questions} words={selected.map(w=>w.term)} onChange={changeQuestions}/></Card>}
 </div><aside className={s.setupAside}><Card className={s.paddedCard}><p className={s.eyebrow}>QUIZ BLUEPRINT</p><h3 className="text-title-1">20 points. Three ways to show it.</h3><div className={s.blueprint}>{[['Recognize','4 questions × 1 point'],['Interpret','4 situations × 2 points'],['Explain','2 responses × 4 points']].map(([label,detail])=><div key={label}><strong>{label}</strong><p>{detail}</p></div>)}</div><p>12 points score automatically. You score the final 8 with partial credit.</p><p>Students can resume and review before submitting. You release the final grade.</p><p>Knowledge mastery stays a separate teacher judgment.</p><label className={s.toggle}><input type="checkbox" checked={approved} disabled={!questions.length} onChange={e=>setApproved(e.target.checked)}/> I reviewed the questions, fresh situations, and answer guides.</label><Button size="lg" disabled={!approved||!title.trim()} onClick={()=>void assign()}>{busy?'Assigning…':'Assign checkpoint'}</Button></Card></aside></fieldset>}
 </section>
}
