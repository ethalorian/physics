import { randomUUID, randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessVocabTask } from '@/lib/vocab-access'
import { UUID,normalizeWord,type LearningWord,type VocabResult } from '@/lib/vocab-learning'
interface Item { id:string;word:LearningWord;options:{id:string;label:string}[] }
const shuffle=<T,>(rows:T[])=>{const a=[...rows];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const visible=(items:Item[])=>items.map(i=>({id:i.id,prompt:i.word.definition,icon:i.word.icon,definitionEs:i.word.definition_es,translations:Object.fromEntries(Object.entries(i.word.translations??{}).map(([lang,t])=>[lang,{definition:t.definition}])),options:i.options}))
export const GET=withAuth(async(req,ctx)=>{
 const id=new URL(req.url).searchParams.get('task_id')??''
 if(!UUID.test(id))return NextResponse.json({error:'Invalid assignment'},{status:400})
 const task=await accessVocabTask(id,ctx)
 if(!task)return NextResponse.json({error:'Assignment unavailable'},{status:403})
 return NextResponse.json({task:ctx.realRole==='student'?{...task,student_ids:[ctx.userId]}:task})
})
export const POST=withAuth(async(req,ctx)=>{
 if(ctx.realRole!=='student')return NextResponse.json({error:'Checks are for student accounts. Preview the words in the assignment board.'},{status:403})
 const b=await req.json() as {task_id:string;check_id?:string;responses?:{id:string;response:string;supports:string[]}[]}
 if(!UUID.test(b.task_id))return NextResponse.json({error:'Invalid assignment'},{status:400})
 const task=await accessVocabTask(b.task_id,ctx)
 if(!task||!task.active)return NextResponse.json({error:'Assignment unavailable'},{status:403})
 if(!b.check_id){
  const {data:pending,error:p}=await supabaseAdmin.from('vocab_checks').select('id,items').eq('task_id',task.id).eq('user_id',ctx.userId).is('completed_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle();if(p)throw p
  if(pending)return NextResponse.json({check_id:pending.id,items:visible(pending.items as Item[])})
  const items:Item[]=shuffle(task.words).map(word=>({id:randomUUID(),word,options:task.check_mode==='recall'?[]:shuffle([word,...shuffle(task.words.filter(w=>normalizeWord(w.term)!==normalizeWord(word.term))).filter((w,i,a)=>a.findIndex(x=>normalizeWord(x.term)===normalizeWord(w.term))===i).slice(0,3)]).map(w=>({id:w.id,label:w.term}))}))
  const {data,error}=await supabaseAdmin.from('vocab_checks').insert({task_id:task.id,user_id:ctx.userId,items}).select('id').single();if(error)throw error
  return NextResponse.json({check_id:data.id,items:visible(items)})
 }
 if(!UUID.test(b.check_id))return NextResponse.json({error:'Invalid check'},{status:400})
 const {data:check,error:e}=await supabaseAdmin.from('vocab_checks').select('id,items,result,completed_at').eq('id',b.check_id).eq('task_id',task.id).eq('user_id',ctx.userId).maybeSingle();if(e)throw e
 if(!check)return NextResponse.json({error:'Check unavailable'},{status:404})
 if(check.completed_at)return NextResponse.json({result:check.result})
 const items=check.items as Item[]
 if(!Array.isArray(b.responses)||b.responses.length!==items.length||new Set(b.responses.map(r=>r.id)).size!==items.length||items.some(i=>!b.responses?.some(r=>r.id===i.id&&typeof r.response==='string'&&r.response.trim()&&r.response.length<=300&&Array.isArray(r.supports))))return NextResponse.json({error:'Answer each word before submitting.'},{status:400})
 const result:VocabResult[]=items.map(i=>{const r=b.responses!.find(r=>r.id===i.id)!;return {term_id:i.word.id,correct:task.check_mode==='recognition'?r.response===i.word.id:normalizeWord(r.response)===normalizeWord(i.word.term),response:r.response,supports:r.supports.filter(s=>['translation','picture','audio'].includes(s))}})
 const {data:saved,error:s}=await supabaseAdmin.from('vocab_checks').update({result,completed_at:new Date().toISOString()}).eq('id',check.id).is('completed_at',null).select('result').maybeSingle();if(s)throw s
 if(saved)return NextResponse.json({result:saved.result})
 const {data:existing,error:x}=await supabaseAdmin.from('vocab_checks').select('result').eq('id',check.id).single();if(x)throw x
 return NextResponse.json({result:existing.result})
})
