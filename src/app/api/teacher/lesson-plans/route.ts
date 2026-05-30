import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import unit1Cpa from '@/data/unit1-cpa-lesson-plans.json'
import unit2Cpa from '@/data/unit2-cpa-lesson-plans.json'
import unit3Cpa from '@/data/unit3-cpa-lesson-plans.json'
import unit8Cpa from '@/data/unit8-cpa-lesson-plans.json'

// Teacher day-by-day lesson plans, READ-ONLY, scoped to the teacher's selected
// class type (curriculum track). Plans are versioned curriculum data in the
// repo (src/data/*-lesson-plans.json), served here by track + unit. Only the
// CPA Unit 1 plans exist today; other tracks/units return empty until authored.

interface DayPlan { day: number; title: string; bodyHtml: string }

// track → unit_id → day plans
const PLANS: Record<string, Record<string, DayPlan[]>> = {
  cpa: {
    'unit-1': unit1Cpa as DayPlan[],
    'unit-2': unit2Cpa as DayPlan[],
    'unit-3': unit3Cpa as DayPlan[],
    'unit-8': unit8Cpa as DayPlan[],
  },
}

export const GET = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const unitId = new URL(request.url).searchParams.get('unit_id') ?? 'unit-1'

    // Class types the teacher actually teaches = the distinct tracks across
    // their courses. Admins (no courses) see every available track.
    let tracks: string[]
    if (ctx.role === 'admin') {
      tracks = Object.keys(PLANS)
    } else {
      const { data } = await supabaseAdmin.from('courses').select('track').eq('teacher_email', ctx.scopeEmail)
      tracks = [...new Set(((data ?? []) as { track: string | null }[]).map((c) => c.track).filter((t): t is string => Boolean(t)))]
    }

    // Union the plans across the teacher's tracks (only CPA exists today).
    const seen = new Set<number>()
    const days: DayPlan[] = []
    for (const t of tracks) {
      for (const d of PLANS[t]?.[unitId] ?? []) {
        if (!seen.has(d.day)) { seen.add(d.day); days.push(d) }
      }
    }
    days.sort((a, b) => a.day - b.day)

    // Union the unit IDs that have authored plans across the teacher's tracks,
    // so the UI can render a unit picker without a second round trip.
    const unitSet = new Set<string>()
    for (const t of tracks) {
      for (const u of Object.keys(PLANS[t] ?? {})) unitSet.add(u)
    }
    const availableUnits = [...unitSet].sort((a, b) => {
      const na = Number(a.replace(/^unit-/, '')); const nb = Number(b.replace(/^unit-/, ''))
      return (Number.isFinite(na) && Number.isFinite(nb)) ? na - nb : a.localeCompare(b)
    })

    return NextResponse.json({ track: tracks[0] ?? null, tracks, unitId, days, availableUnits })
})
