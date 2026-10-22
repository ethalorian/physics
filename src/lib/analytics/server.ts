import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { assignmentBySlug } from '@/lib/interactive-assignments/catalog'
import type { VelocityState } from '@/lib/interactive-assignments/velocity'
import type { QuizSubmission, QuizReview } from '@/lib/quizzes/types'
import { referencedLessonTargets, type TargetDocument } from '@/lib/lesson-target-references'
import { deviceCategory, normalizeQuestions } from './normalize'
import type { AnalyticsDataset, AssignmentExposure, PracticeEvidence } from './types'

type Result = { data: unknown[] | null; error: { message: string } | null }
export async function analyticsRows<T>(query: (from: number, to: number) => PromiseLike<Result>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; from < 100000; from += 500) {
    const result = await query(from, from + 499)
    if (result.error) throw Error(result.error.message)
    if (!Array.isArray(result.data)) throw Error('Analytics returned an invalid result.')
    rows.push(...result.data as T[])
    if (result.data.length < 500) return rows
  }
  // Never present a silently truncated denominator as a complete report.
  throw Error('Analytics range exceeds the supported report size. Choose a shorter period.')
}
async function batches<T>(ids: string[], read: (ids: string[]) => Promise<T[]>): Promise<T[]> {
  const result: T[] = []
  for (let index = 0; index < ids.length; index += 100) result.push(...await read(ids.slice(index, index + 100)))
  return result
}
type Course = { id: string; name: string; section: string | null; teacher_email: string | null; program: string }
type Target = { id: string; slug: string; statement: string; unit_id: string; domain: string }
type Mastery = { id: string; user_id: string; target_id: string; level: number; observed_at: string; rated_by: string | null; evidence_source: string | null }
type Feedback = { id: string; user_id: string; target_id: string | null; created_at: string; message: string; teacher_email: string | null }
type Activity = { user_id: string; created_at: string; activity_type: string; user_agent: string | null }
type Assignment = { id: string; course_id: string; slug: string; target_id: string }
type Submission = { id: string; assignment_id: string; user_id: string; state: VelocityState; submitted_at: string }
type LessonSubmission = { id: string; user_id: string; lesson_id: string; submitted_at: string; content_snapshot: TargetDocument }

