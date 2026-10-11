import {withRole} from '@/lib/api-auth'
import {accessQuiz,quizCourses,quizJson,quizRpcError} from '@/lib/quizzes/server'
import {supabaseAdmin} from '@/lib/supabase'
import {QUIZ_UUID} from '@/lib/quizzes/types'
import {validateQuiz} from '@/lib/quizzes/validation'

/** Copy saved content into a private class draft. Existing submissions are untouched. */
export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
 if(ctx.viewingAsTeacher)return quizJson({error:'Return to your own account to reuse quizzes.'},403)
 const body=await req.json()
 if(!body||!['id','source_id','course_id'].every(k=>typeof body[k]==='string'&&QUIZ_UUID.test(body[k]))||body.id===body.source_id)return quizJson({error:'Choose a saved quiz and a destination class.'},400)
 const [source,courses]=await Promise.all([accessQuiz(body.source_id,ctx),quizCourses(ctx)])
 const course=courses.find(c=>c.id===body.course_id)
 if(!source||!course)return quizJson({error:'Choose a quiz and class you teach.'},403)
 if(source.course.program!==course.program)return quizJson({error:'Choose a class in the same program so the mastery targets stay connected.'},400)
 let copy
 try {
  copy=validateQuiz({...source.quiz,id:body.id,course_id:course.id,status:'published',version:0,student_ids:null,due_at:null,source_quiz_id:null})
 }catch{return quizJson({error:'Complete the saved quiz’s questions, answer guides, and targets before reusing it.'},400)}
 const {data,error}=await supabaseAdmin.rpc('save_quiz_assignment',{p_quiz:{...copy,status:'draft'},p_actor:ctx.email,p_owner:course.teacher_email})
 return error?quizRpcError(error):quizJson({quiz:data},201)
})
