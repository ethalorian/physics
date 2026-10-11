import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import type { BlockDocument, ExSection } from '@/data/content-blocks'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import { readingRows } from '@/lib/textbook-assignments-server'
import { collectTextbookActivities } from '@/lib/textbook-group-activities'

/** Caller must authorize class + lesson first. Never selects an answer key or student work. */
export async function textbookGroupActivities(doc:BlockDocument,courseId:string) {
 const chapters=[...new Set(doc.blocks.flatMap(b=>b.type==='concept_exercise'?[b.chapter]:[]))]
 const [exercises,assignments]=await Promise.all([
  chapters.length?supabaseAdmin.from('concept_exercises').select('chapter,sections').in('chapter',chapters):Promise.resolve({data:[],error:null}),
  readingRows((from,to)=>supabaseAdmin.from('textbook_assignments').select('id,title,chapter,reading,questions').eq('course_id',courseId).eq('status','published').order('created_at',{ascending:false}).order('id').range(from,to)),
 ])
 if(exercises.error)throw exercises.error
 return collectTextbookActivities(doc,(exercises.data??[]) as {chapter:number;sections:ExSection[]}[],assignments as ReadingAssignment[])
}
