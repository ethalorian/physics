import RevisionCycle from '@/components/review-desk/RevisionCycle'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { authorizeLesson, lessonForReader } from '@/lib/lesson-access'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import TradeLessonShell from '@/components/lessons/TradeLessonShell'
import BlockLessonViewer from '@/components/lessons/BlockLessonViewer'
import LessonActivityTracker from '@/components/lessons/LessonActivityTracker'
import { videoWatchHref } from '@/lib/video-watch'

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) redirect('/api/auth/signin')
  const { slug } = await params
  const { data: row } = await supabaseAdmin.from('lessons').select('id').eq('slug', slug).maybeSingle()
  if (!row) notFound()
  const context = await getEffectiveContext(session.user.email)
  const access = await authorizeLesson({ userId: session.user.id, email: session.user.email, realRole: context.realRole }, row.id)
  if (!access.ok) {
    if (access.response.status === 404) notFound()
    const watch = await authorizeLesson({ userId: session.user.id, email: session.user.email, realRole: context.realRole }, row.id, false, false, 'watch')
    if (watch.ok) redirect(videoWatchHref(slug))
    return <div className="mx-auto max-w-md p-8"><h1 className="text-xl font-semibold">This lesson is unavailable</h1><p>Your class must be enrolled and have an open lesson window.</p><Link href="/home">Back to home</Link></div>
  }
  const lesson = lessonForReader(access.lesson, access.document)
  const LessonReader = lesson.content_blocks?.blocks.some(b=>b.vocational) ? TradeLessonShell : BlockLessonViewer
  const reader = <>{context.realRole==='student'&&<RevisionCycle sourceKey={'lesson:'+lesson.id}/>}<LessonReader lesson={lesson} staffView={access.viewer.role === 'admin'} previewReturnHref={context.realRole === 'observer' ? '/lessons' : undefined} /></>
  return access.viewer.role === 'admin' ? reader : <LessonActivityTracker lessonId={lesson.id}>{reader}</LessonActivityTracker>
}
