import { createHash } from 'node:crypto'
import { isTransferBrief } from '@/lib/interactive-assignments/graded-assignment'
import type { SourceReview } from './sources'
import type { ReviewDecision } from './types'
export type NativeAction={route:string;body:Record<string,unknown>;id?:string;method?:'POST'|'PATCH'}
function childId(id:string,key:string){const h=createHash('sha256').update(id+':'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`}
export function reviewActions({doc,native:n}:SourceReview,d:ReviewDecision,requestId:string,returning=false):NativeAction[]{
 const id=doc.submissionId,ratings=Object.fromEntries(doc.targets.map(t=>[t.id,t.released??d.ratings[t.id]])),feedback=d.note
 if(returning&&!doc.canReturn)throw Error('This activity uses a fresh reassessment instead of reopening its submitted evidence.')
 if(n.kind==='quiz')return [{route:'quiz',id:n.sub.quiz_id,body:{action:'review',submission_id:id,request_id:requestId,draft_version:n.draft?.version??0,decision:returning?'returned':'graded',scores:returning?{}:d.scores,ratings:returning?{}:ratings,question_notes:d.feedback,note:feedback,grade_value:returning?null:d.gradeValue}}]
 if(n.kind==='reading')return [{route:'reading',id:n.sub.assignment_id,body:{action:'review',submission_id:id,request_id:requestId,decision:returning?'returned':'rated',ratings:returning?{}:ratings,note:feedback}}]
 if(n.kind==='interactive'||n.kind==='simulation'){
  if(returning)return [{route:'interactive',body:{action:'reopen',assignmentId:n.assignment.id,userId:doc.userId,version:n.work.version}}]
  if(doc.gradeMode==='dimensions')return [{route:isTransferBrief(n.lesson)?'transfer':'lab',body:{action:'release',submissionId:id,requestId,revision:n.grade?.revision??0,items:doc.scoreItems.map(i=>({id:i.id,earned:d.scores[i.id],possible:4,feedback:d.feedback[i.id]??''})),mastery:doc.targets.map(t=>({target_id:t.id,level:ratings[t.id],feedback:n.reviews?.find((r:{target_id:string;feedback:string})=>r.target_id===t.id)?.feedback??feedback})),feedback}}]
  return doc.targets.filter(t=>t.released===undefined).map(t=>({route:'interactive',body:{submissionId:id,requestId:childId(requestId,t.id),level:ratings[t.id],feedback,targetId:t.id}}))
 }
 if(n.kind==='review'){
  if(returning)return [{route:'review-admin',body:{action:'reopen',slug:doc.activity.sourceId,user_id:doc.userId,version:n.work.version}}]
  let revision=n.grade.revision
  const actions:NativeAction[]=doc.scoreItems.filter(i=>d.scores[i.id]!==i.suggested).map(i=>({route:'review-grade',body:{action:'override',slug:doc.activity.sourceId,user_id:doc.userId,field:i.id,score:d.scores[i.id],feedback:d.feedback[i.id]??'',revision:revision++}}))
  actions.push({route:'review-grade',body:{action:'release',slug:doc.activity.sourceId,user_id:doc.userId,revision,draft:{summary:feedback,next_step:'',feedback:d.feedback,ratings}}});return actions
 }
 if(n.kind==='mission')return [{route:'mission',body:{action:'review',id:n.sub.id,revision:n.sub.revision,level:ratings[doc.activity.sourceId]??null,note:feedback}}]
 if(n.kind==='math'){
  if(n.revision?.status==='pending')return [{route:'math-revision',body:{action:'acknowledge',submission_id:id,message:feedback||'Correction reviewed. Complete a fresh independent check to demonstrate your understanding.',next_step:'fresh-check'}}]
  return [{route:'math',body:{submission_id:id,competency_id:n.sub.competency_id,level:returning?null:ratings[n.sub.competency_id],message:feedback,request_revision:returning}}]
 }
 if(['lesson','video','reflection','presentation'].includes(n.kind)){
  if(returning)return [{route:'lesson-review',body:{action:'return',submission_id:id,feedback}}]
  const actions:NativeAction[]=doc.targets.filter(t=>t.released===undefined).map(t=>({route:'mastery',body:{userId:doc.userId,unitId:doc.activity.unitIds[0],targetId:t.id,lessonId:n.lessonId,submissionId:n.kind==='presentation'?undefined:id,requestId:childId(requestId,t.id),mode:'target',level:ratings[t.id],evidenceKeys:n.workByTarget[t.id].map((w:{evidenceKey:string})=>w.evidenceKey),message:feedback}}))
  if(n.kind!=='presentation'&&id)actions.push({route:'lesson-review',body:{submission_id:id,feedback}})
  return actions
 }
 if(n.kind==='vocabulary'){
  if(n.checkpoint)return [{route:'checkpoint',body:{task_id:n.task.id,student_id:doc.userId,attempt_id:id,version:n.sub.version,action:'release',review:{scores:Object.fromEntries(doc.scoreItems.filter(i=>i.automatic===undefined).map(i=>[i.id,d.scores[i.id]])),notes:d.feedback,level:ratings[n.task.target_id]??null,feedback}}}]
  if(n.task.task_kind==='quiz')return [{route:'vocabulary',method:'PATCH',body:{task_id:n.task.id,check_id:id,review_version:n.sub.review_version??0,mastery:ratings[n.task.target_id]??null,grades:doc.scoreItems.map(i=>({term_id:i.id,correct:d.scores[i.id]===1,feedback:d.feedback[i.id]??feedback}))}}]
  return [{route:'record',body:{user_id:doc.userId,target_id:n.task.target_id,level:ratings[n.task.target_id],vocabulary:{task_id:n.task.id,request_id:requestId,evidence_key:n.progress.evidenceKey,previous_review_id:n.progress.review?.id??null,note:feedback}}}]
 }
 if(n.kind==='choice')return doc.targets.filter(t=>t.released===undefined).map(t=>({route:'choice',body:{action:'rate-lab-artifact',section_id:n.section.id,option_id:n.option.id,user_id:doc.userId,target_id:t.id,version:n.sub.artifact_version,level:ratings[t.id],note:feedback}}))
 throw Error('This source does not publish a grade or mastery rating.')
}
