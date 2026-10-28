import { nextTimeText } from '@/lib/teacher-feedback'
import type {Quiz,QuizAnswers} from './types'
export interface QuizAssessmentItem {id:string;score:number;feedback:string;confidence:'high'|'medium'|'low'}
export interface QuizAssessment {items:QuizAssessmentItem[];summary:string;next_step:string;mastery?:{target_id:string;level:1|2|3|null;rationale:string}[]}
export interface QuizAiReview {submission_id:string;status:'queued'|'processing'|'ready'|'error';result:QuizAssessment|null;error:string|null;model:string|null;attempts?:number;locked_until:string|null;updated_at:string}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max
/** The provider may change enum capitalization; never coerce scores or invent evidence. */
export function normalizeQuizAssessment(v:unknown,quiz:Quiz):unknown {
 if(!object(v))return v
 const canonical=(value:unknown,known:string[])=>typeof value==='string'?known.find(id=>id.toLowerCase()===value.toLowerCase())??value:value
 return {...v,...(Array.isArray(v.items)?{items:v.items.map(item=>object(item)?{...item,id:canonical(item.id,quiz.questions.map(q=>q.id)),confidence:canonical(item.confidence,['high','medium','low'])}:item)}:{}),...(Array.isArray(v.mastery)?{mastery:v.mastery.map(r=>object(r)?{...r,target_id:canonical(r.target_id,quiz.questions.map(q=>q.target_id))}:r)}:{})}
}
export function validQuizAssessment(v:unknown,quiz:Quiz,answers:QuizAnswers):v is QuizAssessment {
 if(!object(v)||Object.keys(v).some(k=>!['items','summary','next_step','mastery'].includes(k))||!text(v.summary,1500)||!text(v.next_step,1000)||!Array.isArray(v.items)||v.items.length!==quiz.questions.length)return false
 if(v.mastery!==undefined){
  const targets=new Set(quiz.questions.map(q=>q.target_id)),seenTargets=new Set<string>()
  if(!Array.isArray(v.mastery)||v.mastery.length!==targets.size||!v.mastery.every(r=>object(r)&&typeof r.target_id==='string'&&targets.has(r.target_id)&&!seenTargets.has(r.target_id)&&!!seenTargets.add(r.target_id)&&[1,2,3,null].includes(r.level as number|null)&&text(r.rationale,1200)&&Object.keys(r).every(k=>['target_id','level','rationale'].includes(k))))return false
 }
 const seen=new Set<string>()
 return v.items.every(item=>{
  if(!object(item)||Object.keys(item).some(k=>!['id','score','feedback','confidence'].includes(k))||typeof item.id!=='string'||seen.has(item.id))return false
  seen.add(item.id);const q=quiz.questions.find(q=>q.id===item.id)
  return !!q&&typeof item.score==='number'&&Number.isFinite(item.score)&&item.score>=0&&item.score<=q.points&&Number.isInteger(item.score*2)&&text(item.feedback,2000)&&['high','medium','low'].includes(String(item.confidence))&&(q.kind!=='choice'||item.score===(answers[q.id]===String(q.correct_index)?q.points:0))
 })
}
export function quizAssessmentDraft(result:QuizAssessment,quiz:Quiz){
 return {scores:Object.fromEntries(result.items.filter(i=>quiz.questions.some(q=>q.id===i.id&&q.kind!=='choice')).map(i=>[i.id,i.score])),ratings:Object.fromEntries((result.mastery??[]).map(r=>[r.target_id,r.level])),question_notes:Object.fromEntries(result.items.map(i=>[i.id,i.feedback])),note:`${result.summary}\n\nNext time: ${nextTimeText(result.next_step)}`}
}
export function quizAiPending(review:QuizAiReview){return review.status==='queued'||review.status==='processing'}
export function quizAiClaimable(review:QuizAiReview,now=Date.now()){return review.status==='queued'||review.status==='processing'&&!!review.locked_until&&Date.parse(review.locked_until)<now}
/** Bounded recovery when the teacher opens Results; permanent setup errors need attention. */
export function quizAiRecoverable(review:QuizAiReview,now=Date.now()){
 return quizAiClaimable(review,now)||review.status==='error'&&(review.attempts??3)<3&&
  !/credentials|model is unavailable|configuration|not configured/.test(review.error??'')&&
  Date.parse(review.updated_at)+60000<=now
}
export const quizAssessmentSchema={type:'object',additionalProperties:false,required:['items','summary','next_step','mastery'],properties:{items:{type:'array',items:{type:'object',additionalProperties:false,required:['id','score','feedback','confidence'],properties:{id:{type:'string'},score:{type:'number'},feedback:{type:'string'},confidence:{type:'string',enum:['high','medium','low']}}}},summary:{type:'string'},next_step:{type:'string'},mastery:{type:'array',items:{type:'object',additionalProperties:false,required:['target_id','level','rationale'],properties:{target_id:{type:'string'},level:{anyOf:[{type:'integer',enum:[1,2,3]},{type:'null'}]},rationale:{type:'string'}}}}}}
