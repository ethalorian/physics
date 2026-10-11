import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { redirect } from 'next/navigation'

export default async function ResourcesPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/signin?callbackUrl=/admin/resources')
  const { role } = await getEffectiveContext(session.user.email)
  if (!['admin', 'teacher', 'observer'].includes(role)) redirect('/home')
  const observer = role === 'observer'
  const resources = [
    ['/textbook', 'Textbook', 'Read chapters and explanations.'],
    ...(observer ? [
      ['/lessons', 'Video lessons & concept map', 'Watch published video lessons and explore connected ideas.'],
    ] : [
      ['/admin/simulations/activities', 'Guided investigations', 'Prepare target-linked simulation activities and set class access.'],
      ['/vocabulary', 'Vocabulary', 'Find words and practice resources.'],
    ]),
    ['/simulations', 'Optional exploration', 'Explore interactive physics models.'],
    ['/admin/teacher/plans', 'Teacher plans', 'Browse teaching plans by unit.'],
  ]
  return <main className="mx-auto max-w-5xl space-y-5 p-6">
    <h1 className="text-2xl font-semibold">Resources</h1>
    <p>{observer ? 'Browse classroom resources with read-only observer access.' : 'Supporting materials for planning and teaching. Lesson-specific activities and materials are in Prepare.'}</p>
    <div className="grid gap-4 sm:grid-cols-2">{resources.map(([href, title, description]) => <Link key={href} className="rounded-xl border bg-card p-5" href={href}><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></Link>)}</div>
  </main>
}
