'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { commandRequest } from '@/lib/classroom-command'
import { lessonContextHref } from '@/lib/lesson-release'
import { planTeachHref, type PresentationIdentity } from '@/lib/course-plan-presentation'
type SavedPresentation = PresentationIdentity & {course_id:string}

export default function ResumeTeaching() {
  const [session,setSession]=useState<SavedPresentation|null>(null)
  useEffect(()=>{const abort=new AbortController();const refresh=()=>{if(document.visibilityState==='hidden')return;void commandRequest<{sessions:SavedPresentation[]}>('/api/present/sessions?active=1',{signal:abort.signal}).then(d=>setSession(d.sessions[0]??null)).catch(()=>{})};refresh();const timer=setInterval(refresh,30000);return()=>{abort.abort();clearInterval(timer)}},[])
  return session?<Link className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground" href={session.plan_unit_id&&session.plan_day?planTeachHref(session.plan_unit_id,session.plan_day,session.course_id)+'&resume=1':lessonContextHref('/admin/command-center?resume=1',{class:session.course_id,lesson:session.lesson_id??''})}>Resume guided practice</Link>:null
}
