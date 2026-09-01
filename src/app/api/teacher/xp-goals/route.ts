import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Teacher-scoped daily XP goal settings. Always keyed by ctx.scopeEmail — the
// signed-in teacher's own config. Admin edits ADMIN'S OWN goals here, not a
// global value; every teacher owns theirs.

export const GET = withAuth(async (_req, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const [{ data: goals }, { data: days }] = await Promise.all([
    supabaseAdmin.from('teacher_xp_goals').select('school_day_goal, special_day_goal, special_day_bonus').eq('teacher_email', ctx.scopeEmail).maybeSingle(),
    supabaseAdmin.from('teacher_special_days').select('id, label, start_date, end_date').eq('teacher_email', ctx.scopeEmail).order('start_date'),
  ])
  return NextResponse.json({
    goals: goals ?? { school_day_goal: 30, special_day_goal: 20, special_day_bonus: 15 },
    configured: !!goals,
    specialDays: days ?? [],
  })
})

// PUT { goals?: {school_day_goal, special_day_goal, special_day_bonus},
//       addSpecialDay?: {label, start_date, end_date},
//       removeSpecialDayId?: uuid }
export const PUT = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()

  if (body.goals) {
    const g = body.goals
    const ints = [g.school_day_goal, g.special_day_goal, g.special_day_bonus]
    if (ints.some((v) => !Number.isInteger(v) || v < 0 || v > 500)) {
      return NextResponse.json({ error: 'Goal values must be whole numbers between 0 and 500' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('teacher_xp_goals').upsert({
      teacher_email: ctx.scopeEmail,
      school_day_goal: g.school_day_goal,
      special_day_goal: g.special_day_goal,
      special_day_bonus: g.special_day_bonus,
      updated_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.addSpecialDay) {
    const d = body.addSpecialDay
    if (!d.label || !/^\d{4}-\d{2}-\d{2}$/.test(d.start_date ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(d.end_date ?? '') || d.end_date < d.start_date) {
      return NextResponse.json({ error: 'Special day needs a label and a valid date range' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('teacher_special_days').insert({
      teacher_email: ctx.scopeEmail, label: d.label, start_date: d.start_date, end_date: d.end_date,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.removeSpecialDayId) {
    // Scoped delete: only your own rows.
    const { error } = await supabaseAdmin.from('teacher_special_days')
      .delete().eq('id', body.removeSpecialDayId).eq('teacher_email', ctx.scopeEmail)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
