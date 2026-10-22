import { withRole } from '@/lib/api-auth'
import { readingCourses, readingJson } from '@/lib/textbook-assignments-server'
import { loadAssessmentResults } from '@/lib/assessment-results/server'

export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const params = new URL(request.url).searchParams
  const classId = params.get('class'), unitId = params.get('unit') || 'all'
  if (!classId) return readingJson({ error: 'Choose a class to see its results.' }, 400)
  const course = (await readingCourses(ctx)).find(c => c.id === classId)
  if (!course) return readingJson({ error: 'Class unavailable for this account.' }, 403)
  if (unitId.length > 120 || !/^[a-zA-Z0-9_-]+$/.test(unitId) || unitId === 'auto') return readingJson({ error: 'Choose a unit or all units.' }, 400)
  return readingJson(await loadAssessmentResults(ctx, course, unitId))
})
