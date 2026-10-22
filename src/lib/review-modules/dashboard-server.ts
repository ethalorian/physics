import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'
import { getTeacherStudentGids } from '@/lib/teacher-scope'
import { canAccessReview,type ReviewAssignment } from './server'
export async function reviewDashboardScope(ctx:AuthContext){
 const {data,error}=await supabaseAdmin.from('review_module_assignments').select('*').order('slug');if(error)throw error
 const assignments:ReviewAssignment[]=[];for(const a of data??[])if(await canAccessReview(ctx,a))assignments.push(a)
 const courseIds=[...new Set(assignments.flatMap(a=>a.course_ids))]
 const rosterResult=courseIds.length?await supabaseAdmin.from('course_students').select('student_id,course_id,students(name,email)').in('course_id',courseIds).eq('enrollment_state','ACTIVE'):{data:[],error:null};if(rosterResult.error)throw rosterResult.error
 const allowed=ctx.role==='teacher'?new Set(await getTeacherStudentGids(ctx.scopeEmail)):null
 const roster=(rosterResult.data??[]).filter(r=>!allowed||allowed.has(r.student_id)).map(r=>{const student=Array.isArray(r.students)?r.students[0]:r.students;return {student_id:r.student_id,course_id:r.course_id,name:student?.name||student?.email||'Student',email:student?.email||''}})
 return {assignments,courseIds,roster,users:[...new Set(roster.map(r=>r.student_id))]}
}
