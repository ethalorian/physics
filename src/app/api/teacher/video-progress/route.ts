import {NextResponse} from 'next/server'
import {withAuth} from '@/lib/api-auth'
import {videoClassReport,VideoReportError} from '@/lib/teacher-video-progress-server'

export const GET=withAuth(async(request,ctx)=>{
  if(!['teacher','admin'].includes(ctx.role))return NextResponse.json({error:'Teachers only.'},{status:403})
  const p=new URL(request.url).searchParams,course=p.get('class'),lesson=p.get('lesson')
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if(!course||!uuid.test(course)||(lesson&&!uuid.test(lesson)))return NextResponse.json({error:'Choose a valid class and lesson.'},{status:400})
  try{return NextResponse.json(await videoClassReport(ctx,course,lesson),{headers:{'Cache-Control':'private, no-store'}})}
  catch(e){if(e instanceof VideoReportError)return NextResponse.json({error:e.message},{status:e.status});throw e}
})
