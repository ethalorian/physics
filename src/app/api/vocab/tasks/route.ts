import { NextResponse } from 'next/server'
import { withAuth,withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessVocabTask,vocabCourses } from '@/lib/vocab-access'
import { vocabRows } from '@/lib/vocab-pagination'
import { UUID,summarizeWords,type VocabTask,type CheckRecord } from '@/lib/vocab-learning'
export const GET=withAuth(async(req,ctx)=>{
 const staff=ctx.role==='teacher'||ctx.role==='admin'
 let q=supabaseAdmin.from('vocab_tasks').select('*').order('created_at',{ascending:false})
 if(staff) q=q.in('course_id',(await vocabCourses(ctx)).map(c=>c.id))
 else {
  const {data,error}=await supabaseAdmin.from('course_students').select('course_id').eq('student_id',ctx.userId).eq('enrollment_state','ACTIVE');if(error)throw error
  q=q.contains('student_ids',[ctx.userId]).eq('active',true).in('course_id',(data ?? []).map(c=>c.course_id))
 }
 const {data,error}=await q.limit(200);if(error)throw error
 const tasks=(data ?? []) as VocabTask[]
 let cq=supabaseAdmin.from('vocab_checks').select('id,task_id,user_id,completed_at,result').in('task_id',tasks.map(t=>t.id)).not('completed_at','is',null).order('completed_at',{ascending:false})
 if(!staff)cq=cq.eq('user_id',ctx.userId)
 const checks=await vocabRows((from,to)=>cq.range(from,to))
 const ids=[...new Set(tasks.flatMap(t=>t.student_ids))]
 const {data:students,error:se}=staff&&ids.length?await supabaseAdmin.from('students').select('id,name').in('id',ids):{data:[],error:null};if(se)throw se
 const {data:ratings,error:re}=staff&&ids.length?await supabaseAdmin.from('mastery_records').select('user_id,target_id,level,observed_at').in('user_id',ids).in('target_id',tasks.map(t=>t.target_id).filter((id):id is string=>Boolean(id))).order('observed_at',{ascending:false}):{data:[],error:null};if(re)throw re
 return NextResponse.json({tasks:tasks.map(t=>({...t,student_ids:staff?t.student_ids:[ctx.userId],progress:(staff?t.student_ids:[ctx.userId]).map(id=>({studentId:id,name:students?.find(s=>s.id===id)?.name ?? 'Student',physicsRating:ratings?.find(r=>r.user_id===id&&r.target_id===t.target_id)?.level ?? null,...summarizeWords(t,(checks ?? []).filter(c=>c.task_id===t.id&&c.user_id===id) as CheckRecord[])}))}))})
})
export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
 const b=await req.json() as {course_ids:string[];student_ids?:string[];term_ids:string[];target_id?:string;title:string;note?:string;due_on?:string;threshold:number;min_checks:number;check_mode:string}
 if(!Array.isArray(b.course_ids)||!b.course_ids.length||!Array.isArray(b.term_ids)||!b.term_ids.length||b.term_ids.length>60||[...b.course_ids,...b.term_ids,...(b.student_ids ?? [])].some(id=>!UUID.test(id))||!b.title?.trim()||b.title.length>200||![1,2,3,4,5].includes(b.min_checks)||!Number.isInteger(b.threshold)||b.threshold<50||b.threshold>100||!['recognition','recall'].includes(b.check_mode)||b.target_id&&!UUID.test(b.target_id)||b.due_on&&!/^\d{4}-\d{2}-\d{2}$/.test(b.due_on))return NextResponse.json({error:'Choose classes, 1–60 words, and valid completion settings.'},{status:400})
 const courses=await vocabCourses(ctx)
 if(b.course_ids.some(id=>!courses.some(c=>c.id===id)))return NextResponse.json({error:'Not your class'},{status:403})
 const {data:enroll,error:e}=await supabaseAdmin.from('course_students').select('course_id,student_id').in('course_id',b.course_ids).eq('enrollment_state','ACTIVE');if(e)throw e
 if(b.student_ids?.some(id=>!enroll?.some(e=>e.student_id===id)))return NextResponse.json({error:'Student is not in the selected classes'},{status:400})
 const {data:words,error:w}=await supabaseAdmin.from('vocabulary_terms').select('id,term,definition,tier,vocabulary_set_id,icon,cognate,definition_es,translations,example').in('id',b.term_ids).eq('archived',false);if(w)throw w
 if(words?.length!==new Set(b.term_ids).size)return NextResponse.json({error:'Some words are no longer available. Refresh the list.'},{status:409})
 const {data:sets,error:s}=await supabaseAdmin.from('vocabulary_sets').select('id').in('id',words.map(w=>w.vocabulary_set_id)).eq('published',true).eq('archived',false);if(s)throw s
 if(words.some(w=>!sets?.some(s=>s.id===w.vocabulary_set_id)))return NextResponse.json({error:'Publish the word sets first'},{status:400})
 if(b.check_mode==='recognition'&&new Set(words.map(w=>w.term.toLowerCase())).size<2)return NextResponse.json({error:'Recognition needs at least two distinct words. Use recall for a single word.'},{status:400})
 const rows=b.course_ids.map(course_id=>({course_id,target_id:b.target_id||null,title:b.title.trim(),note:(b.note??'').slice(0,2000),due_on:b.due_on||null,threshold:b.threshold,min_checks:b.min_checks,check_mode:b.check_mode,assigned_by:ctx.email,term_ids:words.map(w=>w.id),words,student_ids:[...new Set((enroll??[]).filter(e=>e.course_id===course_id&&(!b.student_ids?.length||b.student_ids.includes(e.student_id))).map(e=>e.student_id))]})).filter(t=>t.student_ids.length)
 if(!rows.length)return NextResponse.json({error:'No active students selected'},{status:400})
 const {data,error}=await supabaseAdmin.from('vocab_tasks').insert(rows).select('id');if(error)throw error
 return NextResponse.json({created:data?.length})
})
export const PATCH=withRole(['teacher','admin'],async(req,ctx)=>{
 const b=await req.json() as {id:string;due_on?:string|null;active?:boolean}
 if(!UUID.test(b.id))return NextResponse.json({error:'Invalid assignment'},{status:400})
 if(!await accessVocabTask(b.id,ctx))return NextResponse.json({error:'Not your assignment'},{status:403})
 const patch:{due_on?:string|null;active?:boolean}={}
 if(b.due_on!==undefined){if(b.due_on!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(b.due_on))return NextResponse.json({error:'Invalid date'},{status:400});patch.due_on=b.due_on}
 if(typeof b.active==='boolean')patch.active=b.active
 const {error}=await supabaseAdmin.from('vocab_tasks').update(patch).eq('id',b.id);if(error)throw error
 return NextResponse.json({ok:true})
})
