import {LAB_DIMENSIONS} from './lab-rubric'
import {labRubric} from './lab-grades'
import {isLabAssignment, type LessonAssignment} from './catalog'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Claude's structured string enums can differ only in capitalization. Restore the
 * supplied spelling without guessing identifiers, changing scores, or filling gaps. */
export function normalizeAssessmentEnums(raw: unknown, lesson: LessonAssignment): unknown {
  if (!record(raw)) return raw
  const canonical = (value: unknown, allowed: readonly string[]): unknown => {
    if (typeof value !== 'string' || allowed.includes(value)) return value
    const matches = [...new Set(allowed)].filter(option => option.toLowerCase() === value.toLowerCase())
    return matches.length === 1 ? matches[0] : value
  }
  const map = (value: unknown, fields: Record<string, readonly string[]>): unknown => {
    if (!record(value)) return value
    return {...value, ...Object.fromEntries(Object.entries(fields).map(([key, options]) => [key, canonical(value[key], options)]))}
  }
  const list = (value: unknown, fields: Record<string, readonly string[]>): unknown =>
    Array.isArray(value) ? value.map(item => map(item, fields)) : value
  const confidence = ['high', 'medium', 'low'], status = ['complete', 'partial', 'incorrect', 'unclear']
  const ids = lesson.questions.map(question => question.id)
  return {
    ...raw,
    confidence: canonical(raw.confidence, confidence),
    explanation: map(raw.explanation, {status}),
    items: list(raw.items, {id: ids, status}),
    ratings: list(raw.ratings, {target_slug: lesson.targets, confidence}),
    weakpoints: Array.isArray(raw.weakpoints) ? raw.weakpoints.map(weakpoint => {
      if (!record(weakpoint)) return weakpoint
      return {
        ...weakpoint,
        concept: canonical(weakpoint.concept, lesson.sections.map(section => section.title)),
        question_ids: Array.isArray(weakpoint.question_ids) ? weakpoint.question_ids.map(id => canonical(id, ids)) : weakpoint.question_ids,
      }
    }) : raw.weakpoints,
    ...(isLabAssignment(lesson) ? {
      lab_scores: list(raw.lab_scores, {id: labRubric(lesson).map(question => question.id)}),
      lab_dimensions: list(raw.lab_dimensions, {id: LAB_DIMENSIONS.map(dimension => dimension.id)}),
    } : {}),
  }
}
