import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { coursePlanChoices, presentationCourse } from '@/lib/course-plan-presentation-server'

export const GET=withRole(['teacher','admin'],async(request,ctx)=>{
  const courseId=new URL(request.url).searchParams.get('course_id')
  if(!courseId)return NextResponse.json({error:'Choose a class.'},{status:400})
  const result=await presentationCourse(courseId,ctx)
  if(!result.ok)return NextResponse.json({error:result.error},{status:result.status})
  return NextResponse.json({plans:coursePlanChoices(result.course),track:result.course.track==='honors'?'honors':'cpa'})
})
