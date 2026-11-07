import 'server-only'
import catalog from '@/data/student-choice-binder.json'
import type { AuthContext } from './api-auth'
import { supabaseAdmin } from './supabase'
import { quizCourses, quizStaff } from './quizzes/server'
import type { BinderDay, StudentChoiceAssignment } from './student-choice'

export const binderCatalog = catalog as BinderDay[]
export const currentBinderCatalog = binderCatalog.filter((p, i) => binderCatalog.findIndex(other => other.key === p.key) === i)
export function binderPacket(key: string, version?: string) { return binderCatalog.find(p => p.key === key && (!version || p.version === version)) }
export async function accessStudentChoice(id: string, ctx: AuthContext) {
  const { data, error } = await supabaseAdmin.from('student_choice_assignments').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  const assignment = data as StudentChoiceAssignment | null
  if (!assignment) return null
  const course = (await quizCourses(ctx)).find(c => c.id === assignment.course_id && c.program === 'physics')
  if (!course) return null
  // Archived work remains readable to its enrolled students; it never returns to their active calendar.
  if (!quizStaff(ctx) && ctx.realRole !== 'student') return null
  return { assignment, course }
}
