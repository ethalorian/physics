import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import unit1Cpa from '@/data/unit1-cpa-lesson-plans.json'

// Teacher day-by-day lesson plans, READ-ONLY, scoped to the teacher's selected
// class type (curriculum track). Plans are versioned curriculum data in the
// repo (src/data/*-lesson-plans.json), served here by track + unit. Only the
// CPA Unit 1 plans exist today; other tracks/units return empty until authored.

interface DayPlan { day: number; title: string; bodyHtml: string }

// track → unit_id → day plans
const PLANS: Record<string, Record<string, DayPlan[]>> = {
  cpa: { 'unit-1': unit1Cpa as DayPlan[] },
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const unitId = new URL(request.url).searchParams.get('unit_id') ?? 'unit-1'

    // The teacher's chosen class type (from onboarding); default to CPA.
    const { data: row } = await supabaseAdmin
      .from('teacher_onboarding')
      .select('curriculum_track')
      .eq('teacher_email', ctx.scopeEmail)
      .maybeSingle()
    const track = (row as { curriculum_track?: string | null } | null)?.curriculum_track || 'cpa'

    const days = PLANS[track]?.[unitId] ?? []
    return NextResponse.json({ track, unitId, days })
  } catch (error) {
    console.error('Error in GET /api/teacher/lesson-plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
