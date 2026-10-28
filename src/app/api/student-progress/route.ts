import { withAuth } from '@/lib/api-auth'
import { readingCourses, readingJson, readingStaff } from '@/lib/textbook-assignments-server'
import { loadAssessmentResults } from '@/lib/assessment-results/server'
import { byIds, read } from '@/lib/assessment-results/queries'
import { loadGradingSettings } from '@/lib/grading-terms-server'
import { emptyGradingSettings } from '@/lib/grading-terms'
import { studentGradebookRows, studentLabEntries, studentTransferEntries, type StudentProgressData } from '@/lib/student-gradebook'
import { decayingAverage } from '@/data/curriculum-types'
import { missingDailyLessons, missingReviewFoundations } from '@/lib/interactive-assignments/foundations/sequence-server'

export const GET = withAuth(async (request, ctx) => {
  const params = new URL(request.url).searchParams, staff = readingStaff(ctx)
  const courses = await readingCourses(ctx), requested = params.get('class')
  const course = requested ? courses.find(c => c.id === requested) : courses[0]
  if (requested && !course) return readingJson({ error: 'Class unavailable for this account.' }, 403)
  const result: StudentProgressData = { staff, courseId: course?.id ?? null, student: null, courses: courses.map(({ id, name, section }) => ({ id, name, section })), roster: [], settings: emptyGradingSettings(), rows: [], units: [], targets: [], feedback: [], warnings: [], generatedAt: new Date().toISOString() }
  if (!course) return readingJson(result)
  result.syllabusCategories = course.program === 'physics'
  if (staff) {
    const roster = await read<{ student_id: string; students: { name: string; is_active: boolean } | { name: string; is_active: boolean }[] | null }>('course_students', 'student_id,students(name,is_active)', q => q.eq('course_id', course.id).eq('enrollment_state', 'ACTIVE'), ['student_id'])
    result.roster = roster.flatMap(row => { const student = Array.isArray(row.students) ? row.students[0] : row.students; return student && student.is_active !== false ? [{ id: row.student_id, name: student.name }] : [] })
    result.roster.sort((a, b) => a.name.localeCompare(b.name))
  }
  // A student never chooses another user. Staff previews must belong to this authorized class.
  const userId = staff ? params.get('student') : ctx.userId
  if (!userId) return readingJson(result)
  if (staff && !result.roster.some(student => student.id === userId)) return readingJson({ error: 'Student unavailable in this class.' }, 403)
  const [results, settings] = await Promise.all([
    loadAssessmentResults(ctx, course, 'all', { studentId: userId }),
    loadGradingSettings(course.id).catch(() => { result.warnings.push({ source: 'Grading terms', message: 'Term settings could not load. Your scores remain available; refresh to try again.' }); return emptyGradingSettings() }),
  ])
  const student = results.students.find(s => s.id === userId)
  result.student = student ? { id: student.id, name: student.name } : null
  if (!result.student) return readingJson({ error: 'Active enrollment is required to view this gradebook.' }, 403)
  result.units = results.units; result.settings = settings
  result.warnings.push(...results.warnings.map(w => ({ source: w.source, message: 'This source could not load. Scores and missing-work counts may be incomplete.' })))
  const lessonIds = results.activities.filter(a => ['lesson', 'video', 'reflection'].includes(a.kind)).map(a => a.sourceId)
  let slugs = new Map<string, string>()
  try { slugs = new Map((await byIds<{ id: string; slug: string }>('lessons', 'id,slug', 'id', lessonIds, ['id'])).map(l => [l.id, l.slug])) }
  catch { result.warnings.push({ source: 'Assignment links', message: 'Some lesson links could not load. Use your class calendar to open those lessons.' }) }
  result.rows = studentGradebookRows(results.activities, userId, settings, slugs)
  // Batch prerequisite checks for this student’s ledger, without question or answer-key disclosure.
  try {
    const [missing,reviews] = await Promise.all([
      missingDailyLessons(result.rows.filter(row => row.kind === 'quiz' && !row.archived).map(row => row.key.replace(/^quiz:/, '')), userId),
      missingReviewFoundations(result.rows.filter(row => ['interactive','simulation'].includes(row.kind) && !row.archived).map(row => row.key.replace(/^interactive:/, '')), userId),
    ])
    result.rows = result.rows.map(row => {
      const prerequisites = [...missing.filter(item => 'quiz:' + item.quiz_id === row.key),...reviews.filter(item => 'interactive:' + item.assignment_id === row.key)]
      return prerequisites.length ? { ...row, prerequisites: prerequisites.map(({ id, title }) => ({ id, title })), href: '/interactive-assignments/' + prerequisites[0].id, statusLabel: 'Locked · finish ' + prerequisites.map(item => item.role).join(' and ') } : row
    })
  } catch {
    result.warnings.push({ source: 'Lesson prerequisites', message: 'Some prerequisite information could not load. Open the assignment to check access.' })
  }
  result.labEntries = studentLabEntries(results.activities, userId, settings)
  result.transferEntries = studentTransferEntries(results.activities, userId, settings)
  // Only disclose overrides for work on this student's ledger.
  result.settings = { ...settings, placements: Object.fromEntries(result.rows.filter(row => row.manualTerm).map(row => [row.key, row.termId!])) }
  const targetIds = (results.targets ?? []).map(t => t.id)
  try {
    const [records, feedback] = await Promise.all([
      byIds<{ id: string; target_id: string; level: number; observed_at: string; evidence_source: string | null }>('mastery_records', 'id,target_id,level,observed_at,evidence_source', 'target_id', targetIds, ['observed_at', 'id'], q => q.eq('user_id', userId)),
      byIds<{ id: string; target_id: string; message: string; created_at: string }>('teacher_feedback', 'id,target_id,message,created_at', 'target_id', targetIds, ['created_at', 'id'], q => q.eq('user_id', userId)),
    ])
    result.targets = (results.targets ?? []).map(target => {
      const observations = records.filter(r => r.target_id === target.id).sort((a, b) => a.observed_at.localeCompare(b.observed_at))
      return { ...target, value: observations.length ? decayingAverage(observations.map(r => r.level)) : null, observations: observations.map(r => ({ id: r.id, level: r.level, at: r.observed_at, source: 'Teacher observation' })) }
    })
    result.feedback = feedback.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20).map(r => ({ id: r.id, message: r.message, at: r.created_at, targetId: r.target_id }))
  } catch { result.warnings.push({ source: 'Learning history', message: 'Your learning history and target feedback could not load. Refresh to try again.' }) }
  return readingJson(result)
})
