'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { studentLessonHref, teachingHref } from '@/lib/teaching-navigation'
import { TradeContext } from '@/components/lessons/TradeContext'
import type { AssignedTrade } from '@/lib/vocational'
import type { LanguageProfile } from '@/lib/sei'
import BlockLessonViewer from '@/components/lessons/BlockLessonViewer'
import type { PreviewLesson } from '@/components/admin/AdminLessonPreview'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import { commandRequest } from '@/lib/classroom-command'
import { classLabel, type ReleaseClass } from '@/lib/lesson-release'
import { useLessonContext } from '@/components/admin/useLessonContext'

type Data={flags?:{experience:'classic'|'stepped';gateCheckpoints:boolean};languageProfile?:LanguageProfile;trade?:AssignedTrade|null;classes:ReleaseClass[];students:{id:string;name:string;email:string}[];course?:ReleaseClass;student?:{name:string};lessons:{id:string;title:string;window:{state:string}}[];lesson?:PreviewLesson;responses?:BlockResponseMap;status?:{submittedAt:string|null;locked:boolean;feedback?:string};unavailable?:string;progress?:{completed_sections:number[];completed_anchors:string[];document_revision:string};targets?:{slug:string;statement:string;self:null;teacher:number|null;delta:null}[]}
export default function StudentAccountPreview(){
  const context=useLessonContext()
  const params=useSearchParams(),router=useRouter()
  const classId=params.get('class')??context.classId,studentId=params.get('student')??'',lessonId=params.get('lesson')??''
  const unit=params.get('unit')??'auto'
  const choose=(course:string,student='',lesson='')=>router.replace(studentLessonHref(course,student,lesson,course===classId?unit:'auto'),{scroll:false})
  const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true)
  useEffect(()=>{const abort=new AbortController();setLoading(true);setError('');setData(null);commandRequest<Data>('/api/teacher/student-preview?'+new URLSearchParams({class:classId,student:studentId,lesson:lessonId}),{signal:abort.signal}).then(setData).catch(e=>{if(!abort.signal.aborted)setError(e.message)}).finally(()=>{if(!abort.signal.aborted)setLoading(false)});return()=>abort.abort()},[classId,studentId,lessonId])
  return <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6"><div className="sticky top-0 z-20 rounded-xl border bg-card p-4"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-xl font-semibold">Student lesson view · read-only</h1><Link className="inline-flex min-h-11 items-center underline" href={teachingHref('results',classId,unit)+(studentId?'&resultStudent='+encodeURIComponent(studentId):'')}>Back to Results</Link></div><p className="text-sm">Actual lesson availability, saved answers, and returned feedback. Changes and submissions are disabled. Live participation and other account areas are not simulated here.</p></div>
    <div className="grid gap-3 sm:grid-cols-3"><label>Class<select className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3" value={classId} onChange={e=>choose(e.target.value)}><option value="">Choose class</option>{data?.classes.map(c=><option key={c.id} value={c.id}>{classLabel(c)}</option>)}</select></label><label>Student<select className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3" value={studentId} disabled={!classId||loading} onChange={e=>choose(classId,e.target.value)}><option value="">Choose student</option>{data?.students.map(s=><option key={s.id} value={s.id}>{s.name||s.email}</option>)}</select></label><label>Lesson<select className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3" value={lessonId} disabled={!studentId||loading} onChange={e=>choose(classId,studentId,e.target.value)}><option value="">Choose lesson</option>{data?.lessons.map(l=><option key={l.id} value={l.id}>{l.title} · {l.window.state}</option>)}</select></label></div>
    {loading&&<p role="status">Loading student account…</p>}{error&&<p role="alert" className="text-destructive">{error}</p>}
    {data?.student&&<section className="rounded-xl border p-4"><h2 className="font-semibold">{data.student.name} · lesson access</h2><p className="text-sm text-muted-foreground">Access includes any other class this student is enrolled in. Unsynced work on the student’s device is unavailable.</p>{!lessonId&&<ul className="mt-3 divide-y">{data.lessons.map(l=><li key={l.id} className="flex items-center justify-between gap-4 py-2"><button className="min-h-11 text-left underline" onClick={()=>choose(classId,studentId,l.id)}>{l.title}</button><span className="text-sm">{l.window.state}</span></li>)}</ul>}{data.status&&<p className="mt-3">{data.status.locked?'Submitted · awaiting review':data.status.submittedAt?'Reviewed · open for revision':'Not submitted'}{data.progress?` · ${data.progress.completed_sections?.length??0} sections completed`:''}</p>}{data.status?.feedback&&<div className="mt-3"><h3 className="font-medium">Returned feedback</h3><p className="whitespace-pre-wrap">{data.status.feedback}</p></div>}</section>}
    {data?.unavailable&&<p className="rounded-xl border p-5">Student sees: {data.unavailable}</p>}
    {data?.lesson&&<TradeContext.Provider value={data.trade??null}><BlockLessonViewer key={`${studentId}:${lessonId}`} preview previewReturnHref={teachingHref('results',classId,unit)+(studentId?'&resultStudent='+encodeURIComponent(studentId):'')} snapshot={{responses:data.responses??{},feedback:data.status?.feedback,locked:data.status?.locked??false,submitted:!!data.status?.submittedAt,completedAnchors:data.progress?.completed_anchors,revision:data.progress?.document_revision}} previewProfile={data.languageProfile} previewFlags={data.flags??{experience:data.course?.lesson_experience??'stepped',gateCheckpoints:data.course?.gate_checkpoints??true}} previewTargets={data.targets} lesson={data.lesson}/></TradeContext.Provider>}
  </main>
}
