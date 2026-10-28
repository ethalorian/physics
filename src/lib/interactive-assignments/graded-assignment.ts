import type { LessonAssignment } from './catalog'
import { FOUR_DIMENSION_LAB_VERSION, labDimensionGrade, validLabDimensions } from './lab-rubric'

export const TRANSFER_BRIEF_RUBRIC_VERSION = 'transfer-brief-four-dimensions-v1'
export const isTransferBrief = (lesson: LessonAssignment | null | undefined) => !!lesson?.transferBrief
export const hasDimensionGrade = (lesson: LessonAssignment | null | undefined) => !!(lesson?.transferBrief || lesson?.simulation || lesson?.lab)
export const gradeTable = (lesson: LessonAssignment) => isTransferBrief(lesson) ? 'transfer_task_grades' : 'simulation_lab_grades'
export const gradeEndpoint = (lesson: LessonAssignment) => isTransferBrief(lesson) ? '/api/interactive-assignments/transfer-grade' : '/api/interactive-assignments/lab-grade'
export const gradeRubricVersion = (lesson: LessonAssignment) => isTransferBrief(lesson) ? TRANSFER_BRIEF_RUBRIC_VERSION : FOUR_DIMENSION_LAB_VERSION
export const isDimensionRubric = (version: string) => [FOUR_DIMENSION_LAB_VERSION, TRANSFER_BRIEF_RUBRIC_VERSION].includes(version)
export const TRANSFER_RUBRIC_SUMMARY = 'Science, Reasoning, Communication and Transfer are each scored from 0 to 4 using the evidence requested in this brief. Clear, concise reasoning is enough. The lowest dimension sets the grade: 4 → 96%, 3 → 89%, 2 → 85%, 1 → 75%, 0 → 50%. Mastery is reviewed separately.'
export const TRANSFER_RUBRIC = 'Score Science, Reasoning, Communication, and Transfer from 0 to 4 against the evidence explicitly requested in this brief. Use 0 for no assessable evidence, 1 for substantial gaps, 2 for partial success, 3 for mostly successful evidence with a minor gap, and 4 for accurate, supported evidence at the requested demand. The lowest dimension sets the grade: 4 → 96%, 3 → 89%, 2 → 85%, 1 → 75%, 0 → 50%. Never average dimensions or convert mastery into points. Do not penalize language supports, home language, brevity, spelling, or response mode. Do not require unrelated parts of a broader standard. Communication earns 4 when the requested reasoning, quantities, units, and context are understandable. Do not deduct for paragraph versus list format, not repeating a reference frame already established, or optional presentation improvements. For any score below 4, identify a concrete gap in the explicitly requested evidence; a useful next-step suggestion alone is not a scoring gap. When the prompt asks for one assumption, condition or example, one supported choice earns full credit; the answer guide lists alternatives, not a checklist. Never require every example from the guide or restate all supplied assumptions. Before finalizing each deduction or weakpoint, compare it with the actual response and prompt: remove it if the student already supplied the requested evidence or the extra detail was not asked for. An optional extension can still appear as feedback without lowering the score. Mastery and feedback remain the teacher’s separate choices.'

/** Version validation prevents a lab from being counted in Transfer Task or vice versa. */
export function transferDimensionGrade(version: string, items: unknown) {
  return version === TRANSFER_BRIEF_RUBRIC_VERSION && validLabDimensions(items) ? labDimensionGrade(items) : null
}
