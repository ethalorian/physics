'use client'

import type { BlockDocument } from '@/data/content-blocks'

export default function NotebookLessonSettings({ document, onChange, targets }: { document: BlockDocument; onChange: (doc: BlockDocument) => void; targets: { id: string; slug: string; statement: string }[] }) {
  const notebook = document.interactiveNotebook
  if (!notebook) return null
  const linked = new Set([...notebook.questionBlockIds, 'units-reflection'])
  const values = new Set(document.blocks.filter(block => linked.has(block.id)).map(block => block.targetId ?? ''))
  const target = values.size === 1 ? [...values][0] : ''
  return <section aria-label="Notebook lesson settings" className="space-y-3 rounded-xl border bg-card p-4">
    <h3 className="font-semibold">Original interactive notebook</h3>
    <p className="text-sm text-muted-foreground">The Units and Dimensions design stays intact. Its five checks save as lesson questions, followed by a short reflection. Question prompts and choices stay matched to the original; targets and teacher feedback use the usual lesson tools.</p>
    <label className="block text-sm">Learning target for the checks and reflection
      <select className="mt-1 min-h-11 w-full rounded-lg border bg-background p-3" value={target} onChange={event => {
        const targetId = event.target.value
        onChange({ ...document, learningPath: document.learningPath ? { ...document.learningPath, targetSlugs: targetId ? [targetId] : [] } : undefined, blocks: document.blocks.map(block => linked.has(block.id) && (block.type === 'question' || block.type === 'exit_ticket') ? { ...block, targetId: targetId || undefined } : block) })
      }}><option value="">{values.size > 1 ? 'Individual targets selected' : 'Choose a learning target'}</option>{targets.map(item => <option key={item.id} value={item.slug}>{item.statement}</option>)}</select>
    </label>
    <p className="text-xs text-muted-foreground">You can assign different targets to individual questions below. Preview the lesson, then publish and open access for a class from its workspace.</p>
    <button type="button" className="min-h-11 text-sm underline" onClick={() => { const next = { ...document }; delete next.interactiveNotebook; onChange(next) }}>Use standard layout and editable questions</button>
  </section>
}
