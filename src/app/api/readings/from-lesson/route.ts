import { isInteractiveReading, INTERACTIVE_READING_ONLY } from '@/lib/reading-availability'
import { randomUUID } from 'node:crypto'
import { withRole } from '@/lib/api-auth'
import { authorizeLesson } from '@/lib/lesson-access'
import { supabaseAdmin } from '@/lib/supabase'
import { readingCourses, readingJson, readingRows } from '@/lib/textbook-assignments-server'
import { lessonReadingDraft } from '@/lib/lesson-reading'
import { isBlockVisible, isLessonVisible } from '@/lib/track-visibility'
import { READING_UUID, type ReadingTarget } from '@/lib/textbook-assignments'

export const GET = withRole(['teacher','admin'],async(req,ctx)=>{
  const p=new URL(req.url).searchParams,lessonId=p.get('lesson_id')??'',blockId=p.get('block_id')??''
  if(!READING_UUID.test(lessonId)||!blockId) return readingJson({error:'Choose a lesson reading.'},400)
  const access=await authorizeLesson(ctx,lessonId)
  if(!access.ok)return access.response
  const block=access.document?.blocks.find(b=>b.id===blockId)
  if(block?.type!=='reading')return readingJson({error:'This lesson reading is unavailable.'},404)
  const {data:unit,error}=await supabaseAdmin.from('units').select('program').eq('id',access.lesson.unit_id).maybeSingle()
  if(error)throw error
  const courses=(await readingCourses(ctx)).filter(c=>c.program===unit?.program&&isLessonVisible(access.lesson.visibility_track,{role:'teacher',track:c.track})&&isBlockVisible(block,{role:'teacher',track:c.track}))
  const course=p.get('course_id')?courses.find(c=>c.id===p.get('course_id')):courses[0]
  if(!course)return readingJson({error:'Choose an owned class that can use this lesson.'},403)
  const targets=await readingRows<ReadingTarget>((a,b)=>supabaseAdmin.from('learning_targets').select('id,slug,statement,unit_id,domain,program').eq('program',course.program).eq('exclude_from_growth',false).order('id').range(a,b))
  const assignment = lessonReadingDraft(access.lesson,block,course.id,targets,course.program,randomUUID)
  if (!isInteractiveReading(assignment)) return readingJson({error:INTERACTIVE_READING_ONLY},409)
  return readingJson({assignment,courses:courses.map(({id,name,section,program,track})=>({id,name,section,program,track}))})
})
