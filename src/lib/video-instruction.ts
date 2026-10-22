import type { LessonCompletion } from './lesson-completion'
import { PHYSICS_VIDEOS, type PhysicsVideo } from '@/data/physics-videos'
import type { PhysicsLearningEntry } from './physics-learning'

export { PHYSICS_VIDEOS, UPCOMING_PHYSICS_VIDEOS } from '@/data/physics-videos'
export type { PhysicsVideo } from '@/data/physics-videos'

/** Display-only: stable lesson IDs, stored titles, plans and saved work stay intact. */
export function conceptTitle(title: string): string {
  return title.replace(/^Day\s+\d+(?:\s*[–-]\s*\d+)?\s*[—–:-]\s*/i, '')
}
/** Reviewed links only: a video's presence in a lesson does not cover every target. */
export function videosForTarget(slug: string) {
  return PHYSICS_VIDEOS.flatMap(video => video.targets.filter(link => link.slug === slug).map(link => ({ video, link })))
}
export interface VideoLessonLink {
  id: string
  slug: string
  title: string
  completion?: LessonCompletion
  published?: boolean
  window?: { state: string; due_at?: string | null } | null
  learning?: PhysicsLearningEntry
}
/** A classroom investigation can include a video without becoming its
 * standalone instruction lesson. Keep the two destinations distinct. */
export function isVideoInstructionEntry(entry?: Pick<PhysicsLearningEntry,'source'|'kind'|'videoIds'>): boolean {
  return Boolean(entry?.source === 'new' && entry.kind === 'lesson' && entry.videoIds.some(id => PHYSICS_VIDEOS.some(v=>v.youtubeId===id)))
}
/** A shared target is a discovery aid, never a video release. Each video must
 * occur explicitly in a current lesson that is open for this student. */
export function lessonsForVideo(video: PhysicsVideo, lessons: VideoLessonLink[], staff = false): VideoLessonLink[] {
  return lessons.filter(lesson => (staff || (lesson.published !== false && lesson.window?.state === 'open')) &&
    isVideoInstructionEntry(lesson.learning) && lesson.learning?.videoIds.includes(video.youtubeId))
    .sort((a, b) => Number(b.published !== false) - Number(a.published !== false))
}
/** Watching uses the published, server-scoped catalog independently of assignments. */
export function watchLessonsForVideo(video: PhysicsVideo, lessons: VideoLessonLink[], staff = false): VideoLessonLink[] {
  return lessons.filter(lesson => (staff || lesson.published !== false) &&
    isVideoInstructionEntry(lesson.learning) && lesson.learning?.videoIds.includes(video.youtubeId))
    .sort((a, b) => Number(b.published !== false) - Number(a.published !== false))
}
export function videoBlock(video: PhysicsVideo) {
  return { id: `video-${video.youtubeId}`, type: 'instruction_video' as const, youtubeId: video.youtubeId, title: video.title, summary: video.summary, ...(video.durationSeconds ? {durationSeconds:video.durationSeconds} : {}) }
}
