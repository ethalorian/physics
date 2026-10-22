import { enrichVideoLesson } from './video-lesson-practice'
import { VIDEO_VOCABULARY } from '@/data/video-vocabulary'
import type { BlockDocument } from '@/data/content-blocks'
import { PHYSICS_VIDEOS, videoBlock } from './video-instruction'

/** New video assignments use the same authored interactive tasks as published lessons. */
export function createVideoLesson(youtubeId: string): BlockDocument | null {
  const video = PHYSICS_VIDEOS.find(item => item.youtubeId === youtubeId)
  if (!video) return null
  const targetSlugs = video.targets.filter(target => target.relationship === 'teaches').map(target => target.slug)
  return enrichVideoLesson({
    schemaVersion: 1, presentation: 'physics-path', dayType: 'STANDARD',
    learningPath: { version: 1, kind: 'lesson', focus: video.focus, targetSlugs, foundations: video.collection === 'Foundations' },
    blocks: [
      { ...videoBlock(video), targetId: targetSlugs[0] },
      { id: 'vocabulary-'+youtubeId, type: 'vocab', terms: VIDEO_VOCABULARY[youtubeId]??[], referencePanel: true },
    ],
  })
}
