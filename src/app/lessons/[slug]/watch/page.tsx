import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { supabaseAdmin } from '@/lib/supabase'
import { authorizeLesson } from '@/lib/lesson-access'
import VideoWatchView from '@/components/lessons/VideoWatchView'

export default async function WatchVideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) redirect('/api/auth/signin')
  const { slug } = await params
  const { data: row, error } = await supabaseAdmin.from('lessons').select('id').eq('slug', slug).maybeSingle()
  if (error) throw error
  if (!row) notFound()
  const context = await getEffectiveContext(session.user.email)
  const access = await authorizeLesson({ userId: session.user.id, email: session.user.email, realRole: context.realRole }, row.id, false, false, 'watch')
  if (!access.ok || !access.document) notFound()
  return <VideoWatchView title={access.lesson.title} document={access.document}/>
}
