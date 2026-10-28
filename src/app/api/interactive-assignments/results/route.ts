import type {LabGrade} from '@/lib/interactive-assignments/lab-grades'
import {NextResponse} from 'next/server'
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {assignmentCourses, privateHeaders, type Assignment, type Work, type Submission, type Review} from '@/lib/interactive-assignments/server'
import {SIMULATION_ASSIGNMENTS} from '@/lib/interactive-assignments/simulations'
import {simulationResults} from '@/lib/interactive-assignments/results'
import type {AiReview} from '@/lib/interactive-assignments/analytics'
import {assignmentModel} from '@/lib/interactive-assignments/grading-server'

async function pages<T>(query: (from: number, to: number) => PromiseLike<{data: T[] | null; error: unknown}>): Promise<T[]> {
  const result: T[] = []
  for (let start = 0; ; start += 500) {
    const response = await query(start, start + 499)
    if (response.error) throw response.error
    result.push(...response.data ?? [])
    if ((response.data?.length ?? 0) < 500) return result
  }
}
async function batches<T>(ids: string[], query: (batch: string[]) => Promise<T[]>): Promise<T[]> {
  const result: T[] = []
  for (let start = 0; start < ids.length; start += 100) result.push(...await query(ids.slice(start, start + 100)))
  return result
}
export const GET = withAuth(async (request, ctx) => {
  if (!['teacher', 'admin'].includes(ctx.role)) return NextResponse.json({error: 'Teacher access required.'}, {status: 403, headers: privateHeaders})
  const courses = await assignmentCourses(ctx), course = new URL(request.url).searchParams.get('class')
  const base = {courses, courseId: course, readOnly: !!ctx.viewingAsTeacher, claudeConfigured: !!process.env.ANTHROPIC_API_KEY, claudeModel: assignmentModel()}
  if (!course) return NextResponse.json({...base, activities: [], rows: []}, {headers: privateHeaders})
  if (!courses.some(c => c.id === course)) return NextResponse.json({error: 'Class unavailable.'}, {status: 403, headers: privateHeaders})
  const [assignments, roster] = await Promise.all([
    pages<Assignment>((from, to) => supabaseAdmin.from('interactive_assignments').select('id,course_id,slug,target_id,created_at,due_on').eq('course_id', course).in('slug', SIMULATION_ASSIGNMENTS.map(l => l.slug)).order('id').range(from, to)),
    pages<{student_id: string; students: {name: string} | {name: string}[]}>((from, to) => supabaseAdmin.from('course_students').select('student_id,students(name)').eq('course_id', course).eq('enrollment_state', 'ACTIVE').order('student_id').range(from, to))
  ])
  const students = roster.map(r => ({id: r.student_id, name: (Array.isArray(r.students) ? r.students[0]?.name : r.students?.name) ?? 'Student'}))
  const ids = assignments.map(a => a.id), users = students.map(s => s.id)
  if (!ids.length || !users.length) return NextResponse.json({...base, ...simulationResults({assignments, students, work: [], submissions: [], reviews: [], ai: []})}, {headers: privateHeaders})
  const [work, versions] = await Promise.all([
    batches<Omit<Work, 'state'>>(users, batch => pages((from, to) => supabaseAdmin.from('interactive_assignment_work').select('assignment_id,user_id,version,status,updated_at').in('assignment_id', ids).in('user_id', batch).order('assignment_id').order('user_id').range(from, to))),
    batches<Pick<Submission, 'id' | 'assignment_id' | 'user_id' | 'version'>>(users, batch => pages((from, to) => supabaseAdmin.from('interactive_assignment_submissions').select('id,assignment_id,user_id,version').in('assignment_id', ids).in('user_id', batch).order('id').range(from, to)))
  ])
  const currentVersions = new Set(work.filter(w => w.status === 'submitted').map(w => w.assignment_id + ':' + w.user_id + ':' + w.version))
  const currentIds = versions.filter(s => currentVersions.has(s.assignment_id + ':' + s.user_id + ':' + s.version)).map(s => s.id)
  const [submissions, reviews, ai, grades] = await Promise.all([
    batches<Submission>(currentIds, batch => pages((from, to) => supabaseAdmin.from('interactive_assignment_submissions').select('id,assignment_id,user_id,state,version,submitted_at').in('id', batch).order('id').range(from, to))),
    batches<Review>(currentIds, batch => pages((from, to) => supabaseAdmin.from('interactive_assignment_reviews').select('id,submission_id,target_id,level,feedback,created_at').in('submission_id', batch).order('id').range(from, to))),
    batches<AiReview>(currentIds, batch => pages((from, to) => supabaseAdmin.from('interactive_assignment_ai_reviews').select('submission_id,status,result,model,error,updated_at,locked_until').in('submission_id', batch).order('submission_id').range(from, to))),
    batches<Pick<LabGrade,'submission_id'|'earned'|'possible'|'rubric_version'|'items'>>(currentIds,batch=>pages((from,to)=>supabaseAdmin.from('simulation_lab_grades').select('submission_id,earned,possible,rubric_version,items').in('submission_id',batch).order('submission_id').range(from,to)))
  ])
  // Return summaries; full student answers stay in the existing, class-scoped review endpoint.
  return NextResponse.json({...base, ...simulationResults({assignments, students, work, submissions, reviews, ai, grades})}, {headers: privateHeaders})
})
