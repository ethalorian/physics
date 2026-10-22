'use client'
import type { BlockDocument, ExitTicketBlock } from '@/data/content-blocks'
import { NOVEL_BOOK, createGraphicNovelAssignment, novelQuestionBank } from '@/lib/graphic-novel-assignments'
import { BLOOMS, demand, type AssessmentDemand } from '@/lib/assessment-demand'

const field = 'mt-1 block min-h-11 w-full rounded-lg border bg-background p-3'
export default function GraphicNovelSettings({ document, onChange, targets = [], published = false }: {
  document: BlockDocument; onChange: (doc: BlockDocument) => void
  targets?: { id: string; slug: string; statement: string }[]; published?: boolean
}) {
  const chapter = document.reflection?.chapter ?? 1
  const questions = document.blocks.filter((b): b is ExitTicketBlock => b.type === 'exit_ticket')
  const update = (id: string, patch: Partial<ExitTicketBlock>) => onChange({ ...document, blocks: document.blocks.map(b => b.id === id ? { ...b, ...patch } as ExitTicketBlock : b) })
  return <section className="space-y-5" aria-label="Bloom’s and DOK assignment builder">
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Chapter and questions</h2>
      <p className="mt-2 text-sm text-muted-foreground">Choose a chapter for 1–3 reasoning questions. Keep the language short and clear.</p>
      <label className="mt-4 block text-sm font-medium">Chapter<select className={field} disabled={published} value={chapter} onChange={e => {
        const next = createGraphicNovelAssignment(Number(e.target.value), Math.min(3, Math.max(1, questions.length)))
        onChange({ ...document, ...next })
      }}>{NOVEL_BOOK.chapters.map(c => <option key={c.day} value={c.day}>{c.day}. {c.title}</option>)}</select></label>
      <p className="mt-2 text-sm text-muted-foreground">{published ? 'Create a new assignment to use a different chapter.' : 'Changing the chapter replaces these questions. Choose the learning targets for the new chapter.'}</p>
    </div>
    {questions.map((q, i) => {
      const planning = q.demand ?? demand('Analyze', 2, 'Uses chapter evidence to explain the physics.')
      return <fieldset key={q.id} className="space-y-4 rounded-xl border bg-card p-5">
        <legend className="px-2 text-lg font-semibold">Question {i + 1}</legend>
        <label className="block text-sm font-medium">Student question<textarea className={field} rows={3} required maxLength={2000} value={q.prompt} onChange={e => update(q.id, { prompt: e.target.value })}/></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Bloom’s thinking<select className={field} value={planning.blooms} onChange={e => update(q.id, { demand: { ...planning, blooms: e.target.value as AssessmentDemand['blooms'] } })}>{BLOOMS.map(b => <option key={b}>{b}</option>)}</select></label>
          <label className="text-sm font-medium">Depth of Knowledge<select className={field} value={planning.dok} onChange={e => update(q.id, { demand: { ...planning, dok: Number(e.target.value) as AssessmentDemand['dok'] } })}>{[1,2,3,4].map(d => <option key={d} value={d}>DOK {d}</option>)}</select></label>
        </div>
        <label className="block text-sm font-medium">Learning target<select className={field} required value={q.targetId ?? ''} onChange={e => update(q.id, { targetId: e.target.value || undefined })}><option value="">Choose a physics target</option>{targets.map(t => <option key={t.id} value={q.targetId === t.slug ? t.slug : t.id}>{t.statement}</option>)}</select></label>
        <label className="block text-sm font-medium">Evidence to look for<textarea className={field} rows={2} required value={planning.evidence} maxLength={500} onChange={e => update(q.id, { demand: { ...planning, evidence: e.target.value } })}/></label>
        <button type="button" className="min-h-11 text-sm underline disabled:opacity-50" disabled={questions.length <= 1 || published} onClick={() => onChange({ ...document, blocks: document.blocks.filter(b => b.id !== q.id) })}>Remove question {i + 1}</button>
      </fieldset>
    })}
    <button type="button" className="min-h-11 rounded-lg border px-4 disabled:opacity-50" disabled={questions.length >= 3 || published} onClick={() => {
      const next = novelQuestionBank(chapter).find(q => !questions.some(b => b.id === q.id))
      if (next) onChange({ ...document, blocks: [...document.blocks, { ...next, targetId: questions[0]?.targetId }] })
    }}>Add a reasoning question</button>
    <p className="text-sm text-muted-foreground">Bloom’s describes the thinking; DOK describes the depth of reasoning. These are teacher planning notes. Students see the chapter and questions.</p>
    {published && <p className="text-sm text-muted-foreground">The question count stays fixed after publication to preserve assigned work. You can edit wording and planning above.</p>}
  </section>
}
