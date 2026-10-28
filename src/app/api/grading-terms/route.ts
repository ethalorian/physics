import { withRole } from '@/lib/api-auth'
import { readingCourses, readingJson } from '@/lib/textbook-assignments-server'
import { loadAssessmentResults } from '@/lib/assessment-results/server'
import { loadGradingSettings } from '@/lib/grading-terms-server'
import { gradingSettingsError, type GradingSettings } from '@/lib/grading-terms'
import { supabaseAdmin } from '@/lib/supabase'
import { QUIZ_UUID } from '@/lib/quizzes/types'

export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const courseId = new URL(request.url).searchParams.get('class')
  const course = (await readingCourses(ctx)).find(c => c.id === courseId)
  if (!course) return readingJson({ error: 'Choose one of your classes.' }, 403)
  const [settings, results] = await Promise.all([loadGradingSettings(course.id), loadAssessmentResults(ctx, course, 'all')])
  return readingJson({ courseId: course.id, settings, activities: results.activities.filter(a => !a.crossUnit).map(a => ({ key: a.key, title: a.title, kind: a.kind, unitIds: a.unitIds, dueAt: a.dueAt, archived: a.archived })), units: results.units, warnings: results.warnings })
})

export const PUT = withRole(['teacher', 'admin'], async (request, ctx) => {
  let body: { courseId?: string; settings?: GradingSettings }
  try { const text = await request.text(); if (text.length > 1_000_000) return readingJson({ error: 'Settings are too large.' }, 400); body = JSON.parse(text) } catch { return readingJson({ error: 'Invalid settings request.' }, 400) }
  if (!body || !QUIZ_UUID.test(body.courseId ?? '')) return readingJson({ error: 'Choose a valid class.' }, 400)
  const course = (await readingCourses(ctx)).find(c => c.id === body.courseId)
  if (!course) return readingJson({ error: 'Class unavailable for this account.' }, 403)
  const validation = gradingSettingsError(body.settings)
  if (validation) return readingJson({ error: validation }, 400)
  const settings = body.settings!, previous = await loadGradingSettings(course.id)
  const changedKeys = Object.keys(settings.placements).filter(key => settings.placements[key] !== previous.placements[key])
  if (changedKeys.length) {
    const results = await loadAssessmentResults(ctx, course, 'all')
    const keys = new Set(results.activities.filter(a => !a.crossUnit).map(a => a.key))
    if (changedKeys.some(key => !keys.has(key))) return readingJson({ error: 'An assignment is unavailable for this class. Reload before placing it.' }, 409)
  }
  const { data, error } = await supabaseAdmin.rpc('save_course_grading_settings', { p_course: course.id, p_terms: settings.terms.map(t => ({ id: t.id, name: t.name.trim(), start: t.start, end: t.end })), p_placements: settings.placements, p_revision: settings.revision, p_owner: course.teacher_email, p_actor: ctx.email })
  if (error) {
    if (error.code === '40001') return readingJson({ error: 'Grading settings changed in another window. Your edits are still here. Reload the saved settings before trying again.' }, 409)
    console.error('[grading-terms] save failed', error)
    return readingJson({ error: 'Could not save grading terms. Your edits are still here; try again.' }, 500)
  }
  return readingJson({ settings: { terms: data.terms, placements: data.placements, revision: data.revision } })
})
