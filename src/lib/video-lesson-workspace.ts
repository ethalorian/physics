import type { BlockDocument } from '@/data/content-blocks'

/** The student library always uses the newer interactive workspace. */
export function usesInteractiveLessonWorkspace(document?: BlockDocument | null): boolean {
  return document?.presentation === 'physics-path'
}

/** Teacher preparation still distinguishes actual authored video lessons. */
export function isVideoLesson(document?: BlockDocument | null): boolean {
  return document?.presentation === 'physics-path'
    && document.learningPath?.kind === 'lesson'
    && document.blocks.some(block => block.type === 'instruction_video')
}
