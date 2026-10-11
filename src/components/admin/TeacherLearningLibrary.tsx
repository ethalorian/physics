'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { type LearningLesson } from '@/components/lessons/PhysicsLearningLibrary'
import { type ManageUnit, type ManageLesson } from './ManageUnits'
import { useLessonContext } from './useLessonContext'
import { appliesToClass, classLabel, lessonContextHref, type ReleaseData } from '@/lib/lesson-release'
import { commandRequest } from '@/lib/classroom-command'
import VideoInstructionLibrary from '@/components/lessons/VideoInstructionLibrary'
import { conceptTitle, isVideoInstructionEntry } from '@/lib/video-instruction'

const control='min-h-11 rounded-lg border bg-background px-3 py-2 text-sm'
export default function TeacherLearningLibrary({lessons,units,orphans,canEdit=false}:{lessons:LearningLesson[];units:ManageUnit[];orphans:ManageLesson[];canPublish:boolean;canEdit?:boolean}) {
  const context=useLessonContext()
  const [query,setQuery]=useState('')
  const [data,setData]=useState<ReleaseData|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{const sync=()=>setQuery(window.location.search);sync();window.addEventListener('popstate',sync);const abort=new AbortController();commandRequest<ReleaseData>('/api/lesson-access',{signal:abort.signal}).then(setData).catch(e=>{if(!abort.signal.aborted)setError(e.message)});return()=>{window.removeEventListener('popstate',sync);abort.abort()}},[])
  const p=new URLSearchParams(query), q=p.get('q')??'', unit=p.get('unit')??'', status=p.get('status')??''
  const course=data?.classes.find(c=>c.id===(p.get('class')??context.classId))
  const requestedProgram=p.get('program')
  const program=course?.program??(requestedProgram==='projects'?'physics':requestedProgram??'physics')
  const videoView=program==='physics'&&p.get('view')!=='classroom'
  const set=(values:Record<string,string>)=>{const next=new URLSearchParams(query);Object.entries(values).forEach(([k,v])=>v?next.set(k,v):next.delete(k));const url='/admin/dashboard'+(next.size?'?'+next:'');window.history.replaceState(window.history.state,'',url);setQuery(next.toString())}
  const href=(id:string)=>lessonContextHref(`/admin/lessons/${id}`,{class:course?.id,lesson:id,return:'/admin/dashboard'+(p.size?'?'+p:'')})
  const metadata=new Map(lessons.map(l=>[l.id,l.learning]))
  const inClass=(id:string)=>!course||Boolean(data?.lessons.some(r=>r.id===id&&appliesToClass(r,course)))
  const match=(l:ManageLesson)=> (program!=='physics'||!isVideoInstructionEntry(metadata.get(l.id)))&& (!q||`${l.title} ${l.slug} ${metadata.get(l.id)?.targets.map(t=>t.statement).join(' ')??''}`.toLowerCase().includes(q.toLowerCase()))&&(!status||l.published===(status==='published'))&&inClass(l.id)
  const all=[...units,...(orphans.length?[{id:'other',name:'Other lessons',program:'other',lessons:orphans}]:[])]
  const visible=all.filter(u=>(!program||(u.program??'physics')===program)&&(!unit||u.id===unit)).map(u=>({...u,lessons:u.lessons.filter(match).sort((a,b)=>Number(metadata.get(b.id)?.source==='new')-Number(metadata.get(a.id)?.source==='new')||(a.lessonNumber??0)-(b.lessonNumber??0))})).filter(u=>u.lessons.length)
  const row=(l:ManageLesson)=><article key={l.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-4"><div><Link className="inline-flex min-h-11 items-center font-medium text-primary underline" href={href(l.id)} onClick={()=>context.remember({classId:course?.id??'',lessonId:l.id})}>{metadata.has(l.id)?conceptTitle(l.title):l.title}</Link><p className="text-sm text-muted-foreground">{l.published?'Published':'Draft'}{l.blockCount?'':' · No activities yet'}</p></div><Link className={control} href={href(l.id)}>Open lesson</Link></article>
  return <section className="space-y-5">
    {program==='physics'&&<nav aria-label="Physics library" className="flex flex-wrap gap-2"><Link className={control} href={lessonContextHref('/admin/control-room?view=videos',{class:course?.id})}>Student video progress</Link><button type="button" className={control+(videoView?' bg-primary text-primary-foreground':'')} aria-pressed={videoView} onClick={()=>set({view:'videos'})}>Video lessons · concept spine</button><Link className={control} href={lessonContextHref('/admin/teacher/plans',{class:course?.id,unit:'unit-1'})}>Asteroid course plans</Link><button type="button" className={control+(!videoView?' bg-primary text-primary-foreground':'')} aria-pressed={!videoView} onClick={()=>set({view:'classroom'})}>Classroom activities & practice</button></nav>}
    {program==='physics'&&<p className="text-sm text-muted-foreground">Video lessons build the concepts. Asteroid course plans organize the story, investigations, and in-class application. Classroom activities collect students’ applied work.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-sm">Class<select className={control+' mt-1 w-full'} value={course?.id??''} onChange={e=>{const c=data?.classes.find(c=>c.id===e.target.value);set({class:e.target.value,program:c?.program??'physics',unit:''});context.remember({classId:e.target.value,lessonId:''})}}><option value="">All classes</option>{data?.classes.map(c=><option key={c.id} value={c.id}>{classLabel(c)}</option>)}</select></label><label className="text-sm">Program<select className={control+' mt-1 w-full'} value={program} onChange={e=>{set({program:e.target.value,class:'',unit:''});context.remember({classId:'',lessonId:''})}}><option value="">All programs</option><option value="physics">Physics</option><option value="trades">Trades Physics</option></select></label>{!videoView&&<><label className="text-sm">Unit<select className={control+' mt-1 w-full'} value={unit} onChange={e=>set({unit:e.target.value})}><option value="">All units</option>{units.filter(u=>!program||(u.program??'physics')===program).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label className="text-sm">Search lessons<input className={control+' mt-1 w-full'} value={q} onChange={e=>set({q:e.target.value})} placeholder="Topic or learning target"/></label></>}</div>
    {error&&<p role="alert" className="text-destructive">{error}</p>}
    {videoView?<VideoInstructionLibrary classId={course?.id} lessons={lessons.filter(l=>inClass(l.id))} catalogLessons={lessons} staff canEdit={canEdit} lessonHref={l=>href(l.id)} accessHref={l=>lessonContextHref('/admin/lesson-access',{class:course?.id,lesson:l.id})} draftHref={videoId=>lessonContextHref('/admin/lessons/new',{unit:'unit-1',class:course?.id,return:'/admin/dashboard'+(p.size?'?'+p:'')})+'&video='+videoId}/>:<>
    <details className="rounded-lg border px-4"><summary className="min-h-11 cursor-pointer py-3 text-sm">More filters and authoring</summary><div className="flex flex-wrap items-center gap-3 pb-4"><label className="text-sm">Publication <select className={control} value={status} onChange={e=>set({status:e.target.value})}><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option></select></label>{canEdit&&<Link className={control} href="/admin/lessons/new">Create a lesson</Link>}</div></details>
    {!visible.length&&<p>No lessons match. Change the program, unit, or search.</p>}
    {visible.map(u=><section key={u.id} className="rounded-xl border bg-card p-5"><h2 className="mb-2 text-lg font-semibold">{u.name}</h2>{u.lessons.map(row)}</section>)}
    </>}
  </section>
}
