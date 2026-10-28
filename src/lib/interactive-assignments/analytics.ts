import type {LabDimensionScore} from './lab-rubric'
import type { LabScore } from "./lab-grades"
import {QUESTIONS,correctAnswer,type VelocityState} from './velocity'
import {assignmentByDay,objectiveQuestion,type LessonAssignment,type LessonQuestion} from './catalog'
export const CONCEPTS=['Distance & displacement','Speed & velocity','Unit conversions','Slope & velocity','Axis direction','Independent explanation'] as const
export type EvidenceAssessment={status:'complete'|'partial'|'incorrect'|'unclear';reason:string}
export type SuggestedRating={target_slug:string;level:1|2|3;confidence:'high'|'medium'|'low';rationale:string;feedback:string}
export type Assessment={lab_dimensions?:LabDimensionScore[];lab_scores?:LabScore[];level:1|2|3;confidence:'high'|'medium'|'low';rationale:string;feedback:string;explanation:EvidenceAssessment;items?:({id:string}&EvidenceAssessment)[];ratings?:SuggestedRating[];weakpoints:{question_ids:string[];concept:string;reason:string;next_step:string}[]}
export type AiReview={submission_id:string;status:'queued'|'processing'|'ready'|'error';result:Assessment|null;model:string|null;error:string|null;updated_at:string;locked_until:string|null}
/** Static field paths only: safe to log without student answers or generated feedback. */
export function assessmentValidationIssues(raw:unknown,lesson?:LessonAssignment):string[]{
 const issues:string[]=[],record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)
 if(!record(raw))return ['assessment.object']
 const questions=lesson?.questions??QUESTIONS,concepts=lesson?.sections.map(s=>s.title)??[...CONCEPTS]
 const short=(value:unknown,max:number,path:string)=>{if(typeof value!=='string'||!value.trim()||value.length>max)issues.push(path)}
 const rating=(value:unknown,path:string)=>{
  if(!record(value)){issues.push(path+'.object');return}
  if(![1,2,3].includes(value.level as number))issues.push(path+'.level')
  if(!['high','medium','low'].includes(value.confidence as string))issues.push(path+'.confidence')
  short(value.rationale,1600,path+'.rationale');short(value.feedback,1600,path+'.feedback')
 }
 const item=(value:unknown,path:string)=>{
  if(!record(value)){issues.push(path+'.object');return}
  if(!['complete','partial','incorrect','unclear'].includes(value.status as string))issues.push(path+'.status')
  short(value.reason,800,path+'.reason')
 }
 rating(raw,'assessment');item(raw.explanation,'explanation')
 if(!Array.isArray(raw.weakpoints)||raw.weakpoints.length>6)issues.push('weakpoints.count')
 if(Array.isArray(raw.weakpoints))raw.weakpoints.forEach((value,index)=>{
  const path='weakpoints.'+index
  if(!record(value)){issues.push(path+'.object');return}
  if(!concepts.includes(value.concept as string))issues.push(path+'.concept')
  short(value.reason,800,path+'.reason');short(value.next_step,800,path+'.next_step')
  const ids=value.question_ids
  if(!Array.isArray(ids)||!ids.length||ids.length>questions.length||new Set(ids).size!==ids.length||!ids.every(id=>questions.some(q=>q.id===id)))issues.push(path+'.question_ids')
 })
 if(lesson){
  const written=questions.filter(q=>!objectiveQuestion(q)&&!q.reflection)
  const items=raw.items,ratings=raw.ratings
  if(!Array.isArray(items)||items.length!==written.length||new Set(items.map(value=>record(value)?value.id:undefined)).size!==written.length)issues.push('items.coverage')
  if(Array.isArray(items))items.forEach((value,index)=>{
   if(!record(value)||!written.some(q=>q.id===value.id))issues.push('items.'+index+'.id')
   item(value,'items.'+index)
  })
  if(!Array.isArray(ratings)||ratings.length!==lesson.targets.length||new Set(ratings.map(value=>record(value)?value.target_slug:undefined)).size!==lesson.targets.length)issues.push('ratings.coverage')
  if(Array.isArray(ratings))ratings.forEach((value,index)=>{
   if(!record(value)||!lesson.targets.includes(value.target_slug as string))issues.push('ratings.'+index+'.target_slug')
   rating(value,'ratings.'+index)
  })
 }
 return issues
}
export function validAssessment(raw:unknown,lesson?:LessonAssignment):raw is Assessment{
 return assessmentValidationIssues(raw,lesson).length===0
}
export function evidenceStatus(q:LessonQuestion,state:VelocityState,ai?:AiReview){
 if(!state.answers[q.id]?.trim())return 'missing'
 if(q.reflection)return 'reflection'
 if(!objectiveQuestion(q))return ai?.status==='ready'?(ai.result?.items?.find(i=>i.id===q.id)?.status??(q.id==='6b'?ai.result?.explanation.status:undefined)??'pending'):'pending'
 return correctAnswer(q,state.answers[q.id])?'correct':'incorrect'
}
export function suggestedRating(ai:AiReview|undefined,slug:string){if(ai?.status!=='ready'||!ai.result)return null;return ai.result.ratings?.find(t=>t.target_slug===slug)??(slug===assignmentByDay(3)!.targets[0]?{...ai.result,target_slug:slug}:null)}
export const STATUS_LABELS:Record<string,string>={correct:'Correct',complete:'Supported reasoning',partial:'Partial reasoning',incorrect:'Review this answer',unclear:'Unclear · teacher review',pending:'Awaiting Claude',missing:'No response',unsubmitted:'Not submitted',reflection:'Reflection · recorded'}
export function practiceSupport(q:LessonQuestion,state:VelocityState){return (state.attempts[q.id]??[]).some(t=>!correctAnswer(q,t.answer))}
