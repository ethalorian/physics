/** Vocabulary checks are evidence about words, never a physics mastery rating. */
export interface LearningWord {
 id: string; term: string; definition: string; tier: number | null; vocabulary_set_id: string
 icon?: string | null; definition_es?: string | null; cognate?: string | null; example?: string | null
 translations?: Record<string, { term?: string; definition?: string }>
}
export interface VocabResult { term_id: string; correct: boolean; supports: string[]; response: string }
export interface CheckRecord { id: string; completed_at: string | null; result: VocabResult[] | null }
export interface VocabTask {
 id: string; course_id: string; target_id: string | null; title: string; note: string; due_on: string | null
 term_ids: string[]; words: LearningWord[]; student_ids: string[]; active: boolean; created_at: string
 threshold: number; min_checks: number; check_mode: 'recognition' | 'recall'
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const normalizeWord = (s: string) => s.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ')
export function summarizeWords(task: Pick<VocabTask,'term_ids'|'threshold'|'min_checks'>, checks: CheckRecord[], now = Date.now()) {
 const done = checks.filter(c => c.completed_at && c.result).sort((a,b) => b.completed_at!.localeCompare(a.completed_at!))
 const words = task.term_ids.map(id => {
  const history = done.flatMap(c => (c.result ?? []).filter(r => r.term_id === id).map(r => ({ ...r, at: c.completed_at! })))
  const recent = history.slice(0,5)
  const accuracy = recent.length ? Math.round(100 * recent.filter(r => r.correct).length / recent.length) : null
  const successes = history.filter(r => r.correct).map(r => Date.parse(r.at)).sort((a,b)=>a-b)
  const retained = successes.length > 1 && successes[successes.length-1] - successes[0] >= 86400000
  const ready = recent.length >= task.min_checks && accuracy !== null && accuracy >= task.threshold
  const reviewDue = ready && now - Date.parse(history[0].at) > 7*86400000
  return { id, attempts: recent.length, accuracy, ready, retained, reviewDue, lastAt: history[0]?.at ?? null, supports: [...new Set(recent.flatMap(r => r.supports))], previousAccuracy: history.length > 5 ? Math.round(100*history.slice(5,10).filter(r=>r.correct).length/history.slice(5,10).length) : null }
 })
 const covered = words.filter(w => w.attempts > 0).length
 const ready = words.filter(w => w.ready).length
 return { words, covered, ready, total: words.length, complete: words.length > 0 && ready === words.length, reviewDue: words.some(w=>w.reviewDue), retained: words.length > 0 && words.every(w=>w.retained), accuracy: covered ? Math.round(words.reduce((n,w)=>n+(w.accuracy ?? 0),0)/covered) : null }
}
