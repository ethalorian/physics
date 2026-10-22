import 'server-only'
import { NextResponse } from 'next/server'
import type { AuthContext } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ownerEmailsFor } from '@/lib/identity-aliases'
import type { ReadingAssignment, ReadingCourse } from '@/lib/textbook-assignments'

export const readingJson = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
export const readingStaff = (ctx: AuthContext) => ctx.role === 'teacher' || ctx.role === 'admin'
export async function readingRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = []
  for (let from = 0; from < 50000; from += 500) {
    const { data, error } = await page(from, from + 499)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < 500) return rows
  }
  throw new Error('Reading data exceeded the page limit')
}
export async function readingCourses(ctx: AuthContext): Promise<(ReadingCourse & { teacher_email: string })[]> {
  const staff = readingStaff(ctx)
  if (!staff && ctx.realRole !== 'student') return []
  const enrollment = staff ? [] : await readingRows((a, b) => supabaseAdmin.from('course_students').select('course_id').eq('student_id', ctx.userId).eq('enrollment_state', 'ACTIVE').order('id').range(a, b))
  if (!staff && !enrollment.length) return []
  return readingRows((a, b) => {
    let q = supabaseAdmin.from('courses').select('id,name,section,program,teacher_email,track').is('archived_at', null)
    q = staff ? q.in('teacher_email', ownerEmailsFor(ctx.scopeEmail)) : q.in('id', enrollment.map(e => e.course_id))
    return q.order('id').range(a, b)
  })
}
export async function accessReading(id: string, ctx: AuthContext) {
  const { data, error } = await supabaseAdmin.from('textbook_assignments').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data || (!readingStaff(ctx) && (data.status === 'draft' || data.opens_at && Date.parse(data.opens_at) > Date.now()))) return null
  if (!readingStaff(ctx)) {
    const { data: exemption, error: exemptionError } = await supabaseAdmin.from('textbook_reading_exemptions').select('user_id').eq('assignment_id', id).eq('user_id', ctx.userId).maybeSingle()
    if (exemptionError) throw exemptionError
    if (exemption) return null
  }
  const course = (await readingCourses(ctx)).find(c => c.id === data.course_id)
  return course ? { assignment: data as ReadingAssignment, course } : null
}
export function readingRpcError(error: { code?: string; message: string }) {
  if (error.code === 'P0001') return readingJson({ error: error.message }, 409)
  console.error('Textbook assignment operation failed', error)
  return readingJson({ error: 'Could not save. Your changes are still on this screen; please try again.' }, 500)
}
