import { calendarAssigned } from '@/lib/calendar-assignment'
import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'
import type { VocabTask } from './vocab-learning'
import { ownerEmailsFor } from './identity-aliases'
export async function vocabCourses(ctx: AuthContext) {
 const q = supabaseAdmin.from('courses').select('id,name,section,program,teacher_email').is('archived_at',null).in('teacher_email',ownerEmailsFor(ctx.scopeEmail)).order('name')
 const {data,error}=await q; if(error) throw error
 return data ?? []
}
export async function accessVocabTask(id: string, ctx: AuthContext): Promise<VocabTask | null> {
 const {data,error}=await supabaseAdmin.from('vocab_tasks').select('*').eq('id',id).maybeSingle()
 if(error) throw error
 const task=data as VocabTask | null
 if(!task) return null
 if(ctx.role==='teacher'||ctx.role==='admin') return (await vocabCourses(ctx)).some(c=>c.id===task.course_id)?task:null
 if(ctx.realRole!=='student'||!calendarAssigned(task.active,task.due_on)||!task.student_ids.includes(ctx.userId)) return null
 const {data:course,error:courseError}=await supabaseAdmin.from('courses').select('id').eq('id',task.course_id).is('archived_at',null).maybeSingle()
 if(courseError)throw courseError
 if(!course)return null
 const {data:enrollment,error:e}=await supabaseAdmin.from('course_students').select('id').eq('course_id',task.course_id).eq('student_id',ctx.userId).eq('enrollment_state','ACTIVE').maybeSingle()
 if(e) throw e
 return enrollment ? task : null
}
