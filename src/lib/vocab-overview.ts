import type { VocabMasteryData, VocabMasteryTask, VocabStudentProgress } from './vocab-mastery'

export type VocabOverviewFilter = 'all' | 'review' | 'practice' | 'no-checks' | 'rated' | 'unassigned'

export function needsVocabularyPractice(progress: VocabStudentProgress) {
  return progress.status !== 'quiz-review' && (progress.reviewDue ||
    (progress.covered > 0 && !progress.complete) || Boolean(progress.review && progress.review.level < 3))
}

export function vocabularyOverviewRows(data: VocabMasteryData, tasks: VocabMasteryTask[] = data.tasks) {
  const roster = data.students ?? [...new Map(data.tasks.flatMap(t => t.progress.map(s =>
    [s.studentId, { studentId: s.studentId, name: s.name }] as const))).values()]
  const byTask = new Map(tasks.map(task => [task.id, new Map(task.progress.map(s => [s.studentId, s]))]))
  return roster.map(student => {
    const cells = tasks.map(task => ({ task, progress: byTask.get(task.id)?.get(student.studentId) }))
    const assigned = cells.flatMap(cell => cell.progress ? [cell.progress] : [])
    const toReview = assigned.filter(s => s.status === 'pending' || s.status === 'quiz-review').length
    const needPractice = assigned.filter(needsVocabularyPractice).length
    const rated = assigned.filter(s => s.status === 'rated').length
    const noChecks = assigned.length > 0 && assigned.every(s => s.checks.length === 0)
    return { ...student, cells, assigned: assigned.length, toReview, needPractice, rated, noChecks,
      fullyRated: assigned.length > 0 && rated === assigned.length }
  })
}

export type VocabOverviewRow = ReturnType<typeof vocabularyOverviewRows>[number]

export function matchesVocabOverviewFilter(row: VocabOverviewRow, filter: VocabOverviewFilter) {
  if (filter === 'review') return row.toReview > 0
  if (filter === 'practice') return row.needPractice > 0
  if (filter === 'no-checks') return row.noChecks
  if (filter === 'rated') return row.fullyRated
  if (filter === 'unassigned') return row.assigned === 0
  return true
}

export function vocabularyAssignmentCell(s: VocabStudentProgress) {
  const label = s.review ? `${s.review.level} · ${['Not yet', 'Almost', 'Got it'][s.review.level - 1]}` :
    s.status === 'quiz-review' ? 'Review answers' : s.status === 'pending' ? 'Ready to rate' : 'No checks'
  const detail = s.status === 'quiz-review' ? 'Written answers waiting' : s.status === 'pending' ?
    s.review ? 'New evidence to rate' : `${s.checks.length} completed ${s.checks.length === 1 ? 'check' : 'checks'}` :
    s.reviewDue ? 'Practice review due' : `${s.ready}/${s.total} words at goal`
  const tone = s.status === 'pending' || s.status === 'quiz-review' ? 'review' :
    s.review ? `level-${s.review.level}` : 'empty'
  return { label, detail, tone }
}

export function vocabularyWordCell(s: VocabStudentProgress, wordId: string) {
  const word = s.words.find(w => w.id === wordId)
  const awaiting = s.checks.some(c => c.result?.some(r => (r.term_id === wordId || r.term_ids?.includes(wordId)) && r.correct === null))
  if (awaiting) return { label: 'Review answer', detail: 'Not scored yet', tone: 'review' }
  if (!word?.attempts) return { label: '—', detail: 'Not checked', tone: 'empty' }
  return { label: `${word.accuracy}%`, detail: word.reviewDue ? 'Review due' : word.ready ? 'Goal met' :
    `${word.attempts} ${word.attempts === 1 ? 'check' : 'checks'} · building`,
    tone: word.reviewDue ? 'review' : word.ready ? 'level-3' : 'building' }
}
