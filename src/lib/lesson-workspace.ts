import type { BlockDocument } from '@/data/content-blocks'
import { findDay } from './lesson-plan-export'

export function linkedTeachingPlans(lesson: { unit_id?: string | null; lesson_number?: number | null; slug?: string | null }, document?: BlockDocument | null) {
  // An explicit empty list intentionally removes a historical default.
  const refs = document?.teachingPlans ?? (lesson.unit_id && lesson.lesson_number && !document?.learningPath
    ? [{ unitId: lesson.unit_id, day: lesson.lesson_number }] : [])
  const seen = new Set<string>()
  return refs.flatMap(ref => {
    const key = `${ref.unitId}:${ref.day}`
    const plan = findDay(ref.unitId, ref.day, ['cpa', 'trades', 'projects'])
    if (!plan || seen.has(key)) return []
    seen.add(key)
    return [{ ...ref, title: plan.title, bodyHtml: plan.bodyHtml }]
  })
}
