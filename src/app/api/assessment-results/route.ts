import { after } from 'next/server'
import { pendingQuizRecovery, recoverQuizJobs } from '@/lib/quizzes/recovery-server'
export const maxDuration = 180
import { withRole } from '@/lib/api-auth'
import { readingCourses, readingJson } from '@/lib/textbook-assignments-server'
import { loadAssessmentResults } from '@/lib/assessment-results/server'
import { loadGradingSettings } from '@/lib/grading-terms-server'
import { inGradingTerm, termQuizTotal } from '@/lib/grading-terms'

export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const params = new URL(request.url).searchParams
  const classId = params.get('class'), unitId = params.get('unit') || 'all'
  if (!classId) return readingJson({ error: 'Choose a class to see its results.' }, 400)
  const course = (await readingCourses(ctx)).find(c => c.id === classId)
  if (!course) return readingJson({ error: 'Class unavailable for this account.' }, 403)
  if (unitId.length > 120 || !/^[a-zA-Z0-9_-]+$/.test(unitId) || unitId === 'auto') return readingJson({ error: 'Choose a unit or all units.' }, 400)
  const results = await loadAssessmentResults(ctx, course, 'all')
  const termId = params.get('term') || 'all'
  results.gradingTermId = termId
  try {
    const settings = await loadGradingSettings(course.id)
    if (!['all', 'unassigned'].includes(termId) && !settings.terms.some(t => t.id === termId)) return readingJson({ error: 'This grading term is unavailable. Choose another term.' }, 400)
    results.gradingSettings = settings
    results.termQuizTotals = Object.fromEntries(results.students.map(student => { const { earned, possible, percent, count } = termQuizTotal(results.activities, student.id, settings, termId); return [student.id, { earned, possible, percent, count }] }))
    results.activities = results.activities.filter(a => a.crossUnit || inGradingTerm(a, settings, termId))
  }
  catch {
    results.warnings.push({ source: 'Grading terms', message: 'Grading terms could not load. Term totals are unavailable; refresh to try again.' })
    if (termId !== 'all') results.activities = []
  }
  results.unitId = unitId
  results.activities = results.activities.filter(a => unitId === 'all' || (unitId === 'unmapped' ? !a.unitIds.length && !a.crossUnit : a.crossUnit || a.unitIds.includes(unitId)))
  if (!ctx.viewingAsTeacher && process.env.ANTHROPIC_API_KEY) {
    try {
      const jobs = await pendingQuizRecovery(results)
      if (jobs.length) {
        const ids = new Set(jobs.map(j => j.submission_id))
        for (const activity of results.activities) if (activity.kind === 'quiz') for (const cell of Object.values(activity.cells)) {
          if (cell.submissionId && ids.has(cell.submissionId)) cell.assessment = 'processing'
        }
        after(async () => { await recoverQuizJobs(jobs) })
      }
    } catch { results.warnings.push({source:'Automatic grading',message:'Pending analysis could not resume. Refresh results to try again.'}) }
  }
  return readingJson(results)
})
