import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'
import { type VelocityState } from './velocity'
import { validPlanDate } from '@/lib/learning-week'
import {assignmentByDay,type LessonAssignment} from './catalog'
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const privateHeaders={'Cache-Control':'private, no-store'}
export type Assignment={id:string;course_id:string;slug:string;target_id:string;created_at:string;due_on:string|null}
export type Work={assignment_id:string;user_id:string;state:VelocityState;version:number;status:'draft'|'submitted';updated_at:string}
export type Submission={id:string;assignment_id:string;user_id:string;state:VelocityState;version:number;submitted_at:string}
export type Review={id:string;submission_id:string;target_id:string;level:1|2|3;feedback:string;created_at:string}
export async function assignmentCourses(ctx:AuthContext){
 let q=supabaseAdmin.from('courses').select('id,name,section,teacher_email,program').is('archived_at',null).eq('program','physics')
 if(ctx.role==='teacher')q=q.ilike('teacher_email',ctx.scopeEmail)
 else if(ctx.role!=='admin'){const r=await supabaseAdmin.from('course_students').select('course_id').eq('student_id',ctx.userId).eq('enrollment_state','ACTIVE');if(r.error)throw r.error;const ids=r.data.map(c=>c.course_id);if(!ids.length)return [];q=q.in('id',ids)}
 const r=await q.order('name');if(r.error)throw r.error;return ctx.role==='teacher'?r.data.filter(c=>c.teacher_email?.toLowerCase()===ctx.scopeEmail.toLowerCase()):r.data
}
export async function accessibleAssignment(ctx:AuthContext,id:string){
 if(!UUID.test(id))return null
 const courses=await assignmentCourses(ctx)
 if(!courses.length)return null
 const r=await supabaseAdmin.from('interactive_assignments').select('id,course_id,slug,target_id,created_at,due_on').eq('id',id).in('course_id',courses.map(c=>c.id)).maybeSingle();if(r.error)throw r.error
 // An existing record preserves evidence; only a calendar date assigns it to students.
 if(ctx.role==='student'&&!validPlanDate(r.data?.due_on))return null
 return r.data as Assignment|null
}
export async function lessonTargets(lesson:LessonAssignment){const r=await supabaseAdmin.from('learning_targets').select('id,statement,slug').eq('unit_id',lesson.unit).in('slug',lesson.targets);if(r.error)throw r.error;if(r.data.length!==lesson.targets.length)throw Error('Assignment targets are unavailable.');return lesson.targets.map(slug=>r.data.find(t=>t.slug===slug)!)}
export async function velocityTarget(){return (await lessonTargets(assignmentByDay(3)!))[0]}
