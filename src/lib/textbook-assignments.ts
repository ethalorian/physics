import { validateHonorsReading, type HonorsReading } from './openstax-physics'
import { textbookChapter } from '@/data/textbook'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'

export const READING_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export type ReadingQuestion = { id: string; reference: string; prompt: string; target_id: string }
export type ReadingTarget = { id: string; slug?: string; statement: string; unit_id: string; domain: string; program: string }
export type ReadingAssignment = {
  origin_key?: string | null; passage?: string | null; honors_reading?: HonorsReading | null;
  id: string; course_id: string; title: string; chapter: number; reading: string; section_ids: string[];
  instructions: string; questions: ReadingQuestion[]; due_at: string | null;
  status: 'draft' | 'published' | 'archived'; version: number; created_at: string;
}
export type ReadingWork = {
  assignment_id: string; user_id: string; answers: Record<string, string>; version: number;
  state: 'in_progress' | 'submitted' | 'returned' | 'rated'; submission_id: string | null; updated_at: string;
}
export type ReadingSubmission = { id: string; assignment_id: string; user_id: string; answers: Record<string, string>; snapshot: ReadingAssignment; submitted_at: string }
export type ReadingReview = { id: string; submission_id: string; decision: 'rated' | 'returned'; ratings: Record<string, number>; note: string; reviewed_at: string }
export type ReadingCourse = { id: string; name: string; section: string | null; program: string; track?: string | null }
export type ReadingList = { review_counts?: Record<string,number>; assignments: ReadingAssignment[]; work: ReadingWork[]; courses: ReadingCourse[]; staff: boolean }
export type ReadingDetail = { readingQuiz?: {id: string | null; locked: boolean; state?: string; needsCompletion?: boolean} | null; lesson_slug?: string | null; assignment: ReadingAssignment; work: ReadingWork[]; submissions: ReadingSubmission[]; reviews: ReadingReview[]; targets: ReadingTarget[]; students: { id: string; name: string }[]; staff: boolean }

export function readingState(work?: ReadingWork | null) {
  return work ? ({ in_progress: 'In progress', submitted: 'Ready to review', returned: 'Needs revision', rated: 'Rated' })[work.state] : 'Not started'
}
export function readingOverdue(assignment: ReadingAssignment, work?: ReadingWork | null, now = Date.now()) {
  return assignment.status === 'published' && !!assignment.due_at && Date.parse(assignment.due_at) < now && (!work || ['in_progress', 'returned'].includes(work.state))
}
export function questionNumbers(input: string): number[] {
  const numbers = new Set<number>()
  if (!input.trim()) return []
  for (const token of input.split(/[,\s]+/).filter(Boolean)) {
    const match = token.match(/^(\d{1,3})(?:[-–](\d{1,3}))?$/)
    if (!match) throw new Error('Use question numbers such as 1–5, 8, 12.')
    const first = Number(match[1]), last = Number(match[2] ?? match[1])
    if (first < 1 || last < first || last > 999 || last - first > 29) throw new Error('Choose up to 30 questions, using increasing ranges.')
    for (let n = first; n <= last; n++) numbers.add(n)
  }
  if (numbers.size > 30) throw new Error('Choose up to 30 questions per reading.')
  return [...numbers]
}
function bounded(value: unknown, max: number, label: string, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`Check ${label}.`)
  return value.trim()
}
export function validateReading(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Complete the reading assignment.')
  const b = value as Record<string, unknown>
  const origin = b.origin_key == null ? null : bounded(b.origin_key, 204, 'the lesson link', true)
  if (origin && !/^lesson:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[^\s]{1,160}$/i.test(origin)) throw new Error('Check the lesson link.')
  if (!READING_UUID.test(String(b.id)) || !READING_UUID.test(String(b.course_id))) throw new Error('Choose a class.')
  if (!Number.isInteger(b.chapter) || !textbookChapter(Number(b.chapter))) throw new Error('Choose a textbook chapter.')
  if (!['draft', 'published'].includes(String(b.status))) throw new Error('Choose save draft or publish.')
  if (!Number.isInteger(b.version) || Number(b.version) < 0) throw new Error('Reload the assignment.')
  const sections = TEXTBOOK_SECTIONS[Number(b.chapter)]?.sections ?? []
  if (!Array.isArray(b.section_ids) || b.section_ids.length > sections.length || b.section_ids.some(id => !sections.some(s => s.id === id))) throw new Error('Choose sections from this chapter.')
  if (!Array.isArray(b.questions) || b.questions.length < 1 || b.questions.length > 30) throw new Error('Add 1–30 questions.')
  const seen = new Set<string>()
  const questions = b.questions.map((raw: unknown) => {
    const q = (raw ?? {}) as Record<string, unknown>
    if (!READING_UUID.test(String(q.id)) || seen.has(String(q.id)) || !READING_UUID.test(String(q.target_id))) throw new Error('Link each question to a mastery target.')
    seen.add(String(q.id))
    const reference = bounded(q.reference, 160, 'the question reference'), prompt = bounded(q.prompt, 3000, 'the question prompt')
    if (!reference && !prompt) throw new Error('Enter a question reference or prompt.')
    return { id: String(q.id), reference, prompt, target_id: String(q.target_id) }
  })
  const due = b.due_at === null ? null : bounded(b.due_at, 40, 'the due date', true)
  if (due && !Number.isFinite(Date.parse(due))) throw new Error('Enter a valid due date.')
  const passage = b.passage == null ? null : bounded(b.passage, 12000, 'the course reading', true)
  return { ...('honors_reading' in b ? { honors_reading: validateHonorsReading(b.honors_reading) } : {}), ...('passage' in b ? { passage } : {}), origin_key: origin, id: String(b.id), course_id: String(b.course_id), title: bounded(b.title, 160, 'the title', true), chapter: Number(b.chapter), reading: bounded(b.reading, 500, 'the reading pages or sections', true), section_ids: [...new Set(b.section_ids)] as string[], instructions: bounded(b.instructions, 3000, 'the directions'), questions, due_at: due ? new Date(due).toISOString() : null, status: b.status as 'draft' | 'published', version: Number(b.version) }
}
export function validateReadingAnswers(value: unknown, questions: ReadingQuestion[], submitting: boolean): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Your answers could not be read.')
  const entries = Object.entries(value)
  if (entries.length > questions.length || entries.some(([id, v]) => !questions.some(q => q.id === id) || typeof v !== 'string' || v.length > 10000)) throw new Error('Answers must match these questions and stay under 10,000 characters each.')
  const answers = Object.fromEntries(entries) as Record<string, string>
  if (JSON.stringify(answers).length > 200000) throw new Error('This response is too long to save.')
  if (submitting && questions.some(q => !answers[q.id]?.trim())) throw new Error('Answer every question before submitting. You can save unfinished work as a draft.')
  return answers
}
