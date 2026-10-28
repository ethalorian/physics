import type { ReviewManifest, ReviewState } from './state'
export type Topic = { id:string; label:string }
export type Criterion = { id:string; topic:string; expected:string }
export type ScoreItem = { id:string; score:number; feedback:string; issue:string; confidence:'high'|'medium'|'low' }
export type ScoreResult = { items:ScoreItem[]; summary:string; next_step:string }
export type ReviewRelease = {summary:string;next_step:string;feedback:Record<string,string>;ratings:Record<string,1|2|3|null>}
export type ReviewScore = {review_draft?:ReviewRelease|null;released_review?:ReviewRelease|null; released_at?:string|null;released_by?:string|null; module_slug:string;user_id:string;work_version:number;work_status:string;response_snapshot:Record<string,string>;rubric_version:string;status:'queued'|'running'|'ready'|'error';result:ScoreResult|null;overrides:Record<string,{score:number;feedback:string}>;score:number|null;model:string|null;error:string|null;revision:number;graded_at:string|null;lease_until:string|null;attempts:number }
export type ReviewWork = {module_slug:string;user_id:string;state:ReviewState;status:string;version:number;submitted_at:string|null;updated_at:string;students:{name:string;email:string}|null;practice:{id:string;topic:string;label:string;correct:boolean}[]}
export type ReviewAssignment = {slug:string;title:string;version:number;course_ids:string[];manifest:ReviewManifest;criteria:Criterion[];topics:Topic[]}
export type ReviewRoster = {student_id:string;course_id:string;name:string;email:string}
export type DashboardData = {assignments:ReviewAssignment[];work:ReviewWork[];scores:ReviewScore[];roster:ReviewRoster[];courses:{id:string;name:string;section:string|null}[];claude:{configured:boolean;model:string}}
export const ISSUE_LABELS:Record<string,string>={units:'Units and conversions',time:'Time in seconds',components:'Vector components',sign:'Direction and signs',uncertainty:'Uncertainty and ranges',model:'Model assumptions',graph:'Reading the graph',communication:'Explaining the physics',task:'Task and rubric',calculation:'Calculation',none:'No specific issue'}
export function responseKey(r:Record<string,string>){return JSON.stringify(Object.entries(r).sort(([a],[b])=>a.localeCompare(b)))}
export function scoreIsCurrent(score:ReviewScore|undefined,work:ReviewWork|undefined){return !!score&&!!work&&score.work_status===work.status&&responseKey(score.response_snapshot)===responseKey(work.state.responses)}
export function effectiveItems(score:ReviewScore){return (score.result?.items??[]).map(i=>({...i,...score.overrides[i.id],overridden:!!score.overrides[i.id]}))}
export function scorePercent(items:{score:number}[]){return items.length?Math.round(items.reduce((n,i)=>n+i.score,0)/items.length/4*100):null}
export function scoreBand(score:number|null){return score===null?'empty':score>=75?'strong':score>=50?'developing':'support'}
export function topicScore(score:ReviewScore,criteria:Criterion[],topic:string){const ids=new Set(criteria.filter(f=>f.topic===topic).map(f=>f.id));return scorePercent(effectiveItems(score).filter(i=>ids.has(i.id)))}
export function validateScoreResult(value:unknown,ids:string[]):value is ScoreResult{
 if(!value||typeof value!=='object')return false
 const x=value as ScoreResult
 if(typeof x.summary!=='string'||x.summary.length>800||typeof x.next_step!=='string'||x.next_step.length>800||!Array.isArray(x.items)||x.items.length!==ids.length)return false
 const seen=new Set<string>();return x.items.every(i=>{if(!i||!ids.includes(i.id)||seen.has(i.id)||!Number.isInteger(i.score)||i.score<0||i.score>4||typeof i.feedback!=='string'||!i.feedback.trim()||i.feedback.length>800||!Object.hasOwn(ISSUE_LABELS,i.issue)||!['high','medium','low'].includes(i.confidence))return false;seen.add(i.id);return true})
}
