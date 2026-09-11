import { randomUUID, randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { withAuth,withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessVocabTask } from '@/lib/vocab-access'
import { UUID,normalizeWord,type LearningWord,type VocabResult,type VocabTask } from '@/lib/vocab-learning'
interface Item { id:string;word:LearningWord;options:{id:string;label:string}[] }
const shuffle=<T,>(rows:T[])=>{const a=[...rows];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const visible=(items:Item[],task?:VocabTask)=>items.map(i=>({id:i.id,prompt:task?.quiz_format==='definition'?`Explain the meaning of ${i.word.term} in your own words.`:task?.quiz_format==='sentence'?`Write a sentence using ${i.word.term} that shows its meaning.`:i.word.definition,icon:task?.task_kind==='quiz'?undefined:i.word.icon,definitionEs:task?.task_kind==='quiz'?undefined:i.word.definition_es,translations:task?.task_kind==='quiz'?{}:Object.fromEntries(Object.entries(i.word.translations??{}).map(([lang,t])=>[lang,{definition:t.definition}])),options:i.options}))
export const GET=withAuth(async(req,ctx)=>{
 const id=new URL(req.url).searchParams.get('task_id')??''
 if(!UUID.test(id))return NextResponse.json({error:'Invalid assignment'},{status:400})
 const task=await accessVocabTask(id,ctx)
 if(!task)return NextResponse.json({error:'Assignment unavailable'},{status:403})
 return NextResponse.json({task:ctx.realRole==='student'?{...task,words:task.task_kind==='quiz'?[]:task.words,student_ids:[ctx.userId]}:task})
})
export const POST=withAuth(async(req,ctx)=>{
 if(ctx.realRole!=='student')return NextResponse.json({error:'Checks are for student accounts. Preview the words in the assignment board.'},{status:403})
 const b=await req.json() as {task_id:string;check_id?:string;responses?:{id:string;response:string;supports:string[]}[]}
 if(!UUID.test(b.task_id))return NextResponse.json({error:'Invalid assignment'},{status:400})
 const task=await accessVocabTask(b.task_id,ctx)
 if(!task||!task.active)return NextResponse.json({error:'Assignment unavailable'},{status:403})
 if(!b.check_id){
  if(task.task_kind==='quiz'){
   const {data:existing,error}=await supabaseAdmin.from('vocab_checks').select('id,items,result,completed_at').eq('task_id',task.id).eq('user_id',ctx.userId).maybeSingle();if(error)throw error
   if(existing)return NextResponse.json(existing.completed_at?{check_id:existing.id,result:existing.result,completed:true}:{check_id:existing.id,items:visible(existing.items as Item[],task)})
  }
  const {data:pending,error:p}=await supabaseAdmin.from('vocab_checks').select('id,items').eq('task_id',task.id).eq('user_id',ctx.userId).is('completed_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle();if(p)throw p
  if(pending)return NextResponse.json({check_id:pending.id,items:visible(pending.items as Item[],task)})
  const items:Item[]=shuffle(task.words).map(word=>({id:randomUUID(),word,options:task.check_mode==='recall'||task.quiz_format==='definition'||task.quiz_format==='sentence'?[]:task.quiz_format==='matching'?shuffle(task.words).map(w=>({id:w.id,label:w.term})):shuffle([word,...shuffle(task.words.filter(w=>normalizeWord(w.term)!==normalizeWord(word.term))).filter((w,i,a)=>a.findIndex(x=>normalizeWord(x.term)===normalizeWord(w.term))===i).slice(0,3)]).map(w=>({id:w.id,label:w.term}))}))
  const {data,error}=await supabaseAdmin.from('vocab_checks').insert({task_id:task.id,user_id:ctx.userId,items,quiz_guard:task.task_kind==='quiz'}).select('id').single();if(error?.code==='23505'&&task.task_kind==='quiz'){
   const {data:existing,error:raceError}=await supabaseAdmin.from('vocab_checks').select('id,items,result,completed_at').eq('task_id',task.id).eq('user_id',ctx.userId).single();if(raceError)throw raceError
   return NextResponse.json(existing.completed_at?{check_id:existing.id,result:existing.result,completed:true}:{check_id:existing.id,items:visible(existing.items as Item[],task)})
  }if(error)throw error
  return NextResponse.json({check_id:data.id,items:visible(items,task)})
 }
 if(!UUID.test(b.check_id))return NextResponse.json({error:'Invalid check'},{status:400})
 const {data:check,error:e}=await supabaseAdmin.from('vocab_checks').select('id,items,result,completed_at').eq('id',b.check_id).eq('task_id',task.id).eq('user_id',ctx.userId).maybeSingle();if(e)throw e
 if(!check)return NextResponse.json({error:'Check unavailable'},{status:404})
 if(check.completed_at)return NextResponse.json({result:check.result})
 const items=check.items as Item[]
 if(!Array.isArray(b.responses)||b.responses.length!==items.length||new Set(b.responses.map(r=>r.id)).size!==items.length||items.some(i=>!b.responses?.some(r=>r.id===i.id&&typeof r.response==='string'&&r.response.trim()&&r.response.length<=(task.quiz_format==='sentence'||task.quiz_format==='definition'?2000:300)&&Array.isArray(r.supports))))return NextResponse.json({error:'Answer each word before submitting.'},{status:400})
 if(task.quiz_format==='matching'&&new Set(b.responses.map(r=>r.response)).size!==items.length)return NextResponse.json({error:'Use each matching word once.'},{status:400})
 const result:VocabResult[]=items.map(i=>{const r=b.responses!.find(r=>r.id===i.id)!;return {term_id:i.word.id,correct:task.quiz_format==='definition'||task.quiz_format==='sentence'?null:task.check_mode==='recognition'?r.response===i.word.id:normalizeWord(r.response)===normalizeWord(i.word.term),response:r.response,...(task.task_kind==='quiz'?{term:i.word.term,definition:i.word.definition}:{}),supports:r.supports.filter(s=>['translation','picture','audio'].includes(s))}})
 const {data:saved,error:s}=await supabaseAdmin.from('vocab_checks').update({result,completed_at:new Date().toISOString()}).eq('id',check.id).is('completed_at',null).select('result').maybeSingle();if(s)throw s
 if(saved)return NextResponse.json({result:saved.result})
 const {data:existing,error:x}=await supabaseAdmin.from('vocab_checks').select('result').eq('id',check.id).single();if(x)throw x
 return NextResponse.json({result:existing.result})
})

export const PATCH=withRole(['teacher','admin'],async(req,ctx)=>{
 const b=await req.json() as {task_id:string;check_id:string;review_version:number;grades:{term_id:string;correct:boolean;feedback?:string}[]}
 if(!UUID.test(b.task_id)||!UUID.test(b.check_id)||!Number.isInteger(b.review_version)||!Array.isArray(b.grades))return NextResponse.json({error:'Invalid review'},{status:400})
 const task=await accessVocabTask(b.task_id,ctx)
 if(!task||task.task_kind!=='quiz'||!['definition','sentence'].includes(task.quiz_format??''))return NextResponse.json({error:'Quiz review unavailable'},{status:403})
 const {data:c,error}=await supabaseAdmin.from('vocab_checks').select('id,result,completed_at,review_version').eq('id',b.check_id).eq('task_id',task.id).maybeSingle();if(error)throw error
 if(!c?.completed_at)return NextResponse.json({error:'Quiz has not been submitted'},{status:409})
 const results=c.result as VocabResult[]
 if(b.grades.length!==results.length||new Set(b.grades.map(g=>g.term_id)).size!==results.length||results.some(r=>!b.grades.some(g=>g.term_id===r.term_id&&typeof g.correct==='boolean'&&(g.feedback===undefined||typeof g.feedback==='string'&&g.feedback.length<=2000))))return NextResponse.json({error:'Score every answer before saving.'},{status:400})
 const graded=results.map(r=>{const g=b.grades.find(g=>g.term_id===r.term_id)!;return {...r,correct:g.correct,feedback:g.feedback??''}})
 const {data:saved,error:saveError}=await supabaseAdmin.from('vocab_checks').update({result:graded,review_version:b.review_version+1,reviewed_by:ctx.email,reviewed_at:new Date().toISOString()}).eq('id',c.id).eq('review_version',b.review_version).select('id').maybeSingle();if(saveError)throw saveError
 if(!saved)return NextResponse.json({error:'This review changed. Refresh before saving again.'},{status:409})
 return NextResponse.json({ok:true})
})
