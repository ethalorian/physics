'use client'
import {useEffect,useRef,useState} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {ArrowLeft,ArrowRight,Check,ChevronLeft,ChevronRight,LockKeyhole,MessageSquare,RotateCcw,Sparkles} from 'lucide-react'
import {useAssessmentReviewGuard} from '@/components/admin/useAssessmentReviewGuard'
import {applyAllSuggestions} from '@/lib/review-desk/apply-suggestions'
import {addRemainingSuggestedScores,appendFeedback,initialReviewDecision,reviewPercent,reviewScoreIssues,targetMasterySummary,validateDecision,type Rating,type ReviewDecision,type ReviewDocument,type SavedDraft,type ScoreItem} from '@/lib/review-desk/types'
import type {EvidenceSuggestions} from '@/lib/review-desk/suggestions'
import EvidenceResponse from './EvidenceResponse'
import s from './ReviewDesk.module.css'
export type SuggestionState={status:string;result:EvidenceSuggestions|null;error?:string}|null
export async function deskPost(body:unknown){const r=await fetch('/api/review-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error??'Review could not be saved.');return d}
export function RatingButtons({value,onChange,allowSkip=true,disabled=false,label}:{value:Rating|undefined;onChange:(level:Rating)=>void;allowSkip?:boolean;disabled?:boolean;label:string}){return <div className={s.ratings} role="group" aria-label={label}>{([1,2,3] as const).map((level,i)=><button type="button" data-level={level} key={level} aria-label={`${level} · ${['Not yet','Almost','Got it'][i]}`} title={`${level} · ${['Not yet','Almost','Got it'][i]}`} aria-pressed={value===level} disabled={disabled} onClick={()=>onChange(level)}>{level}</button>)}{allowSkip&&<button type="button" aria-label="No new rating" title="No new rating" aria-pressed={value===null} disabled={disabled} onClick={()=>onChange(null)}>—</button>}</div>}
export function DecisionPreview({doc,decision}:{doc:ReviewDocument;decision:ReviewDecision}){
 const percent=reviewPercent(doc,decision)
 return <div className={s.card}><h3>{doc.studentName} · {doc.activity.title}</h3><p>{percent===null?'No percentage grade':`${percent.toFixed(1)}%${decision.gradeValue?' · '+decision.gradeValue:''}`}</p>{doc.targets.map(t=><p key={t.id}><strong>{t.statement}:</strong> {t.released!==undefined?'Previously released · ':''}{(t.released??decision.ratings[t.id])===null?'No new mastery rating':(t.released??decision.ratings[t.id])+' / 3'}</p>)}{doc.scoreItems.map(i=><p key={i.id}>{i.label}: {i.automatic??decision.scores[i.id]} / {i.possible}</p>)}<h4>Feedback the student will receive</h4><p className={s.answer}>{decision.note||'No overall feedback added.'}</p>{Object.entries(decision.feedback).filter(([,note])=>note.trim()).map(([id,note])=><div key={id}><strong>{doc.evidence.find(e=>e.id===id)?.prompt??doc.scoreItems.find(i=>i.id===id)?.label}</strong><p className={s.answer}>{note}</p></div>)}</div>
}
export default function ReviewEditor({doc,suggestions,classId,readOnly,onSaved,onNext,onSuggest,studentNavigation}:{doc:ReviewDocument;suggestions:SuggestionState;classId:string;readOnly:boolean;onSaved:()=>void;onNext:()=>void;onSuggest:()=>void;studentNavigation?:{position:number;total:number;previous?:()=>void;next?:()=>void}}){
 const [decision,setDecision]=useState<ReviewDecision>(()=>initialReviewDecision(doc)),[draft,setDraft]=useState<SavedDraft|null>(doc.draft),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(doc.draft?.canReopenQuiz?'Release stopped before any results were sent. Reopen your saved review to check feedback.':doc.draft?.state==='released'?'This review has been released.':doc.draft?.state==='returned'?'Revision instructions sent.':doc.draft?'Saved private draft restored.':''),[preview,setPreview]=useState<'release'|'return'|null>(null),[changedOnly,setChangedOnly]=useState(false)
 const saving=useRef(false),reviewVersion=useRef(doc.reviewVersion)
 const [activeEvidence,setActiveEvidence]=useState(doc.evidence[0]?.id??''),[compare,setCompare]=useState(false)
 const evidencePanel=useRef<HTMLElement>(null)
 const scoreInputs=useRef(new Map<string,HTMLInputElement>()),[focusScore,setFocusScore]=useState<string|null>(null)
 useEffect(()=>{if(focusScore!==null){const input=scoreInputs.current.get(focusScore);input?.scrollIntoView({block:'center'});input?.focus({preventScroll:true});setFocusScore(null)}},[focusScore,changedOnly,activeEvidence])
 useAssessmentReviewGuard(dirty||busy)
 const locked=busy||readOnly||doc.state!=='submitted'||draft?.state==='releasing'||draft?.state==='returning'||draft?.state==='released'||draft?.state==='returned',percent=reviewPercent(doc,decision),proposal=suggestions?.status==='ready'?suggestions.result:null
 const allSuggestions=applyAllSuggestions(doc,decision,proposal)
 function update(patch:Partial<ReviewDecision>){setDecision(old=>({...old,...patch}));setDirty(true);setNotice('Unsaved review changes');setError('')}
 const scoreIssues=reviewScoreIssues(doc,decision),suggestedDecision=addRemainingSuggestedScores(doc,decision),suggestedCount=Object.keys(suggestedDecision.scores).length-Object.keys(decision.scores).length
 function jumpToScore(id:string){setChangedOnly(false);if(doc.evidence.some(e=>e.id===id))setActiveEvidence(id);setFocusScore(id)}
 function scoreField(item:ScoreItem){
  const issue=scoreIssues.find(issue=>issue.item.id===item.id)
  return <div className={s.scoreRow} key={item.id}>
   <label htmlFor={'score-'+item.id}>{item.automatic===undefined?(doc.gradeMode==='dimensions'?'Rubric level':'Points'):'Automatically scored'} / {item.possible}</label>
   <input id={'score-'+item.id} ref={input=>{if(input)scoreInputs.current.set(item.id,input);else scoreInputs.current.delete(item.id)}} aria-label={item.label+' points out of '+item.possible} aria-invalid={issue?.reason==='invalid'} aria-describedby={issue?'score-issue-'+item.id:undefined} data-needs-score={!!issue} type="number" min={0} max={item.possible} step={item.step} value={item.automatic??decision.scores[item.id]??''} disabled={locked||item.automatic!==undefined} onChange={event=>{const scores={...decision.scores};if(event.target.value==='')delete scores[item.id];else scores[item.id]=Number(event.target.value);update({scores})}}/>
   {issue&&<span className={s.scoreHelp} id={'score-issue-'+item.id}>{issue.reason==='missing'?'Point score needed — the 1–3 rating is separate.':`Enter 0–${item.possible} in steps of ${item.step}.`}</span>}
   {item.automatic===undefined&&item.suggested!==undefined&&<button disabled={locked} onClick={()=>update({scores:{...decision.scores,[item.id]:item.suggested!}})}>Use suggested {item.suggested} / {item.possible}</button>}
  </div>
 }
 const noteFor=(id:string,text:string)=>update({feedback:{...decision.feedback,[id]:text}})
 async function save(ready=false){
  validateDecision(doc,decision,ready)
  const result=await deskPost({action:'save',classId,assignment:doc.activity.key,student:doc.userId,submissionId:doc.submissionId||undefined,sourceVersion:doc.version,reviewVersion:reviewVersion.current,version:draft?.version??0,payload:decision,ready})
  setDraft(result.draft);setDirty(false);setNotice(ready?'Ready for release · still private.':'Private review draft saved.');onSaved();return result.draft as SavedDraft
 }
 async function run(action:'draft'|'ready'|'release'|'return'|'reopen'){
  if(saving.current)return;saving.current=true;setBusy(true);setError('')
  try{
   if(action==='reopen'){
    if(!draft)throw Error('Reload the saved review.')
    const result=await deskPost({action:'reopen_quiz',id:draft.id,version:draft.version})
    setDraft(result.draft);setDecision(result.draft.payload);setDirty(false);setNotice('Private draft reopened. Check your feedback, then preview the release.');onSaved();return
   }
   if(action==='draft'||action==='ready'){await save(action==='ready');if(action==='ready')onNext();return}
   if(action==='return'&&!decision.note.trim())throw Error('Add a clear next step before requesting revision.')
   const saved=draft&&['releasing','returning'].includes(draft.state)?draft:await save(action==='release');await deskPost({action:action==='return'?'return':'release',id:saved.id,version:saved.version});setDirty(false);setDraft({...saved,state:action==='return'?'returned':'released'});setNotice(action==='return'?'Revision requested. No new grade or mastery was released.':'Grade, mastery decisions and feedback released.');setPreview(null);onSaved();onNext()
  }catch(e){setError((e as Error).message)}finally{saving.current=false;setBusy(false)}
 }
 function openPreview(mode:'release'|'return'){try{if(mode==='release')validateDecision(doc,decision,true);else if(!decision.note.trim())throw Error('Write the revision instructions in Overall feedback first.');setError('');setPreview(mode)}catch(e){setError((e as Error).message)}}
 const revision=doc.attempt>1||!!doc.revision&&doc.revision.source_version!==doc.version
 const evidence=doc.evidence.filter(e=>!changedOnly||e.previous===undefined||JSON.stringify(e.previous)!==JSON.stringify(e.response))
 const active=evidence.find(e=>e.id===activeEvidence)??evidence[0]
 const activeIndex=active?evidence.indexOf(active):-1
 const reviewed=doc.evidence.filter(e=>Object.hasOwn(decision.evidenceRatings,e.id)).length
 const missingTargets=doc.targets.filter(t=>t.released===undefined&&!Object.hasOwn(decision.ratings,t.id))
 const overallSuggestion=proposal?.feedback||doc.suggestedFeedback
 function selectEvidence(id:string){setActiveEvidence(id);evidencePanel.current?.scrollTo({top:0})}
 return <>
 <section className={s.evidence} aria-label="Submitted evidence" ref={evidencePanel} onKeyDown={event=>{
  if(locked||preview||event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,[contenteditable=true]'))return
  if(active&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&['1','2','3'].includes(event.key)){
   event.preventDefault();update({evidenceRatings:{...decision.evidenceRatings,[active.id]:Number(event.key) as 1|2|3}})
  }
 }}>
  <header className={s.studentHeader}>
   <div><h3>{doc.studentName}</h3><p className={s.muted}>{doc.submittedAt?`${revision?'Resubmitted':'Submitted'} ${new Date(doc.submittedAt).toLocaleDateString()}`:'Saved evidence'} · Attempt {doc.attempt}</p></div>
   {studentNavigation&&<nav className={s.studentNavigation} aria-label="Navigate students">
    <button aria-label="Previous student" disabled={busy||!studentNavigation.previous} onClick={studentNavigation.previous}><ChevronLeft size={16}/></button>
    <span>{studentNavigation.position} / {studentNavigation.total}</span>
    <button aria-label="Next student" disabled={busy||!studentNavigation.next} onClick={studentNavigation.next}><ChevronRight size={16}/></button>
   </nav>}
  </header>
  {doc.revision&&<section className={s.revisionStrip}>
   <div className={s.actions}><RotateCcw size={15}/><strong>{doc.revision.released_at?'Revision reviewed':doc.revision.source_version===doc.version?'Revision requested':'Revision returned for review'}</strong><button aria-expanded={compare} onClick={()=>setCompare(!compare)}>{compare?'Hide comparison':'Compare attempts'}</button></div>
   {compare&&<div className={s.revisionDetail}><p><strong>Your earlier feedback:</strong> {doc.revision.feedback}</p><p><strong>Student’s change summary:</strong> {doc.revision.change_summary||'No change summary recorded for this attempt.'}</p></div>}
   <button className={s.quiet} aria-pressed={changedOnly} onClick={()=>setChangedOnly(!changedOnly)}>{changedOnly?'Show all responses':'Show changed responses'}</button>
  </section>}
  {doc.limitation&&<p className={s.notice}>{doc.limitation}</p>}
  <div className={s.reviewTools}>
   <span className={s.muted} role="status">{reviewed} of {doc.evidence.length} responses rated</span>
   <button type="button" className={s.applySuggestions} disabled={locked||allSuggestions.count===0} title="Fill empty scores, ratings and feedback. Keep existing entries. Nothing is released." onClick={()=>{update(allSuggestions.decision);setNotice(`Filled ${allSuggestions.count} empty fields. Your entries were kept. Review before releasing.`)}}><Sparkles size={15}/>Apply all suggestions</button>
  </div>
  <div className={s.responseNavigation}>
   <nav className={s.responseTabs} aria-label="Responses">{evidence.map(e=>{
    const index=doc.evidence.indexOf(e),rated=Object.hasOwn(decision.evidenceRatings,e.id),changed=e.previous!==undefined&&JSON.stringify(e.previous)!==JSON.stringify(e.response)
    return <button key={e.id} type="button" data-level={decision.evidenceRatings[e.id]??'none'} aria-pressed={active?.id===e.id} aria-label={`Response ${index+1}: ${e.prompt}${changed?' · Changed':''}${rated?' · Rated':''}`} title={`Response ${index+1}${changed?' · Changed':''}${rated?' · Rated':''}`} onClick={()=>selectEvidence(e.id)}>{rated&&<Check size={12}/>}<span>{index+1}</span>{changed&&<span className={s.changedDot} aria-hidden="true"/>}</button>
   })}</nav>
   {active&&<span className={s.muted}>Response {activeIndex+1} of {evidence.length}{changedOnly?' changed':''}</span>}
  </div>
  {active&&(()=>{
   const e=active,index=doc.evidence.indexOf(e),suggestion=proposal?.evidence.find(p=>p.id===e.id),level=decision.evidenceRatings[e.id],changed=e.previous!==undefined&&JSON.stringify(e.previous)!==JSON.stringify(e.response),scoreItem=doc.gradeMode==='points'?doc.scoreItems.find(item=>item.id===e.id):null
   return <article className={`${s.card} ${s.responseCard}`} data-level={level??'none'} key={e.id} aria-label={`Response ${index+1}`}>
    <div className={s.responseHeading}><span>Response {index+1}</span>{e.previous!==undefined&&<span className={changed?s.revisionText:s.muted}>{changed?'Updated':'Unchanged'}</span>}</div>
    <h4>{e.prompt}</h4>{e.context&&<p className={s.muted}>{e.context}</p>}
    {compare&&e.previous!==undefined&&<div className={s.previousAnswer}><small>Previous attempt</small><EvidenceResponse value={e.previous} rendering={e.rendering}/></div>}
    <div className={s.answer}><EvidenceResponse value={e.response} rendering={e.rendering}/></div>
    <div className={s.evidenceControls}>
     <RatingButtons label={`Evidence rating ${index+1}`} value={level} disabled={locked} onChange={value=>update({evidenceRatings:{...decision.evidenceRatings,[e.id]:value}})}/>
     <span className={s.muted}>{level===undefined?'Choose evidence rating':level===null?'No new rating':`${level} · ${['Not yet','Almost','Got it'][level-1]}`}</span>
    </div>
    {scoreItem&&scoreField(scoreItem)}
    <details className={s.disclosure}>
     <summary className={s.suggestionSummary}>Antocci suggests{suggestion?` · ${suggestion.level===null?'No new rating':suggestion.level+' / 3'}`:suggestions?.status==='error'?' · Needs retry':' · Preparing…'}</summary>
     <div className={s.disclosureBody}>{suggestion?<>
      <p>{suggestion.rationale}</p>
      <button disabled={locked} onClick={()=>update({evidenceRatings:{...decision.evidenceRatings,[e.id]:suggestion.level}})}>Use suggested evidence rating</button>
      <p><strong>Suggested feedback</strong><br/>{suggestion.feedback}</p>
      <button disabled={locked||!suggestion.feedback} onClick={()=>noteFor(e.id,appendFeedback(decision.feedback[e.id]??'',suggestion.feedback))}>Add suggested feedback</button>
     </>:<p>{suggestions?.status==='error'?suggestions.error:'Preparing a suggested rating and feedback for this evidence…'}</p>}</div>
    </details>
    <details className={s.disclosure}><summary><MessageSquare size={14}/>{decision.feedback[e.id]?.trim()?'Feedback added':'Add feedback'}</summary><label className={`${s.field} ${s.disclosureBody}`}>Feedback for this response<textarea rows={3} value={decision.feedback[e.id]??''} maxLength={800} disabled={locked} onChange={event=>noteFor(e.id,event.target.value)}/></label></details>
    {e.guide&&<details className={s.disclosure}><summary>Answer guide & expected evidence</summary><p className={s.guide}>{e.guide}</p></details>}
    {e.previous!==undefined&&!compare&&<details className={s.disclosure}><summary>Previous response</summary><div className={s.previousAnswer}><EvidenceResponse value={e.previous} rendering={e.rendering}/></div></details>}
   </article>
  })()}
  {!evidence.length&&<p className={s.notice}>{changedOnly?'No changed responses were found. Show all responses to review the complete attempt.':'No submitted response is available for this activity.'}</p>}
  {evidence.length>1&&<div className={s.responseNavigation}>
   <button disabled={activeIndex<=0} onClick={()=>selectEvidence(evidence[activeIndex-1].id)}><ArrowLeft size={15}/>Previous response</button>
   <button disabled={activeIndex>=evidence.length-1} onClick={()=>selectEvidence(evidence[activeIndex+1].id)}>Next response<ArrowRight size={15}/></button>
  </div>}
  <div className={s.ratingLegend} aria-label="Rating scale"><span data-level="1">1 Not yet</span><span data-level="2">2 Almost</span><span data-level="3">3 Got it</span><span>— No new rating</span></div>
  <p className={s.keyboardHint}>Keys 1, 2, 3 rate this response when you are not typing.</p>
 </section>
 <aside className={s.side} aria-label="Review decisions">
  <h3>Final review</h3>
  {doc.scoreItems.length>0&&<section className={s.summarySection}>
   <h4>Assignment grade</h4><div className={s.gradeSummary}><p className={s.score}>{percent===null?'—':percent.toFixed(1)+'%'}</p><span className={s.muted}>{doc.scoreItems.length-scoreIssues.length} / {doc.scoreItems.length} scores</span></div>
   <details className={s.disclosure}><summary>How it’s calculated</summary><p className={s.guide}>{doc.gradeMode==='dimensions'?'The lowest of the four dimensions sets the grade.':'Earned points divided by total authored possible points. Evidence ratings and mastery are separate.'}</p></details>
   {scoreIssues.length>0&&<div className={s.scoreChecklist} aria-label="Score completion"><strong>Scores needed</strong><ul>{scoreIssues.map(({item,reason})=><li key={item.id}><button type="button" disabled={locked} onClick={()=>jumpToScore(item.id)}>{item.label} — {reason==='missing'?'add score':'check score'} →</button></li>)}</ul>{suggestedCount>0&&<button disabled={locked} onClick={()=>update({scores:suggestedDecision.scores})}>Fill suggested scores ({suggestedCount})</button>}</div>}
   {doc.gradeMode==='points'&&doc.scoreItems.filter(item=>!doc.evidence.some(e=>e.id===item.id)).map(item=><section className={s.target} key={item.id}><strong>{item.label}</strong>{scoreField(item)}</section>)}
   {doc.gradeMode==='dimensions'&&doc.scoreItems.map(item=><section className={s.target} key={item.id}>
    <strong>{item.label}</strong>{scoreField(item)}
    {item.feedback&&<details className={s.disclosure}><summary>Suggested rubric feedback</summary><p className={s.guide}>{item.feedback}</p></details>}
    <details className={s.disclosure}><summary>{decision.feedback[item.id]?.trim()?'Dimension feedback added':'Add dimension feedback'}</summary><label className={`${s.field} ${s.disclosureBody}`}>Dimension feedback<textarea rows={2} value={decision.feedback[item.id]??''} maxLength={800} disabled={locked} onChange={e=>noteFor(item.id,e.target.value)}/></label></details>
   </section>)}
  </section>}
  {doc.gradeFormat&&doc.gradeFormat!=='numeric'&&<label className={s.field}>{doc.gradeFormat==='letter'?'Letter grade':'Credit decision'}<select value={decision.gradeValue??''} disabled={locked} onChange={e=>update({gradeValue:e.target.value||null})}><option value="">Choose…</option>{(doc.gradeFormat==='credit'?['credit','no_credit']:['A+','A','A−','B+','B','B−','C+','C','C−','D+','D','D−','F']).map(v=><option key={v}>{v}</option>)}</select></label>}
  {doc.targets.length>0&&<section className={s.summarySection}><h4>Final target mastery</h4>{doc.targets.map(t=>{
   const suggestion=proposal?.targets.find(x=>x.id===t.id),combined=targetMasterySummary(doc,decision,t.id),level=decision.ratings[t.id]
   return <section className={s.target} key={t.id}>
    <p>{t.statement}</p>
    <RatingButtons label={'Mastery: '+t.statement} value={level} allowSkip={t.allowSkip} disabled={locked||t.released!==undefined} onChange={value=>update({ratings:{...decision.ratings,[t.id]:value}})}/>
    <p className={s.muted}>{level===undefined?'Choose final mastery':level===null?'No new rating':`${level} · ${['Not yet','Almost','Got it'][level-1]}`}</p>
    {t.released!==undefined?<p className={s.muted}>Previously released for this attempt.</p>:<>
     {combined.total>0&&<div className={s.combinedMastery}>{combined.suggested!==null?<><p className={s.muted}>Evidence average {combined.average!.toFixed(2)} → {combined.suggested} / 3</p><button disabled={locked} onClick={()=>update({ratings:{...decision.ratings,[t.id]:combined.suggested}})}>Use combined suggestion</button></>:<p className={s.muted}>{combined.reviewed<combined.total?`${combined.total-combined.reviewed} more evidence ratings needed for a combined suggestion.`:'No numeric evidence ratings to combine.'}</p>}</div>}
     <details className={s.disclosure}><summary>Rating basis & suggestions</summary><div className={s.disclosureBody}>
      <p>Numeric ratings for this target are averaged and rounded. “No new rating” is excluded. You choose the final mastery.</p>
      {suggestion&&<><strong>Antocci suggests · {suggestion.level===null?'Insufficient evidence':suggestion.level+' / 3'}</strong><p>{suggestion.rationale}</p><button disabled={locked||suggestion.level===null&&!t.allowSkip} onClick={()=>update({ratings:{...decision.ratings,[t.id]:suggestion.level}})}>Use suggested mastery</button></>}
     </div></details>
    </>}
   </section>
  })}</section>}
  {!doc.scoreItems.length&&<p className={s.muted}>{doc.gradeMode==='mastery'?'Mastery only · no percentage grade.':doc.gradeMode==='completion'?'Completion review · no percentage grade.':'No percentage grade for this activity.'}</p>}
  <section className={`${s.summarySection} ${s.field}`}><label htmlFor="desk-feedback">Overall feedback<textarea id="desk-feedback" rows={3} value={decision.note} maxLength={1600} disabled={locked} placeholder="A clear next step for the student…" onChange={e=>update({note:e.target.value})}/></label>
   {overallSuggestion&&<details className={s.disclosure}><summary className={s.suggestionSummary}>Suggested feedback</summary><div className={s.disclosureBody}><p>{overallSuggestion}</p><button disabled={locked} onClick={()=>update({note:appendFeedback(decision.note,overallSuggestion)})}>Add suggested feedback</button></div></details>}
  </section>
  <div className={s.completionSummary} aria-label="Review completion" role="status"><span>{reviewed} / {doc.evidence.length} evidence ratings</span>{doc.scoreItems.length>0&&<span data-complete={!scoreIssues.length}>{scoreIssues.length?`${scoreIssues.length} scores need attention`:doc.gradeMode==='dimensions'?'Rubric scores complete':'Point scores complete'}</span>}{doc.targets.length>0&&<span data-complete={!missingTargets.length}>{missingTargets.length?`${missingTargets.length} final mastery decisions needed`:'Final mastery selected'}</span>}{doc.gradeFormat&&doc.gradeFormat!=='numeric'&&<span data-complete={!!decision.gradeValue}>{decision.gradeValue?`${doc.gradeFormat==='letter'?'Letter grade':'Credit decision'}: ${decision.gradeValue}`:`${doc.gradeFormat==='letter'?'Letter grade':'Credit decision'} needed`}</span>}</div>
  {suggestions?.status==='error'&&<button disabled={busy||readOnly} onClick={onSuggest}>Retry Antocci suggestions</button>}
  <a className={s.sourceLink} href={doc.sourceHref}>Open original assignment review →</a>
 </aside>
 <footer className={s.editorFooter} aria-label="Review actions">
  {(error||notice)&&<div className={s.editorMessage}>{error?<p className={s.error} role="alert">{error}</p>:<p className={s.muted} role="status">{notice}</p>}</div>}
  <div className={s.actions}><span className={s.saveStatus}><LockKeyhole size={14}/>{busy?'Saving…':draft?.state==='released'?'Released':draft?.state==='returned'?'Revision requested':draft?.state==='releasing'?'Release interrupted':draft?.state==='returning'?'Revision request interrupted':dirty?'Unsaved · private':draft?.state==='ready'?'Ready · private':'Private draft'}</span><button className={s.quiet} disabled={locked} onClick={()=>void run('draft')}>Save draft</button></div>
  <div className={s.actions}>
   {draft?.canReopenQuiz?<button className={s.primary} disabled={busy||readOnly} onClick={()=>void run('reopen')}>Reopen saved review</button>:draft&&['releasing','returning'].includes(draft.state)&&<button className={s.primary} disabled={busy||readOnly} onClick={()=>void run(draft.state==='returning'?'return':'release')}>Finish interrupted {draft.state==='returning'?'revision request':'release'}</button>}
   <button className={s.quiet} disabled={locked||!doc.canReturn} onClick={()=>openPreview('return')}>Request revision</button>
   <button disabled={locked||!doc.canRelease} onClick={()=>openPreview('release')}>Preview release</button>
   <button className={s.primary} disabled={locked||!doc.canRelease} onClick={()=>void run('ready')}>Mark ready & next<ArrowRight size={15}/></button>
  </div>
 </footer>
 {preview&&<Dialog.Root open onOpenChange={open=>{if(!open&&!busy)setPreview(null)}}><Dialog.Portal><Dialog.Overlay className={`${s.scrim} ${s.confirmationScrim}`}/><Dialog.Content className={`${s.desk} ${s.preview} ${s.confirmation}`} aria-label="Release preview" onPointerDownOutside={event=>event.preventDefault()} onEscapeKeyDown={event=>{if(busy)event.preventDefault()}}><Dialog.Description className={s.srOnly}>Review exactly what the student will receive before confirming.</Dialog.Description><div className={s.actions}><Dialog.Title asChild><h3>{preview==='return'?'Preview revision request':'Preview exactly what will be released'}</h3></Dialog.Title><button disabled={busy} onClick={()=>setPreview(null)}>Back to editing</button></div><div>{preview==='return'?<div className={s.revisionBox}><h3>{doc.studentName} · Revise & resubmit</h3><p>{decision.note}</p>{doc.evidence.filter(e=>decision.feedback[e.id]?.trim()).map(e=><div key={e.id}><strong>{e.prompt}</strong><p>{decision.feedback[e.id]}</p></div>)}<p>No new grade or mastery rating will be released.</p></div>:<DecisionPreview doc={doc} decision={decision}/>}</div>{error&&<div role="alert" className={s.error}>{error}</div>}<div className={s.actions}><button className={s.primary} disabled={busy} onClick={()=>void run(preview)}>{busy?'Saving…':preview==='return'?'Send revision request & next':'Release & next'}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>}
 </>
}
