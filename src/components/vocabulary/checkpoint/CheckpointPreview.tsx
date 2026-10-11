'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, ClipboardCheck, Eye, RotateCcw, Search, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import BrandLogo from '@/components/BrandLogo'
import { checkpointScore, checkpointStatus, releaseCheckpoint, scoreCheckpointResponse, submitCheckpoint, type CheckpointAttempt } from '@/lib/vocab-checkpoint'
import { CHECKPOINT_QUESTIONS as questions, CHECKPOINT_WORDS, createCheckpointPreview, type CheckpointPreviewState } from './checkpoint-fixture'
import { CheckpointResult, CheckpointStudent } from './CheckpointStudent'
import CheckpointScene from './CheckpointScene'
import s from './checkpoint.module.css'

type Screen = 'dashboard' | 'setup' | 'student' | 'review' | 'results'
const SCREENS: { id: Screen; label: string }[] = [{id:'dashboard',label:'Class dashboard'},{id:'setup',label:'Set up checkpoint'},{id:'student',label:'Student quiz'},{id:'review',label:'Grade responses'},{id:'results',label:'Student results'}]
const STORAGE = 'vocab-checkpoint-screen-preview-v1'
const scoreLabels = ['No evidence','Limited','Developing','Mostly clear','Precise']

export default function CheckpointPreview() {
  const [state, setState] = useState(createCheckpointPreview)
  const [loaded, setLoaded] = useState(false)
  const [storageNotice, setStorageNotice] = useState('')
  const [screen,setScreen] = useState<Screen>('dashboard')
  const [message,setMessage] = useState('')
  const [reviewId,setReviewId] = useState('blair')
  const [responseIndex,setResponseIndex] = useState(0)
  const [resultId,setResultId] = useState('avery')
  const [query,setQuery] = useState('')
  const [filter,setFilter] = useState('all')
  const [autoNext,setAutoNext] = useState(true)
  const [resetConfirm,setResetConfirm] = useState(false)
  const main = useRef<HTMLElement>(null)
  const responseHeading = useRef<HTMLHeadingElement>(null)

  useEffect(()=>{
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE)??'null') as CheckpointPreviewState | null
      const ids = createCheckpointPreview().attempts.map(a=>a.studentId)
      if(saved?.version===1 && typeof saved.title==='string' && typeof saved.course==='string' &&
        saved.attempts?.length===ids.length && saved.attempts.every(a=>ids.includes(a.studentId)&&a.answers&&a.scores&&a.notes&&typeof a.submitted==='boolean')) setState(saved)
    } catch { /* Start from the sample when the saved preview is unavailable. */ }
    setLoaded(true)
  },[])
  useEffect(()=>{ if(loaded) { try {localStorage.setItem(STORAGE,JSON.stringify(state))} catch {setStorageNotice('Browser storage is unavailable. This preview will keep changes until you close it.')} } },[loaded,state])
  useEffect(()=>{main.current?.focus({preventScroll:true});window.scrollTo({top:0})},[screen])
  useEffect(()=>{if(screen==='review')responseHeading.current?.focus({preventScroll:true})},[reviewId,responseIndex,screen])

  const writing=questions.filter(q=>q.part==='explain')
  const student=state.attempts.find(a=>a.studentId==='emery')!
  const reviewed=state.attempts.find(a=>a.studentId===reviewId)!
  const result=state.attempts.find(a=>a.studentId===resultId)!
  const current=writing[responseIndex]
  const reviewScore=checkpointScore(questions,reviewed)
  const counts={review:state.attempts.filter(a=>checkpointStatus(questions,a)==='Needs scoring').length,ready:state.attempts.filter(a=>checkpointStatus(questions,a)==='Ready to release').length,graded:state.attempts.filter(a=>a.released).length}
  const navigate=(next:Screen)=>{setScreen(next);setMessage('')}
  const updateAttempt=(id:string,change:(a:CheckpointAttempt)=>CheckpointAttempt)=>setState(p=>({...p,attempts:p.attempts.map(a=>a.studentId===id?change(a):a)}))
  const openReview=(id:string)=>{const a=state.attempts.find(x=>x.studentId===id)!;setReviewId(id);setResponseIndex(Math.max(0,writing.findIndex(q=>a.scores[q.id]===undefined)));navigate('review')}
  const nextReview=()=>{const next=state.attempts.find(a=>a.studentId!==reviewId&&checkpointStatus(questions,a)==='Needs scoring');if(next)openReview(next.studentId);else navigate('dashboard')}
  const scoreResponse=(points:number)=>{
    updateAttempt(reviewId,a=>scoreCheckpointResponse(questions,a,current.id,points))
    setMessage(`Saved ${points}/4 for ${reviewed.name} · explanation ${responseIndex+1}.`)
    if(autoNext&&responseIndex===0)setResponseIndex(1)
  }
  const release=()=>{updateAttempt(reviewId,a=>releaseCheckpoint(questions,a));setMessage(`Released ${reviewScore.percent}% to ${reviewed.name} in this preview.`)}

  return <div className={s.app}>
    <div className={s.previewBar}><div><span className={s.previewLabel}>SCREEN PREVIEW</span><span>Sample students · Changes stay in this browser</span></div><div>{resetConfirm?<><span>Reset sample work?</span><Button size="lg" variant="outline" onClick={()=>{setState(createCheckpointPreview());setResetConfirm(false);setMessage('Sample restored.');setScreen('dashboard')}}>Reset</Button><Button size="lg" variant="ghost" onClick={()=>setResetConfirm(false)}>Cancel</Button></>:<Button variant="ghost" size="lg" onClick={()=>setResetConfirm(true)}><RotateCcw size={15}/> Reset demo</Button>}</div></div>
    <header className={s.appHeader}><div className={s.brand}><BrandLogo size={36} decorative /><strong>Antocci Physics</strong><span className={s.headerDivider}/><span>Vocabulary</span></div><span className={s.roleTag}>{screen==='student'||screen==='results'?'Student experience':'Teacher experience'}</span></header>
    <nav className={s.screenNav} aria-label="Preview screens">{SCREENS.map((t,i)=><Button key={t.id} variant="ghost" size="lg" aria-current={screen===t.id?'page':undefined} onClick={()=>navigate(t.id)}><span>{i+1}</span>{t.label}</Button>)}</nav>
    {storageNotice&&<p className={s.storageNotice} role="status">{storageNotice}</p>}
    <main ref={main} tabIndex={-1} className={`${s.main} ${screen==='review'?s.reviewPage:''}`}>
      {message&&<p className={s.toast} role="status"><CheckCircle2 size={18}/>{message}</p>}
      {screen==='dashboard'&&<>
        <div className={s.pageHeading}><div><p className={s.eyebrow}>CONTROL ROOM / VOCABULARY</p><h1 className="text-display">Vocabulary checkpoints</h1><p className={s.lead}>A clear view of who’s finished, who needs you, and what they understand.</p></div><Button size="lg" onClick={()=>navigate('setup')}><ClipboardCheck/> Checkpoint settings</Button></div>
        <div className={s.stats}>{[{n:state.attempts.length,label:'Assigned',filter:'all'},{n:counts.review,label:'Need scoring',filter:'Needs scoring'},{n:counts.ready,label:'Ready to release',filter:'Ready to release'},{n:counts.graded,label:'Graded',filter:'Graded'}].map(c=><Button key={c.label} variant="outline" className={s.stat} aria-pressed={filter===c.filter} onClick={()=>setFilter(c.filter)}><strong>{c.n}</strong><span>{c.label}</span></Button>)}</div>
        <Card className={s.dashboardCard}><div className={s.tableHeading}><div><p className={s.eyebrow}>{state.course} · UNIT 1</p><h2 className="text-title-2">{state.title}</h2><p className={s.muted}>6 words · 10 questions · 20 points{state.due?` · Due ${state.due}`:''}</p></div><Button size="lg" disabled={counts.review===0} onClick={()=>openReview(state.attempts.find(a=>checkpointStatus(questions,a)==='Needs scoring')!.studentId)}>Grade next <ArrowRight/></Button></div>
          <div className={s.tableTools}><label className={s.search}><Search size={18}/><input placeholder="Find a student…" aria-label="Find a student" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className={s.inlineField}>Show<select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Checkpoint status"><option value="all">Everyone</option>{['Not started','In progress','Needs scoring','Ready to release','Graded'].map(f=><option key={f}>{f}</option>)}</select></label></div>
          <div className={s.tableScroll} role="region" aria-label="Checkpoint grades" tabIndex={0}><table><thead><tr><th>Student</th><th>Status</th><th>Auto / 12</th><th>Explain / 8</th><th>Quiz grade</th><th>Knowledge</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{state.attempts.filter(a=>a.name.toLowerCase().includes(query.toLowerCase())&&(filter==='all'||checkpointStatus(questions,a)===filter)).map(a=>{const score=checkpointScore(questions,a),status=checkpointStatus(questions,a);return <tr key={a.studentId}><th>{a.name}</th><td><span className={`${s.badge} ${a.released?s.positive:status==='Needs scoring'?s.attention:''}`}>{status}</span></td><td>{a.submitted?score.autoPoints:'—'}</td><td>{a.submitted?score.pending?`${2-score.pending}/2 scored`:score.writtenPoints:'—'}</td><td><strong>{a.released?`${score.percent}%`:'—'}</strong>{status==='Ready to release'&&<small>{score.percent}% draft</small>}</td><td>{a.knowledge?`${a.knowledge} · ${['Not yet','Almost','Got it'][a.knowledge-1]}`:'Unrated'}</td><td>{a.submitted?<Button size="lg" variant="outline" aria-label={`${a.released?'View':status==='Ready to release'?'Release':'Grade'} ${a.name}`} onClick={()=>a.released?(setResultId(a.studentId),navigate('results')):openReview(a.studentId)}>{a.released?'View':status==='Ready to release'?'Release':'Grade'}<ChevronRight size={16}/></Button>:<span className={s.muted}>Waiting</span>}</td></tr>})}</tbody></table></div>
          {!state.attempts.some(a=>a.name.toLowerCase().includes(query.toLowerCase())&&(filter==='all'||checkpointStatus(questions,a)===filter))&&<p className={s.empty}>No students match this view.</p>}
          <p className={s.tableFoot}>Quiz grades appear after you release them. Knowledge mastery stays a separate teacher judgment.</p>
        </Card>
      </>}
      {screen==='setup'&&<>
        <div className={s.pageHeading}><div><p className={s.eyebrow}>ASSIGN VOCABULARY</p><h1 className="text-display">A checkpoint, ready to teach.</h1><p className={s.lead}>The words students practiced. Fresh situations that show understanding.</p></div></div>
        <div className={s.setupGrid}><div className={s.stack}><Card className={s.paddedCard}><h2 className="text-title-2">Assignment details</h2><label className={s.field}>Title<input value={state.title} maxLength={120} onChange={e=>setState(p=>({...p,title:e.target.value}))}/></label><div className={s.twoColumns}><label className={s.field}>Class<select value={state.course} onChange={e=>setState(p=>({...p,course:e.target.value}))}><option>Honors Physics · A</option><option>CPA Physics · E</option><option>CPA Physics · F</option></select></label><label className={s.field}>Due date (optional)<input type="date" value={state.due} onChange={e=>setState(p=>({...p,due:e.target.value}))}/></label></div><label className={s.field}>Student instructions<textarea rows={3} value={state.instructions} maxLength={1000} onChange={e=>setState(p=>({...p,instructions:e.target.value}))}/></label></Card>
          <Card className={s.paddedCard}><div className={s.between}><h2 className="text-title-2">Your word set</h2><span className={s.badge}>6 words</span></div><p className={s.muted}>Unit 1 · Describing motion</p><div className={s.chips}>{CHECKPOINT_WORDS.map(w=><span key={w}>{w}</span>)}</div><div className={s.guidance}><BookOpen size={19}/><div><strong>Knowledge target</strong><p>I can use precise vocabulary to describe motion and distinguish scalar and vector quantities.</p></div></div></Card>
          <Card className={s.paddedCard}><h2 className="text-title-2">Review the questions</h2><p className={s.muted}>All six words are assessed. Answer guides are visible here for your review.</p>{questions.map((q,i)=><details className={s.questionDetail} key={q.id}><summary><span>{i+1}. {q.words.join(' · ')}</span><span>{q.part} · {q.points} pt</span></summary><p>{q.prompt}</p>{q.scene&&<CheckpointScene kind={q.scene}/>}<p className={s.muted}>{q.options?`Correct choice: ${q.options[q.answer!]}`:'Answer guide'}</p><p>{q.explanation}</p></details>)}</Card>
        </div><aside className={s.setupAside}><Card className={s.paddedCard}><p className={s.eyebrow}>QUIZ BLUEPRINT</p><h2 className="text-title-1">20 points. Three ways to show it.</h2><div className={s.blueprint}>{[['Recognize','4 questions × 1 point','4'],['Interpret','4 situations × 2 points','8'],['Explain','2 responses × 4 points','8']].map(([t,d,n])=><div key={t}><div><strong>{t}</strong><p>{d}</p></div><strong>{n}</strong></div>)}</div><div className={s.guidance}><CheckCircle2 size={20}/><p>12 points score automatically. You score the final 8 with partial credit.</p></div><ul className={s.settingList}><li>Untimed; about 10–15 minutes</li><li>Ungraded example before starting</li><li>Sentence starters for explanations</li><li>Answers lock after submission</li><li>You release the final grade</li></ul><Button size="lg" disabled={!state.title.trim()} onClick={()=>{setScreen('dashboard');setMessage('Checkpoint settings saved for the sample class.')}}>Save checkpoint <ArrowRight/></Button><Button size="lg" variant="outline" onClick={()=>navigate('student')}><Eye/> Preview as a student</Button><p className={s.muted}>Screen preview uses the same eight sample students for every class choice.</p></Card></aside></div>
      </>}
      {screen==='student'&&<><div className={s.studentIdentity}>Student preview <strong>Emery Patel</strong></div><CheckpointStudent questions={questions} words={CHECKPOINT_WORDS} state={state} attempt={student} onAnswer={(id,answer)=>updateAttempt('emery',a=>a.submitted?a:{...a,answers:{...a.answers,[id]:answer}})} onSubmit={()=>{updateAttempt('emery',a=>submitCheckpoint(questions,a));setMessage('Checkpoint submitted in the preview.')}} onTeacher={()=>openReview('emery')}/></>}
      {screen==='review'&&<>
        <div className={s.pageHeading}><div><p className={s.eyebrow}>CONTROL ROOM / CHECKPOINT REVIEW</p><h1 className="text-display">Read. Score. Next.</h1><p className={s.lead}>{state.title} · {state.course}</p></div><Button variant="outline" size="lg" onClick={()=>navigate('dashboard')}><ArrowLeft/> Class dashboard</Button></div>
        <div className={s.reviewLayout}><aside className={s.roster}><div className={s.between}><strong>Submitted students</strong><span className={s.badge}>{state.attempts.filter(a=>a.submitted).length}</span></div>{state.attempts.filter(a=>a.submitted).map(a=><Button key={a.studentId} className={s.rosterButton} variant="outline" aria-pressed={a.studentId===reviewId} onClick={()=>openReview(a.studentId)}><span>{a.name}</span><small>{checkpointStatus(questions,a)}</small></Button>)}</aside>
          <div className={s.reviewMain}><div className={s.between}><div><p className={s.eyebrow}>REVIEWING</p><h2 className="text-title-1">{reviewed.name}</h2></div><label className={s.checkLabel}><input type="checkbox" checked={autoNext} onChange={e=>setAutoNext(e.target.checked)}/>Next explanation after scoring</label></div>
            <div className={s.reviewMetrics}><span><strong>{reviewScore.autoPoints} / 12</strong> Automatically checked</span><span><strong>{reviewScore.pending?`${2-reviewScore.pending} of 2`: `${reviewScore.writtenPoints} / 8`}</strong> {reviewScore.pending?'Explanations scored':'Explanation points'}</span><span><strong>{reviewScore.complete?`${reviewScore.percent}%`:'Pending'}</strong> {reviewed.released?'Released quiz grade':'Draft quiz grade'}</span></div>
            <div className={s.explanationTabs}>{writing.map((q,i)=><Button variant="outline" size="lg" key={q.id} aria-pressed={responseIndex===i} onClick={()=>setResponseIndex(i)}>Explanation {i+1}<span>{reviewed.scores[q.id]===undefined?'Not scored':`${reviewed.scores[q.id]}/4`}</span></Button>)}</div>
            <Card className={s.reviewCard}><h3 className="text-title-3" ref={responseHeading} tabIndex={-1}>{current.prompt}</h3><blockquote className={s.studentResponse}><span>STUDENT RESPONSE</span><p>{reviewed.answers[current.id]}</p></blockquote>
              <details className={s.answerGuide}><summary>Answer guide &amp; scoring rubric</summary><p>{current.explanation}</p><div className={s.rubricTable}><div><strong>Meaning · 0–2</strong><p>0: missing or incorrect<br/>1: partly correct<br/>2: essential meanings are accurate</p></div><div><strong>Application · 0–2</strong><p>0: not connected to the situation<br/>1: partly applied<br/>2: used accurately to explain this situation</p></div></div><p>Combine the two criteria for a score out of 4. Judge meaning, not spelling or sentence length.</p></details>
              <div className={s.between}><strong>Score this explanation</strong><span className={s.muted}>Tap to save · out of 4</span></div><div className={s.scoreButtons}>{scoreLabels.map((label,n)=><Button key={n} variant="outline" aria-label={`${n} points · ${label}`} aria-pressed={reviewed.scores[current.id]===n} disabled={reviewed.released} onClick={()=>scoreResponse(n)}><strong>{n}</strong><span>{label}</span></Button>)}</div>
              <label className={s.field}>Feedback (optional)<textarea rows={2} disabled={reviewed.released} placeholder="One strength or one next step…" value={reviewed.notes[current.id]??''} onChange={e=>updateAttempt(reviewId,a=>({...a,notes:{...a.notes,[current.id]:e.target.value}}))}/></label>
            </Card>
            <Card className={s.releaseCard}><div><p className={s.eyebrow}>QUIZ GRADE</p><h3 className="text-title-2">{reviewed.released?`${reviewScore.percent}% released`:reviewScore.complete?`${reviewScore.points}/20 · ${reviewScore.percent}% ready to release`:`${reviewScore.pending} ${reviewScore.pending===1?'explanation':'explanations'} still to score`}</h3><p className={s.muted}>{reviewed.released?'The student can see their grade and feedback.':'Students see the final score and feedback after you release it.'}</p></div><div className={s.actions}>{reviewed.released?<><Button variant="outline" size="lg" onClick={()=>{setResultId(reviewId);navigate('results')}}>View student results <Eye/></Button><Button size="lg" onClick={nextReview}>Next student <ArrowRight/></Button></>:<><Button variant="outline" size="lg" onClick={nextReview}>Next student</Button><Button size="lg" disabled={!reviewScore.complete} onClick={release}>Release grade <Send/></Button></>}</div></Card>
            <details className={s.knowledge}><summary>Knowledge mastery <span>{reviewed.knowledge?`${reviewed.knowledge} · ${['Not yet','Almost','Got it'][reviewed.knowledge-1]}`:'Not rated'}</span></summary><p>Use this checkpoint as evidence for the linked Knowledge target. This judgment does not change the quiz percentage.</p><div className={s.guidance}>I can use precise vocabulary to describe motion and distinguish scalar and vector quantities.</div><div className={s.knowledgeButtons}>{['Not yet','Almost','Got it'].map((label,i)=><Button variant="outline" size="lg" key={label} aria-pressed={reviewed.knowledge===i+1} disabled={!reviewScore.complete} onClick={()=>{updateAttempt(reviewId,a=>({...a,knowledge:(i+1) as 1|2|3}));setMessage('Knowledge judgment saved for this sample student.')}}><strong>{i+1}</strong>{label}</Button>)}</div>{!reviewScore.complete&&<p className={s.muted}>Finish scoring the explanations before making a Knowledge judgment.</p>}</details>
          </div>
        </div>
      </>}
      {screen==='results'&&<><label className={s.resultPicker}>Student preview<select aria-label="Student result preview" value={resultId} onChange={e=>setResultId(e.target.value)}>{state.attempts.map(a=><option key={a.studentId} value={a.studentId}>{a.name}</option>)}</select></label><CheckpointResult questions={questions} state={state} attempt={result}/></>}
    </main>
    <footer className={s.previewFooter}><Check size={16}/> Interactive design preview · No live assignments or grades are changed.</footer>
  </div>
}
