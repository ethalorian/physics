import type {Quiz,QuizAnswers} from './types'
export interface QuizAssessmentItem {id:string;score:number;feedback:string;confidence:'high'|'medium'|'low'}
export interface QuizAssessment {items:QuizAssessmentItem[];summary:string;next_step:string}
export interface QuizAiReview {submission_id:string;status:'queued'|'processing'|'ready'|'error';result:QuizAssessment|null;error:string|null;model:string|null;locked_until:string|null;updated_at:string}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max
export function validQuizAssessment(v:unknown,quiz:Quiz,answers:QuizAnswers):v is QuizAssessment {
 if(!object(v)||Object.keys(v).some(k=>!['items','summary','next_step'].includes(k))||!text(v.summary,1500)||!text(v.next_step,1000)||!Array.isArray(v.items)||v.items.length!==quiz.questions.length)return false
 const seen=new Set<string>()
 return v.items.every(item=>{
  if(!object(item)||Object.keys(item).some(k=>!['id','score','feedback','confidence'].includes(k))||typeof item.id!=='string'||seen.has(item.id))return false
  seen.add(item.id);const q=quiz.questions.find(q=>q.id===item.id)
  return !!q&&typeof item.score==='number'&&Number.isFinite(item.score)&&item.score>=0&&item.score<=q.points&&Number.isInteger(item.score*2)&&text(item.feedback,2000)&&['high','medium','low'].includes(String(item.confidence))&&(q.kind!=='choice'||item.score===(answers[q.id]===String(q.correct_index)?q.points:0))
 })
}
export function quizAssessmentDraft(result:QuizAssessment,quiz:Quiz){
 return {scores:Object.fromEntries(result.items.filter(i=>quiz.questions.some(q=>q.id===i.id&&q.kind!=='choice')).map(i=>[i.id,i.score])),question_notes:Object.fromEntries(result.items.map(i=>[i.id,i.feedback])),note:`${result.summary}\n\nNext step: ${result.next_step}`}
}
export function quizAiPending(review:QuizAiReview){return review.status==='queued'||review.status==='processing'}
export function quizAiClaimable(review:QuizAiReview,now=Date.now()){return review.status==='queued'||review.status==='processing'&&!!review.locked_until&&Date.parse(review.locked_until)<now}
export const quizAssessmentSchema={type:'object',additionalProperties:false,required:['items','summary','next_step'],properties:{items:{type:'array',items:{type:'object',additionalProperties:false,required:['id','score','feedback','confidence'],properties:{id:{type:'string'},score:{type:'number'},feedback:{type:'string'},confidence:{type:'string',enum:['high','medium','low']}}}},summary:{type:'string'},next_step:{type:'string'}}}
