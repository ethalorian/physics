import 'server-only'
import { createHash } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { readingCourses } from '@/lib/textbook-assignments-server'
import { loadAssessmentResults } from '@/lib/assessment-results/server'
import { assignmentBySlug } from '@/lib/interactive-assignments/catalog'
import { hasDimensionGrade, gradeTable } from '@/lib/interactive-assignments/graded-assignment'
import { lessonTargets } from '@/lib/interactive-assignments/server'
import { LAB_DIMENSIONS } from '@/lib/interactive-assignments/lab-rubric'
import { answerText } from '@/lib/interactive-assignments/velocity'
import {foundationExchangeEvidence} from '@/lib/interactive-assignments/foundations/evidence'
import { foundationQuestionText, isIndependentFoundation } from '@/lib/interactive-assignments/foundations/checkpoints'
import { effectiveItems } from '@/lib/review-modules/analytics'
import { reviewManifest } from '@/lib/review-modules/server'
import { reviewCriteria } from '@/lib/review-modules/rubric-server'
import { suggestionEvidence } from '@/lib/assessment-results/suggestions-server'
import { assessmentResultHref } from '@/lib/assessment-center'
import type { AuthContext } from '@/lib/api-auth'
import {emptyDecision,reviewableActivities,type ReviewDocument} from './types'

