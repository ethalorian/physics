import 'server-only'
import { read } from './assessment-results/queries'

export function courseHomeworkWaivers(courseIds: string[]) {
  return courseIds.length ? read<{ course_id: string; work_key: string }>(
    'classroom_homework_waivers', 'course_id,work_key', q => q.in('course_id', courseIds), ['course_id','work_key'],
  ) : Promise.resolve([])
}
