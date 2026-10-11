'use client'
import { useCallback, useEffect, useState } from 'react'
import AssignmentDueInput from '@/components/ui/assignment-due-input'
import { dueDateDraft, dueDateValue } from '@/lib/assignment-due-input'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { readingDashboardHref } from '@/lib/reading-dashboard'
import { ArrowDown, ArrowLeft, BookOpen, Check, FileCheck2, ListTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { SYLLABUS_UNITS, nextSyllabusStep, type SyllabusCatalog, type SyllabusResource } from '@/lib/reading-syllabus'
import { honorsReadingUrl } from '@/lib/openstax-physics'
import { readingFetch } from './ReadingShared'
import styles from './ReadingSyllabus.module.css'

export default function ReadingSyllabus({ embedded = false, courseId, onChanged }: { embedded?: boolean; courseId?: string; onChanged?: () => void } = {}) {
  const params = useSearchParams(), router = useRouter(), requestedStep = params.get('step_id')
  const [data,setData]=useState<SyllabusCatalog|null>(null),[course,setCourse]=useState(''),[selected,setSelected]=useState(''),[unit,setUnit]=useState('unit-1')
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[due,setDue]=useState(()=>dueDateDraft(null))
  const load=useCallback(async(signal?:AbortSignal)=>{const value=await readingFetch<SyllabusCatalog>('/api/reading-syllabus',{signal});setData(value);const params=new URLSearchParams(location.search);const requested=value.steps.find(s=>s.id===params.get('step_id'));setCourse(c=>c||value.courses.find(c=>c.id===params.get('course_id'))?.id||value.courses[0]?.id||'');setSelected(s=>s||requested?.id||value.steps[0]?.id||'');if(requested)setUnit(requested.unit)},[])
  useEffect(()=>{const c=new AbortController();void load(c.signal).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[load])
  useEffect(()=>{if(courseId){setCourse(courseId);setDue(dueDateDraft(null));setNotice('')}},[courseId])
  useEffect(()=>{if(requestedStep&&data?.steps.some(s=>s.id===requestedStep)){setSelected(requestedStep);setUnit(data.steps.find(s=>s.id===requestedStep)!.unit)}},[requestedStep,data?.steps])
  const chosen=data?.courses.find(c=>c.id===course),step=data?.steps.find(s=>s.id===selected)
  const bundles=data?.bundles.filter(b=>b.course_id===course)??[],bundle=bundles.find(b=>b.step_id===selected)
  useEffect(()=>{setDue(dueDateDraft(bundle?.reading.due_at))},[course,selected,bundle?.reading.due_at,bundle?.reading.version])
  const released=bundle?.reading.status==='published'&&bundle.practice.status==='published'&&bundle.readingQuiz.status==='published'
  const next=data?nextSyllabusStep(data.steps,bundles):null
  const sequence=data?.steps.filter(s=>s.unit===unit)??[]
  const prerequisites=data?.steps.filter(s=>step?.prerequisites.includes(s.id))??[]
  const unreleased=prerequisites.filter(s=>!bundles.some(b=>b.step_id===s.id&&b.reading.status!=='draft'))
  function choose(id:string){if(embedded)router.replace(readingDashboardHref({view:'syllabus',courseId:course,stepId:id}));setSelected(id);setUnit(data?.steps.find(s=>s.id===id)?.unit??'unit-1');setError('');setNotice('');setDue(dueDateDraft(null))}
  async function act(action:'prepare'|'release'){
    if(!step||!chosen)return
    setBusy(true);setError('');setNotice('')
    try{
      await readingFetch('/api/reading-syllabus',{method:'POST',body:JSON.stringify({course_id:course,step_id:step.id,action,...(action==='release'?{version:bundle?.reading.version,due_at:dueDateValue(due)}:{})})})
      await load();onChanged?.();setNotice(action==='release'&&released?'Reading and vocabulary practice dates updated. Quiz dates can be changed from each quiz.':action==='prepare'?'Four connected drafts are ready. Review the reading and its quiz before assigning.':'Reading and vocabulary practice assigned. The reading quiz unlocks after submission and stays marked Needs completion until the student submits the quiz.')
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  const resource=(r:SyllabusResource,label:string,href:string)=><div className={styles.resource}><div><strong>{label}</strong><span>{r.status==='draft'?'Draft · review before assigning':r.status==='published'?(label==='Reading quiz'?'Unlocks after reading submission':'Assigned'):r.status}</span></div>{r.id?<Button asChild variant="outline"><Link href={href}>Open {label.toLowerCase()}</Link></Button>:<span>Unavailable</span>}</div>
  return <div className={embedded?styles.embedded:styles.page}>
    {!embedded && <Button asChild variant="ghost" className="self-start"><Link href="/admin/readings"><ArrowLeft/>All readings</Link></Button>}
    <header className={styles.header}><div><p className="text-overline text-primary">Shared foundation · CPA & Honors</p>{embedded?<h2 className="text-title-1 mt-2">Reading syllabus</h2>:<h1 className="text-display mt-2">Reading syllabus</h1>}<p className="text-muted-foreground mt-3">One idea at a time. Connect the reading, learn its language, then bring the idea back in a quiz.</p></div><ListTree size={38} aria-hidden="true"/></header>
    {error&&<div role="alert" className="border border-destructive rounded-lg p-4 text-destructive">{error}<Button variant="outline" onClick={()=>{setError('');void load().catch(e=>setError(e.message))}}>Retry</Button></div>}
    {!data?!error&&<Spinner/>:!data.courses.length?<Card className="p-6">Connect an active Physics class to use the syllabus.</Card>:<>
      <div className={styles.toolbar}>{!embedded&&<label>Class<select aria-label="Class" value={course} disabled={busy} onChange={e=>{setCourse(e.target.value);setNotice('');setDue(dueDateDraft(null))}}>{data.courses.map(c=><option key={c.id} value={c.id}>{c.name}{c.section?` · ${c.section}`:''}</option>)}</select></label>}<label>Unit<select aria-label="Unit" value={unit} disabled={busy} onChange={e=>{setUnit(e.target.value);const first=data.steps.find(s=>s.unit===e.target.value);if(first)choose(first.id)}}>{SYLLABUS_UNITS.map(([id,title],i)=><option key={id} value={id}>{i+1}. {title}</option>)}</select></label><Button variant="outline" disabled={!next||busy} onClick={()=>next&&choose(next)}>Next unassigned reading</Button></div>
      <p className="text-caption text-muted-foreground">{data.steps.length} reading steps · {bundles.filter(b=>b.reading.status==='published').length} readings assigned in this class · Teacher controls release{chosen?.track==='honors'?' · OpenStax + shared foundation':' · Hewitt + course readings'}</p>
      {notice&&<p role="status" className="border border-success rounded-lg p-4">{notice}</p>}
      <div className={styles.layout}><nav className={styles.tree} aria-label="Reading sequence"><ol>{sequence.map(s=>{const saved=bundles.find(b=>b.step_id===s.id);return <li key={s.id}><button disabled={busy} aria-current={selected===s.id?'step':undefined} onClick={()=>choose(s.id)}><span className={styles.number}>{saved?.reading.status==='published'?<Check size={17}/>:data.steps.indexOf(s)+1}</span><span><strong>{s.title}</strong><small>{saved?saved.reading.status==='draft'?'Drafts ready':'Reading assigned':s.id===next?'Next suggested step':'Not assigned'}</small></span></button></li>})}</ol></nav>
      {step&&<div key={`${course}:${step.id}`} className={styles.detail}>
        <Card className="p-5 sm:p-7 gap-4"><p className="text-overline text-primary">Step {data.steps.indexOf(step)+1}</p><h2 className="text-title-1">{step.title}</h2><p>{step.focus}</p>
          <div><h3 className="text-caption text-muted-foreground">Builds on</h3><div className={styles.links}>{prerequisites.length?prerequisites.map(s=><Button key={s.id} variant="outline" disabled={busy} onClick={()=>choose(s.id)}>{s.title}</Button>):<span>This is a starting point.</span>}</div></div>
          {!!unreleased.length&&<p className="text-caption text-muted-foreground">Earlier readings have not been assigned here: {unreleased.map(s=>s.title).join('; ')}. You can start here if these ideas were already taught.</p>}
        </Card>
        <div className={styles.branch}><BookOpen size={20}/><div><h3 className="text-title-3">Read & explain</h3>{chosen?.track==='honors'&&step.honorsReading?<><p>College Physics for AP® Courses 2e · §{step.honorsReading.sections.join(', ')} · pp. {step.honorsReading.from}–{step.honorsReading.to}</p><p className="text-muted-foreground mt-2">{step.honorsReading.focus}</p><Button asChild variant="outline"><Link href={honorsReadingUrl(step.honorsReading)} target="_blank">Preview OpenStax pages</Link></Button></>:step.passage?<details><summary>Preview course reading</summary><p className="whitespace-pre-wrap mt-3">{step.passage}</p></details>:<><p>Hewitt · Sections {step.sections.join(', ')}</p><Button asChild variant="outline"><Link href={`/textbook?ch=${step.chapter}`} target="_blank">Preview Hewitt chapter</Link></Button></>}
          <p className="mt-4 font-medium">Reading response</p><p>{step.readingCheck.prompt}</p></div></div>
        <ArrowDown className="text-muted-foreground ml-4" aria-hidden="true"/>
        <div className={styles.branch}><BookOpen size={20}/><div><h3 className="text-title-3">Learn the vocabulary</h3><p className="text-muted-foreground">Preview these words, read them in context, then practice recall.</p><dl className={styles.words}>{step.words.map(w=><div key={w.term}><dt>{w.term}</dt><dd>{w.definition}</dd></div>)}</dl><p className="text-caption text-muted-foreground">2 checks per word · 80% practice accuracy · definitions from existing class word sets are reused when available.</p></div></div>
        <ArrowDown className="text-muted-foreground ml-4" aria-hidden="true"/>
        <div className={styles.branch}><FileCheck2 size={20}/><div><h3 className="text-title-3">Check understanding & revisit</h3><p>Reading quiz: unlocks upon reading submission. A new application{prerequisites.length?' + a question from an earlier prerequisite':''}{chosen?.track==='honors'?' + a modeling extension':''}.</p><p className="mt-2">Vocabulary quiz: explain each word and use it in a specific example.</p><details className="mt-4"><summary>Preview reading quiz & teacher guide</summary><p className="mt-3">{step.quizCheck.prompt}</p><p className="text-muted-foreground mt-2">{step.quizCheck.guide}</p>{prerequisites[0]&&<p className="mt-3">Revisit: {prerequisites[0].quizCheck.prompt}</p>}{chosen?.track==='honors'&&<p className="mt-3">Extension: {step.honors.prompt}</p>}</details></div></div>
        <Card className="p-5 gap-4"><h3 className="text-title-3">Assignments for {chosen?.name}</h3>{bundle?<>
          {resource(bundle.reading,'Reading',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'reading',id:bundle.reading_id}):`/admin/readings?id=${bundle.reading_id}`)}
          {resource(bundle.practice,'Vocabulary practice',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'practice',id:bundle.practice_id}):`/admin/vocabulary/tasks?task_id=${bundle.practice_id}`)}
          {resource(bundle.readingQuiz,'Reading quiz',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'readingQuiz',id:bundle.reading_quiz_id}):`/admin/quizzes?id=${bundle.reading_quiz_id}`)}
          {resource(bundle.vocabularyQuiz,'Vocabulary quiz',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'vocabularyQuiz',id:bundle.vocabulary_quiz_id}):`/admin/quizzes?id=${bundle.vocabulary_quiz_id}`)}
          {bundle.reading.status!=='archived'&&<><AssignmentDueInput label="Reading & practice due" value={due} onChange={setDue} disabled={busy||data.readOnly}/><Button disabled={busy||data.readOnly} onClick={()=>void act('release')}>{busy?'Saving…':released?'Update reading & practice date':'Assign reading sequence'}</Button><p className="text-caption text-muted-foreground">A newly assigned reading quiz uses this deadline; you can change each quiz’s date from its assignment. The reading quiz unlocks after each student submits the reading. They may take it later; it stays in their outstanding quizzes until submitted. The vocabulary quiz stays a draft until you publish it.</p></>}
        </>:<><p>Prepare a reading, vocabulary practice, reading quiz, and vocabulary quiz for this step. All begin as drafts.</p><Button disabled={busy||data.readOnly} onClick={()=>void act('prepare')}>{busy?'Preparing…':'Prepare four connected assignments'}</Button></>}{data.readOnly&&<p>Switch back to your own account to assign work.</p>}</Card>
      </div>}</div>
    </>}
  </div>
}
