import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import TeacherDailyMathTask from '@/components/math-spine/TeacherDailyMathTask'
import ManageUnits, { type ManageUnit, type ManageLesson } from '@/components/admin/ManageUnits'

// Manage hub — the real application: author lessons as content blocks, per unit.
// (The launcher lives at /admin/home; this is where content gets built.)

type LessonRow = {
  id: string
  slug: string
  title: string
  unit: string | null
  lesson_number: number | null
  published: boolean
  content_blocks: { blocks?: unknown[] } | null
}
type UnitRow = { id: string; name: string; order_index: number }

function blockCount(l: LessonRow): number {
  return Array.isArray(l.content_blocks?.blocks) ? l.content_blocks!.blocks!.length : 0
}
function toManageLesson(l: LessonRow): ManageLesson {
  return { id: l.id, slug: l.slug, title: l.title, lessonNumber: l.lesson_number, published: l.published, blockCount: blockCount(l) }
}

export default async function AdminManagePage() {
  const session = await auth()
  const role = session?.user?.email ? getUserRole(session.user.email) : 'student'
  if (role !== 'admin' && role !== 'teacher') redirect('/home')

  const { data: unitRows } = await supabaseAdmin.from('units').select('id, name, order_index').order('order_index', { ascending: true })
  const units = (unitRows ?? []) as UnitRow[]

  const { data: lessonRows } = await supabaseAdmin
    .from('lessons')
    .select('id, slug, title, unit, lesson_number, published, content_blocks')
  const lessons = (lessonRows ?? []) as LessonRow[]
  lessons.sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0))

  const { count: studentCount } = await supabaseAdmin.from('students').select('*', { count: 'exact', head: true })

  const authored = lessons.filter((l) => blockCount(l) > 0).length
  const needBlocks = lessons.filter((l) => blockCount(l) === 0).length
  const draftCount = lessons.filter((l) => !l.published).length

  // Shape units (+ an "Other" bucket for orphan lessons) for the client list.
  const manageUnits: ManageUnit[] = units
    .map((u) => ({ id: u.id, name: u.name, lessons: lessons.filter((l) => l.unit === u.name).map(toManageLesson) }))
    .filter((u) => u.lessons.length > 0)
  const orphans: ManageLesson[] = lessons.filter((l) => !units.some((u) => u.name === l.unit)).map(toManageLesson)

  const tile = (value: number | string, label: string, accent: string) => (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )

  const allCaughtUp = needBlocks === 0 && draftCount === 0

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Author your curriculum lessons as content blocks, unit by unit.</p>
        </div>
        <Link href="/admin/home" className="text-sm font-semibold rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>← Command center</Link>
      </div>

      <div className="grid gap-3 my-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {tile(lessons.length, 'Lessons', 'var(--primary)')}
        {tile(authored, 'Authored as blocks', 'var(--success)')}
        {tile(needBlocks, 'Still need blocks', needBlocks > 0 ? 'var(--destructive)' : 'var(--muted-foreground)')}
        {tile(studentCount ?? 0, 'Enrolled students', 'var(--reward-foreground)')}
      </div>

      {/* NEEDS YOU NOW — one unified band of the day's actionable work, so the
          top of the page IS the to-do list. Units below are the library. */}
      <section className="rounded-2xl border mb-6" style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'color-mix(in oklch, var(--primary) 5%, var(--card))', overflow: 'hidden' }}>
        <div className="px-4 pt-3 pb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Needs you now
        </div>

        {/* daily math fluency rating */}
        <div className="px-4 pb-3">
          <TeacherDailyMathTask />
        </div>

        {/* authoring to-dos, only when there's something to do */}
        {(needBlocks > 0 || draftCount > 0) && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {needBlocks > 0 && (
              <span className="inline-flex items-center gap-2 text-sm rounded-xl px-3 py-2" style={{ background: 'color-mix(in oklch, var(--destructive) 12%, var(--card))', border: '1px solid color-mix(in oklch, var(--destructive) 35%, var(--border))', color: 'var(--foreground)' }}>
                <strong style={{ color: 'var(--destructive)' }}>{needBlocks}</strong> lesson{needBlocks === 1 ? '' : 's'} still need blocks — open the flagged unit below.
              </span>
            )}
            {draftCount > 0 && (
              <span className="inline-flex items-center gap-2 text-sm rounded-xl px-3 py-2" style={{ background: 'color-mix(in oklch, var(--reward) 18%, var(--card))', border: '1px solid color-mix(in oklch, var(--reward) 40%, var(--border))', color: 'var(--foreground)' }}>
                <strong style={{ color: 'var(--reward-foreground)' }}>{draftCount}</strong> draft{draftCount === 1 ? '' : 's'} not yet published.
              </span>
            )}
          </div>
        )}
        {allCaughtUp && (
          <div className="px-4 pb-4 text-sm" style={{ color: 'var(--success)' }}>
            ✓ Every lesson is authored and published — nothing waiting on the authoring side.
          </div>
        )}
      </section>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Your units</h2>
      </div>

      {lessons.length === 0
        ? <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No lessons yet.</p>
        : <ManageUnits units={manageUnits} orphans={orphans} />}
    </div>
  )
}
