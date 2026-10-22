'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import AssignmentDueInput from '@/components/ui/assignment-due-input'
import { dueDateDraft, dueDateValue } from '@/lib/assignment-due-input'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { isInteractiveSyllabusStep } from '@/lib/reading-availability'
import { initialReadingStep, syllabusInteractiveHref, textbookStepChapter } from '@/lib/reading-authoring'
import { READING_ASSIGNMENT_XP } from '@/lib/xp-policy'
import { readingDashboardHref } from '@/lib/reading-dashboard'
import { ArrowDown, ArrowLeft, BookOpen, Check, FileCheck2, ListTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { SYLLABUS_UNITS, nextSyllabusStep, type SyllabusCatalog, type SyllabusResource } from '@/lib/reading-syllabus'
import { honorsReadingUrl } from '@/lib/openstax-physics'
import { readingFetch } from './ReadingShared'
import styles from './ReadingSyllabus.module.css'

export default function ReadingSyllabus({ embedded = false, creating = false, courseId, onChanged }: { embedded?: boolean; creating?: boolean; courseId?: string; onChanged?: () => void } = {}) {
  const params = useSearchParams(), router = useRouter(), requestedStep = params.get('step_id')
  const [data,setData]=useState<SyllabusCatalog|null>(null),[course,setCourse]=useState(''),[selected,setSelected]=useState(''),[unit,setUnit]=useState('unit-1')
  const [mode,setMode]=useState<'course'|'textbook'>(creating ? 'textbook' : 'course'),[book,setBook]=useState('hewitt'),[chapter,setChapter]=useState('2'),[readingTarget,setReadingTarget]=useState(''),[vocabularyTarget,setVocabularyTarget]=useState('')
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[due,setDue]=useState(()=>dueDateDraft(null))
  const appliedRequest=useRef<string|null>(null)
  const load=useCallback(async(signal?:AbortSignal)=>{
    const value=await readingFetch<SyllabusCatalog>('/api/reading-syllabus',{signal});setData(value)
    const query=new URLSearchParams(location.search)
    const initialCourse=courseId||value.courses.find(c=>c.id===query.get('course_id'))?.id||value.courses[0]?.id||''
    const requested=initialReadingStep(value,{courseId:initialCourse,stepId:query.get('step_id'),book:query.get('book'),chapter:query.get('ch'),creating})
    setCourse(c=>c||initialCourse)
    setSelected(s=>s||requested?.id||'')
    if(!query.get('step_id')&&creating&&requested){setBook(requested.sourceBook??'hewitt');setChapter(textbookStepChapter(requested))}
  },[courseId,creating])
  useEffect(()=>{const c=new AbortController();void load(c.signal).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[load])
  useEffect(()=>{if(courseId){setCourse(courseId);setDue(dueDateDraft(null));setNotice('')}},[courseId])
  useEffect(()=>{
    if(!requestedStep||appliedRequest.current===requestedStep)return
    const requested=[...(data?.steps??[]),...(data?.textbookSteps??[])].find(s=>s.id===requestedStep)
    if(!requested)return
    appliedRequest.current=requestedStep;setSelected(requestedStep)
    if(requested.sourceBook){setMode('textbook');setBook(requested.sourceBook);setChapter((requested.honorsReading?.sections[0]??String(requested.chapter)).split('.')[0])}
    else {setMode('course');setUnit(requested.unit)}
  },[requestedStep,data?.steps,data?.textbookSteps])
  const steps=[...(data?.steps??[]),...(data?.textbookSteps??[])]
  const chosen=data?.courses.find(c=>c.id===course),step=steps.find(s=>s.id===selected)
  const bundles=data?.bundles.filter(b=>b.course_id===course)??[],bundle=bundles.find(b=>b.step_id===selected)
  useEffect(()=>{setDue(dueDateDraft(bundle?.reading.due_at))},[course,selected,bundle?.reading.due_at,bundle?.reading.version])
  const released=bundle?.reading.status==='published'&&bundle.practice.status==='published'&&bundle.readingQuiz.status==='published'
  const next=data?nextSyllabusStep(data.steps.filter(s=>isInteractiveSyllabusStep(s,chosen?.track)),bundles):null
  const sequence=(mode==='course'?data?.steps.filter(s=>s.unit===unit)??[]:(data?.textbookSteps??[]).filter(s=>s.sourceBook===book&&(s.honorsReading?.sections[0]??String(s.chapter)).split('.')[0]===chapter)).filter(s=>isInteractiveSyllabusStep(s,chosen?.track))
  const chapterChoices=[...new Set((data?.textbookSteps??[]).filter(s=>s.sourceBook===book&&isInteractiveSyllabusStep(s,chosen?.track)).map(s=>(s.honorsReading?.sections[0]??String(s.chapter)).split('.')[0]))].sort((a,b)=>+a-+b)
  const mappingTargets=data?.targets.filter(t=>t.unit_id===unit&&t.program==='physics')??[]
  const interactiveHref=step&&chosen?syllabusInteractiveHref(step,chosen,bundle?.reading.id):null
  const wrongTrack=!!step&&!isInteractiveSyllabusStep(step,chosen?.track)
  useEffect(()=>{setReadingTarget('');setVocabularyTarget('')},[selected,course,unit])
  const prerequisites=data?.steps.filter(s=>step?.prerequisites.includes(s.id))??[]
  const unreleased=prerequisites.filter(s=>!bundles.some(b=>b.step_id===s.id&&b.reading.status!=='draft'))
  function choose(id:string){router.replace(embedded?readingDashboardHref({view:creating?'assignments':'syllabus',courseId:course,stepId:id,...(creating?{create:true,resource:'reading'}:{})}):`/admin/readings/syllabus?course_id=${course}&step_id=${id}`);setSelected(id);const nextStep=steps.find(s=>s.id===id);if(!nextStep?.selectionRequired)setUnit(nextStep?.unit??'unit-1');setError('');setNotice('');setDue(dueDateDraft(null))}
  async function act(action:'prepare'|'release'){
    if(!step||!chosen)return
    setBusy(true);setError('');setNotice('')
    try{
      await readingFetch('/api/reading-syllabus',{method:'POST',body:JSON.stringify({course_id:course,step_id:step.id,action,...(step.selectionRequired?{unit,reading_target:readingTarget,vocabulary_target:vocabularyTarget}:{}),...(action==='release'?{version:bundle?.reading.version,due_at:dueDateValue(due)}:{})})})
      await load();onChanged?.();setNotice(action==='release'&&released?'Reading and vocabulary practice dates updated. Quiz dates can be changed from each quiz.':action==='prepare'?'Four connected drafts are ready. Review the reading and its quiz before assigning.':'Reading and vocabulary practice assigned. The reading quiz unlocks after submission and stays marked Needs completion until the student submits the quiz.')
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  const resource=(r:SyllabusResource,label:string,href:string)=><div className={styles.resource}><div><strong>{label}</strong><span>{r.status==='draft'?'Draft · review before assigning':r.status==='published'?(label==='Reading quiz'?'Unlocks after reading submission':'Assigned'):r.status}</span></div>{r.id?<Button asChild variant="outline"><Link href={href}>Open {label.toLowerCase()}</Link></Button>:<span>Unavailable</span>}</div>
  return <div className={embedded?styles.embedded:styles.page}>
    {!embedded && <Button asChild variant="ghost" className="self-start"><Link href="/admin/readings"><ArrowLeft/>All readings</Link></Button>}
    <header className={styles.header}><div><p className="text-overline text-primary">Shared foundation · CPA & Honors</p>{embedded?<h2 className="text-title-1 mt-2">{creating?'Create an interactive reading':'Reading syllabus'}</h2>:<h1 className="text-display mt-2">Reading syllabus</h1>}<p className="text-muted-foreground mt-3">{creating?'Choose a section from either interactive textbook. Prepare its reading response, vocabulary practice, reading quiz, and vocabulary quiz together.':'One idea at a time. Connect the reading, learn its language, then bring the idea back in a quiz.'}</p></div><ListTree size={38} aria-hidden="true"/></header>
    {error&&<div role="alert" className="border border-destructive rounded-lg p-4 text-destructive">{error}<Button variant="outline" onClick={()=>{setError('');void load().catch(e=>setError(e.message))}}>Retry</Button></div>}
    {!data?!error&&<Spinner/>:!data.courses.length?<Card className="p-6">Connect an active Physics class to use the syllabus.</Card>:<>
      <div className={styles.toolbar}>{!embedded&&<label>Class<select aria-label="Class" value={course} disabled={busy} onChange={e=>{setCourse(e.target.value);setNotice('');setDue(dueDateDraft(null))}}>{data.courses.map(c=><option key={c.id} value={c.id}>{c.name}{c.section?` · ${c.section}`:''}</option>)}</select></label>}<label>Reading plan<select aria-label="Reading plan" value={mode} disabled={busy} onChange={e=>{const m=e.target.value as 'course'|'textbook';setMode(m);const first=m==='course'?data.steps[0]:data.textbookSteps?.find(s=>s.sourceBook===book);if(first){choose(first.id);if(first.selectionRequired)setChapter((first.honorsReading?.sections[0]??String(first.chapter)).split('.')[0])}}}><option value="course">Course sequence</option><option value="textbook">Textbook section</option></select></label>{mode==='course'?<><label>Unit<select aria-label="Unit" value={unit} disabled={busy} onChange={e=>{setUnit(e.target.value);const first=data.steps.find(s=>s.unit===e.target.value);if(first)choose(first.id)}}>{SYLLABUS_UNITS.map(([id,title],i)=><option key={id} value={id}>{i+1}. {title}</option>)}</select></label><Button variant="outline" disabled={!next||busy} onClick={()=>next&&choose(next)}>Next unassigned reading</Button></>:<><label>Textbook<select aria-label="Textbook" value={book} disabled={busy} onChange={e=>{setBook(e.target.value);const first=data.textbookSteps?.find(s=>s.sourceBook===e.target.value);if(first){choose(first.id);setChapter((first.honorsReading?.sections[0]??String(first.chapter)).split('.')[0])}}}><option value="hewitt">Hewitt</option><option value="openstax">OpenStax · Honors</option></select></label><label>Chapter<select aria-label="Chapter" value={chapter} disabled={busy} onChange={e=>{setChapter(e.target.value);const first=data.textbookSteps?.find(s=>s.sourceBook===book&&(s.honorsReading?.sections[0]??String(s.chapter)).split('.')[0]===e.target.value);if(first)choose(first.id)}}>{chapterChoices.map(c=><option key={c} value={c}>Chapter {c}</option>)}</select></label></>}</div>
      <p className="text-caption text-muted-foreground">{mode==='course'?data.steps.length:data.textbookSteps?.length??0} reading steps · {bundles.filter(b=>b.reading.status==='published').length} readings assigned in this class · Teacher controls release{chosen?.track==='honors'?' · OpenStax + shared foundation':' · Hewitt + course readings'}</p>
      {notice&&<p role="status" className="border border-success rounded-lg p-4">{notice}</p>}
      <div className={styles.layout}><nav className={styles.tree} aria-label="Reading sequence"><ol>{sequence.map(s=>{const saved=bundles.find(b=>b.step_id===s.id);return <li key={s.id}><button disabled={busy} aria-current={selected===s.id?'step':undefined} onClick={()=>choose(s.id)}><span className={styles.number}>{saved?.reading.status==='published'?<Check size={17}/>:mode==='textbook'?(s.honorsReading?.sections[0]??s.sections[0]):data.steps.indexOf(s)+1}</span><span><strong>{s.title}</strong><small>{saved?saved.reading.status==='draft'?'Drafts ready':'Reading assigned':s.id===next?'Next suggested step':'Not assigned'}</small></span></button></li>})}</ol></nav>
      {step&&<div key={`${course}:${step.id}`} className={styles.detail}>
        <Card className="p-5 sm:p-7 gap-4"><p className="text-overline text-primary">{mode==='textbook'?'Textbook section':`Step ${data.steps.indexOf(step)+1}`}</p><h2 className="text-title-1">{step.title}</h2><p>{step.focus}</p>
          {!step.selectionRequired&&<div><h3 className="text-caption text-muted-foreground">Builds on</h3><div className={styles.links}>{prerequisites.length?prerequisites.map(s=><Button key={s.id} variant="outline" disabled={busy} onClick={()=>choose(s.id)}>{s.title}</Button>):<span>This is a starting point.</span>}</div></div>}
          {!!unreleased.length&&<p className="text-caption text-muted-foreground">Earlier readings have not been assigned here: {unreleased.map(s=>s.title).join('; ')}. You can start here if these ideas were already taught.</p>}
        </Card>
        <div className={styles.branch}><BookOpen size={20}/><div><h3 className="text-title-3">Read & explain</h3>{interactiveHref&&<div className={styles.interactivePreview}><p className="text-overline text-primary">Interactive student reader</p><p>Preview only the sections and responses for this reading, with its start and end clearly marked.</p><Button asChild><Link href={interactiveHref} target="_blank">Preview interactive reading</Link></Button><p className="text-caption text-muted-foreground">Assigned explanations earn {READING_ASSIGNMENT_XP} XP once per reading. Your review connects the evidence to mastery.</p></div>}{step.sourceBook!=='hewitt'&&(step.sourceBook==='openstax'||chosen?.track==='honors'&&step.honorsReading)?<><p>College Physics for AP® Courses 2e · §{step.honorsReading!.sections.join(', ')} · pp. {step.honorsReading!.from}–{step.honorsReading!.to}</p><p className="text-muted-foreground mt-2">{step.honorsReading!.focus}</p><Button asChild variant="outline"><Link href={honorsReadingUrl(step.honorsReading!)} target="_blank">Original OpenStax PDF</Link></Button></>:step.passage?<details><summary>Preview course reading</summary><p className="whitespace-pre-wrap mt-3">{step.passage}</p></details>:<><p>Hewitt · Sections {step.sections.join(', ')}</p><Button asChild variant="outline"><Link href={`/textbook?ch=${step.chapter}`} target="_blank">Original Hewitt PDF</Link></Button></>}
          <p className="mt-4 font-medium">Reading response</p><p>{step.readingCheck.prompt}</p></div></div>
        <ArrowDown className="text-muted-foreground ml-4" aria-hidden="true"/>
        <div className={styles.branch}><BookOpen size={20}/><div><h3 className="text-title-3">Learn the vocabulary</h3><p className="text-muted-foreground">Preview these words, read them in context, then practice recall.</p><dl className={styles.words}>{step.words.map(w=><div key={w.term}><dt>{w.term}</dt><dd>{w.definition}</dd></div>)}</dl><p className="text-caption text-muted-foreground">2 checks per word · 80% practice accuracy · definitions from existing class word sets are reused when available.</p></div></div>
        <ArrowDown className="text-muted-foreground ml-4" aria-hidden="true"/>
        <div className={styles.branch}><FileCheck2 size={20}/><div><h3 className="text-title-3">Check understanding & revisit</h3><p>Reading quiz: unlocks upon reading submission. A new application{prerequisites.length?' + a question from an earlier prerequisite':''}{chosen?.track==='honors'?' + a modeling extension':''}.</p><p className="mt-2">Vocabulary quiz: explain each word and use it in a specific example. Due one day after vocabulary practice, at 11:59 PM Eastern.</p><details className="mt-4"><summary>Preview reading quiz & teacher guide</summary><p className="mt-3">{step.quizCheck.prompt}</p><p className="text-muted-foreground mt-2">{step.quizCheck.guide}</p>{prerequisites[0]&&<p className="mt-3">Revisit: {prerequisites[0].quizCheck.prompt}</p>}{chosen?.track==='honors'&&<p className="mt-3">Extension: {step.honors.prompt}</p>}</details></div></div>
        {step.selectionRequired&&!bundle&&<Card className="p-5 gap-4"><h3 className="text-title-3">Connect the mastery targets</h3><p>Choose the curriculum targets this section provides evidence for. Your teacher review determines mastery; reading and practice checks do not award a rating automatically.</p><div className={styles.toolbar}><label>Curriculum unit<select aria-label="Curriculum unit" value={unit} disabled={busy||data.readOnly} onChange={e=>setUnit(e.target.value)}>{SYLLABUS_UNITS.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label><label>Reading & quiz target<select aria-label="Reading and quiz target" value={readingTarget} disabled={busy||data.readOnly} onChange={e=>setReadingTarget(e.target.value)}><option value="">Choose a matching target</option>{mappingTargets.map(t=><option key={t.id} value={t.id}>{t.statement}</option>)}</select></label><label>Vocabulary Knowledge target<select aria-label="Vocabulary Knowledge target" value={vocabularyTarget} disabled={busy||data.readOnly} onChange={e=>setVocabularyTarget(e.target.value)}><option value="">Choose a matching Knowledge target</option>{mappingTargets.filter(t=>t.domain==='knowledge').map(t=><option key={t.id} value={t.id}>{t.statement}</option>)}</select></label></div><p className="text-caption text-muted-foreground">If this topic has no appropriate curriculum target yet, add one through curriculum management before preparing it. Review all four drafts before assigning.</p></Card>}
        {wrongTrack&&<p role="alert">Choose an interactive reading available for this class.</p>}
        <Card className="p-5 gap-4"><h3 className="text-title-3">Assignments for {chosen?.name}</h3>{bundle?<>
          {resource(bundle.reading,'Reading',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'reading',id:bundle.reading_id}):`/admin/readings?id=${bundle.reading_id}`)}
          {resource(bundle.practice,'Vocabulary practice',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'practice',id:bundle.practice_id}):`/admin/vocabulary/tasks?task_id=${bundle.practice_id}`)}
          {resource(bundle.readingQuiz,'Reading quiz',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'readingQuiz',id:bundle.reading_quiz_id}):`/admin/quizzes?id=${bundle.reading_quiz_id}`)}
          {resource(bundle.vocabularyQuiz,'Vocabulary quiz',embedded?readingDashboardHref({view:'assignments',courseId:course,stepId:step.id,resource:'vocabularyQuiz',id:bundle.vocabulary_quiz_id}):`/admin/quizzes?id=${bundle.vocabulary_quiz_id}`)}
          {bundle.reading.status!=='archived'&&<><AssignmentDueInput label="Reading & practice due" value={due} onChange={setDue} disabled={busy||data.readOnly}/><Button disabled={busy||data.readOnly||wrongTrack} onClick={()=>void act('release')}>{busy?'Saving…':released?'Update reading & practice date':'Assign reading sequence'}</Button><p className="text-caption text-muted-foreground">The reading quiz uses this deadline. The vocabulary quiz is dated one day after practice, at 11:59 PM Eastern. The reading quiz unlocks after each student submits the reading. They may take it later; it stays in their outstanding quizzes until submitted. Use the calendar to assign all four pieces together, including the vocabulary quiz.</p></>}
        </>:<><p>Prepare a reading, vocabulary practice, reading quiz, and vocabulary quiz for this step. All begin as drafts.</p><Button disabled={busy||data.readOnly||wrongTrack||!!step.selectionRequired&&(!readingTarget||!vocabularyTarget)} onClick={()=>void act('prepare')}>{busy?'Preparing…':'Prepare four connected assignments'}</Button></>}{data.readOnly&&<p>Switch back to your own account to assign work.</p>}</Card>
      </div>}</div>
    </>}
  </div>
}
