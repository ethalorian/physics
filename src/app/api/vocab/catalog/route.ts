import { NextResponse } from 'next/server'
import { withRole, withContentEditor } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { vocabCourses } from '@/lib/vocab-access'
import { vocabRows } from '@/lib/vocab-pagination'
import { UUID } from '@/lib/vocab-learning'
export const GET=withRole(['teacher','admin'],async (_req,ctx)=>{
 const courses=await vocabCourses(ctx)
 const results=await Promise.all([
  supabaseAdmin.from('vocabulary_sets').select('id,name,lesson_id,unit_id').eq('published',true).eq('archived',false),
  vocabRows((a,b)=>supabaseAdmin.from('vocabulary_terms').select('id,term,definition,tier,icon,cognate,definition_es,translations,example,vocabulary_set_id').eq('archived',false).order('id').range(a,b)).then(data=>({data,error:null})),
  vocabRows((a,b)=>supabaseAdmin.from('learning_targets').select('id,slug,statement,lesson_id,program').order('slug').order('id').range(a,b)).then(data=>({data,error:null})),
  vocabRows((a,b)=>supabaseAdmin.from('vocab_target_terms').select('target_id,term_id').order('target_id').order('term_id').range(a,b)).then(data=>({data,error:null})),
  supabaseAdmin.from('course_students').select('course_id,student_id,students(id,name)').in('course_id',courses.map(c=>c.id)).eq('enrollment_state','ACTIVE'),
 ])
 for(const r of results) if(r.error) throw r.error
 const sets=results[0].data ?? []; const ids=new Set(sets.map(s=>s.id))
 return NextResponse.json({courses,sets,words:(results[1].data ?? []).filter(w=>ids.has(w.vocabulary_set_id)),targets:results[2].data,links:results[3].data,enrollments:results[4].data})
})
export const PUT=withContentEditor('vocabulary',async(req)=>{
 const b=await req.json() as {target_id:string;term_ids:string[]}
 if(!UUID.test(b.target_id)||!Array.isArray(b.term_ids)||b.term_ids.some(id=>!UUID.test(id))) return NextResponse.json({error:'Choose a target and valid words'},{status:400})
 const {error}=await supabaseAdmin.rpc('link_vocab_target',{p_target:b.target_id,p_terms:b.term_ids})
 if(error) throw error
 return NextResponse.json({ok:true})
})
