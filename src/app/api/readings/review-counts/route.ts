import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { readingCourses, readingJson, readingRows, readingStaff } from '@/lib/textbook-assignments-server'
import { readingCalendarCourse } from '@/lib/reading-calendar-server'
import { readingReviewCounts } from '@/lib/reading-review-counts-server'
import type { ReadingAssignment } from '@/lib/textbook-assignments'

export const GET = withAuth(async (req, ctx) => {
  if (!readingStaff(ctx)) return readingJson({ error: 'This dashboard is for teachers.' }, 403)
  const requested = new URL(req.url).searchParams.get('course_id')
  const courses = await readingCourses(ctx), course = readingCalendarCourse(courses, requested)
  if (requested && !course) return readingJson({ error: 'Choose one of your own classes.' }, 403)
  if (!course) return readingJson({ review_counts: {} })
  const assignments = await readingRows<Pick<ReadingAssignment, 'id' | 'course_id' | 'status'>>((a, b) => supabaseAdmin.from('textbook_assignments').select('id,course_id,status').eq('course_id', course.id).eq('status', 'published').order('id').range(a, b))
  return readingJson({ review_counts: await readingReviewCounts(assignments, [course.id]) })
})