/** Global, read-only reporting; call only after the admin/observer authorization gate. */
export async function loadAnalytics(program: string, days: number, now = new Date()): Promise<AnalyticsDataset> {
  const asOf = now.toISOString(), from = new Date(now.getTime() - days * 86400000).toISOString()
  const [courses, targets, units] = await Promise.all([
    analyticsRows<Course>((a, b) => supabaseAdmin.from('courses').select('id,name,section,teacher_email,program').eq('program', program).is('archived_at', null).order('id').range(a, b)),
    analyticsRows<Target>((a, b) => supabaseAdmin.from('learning_targets').select('id,slug,statement,unit_id,domain').eq('program', program).eq('exclude_from_growth', false).order('id').range(a, b)),
    analyticsRows<{ id: string; name: string }>((a, b) => supabaseAdmin.from('units').select('id,name').eq('program', program).order('order_index').order('id').range(a, b)),
  ])
  const courseIds = courses.map(c => c.id)
  const enrollments = await batches(courseIds, ids => analyticsRows<{ course_id: string; student_id: string }>((a, b) => supabaseAdmin.from('course_students').select('course_id,student_id').in('course_id', ids).eq('enrollment_state', 'ACTIVE').order('id').range(a, b)))
  const people = await batches([...new Set(enrollments.map(e => e.student_id))], ids => analyticsRows<{ id: string; name: string }>((a, b) => supabaseAdmin.from('students').select('id,name').in('id', ids).eq('is_active', true).order('id').range(a, b)))
  const students = people.map(s => ({ ...s, classIds: enrollments.filter(e => e.student_id === s.id).map(e => e.course_id) }))
  const studentIds = students.map(s => s.id), studentSet = new Set(studentIds), targetSet = new Set(targets.map(t => t.id))
  const [mastery, feedback, activity, quizzes, assignments, lessonRows] = await Promise.all([
    batches(studentIds, ids => analyticsRows<Mastery>((a, b) => supabaseAdmin.from('mastery_records').select('id,user_id,target_id,level,observed_at,rated_by,evidence_source').in('user_id', ids).lte('observed_at', asOf).order('id').range(a, b))),
    batches(studentIds, ids => analyticsRows<Feedback>((a, b) => supabaseAdmin.from('teacher_feedback').select('id,user_id,target_id,created_at,message,teacher_email').in('user_id', ids).gte('created_at', from).lte('created_at', asOf).order('id').range(a, b))),
    batches(studentIds, ids => analyticsRows<Activity>((a, b) => supabaseAdmin.from('student_activity').select('user_id,created_at,activity_type,user_agent').in('user_id', ids).gte('created_at', from).lte('created_at', asOf).order('id').range(a, b))),
    batches(courseIds, ids => analyticsRows<{ id: string }>((a, b) => supabaseAdmin.from('quiz_assignments').select('id').in('course_id', ids).is('deleted_at', null).neq('status', 'draft').order('id').range(a, b))),
    batches(courseIds, ids => analyticsRows<Assignment>((a, b) => supabaseAdmin.from('interactive_assignments').select('id,course_id,slug,target_id').in('course_id', ids).order('id').range(a, b))),
    batches(studentIds, ids => analyticsRows<LessonSubmission>((a, b) => supabaseAdmin.from('lesson_submissions').select('id,user_id,lesson_id,submitted_at,content_snapshot').in('user_id', ids).gte('submitted_at', from).lte('submitted_at', asOf).order('id').range(a, b))),
  ])
  const [quizRows, practiceRows] = await Promise.all([
    batches(quizzes.map(q => q.id), ids => analyticsRows<QuizSubmission>((a, b) => supabaseAdmin.from('quiz_submissions').select('id,quiz_id,user_id,answers,snapshot,submitted_at').in('quiz_id', ids).gte('submitted_at', from).lte('submitted_at', asOf).order('id').range(a, b))),
    batches(assignments.map(a => a.id), ids => analyticsRows<Submission>((a, b) => supabaseAdmin.from('interactive_assignment_submissions').select('id,assignment_id,user_id,state,submitted_at').in('assignment_id', ids).gte('submitted_at', from).lte('submitted_at', asOf).order('id').range(a, b))),
  ])
  const submissions = quizRows.filter(s => studentSet.has(s.user_id))
  const reviews = await batches(submissions.map(s => s.id), ids => analyticsRows<QuizReview>((a, b) => supabaseAdmin.from('quiz_reviews').select('id,submission_id,decision,scores,ratings,note,question_notes,earned,possible,grade_mode,grade_value,reviewed_at').in('submission_id', ids).lte('reviewed_at', asOf).order('id').range(a, b)))
  const questions = normalizeQuestions(submissions, reviews).filter(q => courseIds.includes(q.classId))
  const lessons = await batches([...new Set(lessonRows.map(r => r.lesson_id))], ids => analyticsRows<{ id: string; title: string; unit_id: string }>((a, b) => supabaseAdmin.from('lessons').select('id,title,unit_id').in('id', ids).order('id').range(a, b)))
  const exposures: AssignmentExposure[] = [
    ...submissions.filter(s => courseIds.includes(s.snapshot?.course_id)).map(s => ({ id: s.id, assignmentId: `quiz:${s.quiz_id}`, title: s.snapshot.title, kind: 'quiz' as const, studentId: s.user_id, classIds: [s.snapshot.course_id], targetIds: [...new Set(s.snapshot.questions.map(q => q.target_id))].filter(id => targetSet.has(id)), at: s.submitted_at })),
    ...practiceRows.filter(s => studentSet.has(s.user_id)).map(s => { const a = assignments.find(a => a.id === s.assignment_id)!; return { id: s.id, assignmentId: `interactive:${a.id}`, title: assignmentBySlug(a.slug)?.title ?? a.slug, kind: 'interactive' as const, studentId: s.user_id, classIds: [a.course_id], targetIds: [a.target_id].filter(id => targetSet.has(id)), at: s.submitted_at } }),
    ...lessonRows.flatMap(s => { const lesson = lessons.find(l => l.id === s.lesson_id); if (!lesson || !units.some(u => u.id === lesson.unit_id)) return []; return [{ id: s.id, assignmentId: `lesson:${s.lesson_id}`, title: lesson.title, kind: 'lesson' as const, studentId: s.user_id, classIds: students.find(p => p.id === s.user_id)!.classIds, targetIds: referencedLessonTargets(s.content_snapshot, targets).map(t => t.id), at: s.submitted_at }] }),
  ]
  // Attempts are cumulative in each immutable submission. Use the latest snapshot per assignment/student;
  // their order is known, but their timestamps and hint/feedback exposure are not recorded.
  const latestPractice = new Map<string, Submission>()
  for (const row of practiceRows.filter(s => studentSet.has(s.user_id)).sort((a, b) => a.submitted_at.localeCompare(b.submitted_at) || a.id.localeCompare(b.id))) latestPractice.set(`${row.assignment_id}:${row.user_id}`, row)
  const practice: PracticeEvidence[] = []
  for (const row of latestPractice.values()) {
    const assignment = assignments.find(a => a.id === row.assignment_id)!
    const lesson = assignmentBySlug(assignment.slug)
    for (const [questionId, checks] of Object.entries(row.state?.attempts ?? {})) {
      if (!Array.isArray(checks) || !checks.length || checks.some(c => typeof c.correct !== 'boolean')) continue
      practice.push({ id: `${row.id}:${questionId}`, studentId: row.user_id, classId: assignment.course_id,
        targetIds: [assignment.target_id].filter(id => targetSet.has(id)), title: lesson?.title ?? assignment.slug,
        questionId, at: row.submitted_at, attempts: checks.length, firstCorrect: checks[0].correct, latestCorrect: checks.at(-1)!.correct })
    }
  }
  return {
    program, from, asOf, readOnly: true,
    classes: courses.map(c => ({ id: c.id, name: c.name, section: c.section, teacher: c.teacher_email, program: c.program })), students,
    targets: targets.map(t => ({ id: t.id, slug: t.slug, statement: t.statement, unitId: t.unit_id, domain: t.domain })), units,
    ratings: mastery.filter(m => targetSet.has(m.target_id) && [1, 2, 3].includes(m.level)).map(m => ({ id: m.id, studentId: m.user_id, targetId: m.target_id, level: m.level, at: m.observed_at, teacher: m.rated_by, source: m.evidence_source })),
    questions, practice, assignments: exposures,
    feedback: feedback.filter(f => !f.target_id || targetSet.has(f.target_id)).map(f => ({ id: f.id, studentId: f.user_id, targetId: f.target_id, at: f.created_at, message: f.message, teacher: f.teacher_email })),
    activity: activity.map(a => ({ studentId: a.user_id, at: a.created_at, source: a.activity_type, device: deviceCategory(a.user_agent) })),
    coverage: { untaggedQuestions: questions.filter(q => !q.bloom).length, unscoredQuestions: questions.filter(q => q.score === null).length,
      sources: ['Teacher mastery ratings', 'Released quiz reviews', 'Submitted practice checks', 'Saved lesson submissions', 'Written teacher feedback', 'Recorded student activity'] },
  }
}
