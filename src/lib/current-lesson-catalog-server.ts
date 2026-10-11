import { supabaseAdmin } from '@/lib/supabase'
import { CURRENT_LESSON_FIELDS, isCurrentLesson } from './current-lesson-catalog'

/** Shared by summary-only catalogs; never filters or modifies mastery records. */
export async function currentLessonIds(unitIds?: string[]): Promise<Set<string>> {
  if (unitIds && !unitIds.length) return new Set()
  let query = supabaseAdmin.from('lessons').select(`id,${CURRENT_LESSON_FIELDS}`)
  if (unitIds) query = query.in('unit_id', unitIds)
  const { data, error } = await query
  if (error) throw error
  return new Set((data ?? []).filter(isCurrentLesson).map(lesson => lesson.id))
}
