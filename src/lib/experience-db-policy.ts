// These RPCs have been reviewed as reads. Unknown RPCs fail closed, even if
// called via GET: PostgREST can invoke a function with either HTTP method.
export const EXPERIENCE_READ_RPCS = new Set([
  'economy_totals', 'economy_earning_events', 'unit_xp_report', 'student_term_xp',
  'lesson_reward_map', 'lesson_xp_earned', 'lesson_video_xp_status',
  'math_daily_xp_status',
  // STABLE SELECT-only prerequisite lookups used by the student assignment lists.
  'daily_lesson_missing', 'daily_review_missing',
  'get_leaderboard', 'math_mission_leaders', 'avatar_target_level', 'avatar_gallery_page',
  'avatar_owner_counts', 'get_course_sections', 'get_course_students', 'get_section_students',
  'get_unassigned_students', 'get_student_activity_summary', 'calculate_assignment_stats',
])
export function experienceAllowsDatabaseRequest(url: string, method: string): boolean {
  const pathname = new URL(url).pathname
  const rpc = pathname.match(/^\/rest\/v1\/rpc\/([^/]+)$/)?.[1]
  if (rpc) return ['GET', 'HEAD', 'POST'].includes(method.toUpperCase()) && EXPERIENCE_READ_RPCS.has(decodeURIComponent(rpc))
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) && !pathname.startsWith('/functions/')
}
