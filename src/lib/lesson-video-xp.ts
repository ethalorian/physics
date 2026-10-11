export const VIDEO_WATCH_XP = 5
export const VIDEO_WATCH_FRACTION = 0.9

export interface VideoXpStatus {
  youtubeId: string
  duration: number
  start: number
  reward: number
  watched: number
  required: number
  earned: number
  xpAwarded: number
  lessonXp: number
}

export function validVideoHeartbeat(value: unknown): value is {
  lesson_id: string; block_id: string; session_id: string; position: number; playing: boolean; expected_user_id: string
} {
  if (!value || typeof value !== 'object') return false
  const b = value as Record<string, unknown>
  return typeof b.lesson_id === 'string' && typeof b.block_id === 'string' && b.block_id.length > 0 && b.block_id.length <= 200
    && typeof b.session_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.session_id)
    && typeof b.position === 'number' && Number.isFinite(b.position) && b.position >= 0 && b.position <= 14400
    && typeof b.playing === 'boolean' && typeof b.expected_user_id === 'string'
}
