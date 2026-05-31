import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import TeacherDailyMathTask from '@/components/math-spine/TeacherDailyMathTask'

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
  const lessonsByUnit = (unitName: string) => lessons.filter((l) => l.unit === unitName)
  const orphanLessons = lessons.filter((l) => !units.some((u) => u.name === l.unit))

  const tile = (value: number | string, label: string, accent: string) => (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )

  const lessonRow = (l: LessonRow) => {
    const n = blockCount(l)
    return (
      <div key={l.id} className="flex items-center gap-3 flex-wrap py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex-1 min-w-[12rem]">
          <div className="text-sm font-medium">{l.lesson_number ? `${l.lesson_number}. ` : ''}{l.title}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {n > 0
              ? <span style={{ color: 'var(--success)' }}>{n} block{n === 1 ? '' : 's'} authored</span>
              : <span style={{ color: 'var(--destructive)' }}>Needs blocks</span>}
            {!l.published && <span> · draft</span>}
          </div>
        </div>
        <Link href={`/admin/lessons/${l.id}/build`} className="text-xs font-semibold rounded-lg px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Build blocks</Link>
        <Link href={`/lessons/${l.slug}`} target="_blank" className="text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Preview</Link>
        <Link href={`/admin/lessons/${l.id}/edit`} className="text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Settings</Link>
      </div>
    )
  }

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
        {tile(lessons.length - authored, 'Still need blocks', 'var(--destructive)')}
        {tile(studentCount ?? 0, 'Enrolled students', 'var(--reward-foreground)')}
      </div>

      <div className="mb-5">
        <TeacherDailyMathTask />
      </div>

      {units.map((u) => {
        const us = lessonsByUnit(u.name)
        if (us.length === 0) return null
        return (
          <div key={u.id} className="rounded-2xl border p-4 mb-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-sm font-bold mb-1">{u.name}</div>
            {us.map(lessonRow)}
          </div>
        )
      })}

      {orphanLessons.length > 0 && (
        <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="text-sm font-bold mb-1">Other lessons</div>
          {orphanLessons.map(lessonRow)}
        </div>
      )}

      {lessons.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No lessons yet.</p>}
    </div>
  )
}
