import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'

// GET /api/vocab/sources — units and lessons that have any vocab terms,
// for the arcade's "pick a unit or lesson" play selector.

type SetRow = { id: string; lesson_id: string | null; unit_id: string | null }

export const GET = withAuth(async (_request, ctx) => {
    // sets that actually have terms
    const { data: termRows } = await supabaseAdmin.from('vocabulary_terms').select('vocabulary_set_id')
    const setIdsWithTerms = [...new Set(((termRows ?? []) as { vocabulary_set_id: string }[]).map((r) => r.vocabulary_set_id))]
    if (setIdsWithTerms.length === 0) return NextResponse.json({ units: [], lessons: [] })

    // Only PUBLISHED sets surface in the arcade picker. Draft sets (half-built
    // vocab a teacher hasn't marked game-ready) stay hidden here.
    const { data: setRows } = await supabaseAdmin.from('vocabulary_sets').select('id, lesson_id, unit_id').eq('published', true).in('id', setIdsWithTerms)
    const sets = (setRows ?? []) as SetRow[]
    const lessonIds = [...new Set(sets.map((s) => s.lesson_id).filter((x): x is string => Boolean(x)))]
    const unitIds = [...new Set(sets.map((s) => s.unit_id).filter((x): x is string => Boolean(x)))]

    const [{ data: lessonRows }, { data: unitRows }] = await Promise.all([
      lessonIds.length ? supabaseAdmin.from('lessons').select('id, title, unit, lesson_number').in('id', lessonIds) : Promise.resolve({ data: [] }),
      unitIds.length ? supabaseAdmin.from('units').select('id, name, order_index').in('id', unitIds) : Promise.resolve({ data: [] }),
    ])

    const lessons = ((lessonRows ?? []) as { id: string; title: string | null; unit: string | null; lesson_number: number | null }[])
      .map((l) => ({ id: l.id, title: l.title ?? 'Lesson', unit: l.unit ?? '', lessonNumber: l.lesson_number ?? 0 }))
      .sort((a, b) => a.unit.localeCompare(b.unit) || a.lessonNumber - b.lessonNumber)
    const units = ((unitRows ?? []) as { id: string; name: string; order_index: number }[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((u) => ({ id: u.id, name: u.name }))

    // Assigned sets for this student's classes come first in the arcade (the teacher's
    // "play these words this week"). Staff see none — they pick freely.
    let assigned: { setId: string; lessonId: string | null; unitId: string | null; dueOn: string | null; label: string }[] = []
    if (ctx.realRole === 'student') {
      const { data: cs } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id', ctx.userId)
      const courseIds = ((cs ?? []) as { course_id: string }[]).map((c) => c.course_id)
      if (courseIds.length) {
        const { data: asg } = await supabaseAdmin.from('vocab_assignments').select('vocabulary_set_id, due_on, created_at').in('course_id', courseIds).eq('active', true).order('created_at', { ascending: false })
        const setBy = new Map(sets.map((s) => [s.id, s]))
        const lessonBy = new Map(lessons.map((l) => [l.id, l]))
        assigned = ((asg ?? []) as { vocabulary_set_id: string; due_on: string | null }[])
          .map((a) => { const st = setBy.get(a.vocabulary_set_id); if (!st) return null
            const l = st.lesson_id ? lessonBy.get(st.lesson_id) : undefined
            return { setId: st.id, lessonId: st.lesson_id, unitId: st.unit_id, dueOn: a.due_on, label: l?.title ?? 'Assigned words' } })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
      }
    }

    return NextResponse.json({ units, lessons, assigned })
})
