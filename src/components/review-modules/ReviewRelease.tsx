'use client'
import { useState } from 'react'
import SubmissionSuggestions from '@/components/admin/results/SubmissionSuggestions'
import { useAssessmentReviewGuard } from '@/components/admin/useAssessmentReviewGuard'
import { effectiveItems, type ReviewRelease as Decision, type ReviewScore } from '@/lib/review-modules/analytics'
import { Button } from '@/components/ui/button'
import d from './dashboard.module.css'
export default function ReviewRelease({slug,userId,grade,busy,onSave}:{slug:string;userId:string;grade:ReviewScore;busy:boolean;onSave:(draft:Decision,release:boolean)=>Promise<boolean>}) {
  const [targets,setTargets]=useState<{id:string;statement:string}[]>([])
  const [draft,setDraft]=useState<Decision>(()=>grade.review_draft??{summary:'',next_step:'',feedback:{},ratings:{}})
  const [dirty,setDirty]=useState(false)
  useAssessmentReviewGuard(dirty)
  function update(change:Partial<Decision>){setDraft(old=>({...old,...change}));setDirty(true)}
  const ready=targets.length>0&&targets.every(t=>Object.hasOwn(draft.ratings,t.id))
  async function save(release:boolean){if(await onSave(draft,release))setDirty(false)}
  return <section className={d.panel} aria-label="Choose review mastery and feedback"><h3>Choose mastery and feedback · Private draft</h3>
    <SubmissionSuggestions source="review" id={slug+':'+userId} disabled={busy} onTargets={setTargets} onRating={r=>update({ratings:{...draft.ratings,[r.target_id]:r.level}})} onFeedback={text=>update({summary:draft.summary||text})}/>
    {targets.map(t=><label key={t.id} className="block my-3">{t.statement}<select className="block min-h-11 w-full rounded border bg-background p-2" aria-label={'Mastery: '+t.statement} disabled={busy} value={draft.ratings[t.id]===null?'skip':draft.ratings[t.id]??''} onChange={e=>{const ratings={...draft.ratings};if(!e.target.value)delete ratings[t.id];else ratings[t.id]=e.target.value==='skip'?null:Number(e.target.value) as 1|2|3;update({ratings})}}><option value="">Choose a decision…</option><option value="skip">Skip · no new mastery rating</option><option value="1">1 · Not yet</option><option value="2">2 · Almost</option><option value="3">3 · Got it</option></select></label>)}
    <label className="block my-3">Overall feedback (optional)<textarea className="block w-full rounded border bg-background p-2" value={draft.summary} disabled={busy} maxLength={2500} onChange={e=>update({summary:e.target.value})}/></label>
    <Button variant="outline" disabled={busy} onClick={()=>update({summary:draft.summary||grade.result?.summary||'',next_step:draft.next_step||grade.result?.next_step||''})}>Use review summary and next step</Button>
    <label className="block my-3">Next step (optional)<textarea className="block w-full rounded border bg-background p-2" value={draft.next_step} disabled={busy} maxLength={1000} onChange={e=>update({next_step:e.target.value})}/></label>
    <details><summary>Choose feedback for individual answers</summary>{effectiveItems(grade).map(i=><label className="block my-3" key={i.id}>{i.id} · {i.score}/4<p>{i.feedback}</p><Button variant="outline" disabled={busy} onClick={()=>update({feedback:{...draft.feedback,[i.id]:i.feedback}})}>Use feedback for {i.id}</Button><textarea aria-label={'Feedback for '+i.id} className="block w-full rounded border bg-background p-2" disabled={busy} maxLength={800} value={draft.feedback[i.id]??''} onChange={e=>update({feedback:{...draft.feedback,[i.id]:e.target.value}})}/></label>)}</details>
    <p>Only feedback in these editable fields and your selected mastery ratings will be released. Automatic scores remain editable in the answer review.</p>
    <div className={d.heroActions}><Button variant="outline" disabled={busy} onClick={()=>void save(false)}>Save private draft</Button><Button disabled={busy||!ready} onClick={()=>void save(true)}>Approve & release</Button></div>
  </section>
}
