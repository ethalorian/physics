import type { BlockDocument, InstructionVideoBlock } from '@/data/content-blocks'
import { isVideoLesson } from './video-lesson-workspace'

/** A watch view carries only media and its explanation, never assignment data. */
export function videoWatchDocument(document: BlockDocument | null): BlockDocument | null {
  if (!isVideoLesson(document)) return null
  const blocks: InstructionVideoBlock[] = document!.blocks.flatMap(block => block.type === 'instruction_video' ? [{
    id: block.id, type: 'instruction_video' as const, youtubeId: block.youtubeId,
    title: block.title, summary: block.summary, transcript: block.transcript,
    startSeconds: block.startSeconds, durationSeconds: block.durationSeconds,
  }] : [])
  return { schemaVersion: 1, blocks }
}

export function videoWatchHref(slug: string): string {
  return `/lessons/${encodeURIComponent(slug)}/watch`
}
