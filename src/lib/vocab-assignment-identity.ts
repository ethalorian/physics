import type { VocabTask } from './vocab-learning'
/** Word order, title, due date and check settings do not make a second assignment. */
export const wordSelectionKey = (ids: string[]) => [...new Set(ids)].sort().join(',')
export function duplicateVocabTask(tasks: Pick<VocabTask,'id'|'active'|'course_id'|'term_ids'|'task_kind'>[], courseId: string, terms: string[], kind: string = 'practice') {
 const key=wordSelectionKey(terms)
 return key ? tasks.find(t=>t.active && (t.task_kind??'practice')===kind && t.course_id===courseId && wordSelectionKey(t.term_ids)===key) : undefined
}
