import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ownerEmailsFor } from '@/lib/identity-aliases'
import { patternFromRow } from '@/lib/pacing-server'
import { schoolDayKey, schoolDayNumber, schoolDayKeyFromNumber, schoolDayStart } from '@/lib/school-day'
import { engagementForStudent, validDate, type EngagementEvent, type EngagementXpEvent, type EngagementReport } from '@/lib/student-engagement'
import { type RotationCalendar } from '@/lib/rotation'
import { vocabRows } from '@/lib/vocab-pagination'
import { summarizeWords, type VocabTask, type CheckRecord } from '@/lib/vocab-learning'

// Read only: daily engagement is not XP, attendance, or a mastery rating.
export const GET = withRole('admin', async (request, ctx) => {
  const { data: courses, error: courseError } = await supabaseAdmin.from('courses').select('id,name,section').in('teacher_email', ownerEmailsFor(ctx.scopeEmail)).is('archived_at', null).order('name').order('id')
  if (courseError) throw courseError
  const options = (courses ?? []).map(course => ({ id: course.id as string, name: [course.name, course.section].filter(Boolean).join(' · ') }))
  const params = request.nextUrl.searchParams
  const courseId = params.get('course_id') || options[0]?.id || null
  if (courseId && !options.some(course => course.id === courseId)) return NextResponse.json({ error: 'Choose one of your classes.' }, { status: 403 })
  const latestCompleteDay = schoolDayKeyFromNumber(schoolDayNumber() - 1)
  const empty: EngagementReport = { courses: options, courseId, from: latestCompleteDay, to: latestCompleteDay, latestCompleteDay, scheduleReady: false, scheduleMessage: 'Connect a class to see engagement.', students: [], practice: [] }
  if (!courseId) return NextResponse.json(empty)
  const results = await Promise.all([
    supabaseAdmin.from('rotation_calendar').select('anchor_date,anchor_p1_block,no_school_dates,cycle_offset,alt_week_anchor').eq('id', 'default').maybeSingle(),
    supabaseAdmin.from('section_schedules').select('start_date,block,blocks,week_pattern,on_week_anchor,on_week_dates,no_school_dates').eq('course_id', courseId).maybeSingle(),
    supabaseAdmin.from('course_students').select('student_id,enrolled_at').eq('course_id', courseId).eq('enrollment_state', 'ACTIVE'),
  ])
  for (const result of results) if (result.error) throw result.error
  const calendarRow = results[0].data
  const schedule = results[1].data
  const enrollments = results[2].data ?? []
  const calendar: RotationCalendar = { anchor_date: calendarRow?.anchor_date ?? null, anchor_p1_block: calendarRow?.anchor_p1_block ?? null, cycle_offset: calendarRow?.cycle_offset ?? 0,
    alt_week_anchor: calendarRow?.alt_week_anchor ?? null, no_school_dates: [...(calendarRow?.no_school_dates ?? []), ...(schedule?.no_school_dates ?? [])] }
  const pattern = patternFromRow(schedule)
  const scheduleReady = Boolean(calendar.anchor_date && /^[A-F]$/.test(calendar.anchor_p1_block ?? '') && pattern.blocks.length && (pattern.weekPattern !== 'alternate' || pattern.onWeekAnchor || calendar.alt_week_anchor || pattern.onWeekDates?.length))
  const start = [schedule?.start_date, calendar.anchor_date].filter((date): date is string => Boolean(date)).sort().at(-1) ?? latestCompleteDay
  const from = params.get('from') || (start > latestCompleteDay ? latestCompleteDay : start)
  const to = params.get('to') || latestCompleteDay
  if (!validDate(from) || !validDate(to) || from > to || to > latestCompleteDay || (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000 >= 370) return NextResponse.json({ error: 'Choose a range of up to 370 days ending yesterday or earlier.' }, { status: 400 })
  const ids = [...new Set(enrollments.map(row => row.student_id as string))]
  const base = { ...empty, from, to, scheduleReady, scheduleMessage: scheduleReady ? null : 'Set a rotation calendar and class block schedule in Pacing to calculate class-day percentages.' }
  if (!ids.length) return NextResponse.json(base)
  const lower = schoolDayStart(new Date(`${from}T12:00:00Z`)).toISOString()
  const nextDay = new Date(`${to}T12:00:00Z`); nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  const upper = schoolDayStart(nextDay).toISOString()
  // Stable, paginated reads: row caps must never turn active students into zeros.
  const eventSources = [
    { table: 'student_activity', column: 'created_at', label: 'Lesson / site activity' },
    { table: 'math_warmup_submissions', column: 'submitted_at', label: 'Math warm-up' },
    { table: 'math_practice_instances', column: 'created_at', label: 'Math practice opened' },
    { table: 'vocab_attempts', column: 'created_at', label: 'Vocabulary practice' },
    { table: 'vocab_checks', column: 'created_at', label: 'Vocabulary check started' },
    { table: 'vocab_checks', column: 'completed_at', label: 'Vocabulary check completed' },
    { table: 'arcade_plays', column: 'created_at', label: 'Arcade activity' },
  ]
  const [studentResult, taskResult, xpRows, ...sourceRows] = await Promise.all([
    supabaseAdmin.from('students').select('id,name').in('id', ids),
    supabaseAdmin.from('vocab_tasks').select('id,title,due_on,created_at,student_ids,term_ids,threshold,min_checks').eq('course_id', courseId).eq('active', true).order('created_at', { ascending: false }),
    vocabRows<{ user_id: string; points: number | string; earned_at: string }>((a, b) => supabaseAdmin.rpc('economy_earning_events').in('user_id', ids).gte('earned_at', lower).lt('earned_at', upper).select('user_id,source,points,earned_at,unit_id').order('user_id').order('earned_at').order('source').order('points').order('unit_id').range(a, b)),
    ...eventSources.map(source => vocabRows((a, b) => supabaseAdmin.from(source.table).select(`id,user_id,${source.column}`).in('user_id', ids).gte(source.column, lower).lt(source.column, upper).order(source.column).order('id').range(a, b))),
  ])
  if (studentResult.error) throw studentResult.error
  if (taskResult.error) throw taskResult.error
  const events: EngagementEvent[] = sourceRows.flatMap((rows, index) => (rows as unknown as Record<string, string>[]).map(row => ({ userId: row.user_id, at: row[eventSources[index].column], source: eventSources[index].label })))
  const xpEvents: EngagementXpEvent[] = xpRows.map(row => {
    const points = Number(row.points)
    if (!Number.isFinite(points)) throw new Error('Invalid XP earning event')
    return { userId: row.user_id as string, at: row.earned_at as string, points }
  })
  const students = (studentResult.data ?? []).map(student => engagementForStudent({ id: student.id, name: student.name || 'Student', enrolledAt: enrollments.find(row => row.student_id === student.id)?.enrolled_at ?? null, start, from, to, calendar, pattern, scheduleReady, events, xpEvents })).sort((a, b) => a.name.localeCompare(b.name))
  const tasks = (taskResult.data ?? []) as Pick<VocabTask, 'id' | 'title' | 'due_on' | 'created_at' | 'student_ids' | 'term_ids' | 'threshold' | 'min_checks'>[]
  const checks = tasks.length ? await vocabRows((a, b) => supabaseAdmin.from('vocab_checks').select('id,task_id,user_id,created_at,completed_at,result').in('task_id', tasks.map(task => task.id)).in('user_id', ids).order('created_at').order('id').range(a, b)) : []
  const practice = tasks.map(task => ({ id: task.id, title: task.title, dueOn: task.due_on, createdAt: task.created_at, students: task.student_ids.filter(id => ids.includes(id)).map(studentId => {
    const attempts = checks.filter(check => check.task_id === task.id && check.user_id === studentId)
    const summary = summarizeWords(task, attempts as CheckRecord[])
    const dates = attempts.flatMap(check => [check.created_at, check.completed_at].filter((date): date is string => Boolean(date)))
    return { studentId, name: students.find(student => student.id === studentId)?.name ?? 'Student', started: attempts.length, checks: attempts.filter(check => check.completed_at).length, activeDays: new Set(dates.map(date => schoolDayKey(new Date(date)))).size, lastAt: dates.sort().at(-1) ?? null, ready: summary.ready, total: summary.total, complete: summary.complete }
  }) }))
  return NextResponse.json({ ...base, students, practice }, { headers: { 'Cache-Control': 'private, no-store' } })
})
