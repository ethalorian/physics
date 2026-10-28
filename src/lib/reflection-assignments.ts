import type { BlockDocument } from '@/data/content-blocks'

export type ReflectionKind = 'manga' | 'story'
export const REFLECTION_TEMPLATES = [
  { kind: 'manga' as const, title: 'My week in physics · Manga', description: 'Show this week’s physics in your life on one manga page.' },
  { kind: 'story' as const, title: 'Physics comes to life · Short story', description: 'Bring this week’s physics to life in a short fictional story.' },
]

/** Templates remain discoverable before a teacher creates the first assignment. */
export function reflectionLibraryTemplates(targets: { id: string; unit_id: string }[]) {
  return REFLECTION_TEMPLATES.map(template => ({
    ...template,
    key: 'reflection-template:' + template.kind,
    format: template.kind,
    availability: 'Ready',
    unitIds: [...new Set(targets.map(target => target.unit_id))],
    targetIds: targets.map(target => target.id),
  }))
}

/** Broad creative work can demonstrate any of the unit's targets. Keep these as
 * review candidates instead of attributing every student's product to one
 * arbitrarily chosen target. A teacher still makes every mastery judgment. */
export function createReadyReflection(kind: ReflectionKind, targetIds: string[]): BlockDocument {
  const targets = [...new Set(targetIds)]
  const document = createReflectionAssignment(kind, targets.length === 1 ? targets[0] : undefined)
  return { ...document, blocks: document.blocks.map(block => ({ ...block, targetIds: targets })) }
}

/** The creative product is the entire reflection task. */
export function createReflectionAssignment(kind: ReflectionKind, targetId?: string): BlockDocument {
  return { schemaVersion: 1, dayType: 'SYNTHESIS', reflection: { version: 1, kind }, blocks: kind === 'manga' ? [
    { id: 'reflection-product', type: 'sketch', capture: true, submission: 'upload', captionRequired: false, ...(targetId ? { targetId } : {}), evidenceRole: 'main',
      instruction: 'Create one manga page showing this week’s physics in your life. Show a moment of understanding. Upload your page. Stick figures are welcome.' },
  ] : [
    { id: 'reflection-product', type: 'exit_ticket', capture: true, ...(targetId ? { targetId } : {}), evidenceRole: 'main',
      prompt: 'Write a short fictional story using this week’s physics in an everyday situation. Let your character figure something out. A few short paragraphs are enough.' },
  ] }
}
