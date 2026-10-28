import {isLabAssignment} from './catalog'
import { objectiveQuestion, type LessonAssignment } from './catalog'

export const LAB_RUBRIC_VERSION = 'lab-response-v1'
export const LAB_RUBRIC = 'Objective answers: 0–1 point. Explanations and diagrams: 0 = no assessable evidence; 1 = substantial misconception; 2 = partially correct with a major gap; 3 = mostly correct with a minor gap; 4 = accurate and supported at the requested demand. Predictions, reflections, practice attempts, time spent and completion are not correctness points.'
export type LabScore = { id: string; earned: number; possible: number; feedback: string }
export type LabMasteryDecision = { target_id: string; level: 1|2|3|null; feedback: string }
export type LabGrade = { submission_id: string; rubric_version: string; items: LabScore[]; mastery: LabMasteryDecision[]; earned: number; possible: number; feedback: string; revision: number; request_id: string; released_at: string }
export function labRubric(lesson: LessonAssignment) {
  return isLabAssignment(lesson) ? lesson.questions.filter(q => !q.reflection).map(q => ({ id:q.id, possible:objectiveQuestion(q)?1:4, prompt:q.prompt })) : []
}
export function validLabScores(value: unknown, lesson: LessonAssignment): value is LabScore[] {
  const rubric = labRubric(lesson)
  if (!rubric.length || !Array.isArray(value) || value.length !== rubric.length) return false
  const seen = new Set<string>()
  return value.every((s:LabScore) => {
    if (!s || seen.has(s.id)) return false
    seen.add(s.id)
    return rubric.some(q => q.id === s.id && q.possible === s.possible) && Number.isInteger(s.earned) && s.earned >= 0 && s.earned <= s.possible && typeof s.feedback === 'string' && s.feedback.length <= 1200
  })
}
export function validLabMastery(value: unknown, targets: string[]): value is LabMasteryDecision[] {
  if (!Array.isArray(value) || value.length !== targets.length) return false
  const seen = new Set<string>()
  return value.every((d:LabMasteryDecision) => {
    if (!d || seen.has(d.target_id)) return false
    seen.add(d.target_id)
    return targets.includes(d.target_id) && (d.level === null || [1,2,3].includes(d.level)) && typeof d.feedback === 'string' && d.feedback.length <= 1600
  })
}
