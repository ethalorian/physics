import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Teacher onboarding status. Four setup steps gate a new teacher's dashboard:
//  - classroom  : connect Google Classroom + import a class (AUTO-derived from
//                 whether they own any course — no manual flag needed)
//  - curriculum : confirm the units they're teaching
//  - pacing     : set up their sections' calendar / schedule
//  - tour       : seen the quick tour of the core tools
// curriculum/pacing/tour are persisted flags in teacher_onboarding; the teacher
// (or a setup action) marks them done. The dashboard badges any incomplete step.

type Row = {
  classroom_done: boolean
  curriculum_done: boolean
  pacing_done: boolean
  tour_done: boolean
}
const STEP_KEYS = ['classroom', 'curriculum', 'pacing', 'tour'] as const
type StepKey = (typeof STEP_KEYS)[number]

export const GET = withAuth(async (_request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // classroom step is true if the teacher owns at least one course; the
    // curriculum step is DERIVED per-course: done only when they have courses
    // and every course has a class type assigned (an untyped course re-opens it).
    const { data: courseRows } = await supabaseAdmin
      .from('courses')
      .select('track')
      .eq('teacher_email', ctx.scopeEmail)
    const courses = (courseRows ?? []) as { track: string | null }[]
    const classCount = courses.length
    const untracked = courses.filter((c) => !c.track).length
    const classroomDone = classCount > 0
    const curriculumDone = classCount > 0 && untracked === 0

    const { data: rowRaw } = await supabaseAdmin
      .from('teacher_onboarding')
      .select('classroom_done, pacing_done, tour_done')
      .eq('teacher_email', ctx.scopeEmail)
      .maybeSingle()
    const row = (rowRaw ?? {}) as Partial<Row>

    const steps: Record<StepKey, boolean> = {
      classroom: classroomDone || Boolean(row.classroom_done),
      curriculum: curriculumDone,
      pacing: Boolean(row.pacing_done),
      tour: Boolean(row.tour_done),
    }
    const doneCount = STEP_KEYS.filter((k) => steps[k]).length

    return NextResponse.json({
      steps,
      doneCount,
      total: STEP_KEYS.length,
      complete: doneCount === STEP_KEYS.length,
      classCount,
      untracked,
    })
})

// POST { step, done? } — mark a setup step done (or undone). Used by setup
// actions / the "mark complete" controls on the dashboard.
export const POST = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const step = body.step as StepKey
    const done = body.done !== false
    // Optional: the chosen curriculum track (only 'cpa' is live; others are
    // reserved for Honors/AP/Project-Based classes Craig will add later).
    const track: string | null = step === 'curriculum' && typeof body.track === 'string' ? body.track : null
    if (!STEP_KEYS.includes(step)) return NextResponse.json({ error: 'Unknown step' }, { status: 400 })

    const { data: existing } = await supabaseAdmin
      .from('teacher_onboarding')
      .select('classroom_done, curriculum_done, pacing_done, tour_done')
      .eq('teacher_email', ctx.scopeEmail)
      .maybeSingle()
    const merged: Row = {
      classroom_done: Boolean((existing as Partial<Row> | null)?.classroom_done),
      curriculum_done: Boolean((existing as Partial<Row> | null)?.curriculum_done),
      pacing_done: Boolean((existing as Partial<Row> | null)?.pacing_done),
      tour_done: Boolean((existing as Partial<Row> | null)?.tour_done),
    }
    merged[`${step}_done` as keyof Row] = done

    const allDone = merged.classroom_done && merged.curriculum_done && merged.pacing_done && merged.tour_done
    const { error } = await supabaseAdmin
      .from('teacher_onboarding')
      .upsert(
        {
          teacher_email: ctx.scopeEmail,
          ...merged,
          ...(track ? { curriculum_track: track } : {}),
          completed_at: allDone ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'teacher_email' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
})
