import type { VocabTask } from './vocab-learning'
interface Practice { term_id:string; game:string; correct:boolean; created_at:string; occurred_at?:string|null }
interface Check { created_at?:string; completed_at:string|null }
export function summarizeVocabActivity(task: Pick<VocabTask,'term_ids'|'created_at'>,checks:Check[],events:Practice[]) {
 const practice=events.filter(e=>task.term_ids.includes(e.term_id)&&(e.occurred_at??e.created_at)>=task.created_at)
 const dates=[...practice.map(e=>e.occurred_at??e.created_at),...checks.map(c=>c.completed_at??c.created_at??'')].filter(Boolean).sort()
 return {practiceAttempts:practice.length,practiceCorrect:practice.filter(e=>e.correct).length,completedChecks:checks.filter(c=>c.completed_at).length,checksStarted:checks.length,lastAt:dates.at(-1)??null,games:[...new Set(practice.map(e=>e.game))],words:Object.fromEntries(task.term_ids.map(id=>{const rows=practice.filter(e=>e.term_id===id);return [id,{attempts:rows.length,correct:rows.filter(e=>e.correct).length}]}))}
}
