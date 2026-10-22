import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { readingRows } from './textbook-assignments-server'
import { schoolDayKey } from './school-day'

export async function studentWarmupDates(userId: string): Promise<string[]> {
  const enrollments = await readingRows<{course_id:string}>((a,b) => supabaseAdmin.from('course_students').select('course_id').eq('student_id', userId).eq('enrollment_state','ACTIVE').order('course_id').range(a,b))
  if (!enrollments.length) return []
  const courses = await readingRows<{id:string}>((a,b) => supabaseAdmin.from('courses').select('id').in('id',enrollments.map(e=>e.course_id)).is('archived_at',null).order('id').range(a,b))
  if (!courses.length) return []
  const dates = await readingRows<{day:string}>((a,b) => supabaseAdmin.from('calendar_warmups').select('day').in('course_id',courses.map(c=>c.id)).order('day').order('course_id').range(a,b))
  return [...new Set(dates.map(d=>d.day))]
}
export async function hasCalendarWarmup(userId: string, day = schoolDayKey()): Promise<boolean> {
  return (await studentWarmupDates(userId)).includes(day)
}
