import 'server-only'
import type { BlockDocument } from '@/data/content-blocks'
import { isCurrentLesson } from '@/lib/current-lesson-catalog'
import { isBlockVisible, isLessonVisible } from '@/lib/track-visibility'
import type { LessonSubmission } from '@/lib/lesson-review'
import type { PendingMasteryReads } from '@/lib/pending-lesson-work'
import { byIds, read, reviewSource, type Scope } from './queries'

type Lesson = { id: string; title: string; unit_id: string; visibility_track: string | null; content_blocks: BlockDocument }

/** Owned by one Results composition, including calls outside an API request.
 * Nothing is cached across users, courses, requests, writes or background jobs. */
function createLessonInputs(scope: Scope) {
  const once = <T>(load: () => Promise<T>) => {
    let pending: Promise<T> | undefined
    return () => pending ??= load()
  }
  const users = scope.students.map(student => student.id)
  const viewer = { role: 'student' as const, track: scope.course.track }
  const catalog = once(async () => {
    const all = await byIds<Lesson>('lessons', 'id,title,unit_id,visibility_track,content_blocks', 'unit_id', [...new Set(scope.targetRows.map(t => t.unit_id))], ['id'], q => reviewSource(scope, q.eq('published', true)))
    const visible = all.filter(l => isLessonVisible(l.visibility_track, viewer))
    // Reflection eligibility uses the original blocks; video eligibility uses
    // the current catalog and the student's visible blocks. Never mutate shared rows.
    const forStudent = (l: Lesson): Lesson => ({ ...l, content_blocks: { ...l.content_blocks, blocks: (l.content_blocks?.blocks ?? []).filter(b => isBlockVisible(b, viewer)) } })
    const videos = visible.filter(l => isCurrentLesson({ ...l, program: scope.course.program })).map(forStudent).filter(l => l.content_blocks.blocks.some(b => b.type === 'instruction_video'))
    const reflections = visible.filter(l => l.content_blocks?.reflection || !(l.content_blocks?.blocks ?? []).some(b => b.type === 'instruction_video')).map(forStudent)
    return { videos, reflections, ids: [...new Set([...videos, ...reflections].map(l => l.id))] }
  })
  // Course windows can start alongside the catalog, retaining the video's
  // existing parallel read while also serving the reflection provider.
  const windows = once(() => read<{ lesson_id: string; due_at: string | null }>('lesson_class_windows', 'lesson_id,due_at', q => q.eq('course_id', scope.course.id), ['lesson_id']))
  const submissions = once(async () => users.length ? byIds<LessonSubmission>('lesson_submissions', 'id,user_id,lesson_id,submitted_at', 'lesson_id', (await catalog()).ids, ['submitted_at', 'id'], q => q.in('user_id', users)) : [])
  const reviews = once(async () => byIds<{ submission_id: string }>('lesson_reviews', 'submission_id', 'submission_id', (await submissions()).map(s => s.id), ['id']))
  const responses = once(async () => users.length ? byIds<Awaited<ReturnType<PendingMasteryReads['responses']>>[number]>('block_responses', 'id,user_id,lesson_id,block_id,block_type,target_id,created_at,draft:response->>draft', 'lesson_id', (await catalog()).ids, ['id'], q => q.in('user_id', users)) : [])
  const masteryReviews = once(async () => users.length ? byIds<Awaited<ReturnType<PendingMasteryReads['reviews']>>[number]>('mastery_evidence_reviews', 'id,user_id,lesson_id,target_id,evidence', 'lesson_id', (await catalog()).ids, ['id'], q => q.in('user_id', users)) : [])
  const durations = once(() => read<{ youtube_id: string; duration_seconds: number }>('lesson_video_catalog', 'youtube_id,duration_seconds', q => q, ['youtube_id']))
  const mastery = (lessonIds: string[]): PendingMasteryReads => {
    const ids = new Set(lessonIds)
    return { responses: async () => (await responses()).filter(r => ids.has(r.lesson_id)), reviews: async () => (await masteryReviews()).filter(r => ids.has(r.lesson_id)) }
  }
  return { catalog, windows, submissions, reviews, responses, durations, mastery }
}

export type LessonInputs = ReturnType<typeof createLessonInputs>
export function lessonInputs(scope: Scope): LessonInputs {
  return scope.lessonInputs ??= createLessonInputs(scope)
}
