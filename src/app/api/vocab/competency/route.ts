import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/vocab/competency?course_id=…&set_id=…
// The class × words grid for one assigned set: per student per word, accuracy over all
// attempts and the with-supports / without-supports split (from the vocab_competency view).
// Rows are the ACTIVE students of the class; columns are the set's terms in order.

export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const sp = new URL(request.url).searchParams
  const courseId = sp.get('course_id'), setId = sp.get('set_id')
  if (!courseId || !setId) return NextResponse.json({ error: 'course_id and set_id required' }, { status: 400 })
  const { data: course } = await supabaseAdmin.from('courses').select('id, teacher_email').eq('id', courseId).maybeSingle()
  if (!course || (ctx.role !== 'admin' && (course as { teacher_email: string | null }).teacher_email !== ctx.scopeEmail)) return NextResponse.json({ error: 'Not your class' }, { status: 403 })

  const { data: enrolls } = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', courseId).eq('enrollment_state', 'ACTIVE')
  const ids = ((enrolls ?? []) as { student_id: string }[]).map((e) => e.student_id)
  const [{ data: studs }, { data: terms }, { data: comp }, { data: profiles }] = await Promise.all([
    ids.length ? supabaseAdmin.from('students').select('id, name, alias').in('id', ids) : Promise.resolve({ data: [] }),
    supabaseAdmin.from('vocabulary_terms').select('id, term, tier, icon, cognate, order_index').eq('vocabulary_set_id', setId).order('tier').order('order_index'),
    ids.length ? supabaseAdmin.from('vocab_competency').select('*').eq('vocabulary_set_id', setId).in('user_id', ids) : Promise.resolve({ data: [] }),
    ids.length ? supabaseAdmin.from('language_profile').select('user_id, wida, home_lang').in('user_id', ids) : Promise.resolve({ data: [] }),
  ])
  type Comp = { user_id: string; term_id: string; attempts: number; correct: number; accuracy: number; attempts_supported: number; correct_supported: number; attempts_bare: number; correct_bare: number; last_at: string }
  const cells: Record<string, Record<string, Comp>> = {}
  for (const c of (comp ?? []) as Comp[]) { (cells[c.user_id] ??= {})[c.term_id] = c }
  const profBy = new Map(((profiles ?? []) as { user_id: string; wida: number | null; home_lang: string | null }[]).map((p) => [p.user_id, p]))
  const students = ((studs ?? []) as { id: string; name: string | null; alias: string | null }[])
    .map((s) => ({ id: s.id, name: s.name ?? s.alias ?? 'Student', wida: profBy.get(s.id)?.wida ?? null, homeLang: profBy.get(s.id)?.home_lang ?? null, cells: cells[s.id] ?? {} }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json({ terms: terms ?? [], students })
})
