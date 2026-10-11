import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {quizCourses,quizRows,quizJson} from '@/lib/quizzes/server'
import {isCatalogUnit} from '@/lib/retired-curriculum'
export const GET=withRole(['teacher','admin'],async(_req,ctx)=>{
 const courses=await quizCourses(ctx),programs=[...new Set(courses.map(c=>c.program))]
 const [targets,units,enrollments]=await Promise.all([
  programs.length?quizRows((a,b)=>supabaseAdmin.from('learning_targets').select('id,slug,statement,unit_id,domain,program').in('program',programs).eq('exclude_from_growth',false).order('unit_id').order('order_index').order('id').range(a,b)):[],
  programs.length?quizRows((a,b)=>supabaseAdmin.from('units').select('id,name,program').in('program',programs).order('order_index').order('id').range(a,b)):[],
  courses.length?quizRows((a,b)=>supabaseAdmin.from('course_students').select('course_id,student_id,students(name,is_active)').in('course_id',courses.map(c=>c.id)).eq('enrollment_state','ACTIVE').order('id').range(a,b)):[]
 ])
 return quizJson({courses:courses.map(({id,name,section,program,track})=>({id,name,section,program,track})),targets,units:units.filter(isCatalogUnit),sets:[],words:[],enrollments:enrollments.flatMap(e=>{const s=(Array.isArray(e.students)?e.students[0]:e.students) as {name:string;is_active?:boolean}|null;return s&&s.is_active!==false?[{course_id:e.course_id,student_id:e.student_id,name:s.name}]:[]}),readOnly:ctx.viewingAsTeacher})
})
