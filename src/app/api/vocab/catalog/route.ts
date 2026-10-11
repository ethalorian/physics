import { isCatalogLesson } from '@/lib/retired-curriculum'
import { NextResponse } from 'next/server'
import { withRole, withContentEditor } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { vocabCourses } from '@/lib/vocab-access'
import { vocabRows } from '@/lib/vocab-pagination'
import { UUID } from '@/lib/vocab-learning'
import { vocabularyFor } from '@/lib/vocab-scope-server'
export const GET=withRole(['teacher','admin'],async (_req,ctx)=>{
 const courses=await vocabCourses(ctx)
 const available=await vocabularyFor(ctx,{authoring:true})
 const results=await Promise.all([
  vocabRows((a,b)=>supabaseAdmin.from('learning_targets').select('id,slug,statement,lesson_id,program,unit_id,domain').eq('domain','knowledge').order('unit_id').order('order_index').order('id').range(a,b)).then(data=>({data,error:null})),
  vocabRows((a,b)=>supabaseAdmin.from('vocab_target_terms').select('target_id,term_id').order('target_id').order('term_id').range(a,b)).then(data=>({data,error:null})),
  supabaseAdmin.from('course_students').select('course_id,student_id,students(id,name)').in('course_id',courses.map(c=>c.id)).eq('enrollment_state','ACTIVE'),
 ])
 for(const r of results) if(r.error) throw r.error
 const sets=available.sets; const ids=new Set(sets.flatMap(s=>s.term_ids))
 return NextResponse.json({courses,sets,words:available.words,targets:(results[0].data ?? []).filter(t=>isCatalogLesson(t)&&courses.some(c=>c.program===t.program)),links:(results[1].data??[]).filter(l=>ids.has(l.term_id)),enrollments:results[2].data})
})
export const PUT=withContentEditor('vocabulary',async(req)=>{
 const b=await req.json() as {target_id:string;term_ids:string[]}
 if(!UUID.test(b.target_id)||!Array.isArray(b.term_ids)||b.term_ids.some(id=>!UUID.test(id))) return NextResponse.json({error:'Choose a target and valid words'},{status:400})
 const {error}=await supabaseAdmin.rpc('link_vocab_target',{p_target:b.target_id,p_terms:b.term_ids})
 if(error) throw error
 return NextResponse.json({ok:true})
})
