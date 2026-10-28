import { isLessonVisible } from '@/lib/track-visibility'
import { PHYSICS_VIDEOS } from '@/data/physics-videos'
import { getLessonCompletions } from '@/lib/lesson-completion-server'
import { LESSON_COMPLETION_LABELS } from '@/lib/lesson-completion'
import type { StudentAssignment } from '@/lib/student-dashboard'
import { getStudentTrack } from '@/lib/student-enrollment'
import type { BlockDocument } from '@/data/content-blocks'
import { isCatalogUnit } from '@/lib/retired-curriculum'
import { CURRENT_LESSON_FIELDS, CURRENT_PHYSICS_LESSON_FILTER, isCurrentLesson } from '@/lib/current-lesson-catalog'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { getStudentLessonWindowStatuses } from '@/lib/lesson-windows'
import { getStudentProgram } from '@/lib/program'
import { targetValue, MasteryRecord, Domain } from '@/data/curriculum-types'

// GET /api/home
// One call that feeds the student home hub: Continue (next/in-progress lesson +
// the current unit's journey), Retry (targets below mastery from teacher records),
// the mastery climb (date-stamped ratings), points/XP + streak.
//
// Key join note: lessons.unit is a DISPLAY STRING that equals units.name; the
// stable key (units.id) is what learning_targets.unit_id uses. So we bridge
// lessons.unit -> units.name -> units.id -> learning_targets.unit_id.

type UnitRow = { id: string; name: string; order_index: number }
type LessonRow = { id: string; slug: string; title: string; unit: string; lesson_number: number; content_blocks?: BlockDocument | null; visibility_track?: string | null }
type ProgressRow = { lesson_id: string; status: string | null; progress_percentage: number | null }
type TargetRow = { id: string; statement: string; domain: string; order_index: number }
type RecordRow = { target_id: string; level: number; observed_at: string }

export const GET = withAuth(async (request, ctx) => {
    const userId = ctx.userId
    const name = ctx.session.user.name ?? 'there'

    // --- Program (physics | trades) — decides which units/lessons exist for this student
    // Start independent reads together. Window statuses also supply the access
    // gate, so the same enrollments/windows are not fetched a second time.
    const [program, track, windows, bal, activity, progress] = await Promise.all([
      getStudentProgram(userId),
      getStudentTrack(userId),
      getStudentLessonWindowStatuses(userId),
      getBalance(userId),
      supabaseAdmin.from('student_activity').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
      supabaseAdmin.from('lesson_progress').select('lesson_id, status, progress_percentage').eq('user_id', userId),
    ])
    if (activity.error) throw activity.error
    if (progress.error) throw progress.error
    const openIds = Object.keys(windows).filter(id => windows[id].state === 'open')

    // --- Units (ordered) -----------------------------------------------------
    const { data: unitRowsRaw } = await supabaseAdmin
      .from('units')
      .select('id, name, order_index')
      .eq('program', program)
      .order('order_index', { ascending: true })
    const units = ((unitRowsRaw ?? []) as UnitRow[]).filter(isCatalogUnit)
    const unitIdByName = new Map<string, string>(units.map((u): [string, string] => [u.name, u.id]))
    const orderByName = new Map<string, number>(units.map((u): [string, number] => [u.name, u.order_index]))

    // --- Published lessons, ordered by unit then lesson_number ---------------
    let lessonRowsRaw: LessonRow[] = []
    if (openIds.length && units.length) {
      let query = supabaseAdmin.from('lessons')
        .select(`id,slug,title,unit,lesson_number,content_blocks,visibility_track,${CURRENT_LESSON_FIELDS}`)
        .eq('published', true).in('unit_id', units.map(u => u.id)).in('id', openIds)
      if (program === 'physics') query = query.or(CURRENT_PHYSICS_LESSON_FILTER)
      const result = await query
      if (result.error) throw result.error
      lessonRowsRaw = result.data ?? []
    }
    const lessons = lessonRowsRaw.filter(l => isCurrentLesson({ ...l, program }) && isLessonVisible(l.visibility_track, { role: 'student', track }))
    lessons.sort(
      (a, b) =>
        (orderByName.get(a.unit) ?? 99) - (orderByName.get(b.unit) ?? 99) ||
        (a.lesson_number ?? 0) - (b.lesson_number ?? 0),
    )

    // --- This student's lesson progress --------------------------------------
    const progRowsRaw = progress.data
    const progByLesson = new Map<string, ProgressRow>(
      ((progRowsRaw ?? []) as ProgressRow[]).map((p): [string, ProgressRow] => [p.lesson_id, p]),
    )
    const completion = await getLessonCompletions(userId,lessons,track)
    for (const [id,state] of Object.entries(completion)) progByLesson.set(id,{lesson_id:id,status:state.progress===100?'completed':'in_progress',progress_percentage:state.progress})
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
            completion: completion[current.id],
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

    const homework = lessons.flatMap(lesson => {
      const video = PHYSICS_VIDEOS.find(v => lesson.content_blocks?.blocks?.some(b => b.type === 'instruction_video' && b.youtubeId === v.youtubeId))
      return video ? [{ id:lesson.id, slug:lesson.slug, title:lesson.title, sequence:video.sequence, due_at:windows[lesson.id]?.due_at??null, complete:isDone(lesson) }] : []
    }).sort((a,b) => Number(a.complete)-Number(b.complete) || (a.due_at?Date.parse(a.due_at):Infinity)-(b.due_at?Date.parse(b.due_at):Infinity) || a.sequence-b.sequence)

    // Every released lesson belongs on the calendar, including reflections
    // without an instruction video. Keep homework for older clients.
    const videosById = new Map(homework.map(video => [video.id, video]))
    const lessonAssignments: StudentAssignment[] = lessons.map(lesson => {
      const video = videosById.get(lesson.id), state = completion[lesson.id], complete = isDone(lesson)
      const reflection = lesson.content_blocks?.reflection?.kind
      const context = video ? `Video ${video.sequence}` : reflection === 'graphic-novel' ? 'Graphic novel response' : reflection === 'manga' ? 'Manga' : reflection === 'story' ? 'Written Reflection' : lesson.unit
      return {
        id: `${video ? 'video' : 'lesson'}:${lesson.id}`, kind: video ? 'video' : 'lesson',
        title: lesson.title, href: `/lessons/${lesson.slug}`, due: windows[lesson.id]?.due_at ?? null,
        complete, status: state ? LESSON_COMPLETION_LABELS[state.state] : complete ? 'Submitted' : 'To do',
        action: complete ? 'View work' : video ? 'Open homework' : 'Open assignment', context,
      }
    })

    // --- Points / XP ---------------------------------------------------------

    // --- Streak: consecutive days of activity ending today or yesterday ------
    let streak = 0
    try {
      const act = activity.data
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

    return NextResponse.json({
      student: { name },
      program,
      points: { xp: bal.lifetimeEarned, balance: bal.balance },
      streak: { current: streak },
      continue: continueData,
      retry,
      climb,
      homework,
      lessonAssignments,
    })
})
