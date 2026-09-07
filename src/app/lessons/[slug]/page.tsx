import { isLessonVisible, type Viewer } from '@/lib/track-visibility'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { authorizeLesson, lessonForReader } from '@/lib/lesson-access'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { getStudentLessonGate } from '@/lib/lesson-windows'
import BlockLessonViewer from '@/components/lessons/BlockLessonViewer'
import LessonActivityTracker from '@/components/lessons/LessonActivityTracker'

type SiblingRow = { id: string; slug: string; title: string; lesson_number: number; visibility_track?: string | null }

// Prev/next within the same unit (by lesson_number) for the lesson footer nav.
async function getNav(unit: string | null | undefined, currentSlug: string, gate: (id: string) => boolean, viewer: Viewer) {
  if (!unit) return { prev: null, next: null }
  const { data } = await supabaseAdmin
    .from('lessons')
    .select('id, slug, title, lesson_number, visibility_track')
    .eq('unit_id', unit)
    .eq('published', true)
    .order('lesson_number', { ascending: true })
  const list = ((data ?? []) as SiblingRow[]).filter((l) => gate(l.id) && isLessonVisible(l.visibility_track, viewer))
  const i = list.findIndex((l) => l.slug === currentSlug)
  return {
    prev: i > 0 ? { slug: list[i - 1].slug, title: list[i - 1].title } : null,
    next: i >= 0 && i < list.length - 1 ? { slug: list[i + 1].slug, title: list[i + 1].title } : null,
  }
}

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
    return <div className="mx-auto max-w-md p-8"><h1 className="text-xl font-semibold">This lesson is unavailable</h1><p>Your class must be enrolled and have an open lesson window.</p><Link href="/home">Back to home</Link></div>
  }
  const gate = access.viewer.role === 'admin' ? () => true : await getStudentLessonGate(session.user.id)
  const nav = await getNav(access.lesson.unit_id, slug, gate, access.viewer)
  const lesson = lessonForReader(access.lesson, access.document)
  const reader = <BlockLessonViewer lesson={lesson} nav={nav} staffView={access.viewer.role === 'admin'} />
  return access.viewer.role === 'admin' ? reader : <LessonActivityTracker lessonId={lesson.id}>{reader}</LessonActivityTracker>
}