// Database JSON is interpreted only by each source adapter; no client-supplied table or column names.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SourceRow = Record<string, any>
export async function row(table:string, filters:Record<string,string>) {
  let q=supabaseAdmin.from(table).select('*')
  for(const [key,value] of Object.entries(filters))q=q.eq(key,value)
  const r=await q.maybeSingle();if(r.error)throw r.error;return r.data as SourceRow|null
}
export async function rows(table:string, filters:Record<string,string>, order:string) {
  let q=supabaseAdmin.from(table).select('*')
  for(const [key,value] of Object.entries(filters))q=q.eq(key,value)
  const r=await q.order(order,{ascending:false}).limit(300);if(r.error)throw r.error;return (r.data??[]) as SourceRow[]
}
export type SourceReview={doc:ReviewDocument;native:SourceRow}
const signature=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,24)
export async function loadReview(ctx:AuthContext, courseId:string, key:string, userId:string, requestedSubmission?:string):Promise<SourceReview> {
  const course=(await readingCourses(ctx)).find(c=>c.id===courseId)
  if(!course)throw Error('Class unavailable for this account.')
  const results=await loadAssessmentResults(ctx,course,'all',key.startsWith('math:')?{}:{studentId:userId}),activity=reviewableActivities(results.activities).find(a=>a.key===key),student=results.students.find(s=>s.id===userId)
  if(!activity||!student||!activity.cells[userId])throw Error('Assignment unavailable for this student.')
  const cell=activity.cells[userId]
  if(requestedSubmission&&requestedSubmission!==cell.submissionId&&!cell.reviewItems?.some(i=>i.id==='math:'+requestedSubmission||i.id===requestedSubmission))throw Error('This attempt is no longer awaiting review.')
  const id=requestedSubmission??cell.submissionId
  const doc:ReviewDocument={activity:{key,kind:activity.kind,title:activity.title,sourceId:activity.sourceId,unitIds:activity.unitIds},userId,studentName:student.name,version:'',submissionId:id??'',submittedAt:cell.submittedAt??null,attempt:1,state:cell.needsReview?'submitted':cell.state==='reviewed'?'released':cell.state==='returned'?'returned':'draft',evidence:[],targets:(activity.targetIds??[]).map(id=>({id,statement:results.targets?.find(t=>t.id===id)?.statement??'Learning target',allowSkip:true})),scoreItems:[],gradeMode:'mastery',draft:null,revision:null,canReturn:false,canRelease:cell.needsReview,sourceHref:assessmentResultHref(activity.kind,activity.sourceId,courseId,"",userId)}
  const native:SourceRow={kind:activity.kind,courseId,activity,userId}
  if(activity.kind==='quiz'||activity.kind==='reading') {
    const quiz=activity.kind==='quiz',prefix=quiz?'quiz':'textbook',keyField=quiz?'quiz_id':'assignment_id'
    const work=await row(prefix+'_work',{[keyField]:activity.sourceId,user_id:userId}),sub=id?await row(prefix+'_submissions',{id}):null
    if(!sub||!work||sub.user_id!==userId||work.submission_id!==sub.id)throw Error('No current submitted attempt is available.')
    const history=await rows(prefix+'_submissions',{[keyField]:sub[keyField],user_id:userId},'submitted_at'),prior=history.find(s=>s.submitted_at<sub.submitted_at)
    const review=await row(prefix+'_reviews',{submission_id:sub.id})
    Object.assign(native,{work,sub,review,draft:quiz?await row('quiz_review_drafts',{submission_id:sub.id}):null})
    const saved=native.draft?.payload??review;if(saved)doc.initialDecision={...emptyDecision(),scores:saved.scores??{},ratings:saved.ratings??{},feedback:saved.question_notes??{},note:saved.note??'',gradeValue:saved.grade_value??null}
    doc.state=work.state==='submitted'?'submitted':work.state==='returned'?'returned':'released';doc.canRelease=doc.state==='submitted';doc.canReturn=doc.canRelease;doc.attempt=history.length;doc.version=sub.id;doc.submittedAt=sub.submitted_at
    doc.targets=doc.targets.filter(t=>sub.snapshot.questions.some((q:SourceRow)=>q.target_id===t.id)).map(t=>({...t,allowSkip:quiz}))
    doc.evidence=sub.snapshot.questions.map((q:SourceRow,i:number)=>({id:q.id,prompt:q.reference?`${q.reference}\n${q.prompt}`:q.prompt,response:q.kind==='choice'?q.options?.[Number(sub.answers[q.id])]??'No response':sub.answers[q.id],previous:prior?.answers[q.id],guide:q.guide,targetIds:[q.target_id],...(q.kind==='problem'?{rendering:'problem'}:{}),context:`Question ${i+1}`}))
    if(quiz){doc.gradeMode='points';doc.gradeFormat=sub.snapshot.grade_mode;doc.scoreItems=sub.snapshot.questions.map((q:SourceRow,i:number)=>({id:q.id,label:`Question ${i+1}`,possible:q.points,step:.5,...(q.kind==='choice'?{automatic:sub.answers[q.id]===String(q.correct_index)?q.points:0}:{})}));const ai=await row('quiz_ai_reviews',{submission_id:sub.id});if(ai?.status==='ready'){doc.suggestedFeedback=[ai.result?.summary,ai.result?.next_step].filter(Boolean).join('\n\n');for(const item of doc.scoreItems){const match=ai.result?.items?.find((x:SourceRow)=>x.id===item.id);if(match){item.suggested=match.score;item.feedback=match.feedback}}}}
  } else if(activity.kind==='interactive'||activity.kind==='simulation') {
    const assignment=await row('interactive_assignments',{id:key.slice('interactive:'.length)}),lesson=assignmentBySlug(activity.sourceId)
    if(!assignment||!lesson)throw Error('Assignment unavailable.')
    const work=await row('interactive_assignment_work',{assignment_id:assignment.id,user_id:userId}),sub=id?await row('interactive_assignment_submissions',{id}):null
    if(!sub||sub.user_id!==userId||sub.assignment_id!==assignment.id)throw Error('No submitted attempt is available.')
    const history=await rows('interactive_assignment_submissions',{assignment_id:assignment.id,user_id:userId},'submitted_at'),prior=history.find(s=>s.submitted_at<sub.submitted_at),targets=await lessonTargets(lesson),reviews=await rows('interactive_assignment_reviews',{submission_id:sub.id},'created_at'),grade=hasDimensionGrade(lesson)?await row(gradeTable(lesson),{submission_id:sub.id}):null
    Object.assign(native,{assignment,lesson,work,sub,reviews,grade})
    doc.initialDecision={...emptyDecision(),scores:Object.fromEntries((grade?.items??[]).map((i:SourceRow)=>[i.id,i.earned])),ratings:Object.fromEntries(reviews.map(r=>[r.target_id,r.level])),feedback:Object.fromEntries((grade?.items??[]).map((i:SourceRow)=>[i.id,i.feedback??''])),note:grade?.feedback??reviews[0]?.feedback??''}
    doc.version=sub.id;doc.attempt=history.length;doc.state=work?.status==='submitted'&&work.version===sub.version?(cell.needsReview?'submitted':'released'):'returned';doc.canRelease=doc.state==='submitted';doc.canReturn=work?.status==='submitted';doc.targets=targets.map(t=>({...t,allowSkip:hasDimensionGrade(lesson),...(reviews.find(r=>r.target_id===t.id)?{released:reviews.find(r=>r.target_id===t.id)!.level}:{})}))
    doc.evidence=lesson.questions.map(q=>({id:q.id,prompt:foundationQuestionText(q,isIndependentFoundation(sub.state)).prompt,response:q.diagram?sub.state.answers[q.id]:answerText(q,sub.state.answers[q.id]),previous:prior?.state.answers[q.id],guide:foundationQuestionText(q,isIndependentFoundation(sub.state)).explanation,targetIds:targets.map(t=>t.id),...(q.diagram?{rendering:'force' as const}:{}),context:q.independent?'Independent response':`${sub.state.attempts?.[q.id]?.length??0} practice checks · supports are context, not a penalty`}))
    if(lesson.simulation)doc.evidence.unshift({id:'simulation-trials',prompt:'Recorded investigation evidence',response:{state:sub.state,simulation:lesson.simulation},targetIds:targets.map(t=>t.id),rendering:'simulation',context:'Recorded measurements support the student’s written claims. Measurements alone do not establish conceptual understanding.'})
    if(lesson.foundation){const exchange=foundationExchangeEvidence(sub.state,lesson.foundation);for(const checkpoint of exchange?.checkpoints??[]){for(const [part,response] of Object.entries(checkpoint.own)){if(!response)continue;doc.evidence.push({id:'exchange:'+checkpoint.id+':'+part,prompt:checkpoint.title+' · Student’s '+part,response,targetIds:targets.map(t=>t.id),context:'Only this student’s writing is rated. '+(part==='reply'?'Peer or provided writing is context: '+JSON.stringify(checkpoint.example??checkpoint.peers??checkpoint.peer):''),guide:checkpoint.demand.evidence})}}}
    if(hasDimensionGrade(lesson)){doc.gradeMode='dimensions';doc.scoreItems=LAB_DIMENSIONS.map(d=>({id:d.id,label:d.label,possible:4,step:1,feedback:d.description}));const ai=await row('interactive_assignment_ai_reviews',{submission_id:sub.id});if(ai?.status==='ready'){doc.suggestedFeedback=ai.result?.feedback;for(const item of doc.scoreItems){const match=ai.result?.lab_dimensions?.find((x:SourceRow)=>x.id===item.id);if(match){item.suggested=match.earned;item.feedback=match.feedback}}}}
  } else if(activity.kind==='review') {
    const work=await row('review_module_work',{module_slug:activity.sourceId,user_id:userId}),grade=await row('review_module_scores',{module_slug:activity.sourceId,user_id:userId})
    if(!work)throw Error('No saved work is available.')
    const manifest=await reviewManifest(activity.sourceId),criteria=reviewCriteria(activity.sourceId)
    Object.assign(native,{work,grade});doc.version=String(work.version);doc.submissionId=activity.sourceId+':'+userId;doc.canReturn=work.status==='submitted';doc.canRelease=work.status==='submitted'&&grade?.status==='ready'&&!grade.released_at;doc.gradeMode='points'
    doc.evidence=manifest.fields.map(f=>({id:f.id,prompt:f.label,response:work.state.responses[f.id],guide:criteria.find(c=>c.id===f.id)?.expected,targetIds:[]}))
    const items=grade?.status==='ready'?effectiveItems(grade as Parameters<typeof effectiveItems>[0]):[]
    if(grade?.review_draft)doc.initialDecision={...emptyDecision(),scores:Object.fromEntries(items.map(i=>[i.id,i.score])),ratings:grade.review_draft.ratings??{},feedback:grade.review_draft.feedback??{},note:[grade.review_draft.summary,grade.review_draft.next_step].filter(Boolean).join('\n\n')}
    doc.scoreItems=manifest.fields.map(f=>({id:f.id,label:f.label,possible:4,step:1,suggested:items.find(i=>i.id===f.id)?.score,feedback:items.find(i=>i.id===f.id)?.feedback}))
    const suggestions=await suggestionEvidence('review',doc.submissionId)
    if(suggestions?.targetIds.length){const t=await supabaseAdmin.from('learning_targets').select('id,statement').in('id',suggestions.targetIds);if(t.error)throw t.error;doc.targets=(t.data??[]).map(t=>({...t,allowSkip:true}));doc.evidence.forEach(e=>e.targetIds=suggestions.targetIds)}
    doc.suggestedFeedback=[grade?.result?.summary,grade?.result?.next_step].filter(Boolean).join('\n\n');if(!doc.canRelease&&work.status==='submitted'&&!grade?.released_at)doc.limitation='Automatic scoring must finish before this review can be released. Refresh after analysis completes.'
  } else if(activity.kind==='math'&&id?.startsWith('mission:')) {
    const sub=await row('math_mission_sessions',{id:id.slice(8)}),target=await row('math_competencies',{id:activity.sourceId})
    if(!sub||sub.user_id!==userId||sub.code!==activity.code||sub.status!=='completed'||sub.staff)throw Error('Mission unavailable.')
    Object.assign(native,{kind:'mission',sub});doc.version=id+':'+sub.completed_at;doc.submissionId=id;doc.canRelease=!sub.reviewed_at;doc.state=doc.canRelease?'submitted':'released';doc.submittedAt=sub.completed_at;doc.targets=[{id:activity.sourceId,statement:target?.statement??activity.title,allowSkip:true}]
    const evidence=Array.isArray(sub.state?.evidence)?sub.state.evidence:Object.entries(sub.state?.evidence??{}).map(([id,response])=>({id,response}))
    doc.evidence=evidence.map((e:SourceRow,i:number)=>({id:String(e.taskId??e.id??i),prompt:String(e.prompt??e.question??'Mission evidence '+(i+1)),response:e.answers??e.response??e.answer??e,guide:e.explanation,targetIds:[activity.sourceId],context:`${e.phase??'Mission'} · ${e.assisted?'Supported practice':'Independent response'} · ${e.hints??0} hints. Math mastery only; no percentage grade.`}))
    doc.limitation='A new mission provides fresh independent evidence. Corrections are reviewed separately from the game score.'
  } else if(activity.kind==='math') {
    const sub=id?await row('math_warmup_submissions',{id}):null
    if(!sub||sub.user_id!==userId||sub.competency_id!==activity.sourceId&&!sub.tested_competency_ids?.includes(activity.sourceId))throw Error('Warm-up unavailable.')
    const revision=await row('math_warmup_revisions',{submission_id:sub.id}),target=await row('math_competencies',{id:sub.competency_id})
    Object.assign(native,{sub,revision});doc.version=sub.id+':'+(revision?.submitted_at??'first');doc.attempt=revision?2:1;doc.canReturn=!revision&&sub.status!=='reviewed';doc.canRelease=sub.status!=='reviewed'||revision?.status==='pending';doc.state=doc.canRelease?'submitted':'released';doc.targets=revision?[]:[{id:sub.competency_id,statement:target?.statement??activity.title,allowSkip:false}]
    doc.evidence=[{id:'response',prompt:sub.prompt,response:revision?.response_json??sub.response_json??sub.response,previous:revision?sub.response_json??sub.response:undefined,targetIds:[sub.competency_id],rendering:'math',context:revision?'Supported correction. A fresh independent check establishes new mastery.':'Math mastery · no percentage grade'}]
    if(revision)doc.limitation='This is a supported correction. Releasing acknowledges the correction and asks for a fresh independent check; it does not replace the earlier mastery observation.'
  } else {
    const {loadAdditionalSource}=await import('./sources-additional')
    await loadAdditionalSource(ctx,doc,native,id)
  }
  if(!doc.version)doc.version=doc.submissionId||signature(doc.evidence)
  if(doc.version.length>200)doc.version=signature(doc.version)
  doc.reviewVersion=signature({draft:native.draft?.version,grade:native.grade?.revision,review:native.review?.id,reviews:native.reviews?.map((r:SourceRow)=>r.id).sort(),version:native.sub?.review_version??(native.checkpoint?native.sub?.version:undefined),mission:native.kind==='mission'?native.sub?.revision:undefined,math:native.kind==='math'?[native.sub?.reviewed_at,native.revision?.status]:undefined})
  const [draft,revision]=await Promise.all([row('review_desk_drafts',{source_key:key,user_id:userId,source_version:doc.version,reviewer_email:ctx.scopeEmail}),rows('review_desk_revisions',{source_key:key,user_id:userId},'requested_at')])
  doc.draft=draft as ReviewDocument['draft'];doc.revision=(revision[0]??null) as ReviewDocument['revision']
  if(doc.revision&&doc.revision.source_version!==doc.version){doc.attempt=Math.max(doc.attempt,revision.length+1);for(const evidence of doc.evidence){const prior=doc.revision.evidence.find(e=>e.id===evidence.id);if(prior)evidence.previous=prior.response}}
  return {doc,native}
}
