import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { decayingAverage } from '@/data/curriculum-types'

// GET /api/mastery/lesson-comparison?target_id=...&user_id=...
// Quick drawer analytic: this student's mastery on the clicked target's LESSON
// vs. the class (all students), using the SAME decaying-average rollup the grid
// uses (one metric, one meaning). A student's lesson value = mean of their
// per-target decaying averages across that lesson's targets.

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'teacher'].includes(getUserRole(session.user.email))) {
      return NextResponse.json({ error: 'Teachers only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('target_id')
    const userId = searchParams.get('user_id')
    if (!targetId || !userId) return NextResponse.json({ error: 'Missing target_id or user_id' }, { status: 400 })

    // target → its lesson → the lesson's full set of targets
    const { data: tRow } = await supabaseAdmin.from('learning_targets').select('lesson_id').eq('id', targetId).maybeSingle()
    const lessonId = tRow?.lesson_id as string | null | undefined
    if (!lessonId) return NextResponse.json({ lessonId: null, lessonTitle: null, studentAvg: null, globalAvg: null, nStudents: 0 })

    const { data: lessonTargets } = await supabaseAdmin.from('learning_targets').select('id').eq('lesson_id', lessonId)
    const targetIds = (lessonTargets ?? []).map((t) => t.id as string)
    let lessonTitle: string | null = null
    const { data: lessonRow } = await supabaseAdmin.from('lessons').select('title').eq('id', lessonId).maybeSingle()
    lessonTitle = (lessonRow?.title as string) ?? null
    if (targetIds.length === 0) return NextResponse.json({ lessonId, lessonTitle, studentAvg: null, globalAvg: null, nStudents: 0 })

    // all observations for the lesson's targets, oldest → newest (so per-pair arrays are chronological)
    const { data: recs } = await supabaseAdmin
      .from('mastery_records')
      .select('user_id, target_id, level, observed_at')
      .in('target_id', targetIds)
      .order('observed_at', { ascending: true })

    // group levels by user → target
    const byUser = new Map<string, Map<string, number[]>>()
    for (const r of recs ?? []) {
      const uid = r.user_id as string
      const tid = r.target_id as string
      if (!byUser.has(uid)) byUser.set(uid, new Map())
      const tmap = byUser.get(uid)!
      if (!tmap.has(tid)) tmap.set(tid, [])
      tmap.get(tid)!.push(Number(r.level))
    }

    // each student's lesson value = mean of their per-target decaying averages
    const lessonValue = (tmap: Map<string, number[]>): number | null => {
      const vals: number[] = []
      for (const levels of tmap.values()) {
        const v = decayingAverage(levels)
        if (v !== null) vals.push(v)
      }
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }

    const studentAvg = byUser.has(userId) ? lessonValue(byUser.get(userId)!) : null
    const allValues: number[] = []
    for (const tmap of byUser.values()) {
      const v = lessonValue(tmap)
      if (v !== null) allValues.push(v)
    }
    const globalAvg = allValues.length ? allValues.reduce((a, b) => a + b, 0) / allValues.length : null

    return NextResponse.json({
      lessonId,
      lessonTitle,
      studentAvg: studentAvg === null ? null : Math.round(studentAvg * 100) / 100,
      globalAvg: globalAvg === null ? null : Math.round(globalAvg * 100) / 100,
      nStudents: allValues.length,
    })
  } catch (err) {
    console.error('Error in GET /api/mastery/lesson-comparison:', err)
    return NextResponse.json({ error: 'Could not compute comparison' }, { status: 500 })
  }
}
