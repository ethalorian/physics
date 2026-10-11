/** Checkpoint scoring model. Practice and Knowledge ratings never enter the quiz calculation. */
export interface CheckpointQuestion {
  id: string
  part: 'recognize' | 'interpret' | 'explain'
  prompt: string
  points: number
  words: string[]
  options?: string[]
  answer?: number
  explanation?: string
  scene?: 'roundtrip' | 'track'
  frame?: string
}

export interface CheckpointAttempt {
  studentId: string
  name: string
  answers: Record<string, string>
  submitted: boolean
  scores: Record<string, number>
  notes: Record<string, string>
  released: boolean
  knowledge: 1 | 2 | 3 | null
}

export function checkpointScore(questions: CheckpointQuestion[], attempt: CheckpointAttempt) {
  const auto = questions.filter(q => q.part !== 'explain')
  const writing = questions.filter(q => q.part === 'explain')
  const autoPoints = auto.reduce((sum, q) => sum + (attempt.answers[q.id] === String(q.answer) ? q.points : 0), 0)
  const validScore = (q: CheckpointQuestion) => Number.isInteger(attempt.scores[q.id]) && attempt.scores[q.id] >= 0 && attempt.scores[q.id] <= q.points
  const reviewed = writing.filter(validScore)
  const writtenPoints = reviewed.reduce((sum, q) => sum + attempt.scores[q.id], 0)
  const possible = questions.reduce((sum, q) => sum + q.points, 0)
  const complete = attempt.submitted && reviewed.length === writing.length
  return { autoPoints, autoPossible: auto.reduce((sum, q) => sum + q.points, 0), writtenPoints,
    writtenPossible: writing.reduce((sum, q) => sum + q.points, 0), pending: writing.length - reviewed.length,
    possible, complete, points: complete ? autoPoints + writtenPoints : null,
    percent: complete && possible > 0 ? Math.round((autoPoints + writtenPoints) / possible * 100) : null }
}

export function checkpointStatus(questions: CheckpointQuestion[], attempt: CheckpointAttempt) {
  if (!attempt.submitted) return Object.values(attempt.answers).some(a => a.trim()) ? 'In progress' : 'Not started'
  if (!checkpointScore(questions, attempt).complete) return 'Needs scoring'
  return attempt.released ? 'Graded' : 'Ready to release'
}

export function submitCheckpoint(questions: CheckpointQuestion[], attempt: CheckpointAttempt): CheckpointAttempt {
  if (attempt.submitted) return attempt
  if (questions.some(q => !attempt.answers[q.id]?.trim() || (q.options && !q.options.some((_, i) => String(i) === attempt.answers[q.id])))) {
    throw new Error('Answer every question before submitting.')
  }
  return { ...attempt, submitted: true }
}

export function scoreCheckpointResponse(questions: CheckpointQuestion[], attempt: CheckpointAttempt, id: string, points: number): CheckpointAttempt {
  const question = questions.find(q => q.id === id && q.part === 'explain')
  if (!attempt.submitted || !question || !Number.isInteger(points) || points < 0 || points > question.points) throw new Error('Choose a valid score for a submitted explanation.')
  if (attempt.released) throw new Error('Released grades are locked. Assign a reassessment to collect new evidence.')
  return { ...attempt, scores: { ...attempt.scores, [id]: points } }
}

export interface StoredCheckpointAttempt extends CheckpointAttempt {
  id: string
  task_id: string
  user_id: string
  number: number
  version: number
  questions: CheckpointQuestion[]
  submitted_at: string | null
  released_at: string | null
  created_at: string
}

export type CheckpointRow = Omit<StoredCheckpointAttempt, 'studentId' | 'name' | 'submitted' | 'released' | 'knowledge'>

export function checkpointModel(row: CheckpointRow, name = 'Student'): StoredCheckpointAttempt {
  return { ...row, studentId: row.user_id, name, submitted: Boolean(row.submitted_at), released: Boolean(row.released_at), knowledge: null }
}

/** Never serialize keys, scoring guides, draft grades or feedback to an unfinished student attempt. */
export function publicCheckpoint(row: CheckpointRow, staff: boolean) {
  const attempt = checkpointModel(row)
  if (staff || attempt.released) return attempt
  return { ...attempt, scores: {}, notes: {}, questions: attempt.questions.map(q => ({ id:q.id,part:q.part,points:q.points,prompt:q.prompt,words:q.words,options:q.options,scene:q.scene,frame:q.frame })) }
}

export function validateCheckpointQuestions(value: unknown, terms: string[]): CheckpointQuestion[] {
  if (!Array.isArray(value) || value.length !== 10) throw new Error('Use 4 recognition, 4 interpretation, and 2 explanation questions.')
  const keys = new Set<string>()
  const words = new Set(terms.map(t => t.toLocaleLowerCase()))
  const questions = value.map((item, i) => {
    const q = item as CheckpointQuestion
    const part: CheckpointQuestion['part'] = i < 4 ? 'recognize' : i < 8 ? 'interpret' : 'explain'
    const points = i < 4 ? 1 : i < 8 ? 2 : 4
    if (!q || typeof q.id !== 'string' || !/^q\d+$/.test(q.id) || keys.has(q.id) || q.part !== part || q.points !== points ||
      typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 1500 ||
      typeof q.explanation !== 'string' || !q.explanation.trim() || q.explanation.length > 2000 ||
      !Array.isArray(q.words) || !q.words.length || q.words.some(w => typeof w !== 'string' || !words.has(w.toLocaleLowerCase())) ||
      (q.frame !== undefined && (typeof q.frame !== 'string' || q.frame.length > 500)) ||
      (q.scene !== undefined && !['roundtrip', 'track'].includes(q.scene))) throw new Error(`Complete question ${i + 1}, its assessed words, and its answer guide.`)
    keys.add(q.id)
    if (part !== 'explain' && (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => typeof o !== 'string' || !o.trim() || o.length > 500) || new Set(q.options.map(o => o.trim().toLowerCase())).size !== 4 || !Number.isInteger(q.answer) || q.answer! < 0 || q.answer! > 3)) throw new Error(`Question ${i + 1} needs four different choices and one correct answer.`)
    return { id: q.id, part, points, prompt: q.prompt.trim(), words: q.words, explanation: q.explanation.trim(), ...(part !== 'explain' ? { options: q.options, answer: q.answer } : { frame: q.frame }), ...(q.scene ? { scene: q.scene } : {}) }
  })
  if (terms.some(t => !questions.some(q => q.words.some(w => w.toLocaleLowerCase() === t.toLocaleLowerCase())))) throw new Error('Every selected word must appear in at least one assessed question.')
  return questions
}

export function releaseCheckpoint(questions: CheckpointQuestion[], attempt: CheckpointAttempt): CheckpointAttempt {
  if (!checkpointScore(questions, attempt).complete) throw new Error('Score both explanations before releasing the grade.')
  return { ...attempt, released: true }
}
