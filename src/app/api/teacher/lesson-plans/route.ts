import { NextResponse } from 'next/server'
import { canEditArea } from '@/lib/content-access'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { PLANS, trackForCourse, type DayPlan } from '@/lib/lesson-plan-export'
import { planAlignment, planFingerprint, lessonPlanRevision, type PlanLink } from '@/lib/lesson-plan-alignment'
import { honorsDaysFor } from '@/lib/honors-extension-export'

// Teacher day-by-day lesson plans, READ-ONLY, scoped to the class types the
// teacher teaches. Plans are versioned curriculum data in the repo
// (src/data/*-lesson-plans.json), keyed by CLASS TYPE + unit: 'cpa' / 'honors'
// are physics tracks; 'trades' is the Trades Physics program (one plan per
// SESSION, 15 per unit); 'projects' is Project Physics — the MVP CPA section —
// where a unit is a mission phase and a plan is either a WEEK OVERVIEW
// (day = week*10) or a day inside that week (day = week*10 + n).
//
// PLANS itself lives in @/lib/lesson-plan-export so the reader, the .docx and
// the print view can never disagree about what a unit contains.

export const GET = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher' && ctx.role !== 'observer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const unitId = new URL(request.url).searchParams.get('unit_id') ?? 'unit-1'

    // Class types the teacher actually teaches = the distinct tracks across
    // their physics courses, plus 'trades' if any course follows that program.
    // Admins (no courses) see every available class type.
    let tracks: string[]
    const courseId = new URL(request.url).searchParams.get('course_id')
    if (courseId) {
      const { data: course, error } = await supabaseAdmin.from('courses').select('track, program, teacher_email').eq('id', courseId).maybeSingle()
      if (error) throw error
      if (!course) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      if (ctx.role === 'teacher' && course.teacher_email !== ctx.scopeEmail) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const track = trackForCourse(course)
      tracks = track ? [track] : []
    } else if (ctx.role === 'admin' || ctx.role === 'observer') {
      tracks = Object.keys(PLANS)
    } else {
      const { data, error } = await supabaseAdmin.from('courses').select('track, program').eq('teacher_email', ctx.scopeEmail)
      if (error) throw error
      const rows = (data ?? []) as { track: string | null; program: string | null }[]
      tracks = [...new Set(rows.map(trackForCourse).filter((t): t is string => Boolean(t)))]
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
    // Sort by prefix first (unit- / trades- / proj-), then numerically inside it,
    // so an admin seeing every track gets contiguous groups rather than 'proj-1,
    // trades-1, unit-1, unit-2…' interleaved.
    const split = (u: string) => { const m = /^(.*?)-(\d+)$/.exec(u); return m ? [m[1], Number(m[2])] as const : [u, 0] as const }
    const availableUnits = [...unitSet].sort((a, b) => {
      const [pa, na] = split(a); const [pb, nb] = split(b)
      return pa === pb ? na - nb : pa.localeCompare(pb)
    })

    const [lr, ar] = await Promise.all([supabaseAdmin.from('lesson_catalog_summary').select('id,title,unit_id,lesson_number,published,estimated_time,content_fingerprint').eq('unit_id',unitId),supabaseAdmin.from('lesson_plan_links').select('*').eq('unit_id',unitId)])
    if(lr.error)throw lr.error; if(ar.error)throw ar.error
    const linkedDays=days.map(day=>{const matches=(lr.data??[]).filter(l=>l.lesson_number===day.day);const lesson=matches.length===1?matches[0]:null;return {...day,kind:day.kind??'daily',plan_fingerprint:planFingerprint(day),lesson:lesson?{...lesson,revision:lessonPlanRevision(lesson)}:null,alignment:lesson?planAlignment(lesson,ar.data as PlanLink[]):{status:'missing',message:matches.length?'Several lessons share this day. Choose the intended lesson.':'No student lesson matches this plan.'}}})
    const canConfirm=ctx.role!=='observer' && await canEditArea(ctx.email,'lessons',ctx.realRole==='admin')
    return NextResponse.json({ canConfirm, track: tracks[0] ?? null, tracks, unitId, days: linkedDays, availableUnits, honorsDays: honorsDaysFor(unitId) })
})
