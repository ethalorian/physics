import type { LessonPage } from '@/data/content-blocks'
export function sectionAnchor(page: LessonPage): string { return page.blocks[0]?.id ?? '' }
export function sectionIndexForAnchor(pages: LessonPage[], anchor: string | null | undefined): number {
  return anchor ? pages.findIndex(page => page.blocks.some(block => block.id === anchor)) : -1
}
/** Edits invalidate progress; reordering never assigns completion to different work. */
export function documentRevision(pages: LessonPage[]): string {
  const text = JSON.stringify(pages.map(page => page.blocks))
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return `v1:${(hash >>> 0).toString(16)}`
}
