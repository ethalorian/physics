import type { BlockDocument } from '@/data/content-blocks'

export type ReflectionKind = 'manga' | 'story'
export const REFLECTION_TEMPLATES = [
  { kind: 'manga' as const, title: 'My week in physics · Manga', description: 'Show this week’s physics in your life on one manga page.' },
  { kind: 'story' as const, title: 'Physics comes to life · Short story', description: 'Bring this week’s physics to life in a short fictional story.' },
]

/** The creative product is the entire reflection task. */
export function createReflectionAssignment(kind: ReflectionKind, targetId?: string): BlockDocument {
  return { schemaVersion: 1, dayType: 'SYNTHESIS', reflection: { version: 1, kind }, blocks: kind === 'manga' ? [
    { id: 'reflection-product', type: 'sketch', capture: true, submission: 'upload', captionRequired: false, targetId, evidenceRole: 'main',
      instruction: 'Create one manga page showing this week’s physics in your life. Show a moment of understanding. Upload your page. Stick figures are welcome.' },
  ] : [
    { id: 'reflection-product', type: 'exit_ticket', capture: true, targetId, evidenceRole: 'main',
      prompt: 'Write a short fictional story using this week’s physics in an everyday situation. Let your character figure something out. A few short paragraphs are enough.' },
  ] }
}
