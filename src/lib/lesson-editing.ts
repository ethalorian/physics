import type { BlockDocument } from '@/data/content-blocks'

/** Keep document-level presentation and future supported metadata intact. */
export function editLessonDocument(source: BlockDocument | undefined, changes: Pick<BlockDocument, 'blocks' | 'dayType'>): BlockDocument {
  return { ...source, schemaVersion: 1, ...changes }
}

export function changedLessonFields(current: Record<string, unknown>, saved: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(current).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(saved[key])))
}

export const LESSON_EDIT_FIELDS = new Set(['title', 'slug', 'unit_id', 'lesson_number', 'estimated_time', 'description', 'content', 'content_blocks', 'objectives', 'hero_image', 'published', 'visibility_track', 'planned_days'])
