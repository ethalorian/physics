import { NextResponse } from 'next/server'
import { withContentEditor } from '@/lib/api-auth'
import { supabaseAdmin as db } from '@/lib/supabase'
import { findDay } from '@/lib/lesson-plan-export'
import { planFingerprint,lessonPlanRevision } from '@/lib/lesson-plan-alignment'
export const POST = withContentEditor('lessons', async (request, ctx) => {
  const body = await request.json()
  const r = await db.from('lesson_catalog_summary').select('id,title,unit_id,lesson_number,published,estimated_time,content_fingerprint').eq('id',body.lesson_id).maybeSingle()
  if(r.error)throw r.error
  if(!r.data)return NextResponse.json({error:'Lesson not found'},{status:404})
  const plan=findDay(r.data.unit_id,r.data.lesson_number,['cpa','trades','projects'])
  if(!plan)return NextResponse.json({error:'No matching plan.'},{status:422})
  if(body.content_fingerprint!==lessonPlanRevision(r.data) || body.plan_fingerprint!==planFingerprint(plan))return NextResponse.json({error:'The lesson or plan changed. Reload and compare again.'},{status:409})
  const saved=await db.from('lesson_plan_links').upsert({lesson_id:r.data.id,unit_id:r.data.unit_id,plan_day:r.data.lesson_number,content_fingerprint:lessonPlanRevision(r.data),plan_fingerprint:planFingerprint(plan),verified_at:new Date().toISOString(),verified_by:ctx.email,verification_kind:'reviewed'}).select('verified_at').single()
  if(saved.error)throw saved.error
  return NextResponse.json({ok:true,...saved.data})
})
