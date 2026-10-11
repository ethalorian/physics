import Link from 'next/link'
import VideoPlanConnections from '@/components/lessons/VideoPlanConnections'
import { PHYSICS_VIDEOS } from '@/data/physics-videos'
import { lessonAuthoringData } from '@/lib/lesson-authoring'
import { linkedTeachingPlans } from '@/lib/lesson-workspace'
import { lessonContextHref } from '@/lib/lesson-release'
import LessonWorkspaceNav from '@/components/admin/LessonWorkspaceNav'

export default async function LessonWorkspacePage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{class?:string}> }) {
  const { id } = await params
  const query = await searchParams
  const d = await lessonAuthoringData(id, false)
  const plans = linkedTeachingPlans(d.lesson, d.document)
  const blocks = d.document?.blocks ?? []
  const videos=d.document?.learningPath?.kind==='lesson'?PHYSICS_VIDEOS.filter(v=>blocks.some(b=>b.type==='instruction_video'&&b.youtubeId===v.youtubeId)):[]
  const href = (path:string) => lessonContextHref(path, {class:query.class,lesson:id})
  return <main className="mx-auto max-w-6xl p-4 sm:p-6">
    <LessonWorkspaceNav lessonId={id} title={d.lesson.title} published={d.lesson.published}/>
    <div className="grid gap-5 lg:grid-cols-3"><section className="space-y-5 lg:col-span-2">
      <div className="rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">{videos.length?'Prepare the video lesson':'Prepare the classroom activity'}</h2><p className="mt-2 text-sm text-muted-foreground">{d.lesson.unit} {d.lesson.estimated_time ? `· ${d.lesson.estimated_time} minutes` : ''}</p><p className="mt-3">{d.document?.learningPath?.focus ?? 'Review the plan and materials, then try the student activities before teaching.'}</p></div>
      <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">{d.lesson.unit_id?.startsWith('unit-')?'Asteroid course plans & teaching links':'Course plans & teaching links'}</h2>{videos.length>0&&<VideoPlanConnections sequences={videos.map(v=>v.sequence)} classId={query.class}/>}{plans.length ? plans.map(plan => <details key={`${plan.unitId}:${plan.day}`} open={plans.length===1}><summary className="min-h-11 cursor-pointer py-3 font-medium">{plan.title}</summary><Link className="inline-flex min-h-11 items-center text-sm underline" href={lessonContextHref('/admin/teacher/plans',{class:query.class,lesson:id,unit:plan.unitId,day:plan.day})}>Open plan and downloads</Link><div className="prose max-w-none overflow-x-auto" dangerouslySetInnerHTML={{__html:plan.bodyHtml}}/></details>) : <><p>{videos.length?'This video is a reusable concept lesson. The course plans above show where it prepares or supports classroom work.':'No classroom plan is linked to this activity yet.'}</p><Link className="inline-flex min-h-11 items-center underline" href={lessonContextHref('/admin/teacher/plans',{class:query.class,unit:d.lesson.unit_id})}>Browse plans for this unit</Link></>}{d.canEdit && <Link className="inline-flex min-h-11 items-center text-sm underline" href={href(`/admin/lessons/${id}/build#teaching-plans`)}>Manage linked plans</Link>}</section>
      <section className="rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">Activities and materials</h2><ul className="mt-3 divide-y">{blocks.filter(b => !b.referencePanel && b.type !== 'deck').map((b,i) => <li key={b.id} className="py-3 text-sm"><span className="font-medium">{i+1}. {b.type.replaceAll('_',' ')}</span>{'title' in b && typeof b.title==='string' ? ` · ${b.title}` : ''}</li>)}</ul><Link className="inline-flex min-h-11 items-center text-primary underline" href={href(`/admin/lessons/${id}/preview`)}>Try the activities as a student</Link></section>
    </section><aside className="space-y-5"><section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Classroom screen</h2><p className="mt-2 text-sm">{blocks.some(b=>b.type==='deck') ? 'Authored slides, with lesson activities available while teaching. Supplemental slides may have no matching student step.' : 'Slides are built from the same lesson activities students use.'}</p><Link className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground" href={href('/admin/command-center')}>Preview screen and teach</Link></section>
      <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Class access</h2><p className="mt-2 text-sm">Publishing makes the lesson available to teachers. Class access controls when students can open it. Starting a presentation does not change access.</p><Link className="inline-flex min-h-11 items-center underline" href={href('/admin/lesson-access')}>Manage student access</Link></section>
      {d.canEdit && <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Edit lesson</h2><div className="flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center underline" href={href(`/admin/lessons/${id}/build`)}>Content</Link><Link className="inline-flex min-h-11 items-center underline" href={href(`/admin/lessons/${id}/edit`)}>Settings and publishing</Link></div></section>}
      <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Check understanding</h2><p className="mt-2 text-sm">Create a quiz from this lesson and its mastery targets. Claude drafts the questions and answer guides for your review.</p><Link className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground" href={`/admin/quizzes?generate=1&lesson=${encodeURIComponent(id)}${query.class ? '&class='+encodeURIComponent(query.class) : ''}`}>Create quiz with Claude</Link></section>
    </aside></div>
  </main>
}
