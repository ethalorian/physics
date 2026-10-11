import type { LiveCommandState } from './classroom-command'

/** Local-only state. The rehearsal ID is never sent to a presentation API. */
export function rehearsalState(lessonId: string, courseId = ''): LiveCommandState {
  return { session: { id: 'rehearsal', lesson_id: lessonId, course_id: courseId, status: 'live', current_slide: 0, current_section: 0, current_anchor: null, poll_block_id: null, poll_run_id: null, poll_locked: false, poll_revealed: false, blackout: false, timer_ends_at: null, updated_at: '' }, lobby: null, saved: 0, enrolled: 0, tally: {} }
}
