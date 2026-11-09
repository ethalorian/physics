import { LETTER_GRADES } from './quizzes/types'
import type { QuizCourse } from './quizzes/types'
import { schoolDayStart } from './school-day'

export { LETTER_GRADES }
export type ChoiceEdition = 'cpa' | 'honors'
export type ChoicePaperState = 'not_received' | 'received' | 'excused'
export const CHOICE_PAPER_LABELS = { not_received: 'Awaiting paper', received: 'Awaiting teacher review', excused: 'Excused' } as const
export interface BinderPage { title: string; path: string; sha256: string; style?: string; sei?: boolean; target?: string; previewPath?: string }
export interface BinderPrintPacket { day: BinderPage; unit: BinderPage }
export interface BinderDay { key: string; unit: string; day: number; title: string; target: string; version: string; notes: Partial<Record<ChoiceEdition, BinderPage>>; options: BinderPage[]; reference?: BinderPage; printPackets?: Partial<Record<ChoiceEdition, BinderPrintPacket>>; practicePrintBase?: string }
export interface StudentChoiceAssignment { id: string; course_id: string; unit_id: string; day: number; edition: ChoiceEdition; title: string; packet_key: string; packet_version: string; required_choices?: number; due_at: string; status: 'published' | 'archived'; version: number; created_at: string }
export interface StudentChoiceReview { assignment_id: string; user_id: string; state: ChoicePaperState; letter_grade: typeof LETTER_GRADES[number] | null; feedback: string; version: number; recorded_at: string }
export interface StudentChoiceList { staff: boolean; readOnly: boolean; courses: QuizCourse[]; assignments: StudentChoiceAssignment[]; reviews: StudentChoiceReview[]; catalog: BinderDay[] }
export interface StudentChoiceSelection { assignment_id: string; user_id: string; option_numbers: number[]; version: number; updated_at: string }
export interface StudentChoiceDetail { staff: boolean; readOnly: boolean; assignment: StudentChoiceAssignment; packet: BinderDay; reviews: StudentChoiceReview[]; students: { id: string; name: string }[]; selections: StudentChoiceSelection[] }
export const DEFAULT_CHOICE_COUNT = 3
export function validateRequiredChoices(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 6) throw Error('Choose a required practice count from 1 to 6.')
  return value
}
export function requiredChoiceCount(assignment: Pick<StudentChoiceAssignment, 'required_choices'>) { return assignment.required_choices ?? DEFAULT_CHOICE_COUNT }
export function validateChoiceSelection(value: unknown, required = DEFAULT_CHOICE_COUNT) {
  validateRequiredChoices(required)
  const b = value as { option_numbers?: unknown; version?: number } | null
  if (!b || !Number.isInteger(b.version) || b.version! < 0) throw Error('Reload your choices before saving.')
  if (!Array.isArray(b.option_numbers) || b.option_numbers.length !== required || new Set(b.option_numbers).size !== required || b.option_numbers.some(n => !Number.isInteger(n) || n < 1 || n > 6)) throw Error(`Choose exactly ${required} different practice ${required === 1 ? 'page' : 'pages'} from the six available.`)
  return { option_numbers: [...b.option_numbers].sort((a: number, z: number) => a - z) as number[], version: b.version! }
}
export function choicePracticePrintPath(packet: BinderDay, choices: number[]) {
  const { option_numbers } = validateChoiceSelection({ option_numbers: choices, version: 0 }, choices.length)
  return `/student-choice-print?format=pdf&packet=${encodeURIComponent(packet.key)}&edition=${encodeURIComponent(packet.version)}&options=${option_numbers.join(',')}`
}
export function choiceReviewLabel(review?: StudentChoiceReview) { return review?.letter_grade ? `Reviewed · ${review.letter_grade}` : CHOICE_PAPER_LABELS[review?.state ?? 'not_received'] }
/** End of the chosen school day, independent of the teacher's device timezone. */
export function choiceDueAt(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('Choose a calendar date.')
  const anchor = new Date(day + 'T12:00:00Z')
  if (!Number.isFinite(anchor.getTime()) || anchor.toISOString().slice(0, 10) !== day) throw Error('Choose a valid calendar date.')
  anchor.setUTCDate(anchor.getUTCDate() + 1)
  return new Date(schoolDayStart(anchor).getTime() - 60000).toISOString()
}
export function validateChoiceReview(value: unknown) {
  const b = value as Partial<StudentChoiceReview> | null
  if (!b || !Object.hasOwn(CHOICE_PAPER_LABELS, b.state ?? '') || !Number.isInteger(b.version) || b.version! < 0) throw Error('Choose a paper status and reload before saving.')
  if (b.letter_grade !== null && !LETTER_GRADES.includes(b.letter_grade as typeof LETTER_GRADES[number])) throw Error('Choose a letter grade or leave it ungraded.')
  if (b.letter_grade && b.state !== 'received') throw Error('Record the paper as received before grading it.')
  if (typeof b.feedback !== 'string' || b.feedback.length > 3000) throw Error('Keep feedback within 3,000 characters.')
  return { state: b.state!, letter_grade: b.letter_grade!, feedback: b.feedback.trim(), version: b.version! }
}
