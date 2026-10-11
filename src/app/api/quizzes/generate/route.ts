import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {quizCourses,quizJson,quizRpcError} from '@/lib/quizzes/server'
import {generationRequest} from '@/lib/quizzes/generation'
import {generateQuizQuestions,quizGenerationSources} from '@/lib/quizzes/generation-server'
import {QUIZ_UUID} from '@/lib/quizzes/types'

export const maxDuration=180
export const GET=withRole(['teacher','admin'],async(req,ctx)=>{
 const courses=await quizCourses(ctx)
 const id=req.nextUrl.searchParams.get('id')
 if(id){
  if(!QUIZ_UUID.test(id))return quizJson({error:'Invalid generation.'},400)
  const {data:g,error}=await supabaseAdmin.from('quiz_generations').select('id,course_id,status,error,quiz_payload,created_at').eq('id',id).eq('created_by',ctx.email.toLowerCase()).maybeSingle()
  if(error)throw error
  if(!g||!courses.some(c=>c.id===g.course_id))return quizJson({error:'Generation unavailable.'},404)
  if(g.status==='ready'){
   const result=await supabaseAdmin.from('quiz_assignments').select('*').eq('id',id).single()
   if(result.error)throw result.error
   if(result.data.deleted_at)return quizJson({error:'This draft was deleted. Generate a new draft to start again.',failed:true},410)
   return quizJson({status:'ready',quiz:result.data})
  }
  return quizJson({status:g.status,error:g.error,resumable:!!g.quiz_payload,interrupted:Date.now()-Date.parse(g.created_at)>180000})
 }
 const course=courses.find(c=>c.id===req.nextUrl.searchParams.get('course_id'))
 if(!course)return quizJson({error:'Choose your own class.'},403)
 const sources=await quizGenerationSources(course.program)
 return quizJson({configured:!!process.env.ANTHROPIC_API_KEY,targets:sources.targets.map(({id,slug,statement,domain,program,unit_id})=>({id,slug,statement,domain,program,unit_id})),lessons:sources.lessons.map(({id,title,unit_id,target_ids})=>({id,title,unit_id,target_ids}))})
})

export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
 if(ctx.viewingAsTeacher)return quizJson({error:'Return to your own account to generate a quiz.'},403)
 let request
 try{request=generationRequest(await req.json())}catch(e){return quizJson({error:(e as Error).message},400)}
 const course=(await quizCourses(ctx)).find(c=>c.id===request.course_id)
 if(!course)return quizJson({error:'Choose your own class.'},403)
 const sources=await quizGenerationSources(course.program)
 const lesson=request.lesson_id?sources.lessons.find(l=>l.id===request.lesson_id):undefined
 if(request.lesson_id&&!lesson)return quizJson({error:'Choose a lesson from the current lesson library.'},400)
 const targets=sources.targets.filter(t=>request.target_ids.includes(t.id))
 if(targets.length!==request.target_ids.length)return quizJson({error:'Choose targets from this class curriculum.'},400)
 if(lesson&&request.target_ids.some(id=>!lesson.target_ids.includes(id)))return quizJson({error:'Choose targets linked to this lesson, or switch to targets only.'},400)
 if(!process.env.ANTHROPIC_API_KEY)return quizJson({error:'Claude quiz generation is not configured yet.'},503)
 const reserved=await supabaseAdmin.rpc('reserve_quiz_generation',{p_request:request,p_actor:ctx.email,p_owner:course.teacher_email})
 if(reserved.error)return reserved.error.code==='P0001'?quizJson({error:reserved.error.message,failed:true},409):quizRpcError(reserved.error)
 const {generation:g,created}=reserved.data
 if(g.status==='failed')return quizJson({error:g.error||'Generation failed. Start a new draft.',failed:true},422)
 if(!created&&g.status==='pending'&&!g.quiz_payload)return quizJson({status:'pending',id:g.id},202)
 if(created){
  let generated
  try{generated=await generateQuizQuestions(request,targets,lesson)}catch(e){
   const message=(e as Error).name==='TimeoutError'?'Claude took too long. Try a shorter quiz.':(e as Error).message
   const failure=await supabaseAdmin.from('quiz_generations').update({status:'failed',error:message,completed_at:new Date().toISOString()}).eq('id',g.id)
   if(failure.error)console.error('[quiz-generation] Could not record failure',failure.error.code)
   return quizJson({error:message,failed:true},502)
  }
  const {quiz,...usage}=generated
  const stored=await supabaseAdmin.from('quiz_generations').update({quiz_payload:quiz,...usage}).eq('id',g.id)
  if(stored.error){console.error('[quiz-generation] Could not persist output',stored.error.code);return quizJson({error:'Could not save the generated result. Check your connection and retry.'},500)}
 }
 const saved=await supabaseAdmin.rpc('finish_quiz_generation',{p_id:g.id,p_actor:ctx.email,p_owner:course.teacher_email})
 if(saved.error)return quizRpcError(saved.error)
 if(saved.data.deleted_at)return quizJson({error:'This draft was deleted. Generate a new draft to start again.',failed:true},410)
 return quizJson({status:'ready',quiz:saved.data},201)
})
