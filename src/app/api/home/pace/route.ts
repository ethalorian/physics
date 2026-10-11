import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { schoolDayKey, schoolDayStart } from '@/lib/school-day'
import { completedSchoolDates, summarizeLearningPace } from '@/lib/learning-week'
import { vocabRows } from '@/lib/vocab-pagination'

export const GET = withAuth(async (_request, ctx) => {
  const today = schoolDayKey()
  const [calendar, enrollment] = await Promise.all([
    supabaseAdmin.from('rotation_calendar').select('anchor_date,no_school_dates').eq('id', 'default').maybeSingle(),
    supabaseAdmin.from('course_students').select('course_id,enrolled_at').eq('student_id', ctx.userId).eq('enrollment_state', 'ACTIVE'),
  ])
  if (calendar.error || enrollment.error) throw calendar.error || enrollment.error
  const enrolled = enrollment.data ?? [], noSchoolDates: string[] = calendar.data?.no_school_dates ?? []
  const calendarReady = !!calendar.data?.anchor_date && enrolled.length > 0
  const enrolledFrom = enrolled.map(row => row.enrolled_at ? schoolDayKey(new Date(row.enrolled_at)) : today).sort()[0] ?? today
  const eligibleFrom = [enrolledFrom, calendar.data?.anchor_date ?? today].sort().at(-1)!
  const historicalDates = calendarReady ? completedSchoolDates(today, eligibleFrom, noSchoolDates) : []
  const dates = historicalDates.slice(-5)
  const lower = schoolDayStart(new Date(`${historicalDates[0] ?? today}T12:00:00Z`)).toISOString(), upper = schoolDayStart().toISOString()
  const historyStart = new Date(`${today}T12:00:00Z`); historyStart.setUTCDate(historyStart.getUTCDate() - 45)
  const warmups = await vocabRows<{ id: string; competency_id: string; submitted_at: string; status: string }>((a, b) => supabaseAdmin.from('math_warmup_submissions').select('id,competency_id,submitted_at,status').eq('user_id', ctx.userId).gte('submitted_at', schoolDayStart(historyStart).toISOString()).order('submitted_at').order('id').range(a, b))
  // Opening a page, starting a quiz, and game spins are not meaningful learning evidence.
  const sources = [
    ['math_warmup_submissions', 'submitted_at'], ['math_warmup_revisions', 'submitted_at'],
    ['lesson_submissions', 'submitted_at'], ['textbook_submissions', 'submitted_at'], ['quiz_submissions', 'submitted_at'],
    ['vocab_checks', 'completed_at'], ['vocab_attempts', 'created_at'], ['block_responses', 'created_at'],
  ] as const
  const events = dates.length ? await Promise.all(sources.map(([table, column]) => vocabRows<Record<string, string>>((a, b) => supabaseAdmin.from(table).select(`id,${column}`).eq('user_id', ctx.userId).gte(column, lower).lt(column, upper).order(column).order('id').range(a, b)))) : []
  const xp = dates.length ? await vocabRows<{ source: string; points: number; earned_at: string }>((a, b) => supabaseAdmin.rpc('economy_earning_events').eq('user_id', ctx.userId).gte('earned_at', lower).lt('earned_at', upper).select('source,points,earned_at,unit_id').order('earned_at').order('source').order('points').order('unit_id').range(a, b)) : []
  const activity = events.flatMap((rows, i) => rows.map(row => row[sources[i][1]]))
  const earnings = xp.map(row => ({ ...row, points: Number(row.points) }))
  const history = summarizeLearningPace(historicalDates, activity, earnings)
  const historical = { dates: historicalDates, activeDays: history.activeDays, engagement: history.engagement, learningXp: history.learningXp, xpRate: history.xpRate }
  return NextResponse.json({ today, dates, ...summarizeLearningPace(dates, activity, earnings), historical, calendarReady, noSchoolDates, warmups }, { headers: { 'Cache-Control': 'private, no-store' } })
})
