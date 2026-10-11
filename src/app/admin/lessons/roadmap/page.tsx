import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { canEditArea } from '@/lib/content-access'
import { loadPhysicsLearningCatalog } from '@/lib/physics-learning-server'
import { PHYSICS_GROUPS, replacedPhysicsLessons } from '@/lib/physics-learning'
import { PHYSICS_VIDEOS, UPCOMING_PHYSICS_VIDEOS, conceptTitle, videosForTarget } from '@/lib/video-instruction'

export default async function LearningRoadmapPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/signin')
  const context = await getEffectiveContext(session.user.email)
  if (!['teacher', 'admin'].includes(context.realRole) && !await canEditArea(session.user.email, 'lessons', false)) redirect('/home')
  const { units, lessons, targets } = await loadPhysicsLearningCatalog()
  const replaced = replacedPhysicsLessons(lessons.map(l => ({ published: l.published, replaces: l.learning?.replaces })))
  const current = lessons.filter(l => !replaced.has(l.id))
  const rows = targets.map(target => ({
    target,
    lessons: current.filter(l => l.learning?.targets.some(t => t.slug === target.slug)),
    videos: videosForTarget(target.slug),
    planned: UPCOMING_PHYSICS_VIDEOS.filter(video => video.targets.some(link => link.slug === target.slug)),
  }))
  const recordedIds = new Set(PHYSICS_VIDEOS.map(video => video.youtubeId))
  const videoLessons = current.filter(l => l.published && l.learning?.videoIds.some(id => recordedIds.has(id)))
  const needsVideo = rows.filter(row => !row.videos.some(({ link }) => link.relationship === 'teaches'))
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header><Link href="/admin/dashboard" className="inline-flex min-h-11 items-center text-primary underline">← Lesson library</Link><h1 className="mt-3 text-3xl font-semibold">Video instruction & target map</h1><p className="mt-3 max-w-3xl text-muted-foreground">Plan instruction by concept and learning target. Each video names the part it teaches or prepares students for. A linked video does not establish full target coverage or student mastery.</p></header>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4"><strong className="block text-2xl">{PHYSICS_VIDEOS.length}</strong>reviewed channel videos</div>
      <div className="rounded-xl border bg-card p-4"><strong className="block text-2xl">{videoLessons.length}</strong>published lessons using these videos</div>
      <div className="rounded-xl border bg-card p-4"><strong className="block text-2xl">{needsVideo.length}</strong>targets without direct video instruction</div>
    </div>
    <p className="text-sm text-muted-foreground">The suggested sequence is available in the video library. Practice, investigations, and teacher feedback complete the learning path. Publishing a lesson and opening it for a class are separate steps.</p>
    {units.map(unit => <section key={unit.id}><h2 className="mb-4 text-xl font-semibold">{PHYSICS_GROUPS[unit.id] ?? unit.name}</h2><div className="space-y-3">
      {rows.filter(row => row.target.unit_id === unit.id).map(({ target, lessons: linked, videos, planned }) => <article key={target.id} className="grid gap-4 rounded-xl border bg-card p-5 lg:grid-cols-2">
        <div><p className="text-xs font-medium text-primary">{videos.some(({ link }) => link.relationship === 'teaches') ? 'Direct instruction linked · check the scope below' : videos.length ? 'Preparation available · direct instruction gap' : 'No reviewed video linked yet'}</p><h3 className="mt-2 font-semibold">{target.statement}</h3>
          <div className="mt-3 space-y-3">{videos.map(({ video, link }) => <div key={video.youtubeId} className="text-sm"><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/admin/dashboard?view=videos&video=${video.youtubeId}`}>Video {video.sequence} · {video.title}</Link><p className="text-muted-foreground">{link.relationship === 'teaches' ? 'Teaches part of this target' : 'Preparation only'}: {link.scope}</p></div>)}
            {planned.map(video => <p key={video.sequence} className="text-sm text-muted-foreground">In preparation: {video.title}. Published link pending; this is not counted as available instruction.</p>)}
          </div>
        </div>
        <div className="space-y-3 text-sm"><h4 className="font-semibold">Practice & lesson content</h4>{linked.map(lesson => <div key={lesson.id}><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/admin/lessons/${lesson.id}`}>{conceptTitle(lesson.title)}</Link><p className="text-xs text-muted-foreground">{lesson.published ? 'Published' : 'Draft'} · {lesson.learning?.kind === 'mission' ? 'Asteroid mission' : lesson.learning?.kind === 'investigation' ? 'Investigation' : 'Concept lesson'}{lesson.learning?.readings.length ? ' · Textbook support' : ''}</p></div>)}{!linked.length && <p className="text-muted-foreground">No lesson content is linked yet.</p>}</div>
      </article>)}
    </div></section>)}
  </main>
}
