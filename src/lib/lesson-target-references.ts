/** Pure target references shared by catalog cards, authoring, and evidence lookup. */
export type TargetDocument = { blocks?: unknown[]; learningPath?: { targetSlugs?: string[] } } | null | undefined
export function lessonTargetReferences(doc: TargetDocument): string[] {
  const out = new Set<string>(doc?.learningPath?.targetSlugs ?? [])
  for (const raw of doc?.blocks ?? []) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const block = raw as Record<string, unknown>
    if (typeof block.targetId === 'string' && block.targetId) out.add(block.targetId)
    for (const key of ['targetIds', 'targets']) {
      const values = block[key]
      if (Array.isArray(values)) for (const value of values) if (typeof value === 'string' && value) out.add(value)
    }
  }
  return [...out]
}

/** Document order is the reader order; the authoring picker may include a whole unit. */
export function referencedLessonTargets<T extends { id: string; slug: string }>(doc: TargetDocument, targets: T[]): T[] {
  const seen = new Set<string>()
  return lessonTargetReferences(doc).flatMap(ref => {
    const target = targets.find(t => t.slug === ref || t.id === ref)
    if (!target || seen.has(target.id)) return []
    seen.add(target.id)
    return [target]
  })
}
