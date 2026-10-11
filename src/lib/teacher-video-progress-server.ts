import {supabaseAdmin} from '@/lib/supabase'
import type {BlockDocument,InstructionVideoBlock} from '@/data/content-blocks'
import {isCurrentLesson} from './current-lesson-catalog'
import {isLessonVisible,isBlockVisible} from './track-visibility'
import {releaseStatus} from './lesson-release'
import {readLessonRows} from './lesson-completion-server'
import {readIdBatches} from './read-id-batches'
import {PHYSICS_VIDEOS} from '@/data/physics-videos'
import {videoViewing,lessonViewing,type VideoSpec,type RecordedVideo,type VideoClassReport} from './teacher-video-progress'

export class VideoReportError extends Error {constructor(message:string,readonly status:number){super(message)}}
export async function videoClassReport(actor:{role:string;scopeEmail:string},classId:string,requestedLesson:string|null):Promise<VideoClassReport> {
  if(!['admin','teacher'].includes(actor.role))throw new VideoReportError('Teachers only.',403)
  // Ownership is checked before reading any enrollment, playback, or submissions.
  const courseResult=await supabaseAdmin.from('courses').select('id,name,section,teacher_email,program,track,archived_at').eq('id',classId).maybeSingle()
  if(courseResult.error)throw courseResult.error
  const course=courseResult.data
  if(!course || course.archived_at || (actor.role!=='admin'&&course.teacher_email!==actor.scopeEmail))throw new VideoReportError('This class is unavailable.',403)
  const units=await supabaseAdmin.from('units').select('id').eq('program',course.program??'physics')
  if(units.error)throw units.error
  const ids=(units.data??[]).map(u=>u.id)
  const report:VideoClassReport={course:{id:course.id,name:course.section?`${course.name} · ${course.section}`:course.name},lessons:[],lessonId:null,students:[],checkedAt:new Date().toISOString()}
  if(!ids.length)return report
  const [lessonResult,catalogResult,windowResult]=await Promise.all([
    supabaseAdmin.from('lessons').select('id,title,unit_id,visibility_track,content_blocks').eq('published',true).in('unit_id',ids),
    supabaseAdmin.from('lesson_video_catalog').select('youtube_id,duration_seconds'),
    supabaseAdmin.from('lesson_class_windows').select('lesson_id,open_at,close_at').eq('course_id',classId),
  ])
  for(const result of [lessonResult,catalogResult,windowResult])if(result.error)throw result.error
  const durations=new Map((catalogResult.data??[]).map(v=>[v.youtube_id,v.duration_seconds]))
  const windows=new Map((windowResult.data??[]).map(w=>[w.lesson_id,w]))
  const viewer={role:'student' as const,track:course.track}
  const lessons=(lessonResult.data??[]).filter(l=>isCurrentLesson({...l,program:course.program??'physics'})&&isLessonVisible(l.visibility_track,viewer)).map(l=>{
    const doc=l.content_blocks as BlockDocument|null
    const blocks=(doc?.blocks??[]).filter((b):b is InstructionVideoBlock=>b.type==='instruction_video'&&isBlockVisible(b,viewer))
    const specs:VideoSpec[]=[...new Map(blocks.map(b=>[`${b.youtubeId}:${Math.max(0,Math.floor(b.startSeconds??0))}`,{youtubeId:b.youtubeId,title:b.title,duration:durations.get(b.youtubeId)??b.durationSeconds??null,start:Math.max(0,Math.floor(b.startSeconds??0))}])).values()]
    const sequence=PHYSICS_VIDEOS.find(v=>specs.some(s=>s.youtubeId===v.youtubeId))?.sequence??null
    return {id:l.id,title:l.title,unitId:l.unit_id,sequence,access:releaseStatus(windows.get(l.id)),videoCount:specs.length,specs}
  }).filter(l=>l.specs.length).sort((a,b)=>(a.sequence??999)-(b.sequence??999)||a.title.localeCompare(b.title))
  report.lessons=lessons.map(({specs,...l})=>{void specs;return l})
  const selected=requestedLesson?lessons.find(l=>l.id===requestedLesson):lessons.find(l=>l.access==='open')??lessons[0]
  if(requestedLesson&&!selected)throw new VideoReportError('This video lesson is unavailable for this class.',404)
  if(!selected)return report
  report.lessonId=selected.id
  const enrollments=await readLessonRows<{student_id:string}>((from,to)=>supabaseAdmin.from('course_students').select('student_id').eq('course_id',classId).order('student_id').range(from,to))
  const rosterIds=[...new Set(enrollments.map(r=>r.student_id).filter(Boolean))]
  if(!rosterIds.length)return report
  const students=await readIdBatches<{id:string;name:string|null}>(rosterIds,batch=>supabaseAdmin.from('students').select('id,name').in('id',batch))
  const progress:(RecordedVideo&{user_id:string})[]=[],submissions:{user_id:string;submitted_at:string}[]=[]
  // A lesson may have many attempts per student. Page within bounded ID batches.
  for(let offset=0;offset<rosterIds.length;offset+=100){
    const batch=rosterIds.slice(offset,offset+100)
    const [p,s]=await Promise.all([
      readLessonRows<RecordedVideo&{user_id:string}>((from,to)=>supabaseAdmin.from('lesson_video_progress').select('user_id,youtube_id,duration_seconds,start_seconds,watched_seconds,updated_at').eq('lesson_id',selected.id).in('user_id',batch).order('user_id').order('youtube_id').range(from,to)),
      readLessonRows<{user_id:string;submitted_at:string}>((from,to)=>supabaseAdmin.from('lesson_submissions').select('user_id,submitted_at').eq('lesson_id',selected.id).in('user_id',batch).order('submitted_at').order('id').range(from,to)),
    ]);progress.push(...p);submissions.push(...s)
  }
  const byVideo=new Map(progress.map(p=>[`${p.user_id}|${p.youtube_id}`,p]))
  const submitted=new Map<string,string>();for(const s of submissions){if(s.submitted_at>(submitted.get(s.user_id)??''))submitted.set(s.user_id,s.submitted_at)}
  report.students=students.map(s=>{const videos=selected.specs.map(spec=>({...videoViewing(spec,byVideo.get(`${s.id}|${spec.youtubeId}`)),title:spec.title}));return {id:s.id,name:s.name?.trim()||'Unnamed student',...lessonViewing(videos),submittedAt:submitted.get(s.id)??null,videos}}).sort((a,b)=>a.name.localeCompare(b.name))
  return report
}
