import { isCatalogUnit } from '@/lib/retired-curriculum'
import { currentLessonIds } from '@/lib/current-lesson-catalog-server'
import { supabaseAdmin } from '@/lib/supabase'
import TeacherLearningLibrary from '@/components/admin/TeacherLearningLibrary'
import { loadPhysicsLearningCatalog } from '@/lib/physics-learning-server'
import type { CatalogLesson } from '@/lib/curriculum-readiness'

export default async function LibraryLessonCatalog({ isAdmin, canEdit }: { isAdmin: boolean; canEdit: boolean }) {
  const [ur, lr, physics, currentIds] = await Promise.all([
    supabaseAdmin.from('units').select('id, name, program').order('order_index'),
    supabaseAdmin.from('lesson_catalog_summary').select('*').order('lesson_number'),
    loadPhysicsLearningCatalog(),
    currentLessonIds(),
  ])
  if (ur.error) throw ur.error
  if (lr.error) throw lr.error
  const units = (ur.data ?? []).filter(isCatalogUnit), lessons = ((lr.data ?? []) as CatalogLesson[]).filter(l => currentIds.has(l.id))
  const shape = (l: CatalogLesson) => ({ id: l.id, slug: l.slug, title: l.title, lessonNumber: l.lesson_number, published: l.published, blockCount: l.block_count, updatedAt: l.updated_at })
  const usage = new Map<string, number>()
  lessons.forEach(l => l.block_summary.forEach(b => usage.set(b.type, (usage.get(b.type) ?? 0) + 1)))
  return <div className="space-y-5"><TeacherLearningLibrary lessons={physics.lessons} units={units.map(u => ({ ...u, lessons: lessons.filter(l => l.unit_id === u.id).map(shape) }))} orphans={lessons.filter(l => !units.some(u => u.id === l.unit_id)).map(shape)} canPublish={isAdmin} canEdit={canEdit} />{canEdit && <details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer font-medium">Authoring statistics</summary><p className="mb-3 text-sm">{lessons.length} lessons · {[...usage.values()].reduce((a,b) => a+b,0)} blocks</p><div className="flex flex-wrap gap-2">{[...usage.entries()].sort((a,b) => b[1]-a[1]).map(([type,n]) => <span key={type} className="rounded border px-2 py-1 text-xs">{type.replaceAll('_', ' ')} · {n}</span>)}</div></details>}</div>
}
