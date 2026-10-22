import { supabaseAdmin } from '@/lib/supabase'
import type { BlockDocument } from '@/data/content-blocks'
import { physicsLearningEntry, type PhysicsTarget } from './physics-learning'
import { CURRENT_PHYSICS_LESSON_FILTER, isCurrentLesson } from './current-lesson-catalog'

/** Staff-only callers authorize before loading this catalog. Never reads student work. */
export async function loadPhysicsLearningCatalog() {
  const unitsResult=await supabaseAdmin.from('units').select('id,name').eq('program','physics').order('order_index')
  if(unitsResult.error)throw unitsResult.error
  const units=unitsResult.data??[], ids=units.map(u=>u.id)
  if(!ids.length)return {units,lessons:[],targets:[] as PhysicsTarget[]}
  const [lr,tr]=await Promise.all([
    supabaseAdmin.from('lessons').select('id,slug,title,unit_id,published,estimated_time,content_blocks').in('unit_id',ids).or(CURRENT_PHYSICS_LESSON_FILTER).order('lesson_number'),
    supabaseAdmin.from('learning_targets').select('id,slug,statement,domain,unit_id,lesson_id').in('unit_id',ids).order('slug'),
  ])
  if(lr.error)throw lr.error
  if(tr.error)throw tr.error
  const targets=(tr.data??[]) as PhysicsTarget[]
  const lessons=(lr.data??[]).filter(l=>isCurrentLesson({...l,program:'physics'})).map(l=>({id:l.id,slug:l.slug,title:l.title,unit_id:l.unit_id,published:l.published,estimated_time:l.estimated_time??undefined,blockCount:(l.content_blocks as BlockDocument|null)?.blocks?.length??0,learning:physicsLearningEntry(l,targets)}))
  return {units,lessons,targets}
}
