import {supabaseAdmin} from '@/lib/supabase'
import { after, NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'
import { ensureSuggestion, processSuggestion, suggestionEvidence } from '@/lib/assessment-results/suggestions-server'
import { SUGGESTION_SOURCES, type SuggestionSource } from '@/lib/assessment-results/suggestions'

export const maxDuration = 180
const json = (body:unknown,status=200) => NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
export const GET = withRole(['teacher','admin'],async(request,ctx) => {
  const p = new URL(request.url).searchParams, source = p.get('source') as SuggestionSource,id = p.get('id') ?? ''
  if (!SUGGESTION_SOURCES.includes(source) || !id || id.length>200) return json({error:'Invalid submission.'},400)
  const evidence = await suggestionEvidence(source,id)
  if (!evidence || !await teacherCanAccessStudent(ctx.scopeEmail,evidence.userId)) return json({error:'Submission unavailable.'},404)
  const job = await ensureSuggestion(source,id)
  if (!job) return json({error:'Submission unavailable.'},404)
  if (job.row.status === 'queued' || job.row.status === 'processing' && Date.parse(job.row.locked_until ?? '') < Date.now()) after(async()=>{await processSuggestion(source,id)})
  return json({status:job.row.status,result:job.row.result,targets:job.targets,error:job.row.error})
})
export const POST = withRole(['teacher','admin'],async(request,ctx) => {
  if(request.headers.get('origin')!==request.nextUrl.origin)return json({error:'Reload and try again.'},403)
  if(ctx.viewingAsTeacher) return json({error:'Switch back to your own account.'},403)
  const b = await request.json().catch(()=>null)
  if (!b || !SUGGESTION_SOURCES.includes(b.source) || typeof b.id !== 'string' || b.id.length>200) return json({error:'Invalid submission.'},400)
  const evidence = await suggestionEvidence(b.source,b.id)
  if (!evidence || !await teacherCanAccessStudent(ctx.scopeEmail,evidence.userId)) return json({error:'Submission unavailable.'},404)
  const reset=await supabaseAdmin.from('automatic_grading_jobs').update({status:'queued',attempts:0,next_attempt_at:new Date().toISOString(),last_error:null}).eq('source',b.source).eq('source_id',b.id).eq('status','attention');if(reset.error)throw reset.error
  after(async()=>{await processSuggestion(b.source,b.id,true)})
  return json({queued:true})
})
