import {QUESTIONS,correctAnswer,type VelocityState} from './velocity'
import {assignmentByDay,objectiveQuestion,type LessonAssignment,type LessonQuestion} from './catalog'
export const CONCEPTS=['Distance & displacement','Speed & velocity','Unit conversions','Slope & velocity','Axis direction','Independent explanation'] as const
export type EvidenceAssessment={status:'complete'|'partial'|'incorrect'|'unclear';reason:string}
export type SuggestedRating={target_slug:string;level:1|2|3;confidence:'high'|'medium'|'low';rationale:string;feedback:string}
export type Assessment={level:1|2|3;confidence:'high'|'medium'|'low';rationale:string;feedback:string;explanation:EvidenceAssessment;items?:({id:string}&EvidenceAssessment)[];ratings?:SuggestedRating[];weakpoints:{question_ids:string[];concept:string;reason:string;next_step:string}[]}
export type AiReview={submission_id:string;status:'queued'|'processing'|'ready'|'error';result:Assessment|null;model:string|null;error:string|null;updated_at:string;locked_until:string|null}
export function validAssessment(raw:unknown,lesson?:LessonAssignment):raw is Assessment{
 if(!raw||typeof raw!=='object')return false
 const r=raw as Assessment,short=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=max,questions=lesson?.questions??QUESTIONS,concepts=lesson?.sections.map(s=>s.title)??[...CONCEPTS]
 const rating=(x:Assessment|SuggestedRating)=>!!x&&[1,2,3].includes(x.level)&&['high','medium','low'].includes(x.confidence)&&short(x.rationale,1600)&&short(x.feedback,1600)
 const item=(x:EvidenceAssessment)=>!!x&&['complete','partial','incorrect','unclear'].includes(x.status)&&short(x.reason,800)
 if(!rating(r)||!item(r.explanation)||!Array.isArray(r.weakpoints)||r.weakpoints.length>6||!r.weakpoints.every(w=>!!w&&typeof w==='object'&&concepts.includes(w.concept)&&short(w.reason,800)&&short(w.next_step,800)&&Array.isArray(w.question_ids)&&w.question_ids.length>0&&w.question_ids.length<=questions.length&&new Set(w.question_ids).size===w.question_ids.length&&w.question_ids.every(id=>questions.some(q=>q.id===id))))return false
 if(!lesson)return true // Supports previously saved Day 3 assessments.
 const written=questions.filter(q=>!objectiveQuestion(q)&&!('reflection' in q&&q.reflection))
 return Array.isArray(r.items)&&r.items.length===written.length&&new Set(r.items.map(i=>i.id)).size===written.length&&r.items.every(i=>written.some(q=>q.id===i.id)&&item(i))&&Array.isArray(r.ratings)&&r.ratings.length===lesson.targets.length&&new Set(r.ratings.map(t=>t.target_slug)).size===lesson.targets.length&&r.ratings.every(t=>lesson.targets.includes(t.target_slug)&&rating(t))
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
