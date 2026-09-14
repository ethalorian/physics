import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { canEditArea } from '@/lib/content-access'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ManageUnits from '@/components/admin/ManageUnits'
import LibraryNav from '@/components/admin/LibraryNav'
import type { CatalogLesson } from '@/lib/curriculum-readiness'

export default async function AdminManagePage() {
  const session = await auth(), email = session?.user?.email ?? ''
  if (!email) redirect('/home')
  const ec = await getEffectiveContext(email), isAdmin = ec.realRole === 'admin'
  if (!(await canEditArea(email, 'lessons', isAdmin))) redirect(ec.realRole === 'student' ? '/home' : '/admin/home')
  const [ur, lr] = await Promise.all([
    supabaseAdmin.from('units').select('id, name, program').order('order_index'),
    supabaseAdmin.from('lesson_catalog_summary').select('*').order('lesson_number'),
  ])
  if (ur.error) throw ur.error
  if (lr.error) throw lr.error
  const units = ur.data ?? [], lessons = (lr.data ?? []) as CatalogLesson[]
  const shape = (l: CatalogLesson) => ({ id: l.id, slug: l.slug, title: l.title, lessonNumber: l.lesson_number, published: l.published, blockCount: l.block_count, updatedAt: l.updated_at })
  const usage = new Map<string, number>()
  lessons.forEach(l => l.block_summary.forEach(b => usage.set(b.type, (usage.get(b.type) ?? 0) + 1)))
  return <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6"><LibraryNav active="lessons" admin={isAdmin} /><header><h1 className="text-2xl font-semibold">Lesson library</h1><p className="mt-2 text-sm text-muted-foreground">Find the lesson, prepare its content, and check coverage before releasing it to a class.</p></header><ManageUnits units={units.map(u => ({ ...u, lessons: lessons.filter(l => l.unit_id === u.id).map(shape) }))} orphans={lessons.filter(l => !units.some(u => u.id === l.unit_id)).map(shape)} canPublish={isAdmin} /><details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer font-medium">Authoring statistics</summary><p className="mb-3 text-sm">{lessons.length} lessons · {[...usage.values()].reduce((a,b) => a+b,0)} blocks</p><div className="flex flex-wrap gap-2">{[...usage.entries()].sort((a,b) => b[1]-a[1]).map(([type,n]) => <span key={type} className="rounded border px-2 py-1 text-xs">{type.replaceAll('_', ' ')} · {n}</span>)}</div></details></main>
}
