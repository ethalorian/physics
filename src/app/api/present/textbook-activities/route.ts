import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { classLesson } from '@/lib/present-server'
import { textbookGroupActivities } from '@/lib/textbook-group-activities-server'

export const GET=withRole(['teacher','admin'],async(request,ctx)=>{
 const url=new URL(request.url),lessonId=url.searchParams.get('lesson_id'),courseId=url.searchParams.get('course_id')
 if(!lessonId||!courseId)return NextResponse.json({error:'Choose a class and lesson.'},{status:400})
 const lesson=await classLesson(lessonId,courseId,ctx)
 if(!lesson)return NextResponse.json({error:'Lesson unavailable for class.'},{status:403})
 try{return NextResponse.json({activities:await textbookGroupActivities(lesson.content_blocks,courseId)},{headers:{'Cache-Control':'private, no-store'}})}
 catch{return NextResponse.json({error:'Textbook activities could not load. Retry before launching.'},{status:502})}
})
