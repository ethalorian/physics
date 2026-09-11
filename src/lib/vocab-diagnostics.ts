import { summarizeWords, type VocabTask, type CheckRecord } from './vocab-learning'
export const WORD_TIERS = [{id:1,label:'Tier 1 · Everyday'},{id:2,label:'Tier 2 · Academic'},{id:3,label:'Tier 3 · Technical'},{id:0,label:'Unclassified'}] as const
export function vocabDiagnostics(task:VocabTask,checks:CheckRecord[],now=Date.now()) {
 const summary=summarizeWords(task,checks,now)
 const done=checks.filter(c=>c.completed_at&&c.result).sort((a,b)=>b.completed_at!.localeCompare(a.completed_at!))
 const evidence=summary.words.map(w=>{
  const word=task.words.find(x=>x.id===w.id)
  const recent=done.flatMap(c=>(c.result??[]).filter(r=>r.term_id===w.id&&typeof r.correct==='boolean')).slice(0,5)
  const misses=recent.filter(r=>!r.correct)
  const last=recent[0]
  const chosen=last&&!last.correct?task.words.find(x=>x.id===last.response)?.term:null
  const pending=done.some(c=>c.result?.some(r=>r.term_id===w.id&&r.correct===null))
  const issue=pending?'Awaiting teacher review':!w.attempts?'Not checked':w.reviewDue?'Review overdue':misses.length>=2?'Repeated incorrect answers':w.attempts<task.min_checks?'More checks needed':!w.ready?'Below accuracy goal':'Meets word goal'
  const next=pending?'Score the submitted response before interpreting proficiency.':!w.attempts?'Collect a first check.':w.reviewDue?'Check again after a short review.':misses.length>=2?'Re-teach this word with an example and a non-example, then check again.':w.attempts<task.min_checks?'Collect another check before drawing a conclusion.':!w.ready?'Review the meaning and check again.':'Revisit later to check retention.'
  return {...w,pending,tier:[1,2,3].includes(word?.tier??0)?word!.tier!:0,term:word?.term??'Word',correct:recent.filter(r=>r.correct).length,misses:misses.length,issue,next,lastResponse:last?.response??null,confusedWith:chosen}
 })
 const tiers=WORD_TIERS.map(t=>{const words=evidence.filter(w=>w.tier===t.id);const attempts=words.reduce((n,w)=>n+w.attempts,0);const correct=words.reduce((n,w)=>n+w.correct,0);return {...t,total:words.length,pending:words.filter(w=>w.pending).length,checked:words.filter(w=>w.attempts).length,ready:words.filter(w=>w.ready).length,attempts,correct,accuracy:attempts?Math.round(correct*100/attempts):null,needsHelp:words.filter(w=>w.misses>=2||w.reviewDue||(w.attempts>=task.min_checks&&!w.ready)).length}})
 return {tiers,issues:evidence.filter(w=>w.issue!=='Meets word goal'),words:evidence}
}
