import { isLessonVisible } from '@/lib/track-visibility'

export interface ReleaseClass {
  lesson_experience?: 'classic' | 'stepped'
  gate_checkpoints?: boolean
  id: string
  name: string
  section: string | null
  track: string | null
  program: string | null
}
export interface ReleaseLesson {
  id: string
  title: string
  slug: string
  unit: string | null
  unit_id: string | null
  lesson_number: number | null
  published: boolean
  visibility_track?: string | null
  program: string | null
  unit_order: number
}
export interface ReleaseWindow {
  open_at: string | null
  close_at: string | null
}
export interface ReleaseData {
  classes: ReleaseClass[]
  lessons: ReleaseLesson[]
  windows: Record<string, ReleaseWindow>
  canEdit?: boolean
}
export type ReleaseStatus = 'open' | 'closed' | 'scheduled' | 'ended'
export const classLabel = (c: ReleaseClass) =>
  c.section ? `${c.name} · ${c.section}` : c.name
export const lessonLabel = (l: ReleaseLesson) =>
  `${l.lesson_number ? `Day ${l.lesson_number} · ` : ''}${l.title}`
export function appliesToClass(
  l: Pick<ReleaseLesson, 'published' | 'program' | 'visibility_track'>,
  c: Pick<ReleaseClass, 'program' | 'track'>,
) {
  return (
    l.published &&
    l.program !== null &&
    l.program === (c.program ?? 'physics') &&
    isLessonVisible(l.visibility_track, { role: 'student', track: c.track })
  )
}
export function releaseStatus(
  w?: ReleaseWindow,
  now = Date.now(),
): ReleaseStatus {
  if (!w) return 'closed'
  if (w.open_at && now < Date.parse(w.open_at)) return 'scheduled'
  if (w.close_at && now > Date.parse(w.close_at)) return 'ended'
  return 'open'
}
export function releaseSummary(
  data: ReleaseData,
  c: ReleaseClass,
  now = Date.now(),
) {
  const lessons = data.lessons.filter((l) => appliesToClass(l, c))
  const open = lessons.filter(
    (l) => releaseStatus(data.windows[`${c.id}|${l.id}`], now) === 'open',
  )
  // Suggest only beyond the latest released/scheduled lesson. Never reopen an
  // ended lesson or replace a future schedule as an incidental "next" action.
  let lastReleased = -1
  lessons.forEach((l, i) => {
    if (data.windows[`${c.id}|${l.id}`]) lastReleased = i
  })
  const next =
    lessons
      .slice(lastReleased + 1)
      .find((l) => !data.windows[`${c.id}|${l.id}`]) ?? null
  return { lessons, open, next }
}
export function toLocalDateTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso),
    pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function validateReleaseWindow(
  open: unknown,
  close: unknown,
): string | null {
  for (const value of [open, close])
    if (
      value != null &&
      (typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
        !Number.isFinite(Date.parse(value)))
    )
      return 'Enter a valid opening and closing time, including a timezone.'
  if (
    open &&
    close &&
    Date.parse(close as string) <= Date.parse(open as string)
  )
    return 'The closing time must be after the opening time.'
  return null
}
export function lessonContextHref(
  path: string,
  values: {
    class?: string | null
    lesson?: string | null
    unit?: string | null
    day?: number | null
  },
) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, String(v))
  })
  return `${path}${params.size ? '?' + params.toString() : ''}`
}
