import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { targetValue, MasteryRecord, Domain } from '@/data/curriculum-types'

// GET /api/home
// One call that feeds the student home hub: Continue (next/in-progress lesson +
// the current unit's journey), Retry (targets below mastery from teacher records),
// the mastery climb (date-stamped ratings), points/XP + streak, and a side-quest sim.
//
// Key join note: lessons.unit is a DISPLAY STRING that equals units.name; the
// stable key (units.id) is what learning_targets.unit_id uses. So we bridge
// lessons.unit -> units.name -> units.id -> learning_targets.unit_id.

type UnitRow = { id: string; name: string; order_index: number }
type LessonRow = { id: string; slug: string; title: string; unit: string; lesson_number: number }
type ProgressRow = { lesson_id: string; status: string | null; progress_percentage: number | null }
type TargetRow = { id: string; statement: string; domain: string; order_index: number }
type RecordRow = { target_id: string; level: number; observed_at: string }
type SimRow = { slug: string; title: string; unit: string | null }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const name = session.user.name ?? 'there'

    // --- Units (ordered) -----------------------------------------------------
    const { data: unitRowsRaw } = await supabaseAdmin
      .from('units')
      .select('id, name, order_index')
      .order('order_index', { ascending: true })
    const units = (unitRowsRaw ?? []) as UnitRow[]
    const unitIdByName = new Map<string, string>(units.map((u): [string, string] => [u.name, u.id]))
    const orderByName = new Map<string, number>(units.map((u): [string, number] => [u.name, u.order_index]))

    // --- Published lessons, ordered by unit then lesson_number ---------------
    const { data: lessonRowsRaw } = await supabaseAdmin
      .from('lessons')
      .select('id, slug, title, unit, lesson_number')
      .eq('published', true)
    const lessons = ((lessonRowsRaw ?? []) as LessonRow[]).slice()
    lessons.sort(
      (a, b) =>
        (orderByName.get(a.unit) ?? 99) - (orderByName.get(b.unit) ?? 99) ||
        (a.lesson_number ?? 0) - (b.lesson_number ?? 0),
    )

    // --- This student's lesson progress --------------------------------------
    const { data: progRowsRaw } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id, status, progress_percentage')
      .eq('user_id', userId)
    const progByLesson = new Map<string, ProgressRow>(
      ((progRowsRaw ?? []) as ProgressRow[]).map((p): [string, ProgressRow] => [p.lesson_id, p]),
    )
    const pctOf = (l: LessonRow): number => progByLesson.get(l.id)?.progress_percentage ?? 0
    const isDone = (l: LessonRow): boolean =>
      progByLesson.get(l.id)?.status === 'completed' || pctOf(l) >= 100

    // current = first started-but-unfinished, else first not-done, else last
    const current: LessonRow | null =
      lessons.find((l) => {
        const p = progByLesson.get(l.id)
        return !!p && p.status !== 'completed' && (p.progress_percentage ?? 0) > 0 && (p.progress_percentage ?? 0) < 100
      }) ||
      lessons.find((l) => !isDone(l)) ||
      lessons[lessons.length - 1] ||
      null

    const currentUnitName = current?.unit ?? units[0]?.name ?? null
    const currentUnitId = currentUnitName ? unitIdByName.get(currentUnitName) ?? null : null

    const seqLessons = lessons.filter((l) => l.unit === currentUnitName)
    const sequence = seqLessons.map((l) => ({
      lessonNumber: l.lesson_number,
      title: l.title,
      slug: l.slug,
      status: current && l.id === current.id ? 'current' : isDone(l) ? 'done' : 'todo',
    }))

    const continueData = current
      ? {
          unitId: currentUnitId,
          unitName: currentUnitName,
          lesson: {
            slug: current.slug,
            title: current.title,
            lessonNumber: current.lesson_number,
            progress: pctOf(current),
          },
          sequence,
          completed: seqLessons.filter(isDone).length,
          total: seqLessons.length,
        }
      : null

    // --- Retry + mastery climb (current unit) --------------------------------
    type RetryItem = { targetId: string; statement: string; domain: Domain; level: 1 | 2; lastObservedAt: string }
    type ClimbPoint = { observedAt: string; level: number; domain: Domain }
    const retry: RetryItem[] = []
    const climb: ClimbPoint[] = []

    if (currentUnitId) {
      const { data: targetRowsRaw } = await supabaseAdmin
        .from('learning_targets')
        .select('id, statement, domain, order_index')
        .eq('unit_id', currentUnitId)
        .order('order_index', { ascending: true })
      const targets = (targetRowsRaw ?? []) as TargetRow[]
      const targetIds = targets.map((t) => t.id)
      const domainByTarget = new Map<string, Domain>(targets.map((t): [string, Domain] => [t.id, t.domain as Domain]))

      let recs: RecordRow[] = []
      if (targetIds.length > 0) {
        const { data: recRowsRaw } = await supabaseAdmin
          .from('mastery_records')
          .select('target_id, level, observed_at')
          .eq('user_id', userId)
          .in('target_id', targetIds)
          .order('observed_at', { ascending: true })
        recs = (recRowsRaw ?? []) as RecordRow[]
      }

      const recsByTarget = new Map<string, MasteryRecord[]>()
      for (const r of recs) {
        const arr = recsByTarget.get(r.target_id) ?? []
        arr.push({ studentId: userId, targetId: r.target_id, level: r.level as 1 | 2 | 3, observedAt: r.observed_at })
        recsByTarget.set(r.target_id, arr)
      }

      for (const t of targets) {
        const trecs = recsByTarget.get(t.id)
        if (!trecs || trecs.length === 0) continue
        const v = targetValue(trecs)
        if (v !== null && v < 2.5) {
          retry.push({
            targetId: t.id,
            statement: t.statement,
            domain: t.domain as Domain,
            level: v < 1.5 ? 1 : 2,
            lastObservedAt: trecs[trecs.length - 1].observedAt,
          })
        }
      }

      for (const r of recs) {
        climb.push({ observedAt: r.observed_at, level: r.level, domain: domainByTarget.get(r.target_id) ?? 'knowledge' })
      }
    }

    // --- Points / XP ---------------------------------------------------------
    const bal = await getBalance(userId)

    // --- Streak: consecutive days of activity ending today or yesterday ------
    let streak = 0
    try {
      const { data: act } = await supabaseAdmin
        .from('student_activity')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(500)
      const iso = (dt: Date) => dt.toISOString().slice(0, 10)
      const days = new Set<string>(((act ?? []) as { created_at: string }[]).map((a) => iso(new Date(a.created_at))))
      const cursor = new Date()
      if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1)
      while (days.has(iso(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }
    } catch {
      streak = 0
    }

    // --- Side quest sim (match current unit, else any published) -------------
    const { data: simRowsRaw } = await supabaseAdmin
      .from('simulations')
      .select('slug, title, unit')
      .eq('published', true)
    const sims = (simRowsRaw ?? []) as SimRow[]
    const sim =
      sims.find((s) => s.unit && currentUnitName && s.unit === currentUnitName) || sims[0] || null
    const sideQuest = { sim: sim ? { slug: sim.slug, title: sim.title } : null }

    return NextResponse.json({
      student: { name },
      points: { xp: bal.lifetimeEarned, balance: bal.balance },
      streak: { current: streak },
      continue: continueData,
      retry,
      climb,
      sideQuest,
    })
  } catch (error) {
    console.error('Error in GET /api/home:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
