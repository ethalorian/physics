import { isCaptureBlock, type BlockDocument, type ContentBlock } from '@/data/content-blocks'
import { validateBlockDocument } from '@/data/block-registry'
import { seiLint } from '@/lib/sei'
import { viewerCanSeeGate } from '@/lib/track-visibility'

export interface CatalogLesson {
  id: string; slug: string; title: string; unit_id: string; unit: string | null; lesson_number: number | null
  published: boolean; visibility_track: string | null; estimated_time: number | null; planned_days: number | null
  updated_at: string | null; content_fingerprint: string; block_count: number; block_summary: ContentBlock[]
}
export interface CatalogTarget { id: string; slug: string; statement: string; unit_id: string; lesson_id?: string | null }
export function blockTargetKeys(b: ContentBlock): string[] {
  const raw = b as unknown as { targetId?: string; targetIds?: string[]; targets?: string[] }
  return [...new Set([raw.targetId, ...(raw.targetIds ?? []), ...(raw.targets ?? [])].filter((s): s is string => typeof s === 'string' && Boolean(s)))]
}
export function captureKeys(lesson: CatalogLesson, track?: string | null): Set<string> {
  return new Set(lesson.block_summary.filter(b => isCaptureBlock(b) && (track === undefined || viewerCanSeeGate({ role: 'student', track }, b.visibilityTrack))).flatMap(blockTargetKeys))
}
export function targetCoverage(lessons: CatalogLesson[], target: CatalogTarget, track?: string | null) {
  const matches = lessons.filter(l => { const keys = captureKeys(l, track); return keys.has(target.id) || keys.has(target.slug) })
  return { published: matches.filter(l => l.published).map(l => ({ id: l.id, title: l.title })), planned: matches.filter(l => !l.published).map(l => ({ id: l.id, title: l.title })) }
}
export function lessonReadiness(doc: BlockDocument | null, targets: CatalogTarget[], vocab: string[], vocabIds?: string[]) {
  const issues: { blockId?: string; message: string; severity: 'error' | 'warning' }[] = validateBlockDocument(doc, true).map(i => ({ ...i, severity: 'error' }))
  if (!doc?.blocks?.length) return [...issues, { message: 'Add student activities.', severity: 'error' as const }]
  issues.push(...seiLint(doc.blocks, vocab))
  const keys = new Set(targets.flatMap(t => [t.id, t.slug]))
  for (const b of doc.blocks) {
    if(b.type==='vocab' && !b.termIds && !b.terms?.length)issues.push({blockId:b.id,message:'Select canonical vocabulary words or import the inline definitions.',severity:'error'})
    if ((b.type==='vocab'||b.type==='lesson_vocab') && b.termIds) {
      if(!b.termIds.length) issues.push({blockId:b.id,message:'Select at least one canonical vocabulary word.',severity:'error'})
      for(const id of b.termIds)if(vocabIds && !vocabIds.includes(id))issues.push({blockId:b.id,message:'A selected vocabulary word is missing or archived. Refresh the word selection.',severity:'error'})
    }
    const refs = blockTargetKeys(b)
    for (const ref of refs) if (!keys.has(ref)) issues.push({ blockId: b.id, message: `Unknown learning target: ${ref}`, severity: 'error' })
    if (isCaptureBlock(b) && !refs.length) issues.push({ blockId: b.id, message: 'Choose the learning target for this evidence.', severity: 'error' })
  }
  if (doc.blocks.some(b => b.type === 'lesson_vocab') && !vocab.length) issues.push({ message: 'Add terms to the canonical lesson vocabulary set.', severity: 'error' })
  return issues
}
