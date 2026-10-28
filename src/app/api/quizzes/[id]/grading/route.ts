import {rewriteQuizFeedback} from '@/lib/quizzes/feedback-server'
import type {QuizAiReview} from '@/lib/quizzes/grading'
import {after} from 'next/server'
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessQuiz,quizJson,quizRoster,quizStaff,quizListWork} from '@/lib/quizzes/server'
import {assessQuiz,processQuizSubmission} from '@/lib/quizzes/grading-server'
import {QUIZ_UUID} from '@/lib/quizzes/types'
export const maxDuration=180
export const POST=withAuth<{id:string}>(async(req,ctx)=>{
 if(!quizStaff(ctx)||ctx.viewingAsTeacher)return quizJson({error:'Only the teacher can run grading checks.'},403)
 const {id}=await ctx.params;if(!QUIZ_UUID.test(id))return quizJson({error:'Quiz unavailable.'},404)
 const access=await accessQuiz(id,ctx);if(!access)return quizJson({error:'Quiz unavailable.'},404)
 const {data:pair,error:pairError}=await supabaseAdmin.from('worksheet_assignments').select('id').eq('quiz_id',id).maybeSingle();if(pairError)throw pairError
 if(pair)return quizJson({error:'Paired worksheet quizzes use answer-key scoring and teacher review. No AI analysis is needed.'},409)
 const body=await req.json().catch(()=>null)
 if(body?.action==='feedback'){
  const roster=new Set((await quizRoster(access.quiz)).map(s=>s.id)),work=await quizListWork([id])
  const ids=work.filter(w=>w.state==='submitted'&&w.submission_id&&roster.has(w.user_id)).map(w=>w.submission_id!)
  if(!ids.length)return quizJson({message:'No pending quiz feedback to refresh.'})
  const {data:reviews,error:reviewError}=await supabaseAdmin.from('quiz_reviews').select('submission_id').in('submission_id',ids);if(reviewError)throw reviewError
  const reviewed=new Set((reviews??[]).map(r=>r.submission_id))
  const {data:rows,error}=await supabaseAdmin.from('quiz_ai_reviews').select('submission_id,status,result,updated_at').in('submission_id',ids).eq('status','ready').order('updated_at',{ascending:true});if(error)throw error
  const pending=(rows as QuizAiReview[]??[]).filter(r=>r.result&&!reviewed.has(r.submission_id)),jobs=pending,signal=AbortSignal.timeout(125000)
  let cursor=0,updated=0,failed=0
  await Promise.all(Array.from({length:Math.min(4,jobs.length)},async()=>{
   while(cursor<jobs.length){const row=jobs[cursor++];try{
    const result=await rewriteQuizFeedback(row.result!,signal)
    const saved=await supabaseAdmin.from('quiz_ai_reviews').update({result,updated_at:new Date().toISOString()}).eq('submission_id',row.submission_id).eq('status','ready').eq('updated_at',row.updated_at).select('submission_id')
    if(saved.error)throw saved.error;if(saved.data?.length)updated++;else failed++
   }catch{failed++}}
  }))
  return quizJson({message:`Refreshed AI feedback for ${updated} submission${updated===1?'':'s'} in your writing style. Scores, mastery decisions, and your saved feedback are unchanged.${failed?' '+failed+' could not be refreshed; their previous feedback is saved.':''}`})
 }
 if(body?.action==='check'){
  const sample={...access.quiz,title:'Connection check — synthetic physics work',instructions:'Use the given answer guides.',questions:[{id:'sample-choice',kind:'choice' as const,prompt:'Which includes direction?',options:['Speed','Velocity'],correct_index:1,points:2,target_id:'sample-target',guide:'Velocity includes direction.'},{id:'sample-written',kind:'written' as const,prompt:'What is velocity?',points:4,target_id:'sample-target',guide:'4 points: speed and direction. 2 points: speed only. 0: unrelated.'},{id:'sample-drawing',kind:'problem' as const,prompt:'Draw and describe one force pointing right.',points:4,target_id:'sample-target',guide:'4 points for a rightward arrow, a force label, and a consistent written description. Accept a drawing plus concise text.'}]}
  try{
   const result=await assessQuiz(sample,{'sample-choice':'1','sample-written':'How fast an object moves and in which direction.','sample-drawing':{model:{text:'',mode:'drawing',strokes:[{tool:'arrow',color:'#000000',points:[{x:60,y:100},{x:220,y:100}],width:4},{tool:'text',color:'#000000',text:'Force',points:[{x:100,y:75}],width:16}]},plan:'Right is positive.',work:'The force arrow points right.',answer:'One force to the right.'}},true)
   const unexpected=result.result.items.filter(i=>i.score!==(i.id==='sample-choice'?2:4))
   if(unexpected.length)return quizJson({error:`Claude connected, but the sample scores need inspection. ${unexpected.map(i=>`${i.id.replace('sample-','Sample ')}: ${i.score}/${i.id==='sample-choice'?2:4}. ${i.feedback}`).join(' ')} No student work was changed.`},502)
   return quizJson({ok:true,model:result.model,message:'Claude connection and sample scoring passed. No student work or mastery ratings were changed.'})
  }catch(e){return quizJson({error:(e as Error).message},502)}
 }
 if(body?.action!=='retry'||!QUIZ_UUID.test(body.submission_id??''))return quizJson({error:'Choose a submitted attempt.'},400)
 const {data:submission,error}=await supabaseAdmin.from('quiz_submissions').select('id,user_id').eq('quiz_id',id).eq('id',body.submission_id).maybeSingle();if(error)throw error
 if(!submission||!(await quizRoster(access.quiz)).some(s=>s.id===submission.user_id))return quizJson({error:'Submission unavailable.'},404)
 after(async()=>{try{await processQuizSubmission(submission.id,true)}catch{console.warn('[quiz-grading] Retry remains pending.')}})
 return quizJson({ok:true})
})
