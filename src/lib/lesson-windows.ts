import { supabaseAdmin } from '@/lib/supabase'

// Per-class lesson release windows. A published lesson is CLOSED to a class until
// the teacher OPENS it: a window row GRANTS access for one class (open now, or
// open_at in the past) and can also schedule a future open or a close. No window
// row → the lesson is closed for that class. Teachers own windows for their
// classes; admins own only the global published flag.

export interface LessonWindow { course_id: string; lesson_id: string; open_at: string | null; close_at: string | null }

function within(w: { open_at: string | null; close_at: string | null }, now: number): boolean {
  const openOk = !w.open_at || now >= new Date(w.open_at).getTime()
  const closeOk = !w.close_at || now <= new Date(w.close_at).getTime()
  return openOk && closeOk
}

// The courses a student is enrolled in (by google_user_id → students.id → course_students).
async function getStudentCourseIds(googleUserId: string): Promise<string[]> {
  const { data: s } = await supabaseAdmin.from('students').select('id').eq('google_user_id', googleUserId).maybeSingle()
  const sid = (s as { id?: string } | null)?.id
  if (!sid) return []
  const { data: cs } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id', sid)
  return [...new Set(((cs ?? []) as { course_id: string }[]).map((r) => String(r.course_id)))]
}

// Build a predicate `isOpen(lessonId)` for one student, evaluated at `now`.
// A lesson is CLOSED until the teacher opens it: visible only if at least one
// class the student is in has an open window currently in effect.
// (No enrollment / no window → closed.)
export async function getStudentLessonGate(
  googleUserId: string,
  now: number = Date.now(),
): Promise<(lessonId: string) => boolean> {
  const courseIds = await getStudentCourseIds(googleUserId)
  if (courseIds.length === 0) return () => false

  const { data } = await supabaseAdmin
    .from('lesson_class_windows')
    .select('course_id, lesson_id, open_at, close_at')
    .in('course_id', courseIds)
  const byKey = new Map<string, { open_at: string | null; close_at: string | null }>()
  for (const w of (data ?? []) as LessonWindow[]) byKey.set(`${w.course_id}|${w.lesson_id}`, { open_at: w.open_at, close_at: w.close_at })

  return (lessonId: string) => {
    for (const c of courseIds) {
      const w = byKey.get(`${c}|${lessonId}`)
      if (w && within(w, now)) return true   // this class has opened it
    }
    return false                              // closed until a teacher opens it
  }
}

// All windows for one class, keyed by lesson_id — for the teacher scheduler UI.
export async function getCourseWindows(courseId: string): Promise<Record<string, { open_at: string | null; close_at: string | null }>> {
  const { data } = await supabaseAdmin
    .from('lesson_class_windows')
    .select('lesson_id, open_at, close_at')
    .eq('course_id', courseId)
  const out: Record<string, { open_at: string | null; close_at: string | null }> = {}
  for (const w of (data ?? []) as LessonWindow[]) out[w.lesson_id] = { open_at: w.open_at, close_at: w.close_at }
  return out
}
