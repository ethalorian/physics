import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {quizCourses,quizJson,quizRpcError} from '@/lib/quizzes/server'
import {QUIZ_UUID} from '@/lib/quizzes/types'

export const GET=withRole<{id:string}>(['teacher','admin'],async(_req,ctx)=>{
 const {id}=await ctx.params
 if(!QUIZ_UUID.test(id))return quizJson({error:'Quiz unavailable.'},404)
 const {data:quiz,error}=await supabaseAdmin.from('quiz_assignments').select('course_id').eq('id',id).maybeSingle()
 if(error)throw error
 const course=quiz&&(await quizCourses(ctx)).find(c=>c.id===quiz.course_id)
 if(!course)return quizJson({error:'Quiz unavailable.'},404)
 const result=await supabaseAdmin.rpc('manage_quiz_inventory',{p_quiz:id,p_owner:course.teacher_email,p_action:'preview'})
 return result.error?quizRpcError(result.error):quizJson(result.data)
})
export const POST=withRole<{id:string}>(['teacher','admin'],async(req,ctx)=>{
 if(ctx.viewingAsTeacher)return quizJson({error:'Return to your own account to manage quizzes.'},403)
 const {id}=await ctx.params
 if(!QUIZ_UUID.test(id))return quizJson({error:'Quiz unavailable.'},404)
 let body
 try{body=await req.json()}catch{return quizJson({error:'Invalid request.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body)||!['rename','delete'].includes(body.action)||Object.keys(body).some(k=>!['action','version','title','fingerprint'].includes(k))||!Number.isInteger(body.version)||body.version<1||body.version>=2147483647||typeof body.title!=='string'||!body.title.trim()||body.title.length>160||(body.action==='delete'&&(typeof body.fingerprint!=='string'||!/^[a-f0-9]{32}$/.test(body.fingerprint))))return quizJson({error:'Reload the quiz and complete the confirmation.'},400)
 const {data:quiz,error}=await supabaseAdmin.from('quiz_assignments').select('course_id').eq('id',id).maybeSingle()
 if(error)throw error
 const course=quiz&&(await quizCourses(ctx)).find(c=>c.id===quiz.course_id)
 if(!course)return quizJson({error:'Quiz unavailable.'},404)
 const result=await supabaseAdmin.rpc('manage_quiz_inventory',{p_quiz:id,p_owner:course.teacher_email,p_action:body.action,p_version:body.version,p_title:body.title,p_fingerprint:body.action==='delete'?body.fingerprint:null})
 return result.error?quizRpcError(result.error):quizJson(result.data)
})
