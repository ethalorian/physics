import 'server-only'
import type { ReadingCourse } from './textbook-assignments'

/** Resolve only within the caller's authorized courses. Keep the existing first
 * Physics-class default; other authorized programs retain the class chooser. */
export function readingCalendarCourse(courses: ReadingCourse[], requested: string | null) {
  return requested ? courses.find(course => course.id === requested) : courses.find(course => course.program === 'physics')
}
