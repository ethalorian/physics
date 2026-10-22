'use client'
import type { BlockDocument } from '@/data/content-blocks'
export default function ReflectionLessonSettings({ document, onChange, targets }: { document: BlockDocument; onChange: (doc: BlockDocument) => void; targets: { id: string; slug: string; statement: string }[] }) {
  if (!document.reflection) return null
  const values = new Set(document.blocks.filter(b => 'capture' in b && b.capture).map(b => b.targetId ?? ''))
  return <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Metacognitive assignment settings">
    <h3 className="font-semibold">{document.reflection.kind === 'manga' ? 'Manga page' : 'Short story'} · Learning about learning</h3>
    <p className="text-sm text-muted-foreground">Review the creative product and the student’s change in thinking, evidence, learning strategy, and next step. Edit the prompts below for your week. Assign this directly, or add the released assignment to a student choice section.</p>
    <label className="block text-sm">Physics target for this week<select className="mt-1 min-h-11 w-full rounded-lg border bg-background p-3" value={values.size === 1 ? [...values][0] : ''} onChange={e => onChange({ ...document, blocks: document.blocks.map(b => (b.type === 'sketch' || b.type === 'exit_ticket' || b.type === 'question') ? { ...b, targetId: e.target.value || undefined } : b) })}><option value="">{values.size > 1 ? 'Individual targets selected' : 'Choose a physics target'}</option>{targets.map(t => <option value={t.slug} key={t.id}>{t.statement}</option>)}</select></label>
    <p className="text-sm text-muted-foreground">Teacher feedback and grades use the existing review tools. Completing the assignment does not automatically award a mastery rating.</p>
  </section>
}
