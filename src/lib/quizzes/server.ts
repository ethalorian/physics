import 'server-only'
import {supabaseAdmin} from '@/lib/supabase'
import type {AuthContext} from '@/lib/api-auth'
import {readingCourses,readingRows} from '@/lib/textbook-assignments-server'
import type {Quiz,QuizWork} from './types'
import {lockedReadingQuizIds} from '@/lib/reading-quiz-access'
export {readingCourses as quizCourses,readingRows as quizRows,readingJson as quizJson,readingRpcError as quizRpcError,readingStaff as quizStaff} from '@/lib/textbook-assignments-server'
export async function accessQuiz(id:string,ctx:AuthContext){
 const {data,error}=await supabaseAdmin.from('quiz_assignments').select('*').eq('id',id).maybeSingle();if(error)throw error
 if(!data||data.deleted_at)return null
 const staff=ctx.role==='teacher'||ctx.role==='admin'
 if(!staff&&(ctx.realRole!=='student'||data.status==='draft'||data.student_ids&&!data.student_ids.includes(ctx.userId)))return null
 const course=(await readingCourses(ctx)).find(c=>c.id===data.course_id)
 if(course&&!staff&&(await lockedReadingQuizIds([id],ctx.userId)).has(id))return null
 return course?{quiz:data as Quiz,course}:null
}
export async function quizRoster(quiz:Quiz){
 const rows=await readingRows((a,b)=>{let q=supabaseAdmin.from('course_students').select('student_id,students(id,name,is_active)').eq('course_id',quiz.course_id).eq('enrollment_state','ACTIVE');if(quiz.student_ids)q=q.in('student_id',quiz.student_ids);return q.order('id').range(a,b)})
 return rows.flatMap(r=>{const s=(Array.isArray(r.students)?r.students[0]:r.students) as {id:string;name:string;is_active?:boolean}|null;return s&&s.is_active!==false?[{id:s.id,name:s.name}]:[]})
}
export async function quizListWork(ids:string[],user?:string){return ids.length?readingRows<QuizWork>((a,b)=>{let q=supabaseAdmin.from('quiz_work').select('*').in('quiz_id',ids);if(user)q=q.eq('user_id',user);return q.order('quiz_id').order('user_id').range(a,b)}):[]}
