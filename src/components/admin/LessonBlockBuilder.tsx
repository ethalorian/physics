"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BlockDocument } from '@/data/content-blocks'
import PhysicsDiagram from '@/components/blocks/PhysicsDiagram'
import FigureGraph from '@/components/blocks/FigureGraph'

// ---------------------------------------------------------------------------
// Field schema — drives a generic editor for each block type
// ---------------------------------------------------------------------------
type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'stringlist' | 'terms' | 'simref' | 'visualgen'
interface FieldDef { key: string; label: string; kind: FieldKind; options?: string[]; placeholder?: string }
interface BlockDef { type: string; label: string; group: 'Teach' | 'Practice'; capture?: boolean; fields: FieldDef[] }

const BLOCK_DEFS: BlockDef[] = [
  { type: 'target', label: 'Learning target', group: 'Teach', fields: [
    { key: 'statement', label: 'I can… statement', kind: 'textarea' },
    { key: 'targetId', label: 'Target ID (optional)', kind: 'text' },
  ] },
  { type: 'asteroid_thread', label: 'Asteroid thread', group: 'Teach', fields: [
    { key: 'whatWeKnow', label: 'What we know (optional)', kind: 'textarea' },
    { key: 'connection', label: 'Connection to 2026-XJ', kind: 'textarea' },
  ] },
  { type: 'prose', label: 'Prose / reading', group: 'Teach', fields: [
    { key: 'markdown', label: 'Markdown (supports $KaTeX$)', kind: 'textarea' },
  ] },
  { type: 'vocab', label: 'Vocabulary', group: 'Teach', fields: [
    { key: 'terms', label: 'Terms', kind: 'terms' },
  ] },
  { type: 'worked_example', label: 'Worked example', group: 'Teach', fields: [
    { key: 'prompt', label: 'Prompt', kind: 'textarea' },
    { key: 'given', label: 'Given', kind: 'text' },
    { key: 'equation', label: 'Equation', kind: 'text' },
    { key: 'work', label: 'Work', kind: 'textarea' },
    { key: 'answer', label: 'Answer', kind: 'text' },
  ] },
  { type: 'callout', label: 'Callout', group: 'Teach', fields: [
    { key: 'variant', label: 'Variant', kind: 'select', options: ['note', 'tip', 'warning', 'misconception'] },
    { key: 'title', label: 'Title (optional)', kind: 'text' },
    { key: 'markdown', label: 'Body (markdown)', kind: 'textarea' },
  ] },
  { type: 'sentence_frame', label: 'Sentence frame', group: 'Teach', fields: [
    { key: 'frame', label: 'Frame (use ___ for blanks)', kind: 'text' },
    { key: 'wordBank', label: 'Word bank', kind: 'stringlist' },
  ] },
  { type: 'sim_embed', label: 'Simulation embed', group: 'Teach', fields: [
    { key: 'simulationSlug', label: 'Simulation', kind: 'simref' },
  ] },
  { type: 'equation_visualizer', label: 'Equation visualizer', group: 'Teach', fields: [] },
  { type: 'lesson_vocab', label: 'Lesson vocabulary', group: 'Teach', fields: [] },
  { type: 'figure', label: 'Figure / image', group: 'Teach', fields: [
    { key: 'src', label: 'Image URL', kind: 'text', placeholder: 'https://…' },
    { key: 'alt', label: 'Alt text (what the image shows)', kind: 'text' },
    { key: 'caption', label: 'Caption (optional)', kind: 'text' },
    { key: 'credit', label: 'Credit / source (optional)', kind: 'text' },
    { key: 'align', label: 'Size', kind: 'select', options: ['center', 'full'] },
  ] },
  { type: 'diagram', label: 'Physics diagram', group: 'Teach', fields: [
    { key: 'kind', label: 'Diagram type', kind: 'select', options: ['free_body', 'vectors', 'motion_map'] },
    { key: 'genPrompt', label: 'Describe it in plain English', kind: 'visualgen', placeholder: 'e.g. A box sitting still on a table: gravity pulling down and the table pushing up, equal size.' },
    { key: 'title', label: 'Title (optional override)', kind: 'text' },
    { key: 'caption', label: 'Caption (optional override)', kind: 'text' },
  ] },
  { type: 'graph', label: 'Read-the-graph', group: 'Teach', fields: [
    { key: 'genPrompt', label: 'Describe it in plain English', kind: 'visualgen', placeholder: 'e.g. Velocity vs. time for two carts: one steady at 6 m/s, one speeding up from 0 at 2 m/s^2, over 4 seconds.' },
    { key: 'title', label: 'Title (optional override)', kind: 'text' },
    { key: 'xLabel', label: 'X-axis label (optional override)', kind: 'text' },
    { key: 'yLabel', label: 'Y-axis label (optional override)', kind: 'text' },
  ] },
  { type: 'doodle', label: 'Doodle / sketch', group: 'Practice', capture: true, fields: [
    { key: 'instruction', label: 'Instruction', kind: 'text' },
    { key: 'prompts', label: 'Numbered prompts', kind: 'stringlist' },
  ] },
  { type: 'gewa', label: 'GEWA solve', group: 'Practice', capture: true, fields: [
    { key: 'prompt', label: 'Problem prompt', kind: 'textarea' },
    { key: 'givenHint', label: 'Given hint', kind: 'text' },
    { key: 'equationHint', label: 'Equation hint', kind: 'text' },
    { key: 'equationOptions', label: 'Equation bank', kind: 'stringlist' },
  ] },
  { type: 'equation_sandbox', label: 'Equation sandbox', group: 'Practice', capture: true, fields: [
    { key: 'prompt', label: 'Problem prompt', kind: 'textarea' },
  ] },
  { type: 'data_table', label: 'Data table + graph', group: 'Practice', capture: true, fields: [
    { key: 'columns', label: 'Column headers', kind: 'stringlist' },
    { key: 'rows', label: 'Blank rows', kind: 'number' },
    { key: 'patternPrompt', label: 'Pattern prompt', kind: 'text' },
  ] },
  { type: 'observation', label: 'Observation', group: 'Practice', capture: true, fields: [
    { key: 'patternPrompt', label: 'Pattern prompt', kind: 'text' },
    { key: 'interpretPrompt', label: 'Interpret prompt', kind: 'text' },
    { key: 'frame', label: 'Sentence frame (optional)', kind: 'text' },
  ] },
  { type: 'exit_ticket', label: 'Exit ticket', group: 'Practice', capture: true, fields: [
    { key: 'prompt', label: 'Prompt', kind: 'textarea' },
    { key: 'frame', label: 'Sentence frame (optional)', kind: 'text' },
  ] },
  { type: 'marzano', label: 'Marzano self-check', group: 'Practice', capture: true, fields: [
    { key: 'targetId', label: 'Target ID', kind: 'text' },
  ] },
]
const DEF_BY_TYPE = new Map<string, BlockDef>(BLOCK_DEFS.map((d): [string, BlockDef] => [d.type, d]))
const DAY_TYPES = ['ANCHOR', 'STANDARD', 'LAB', 'WORKSHOP', 'SYNTHESIS', 'TRANSFER']

interface BlockState { id: string; type: string; data: Record<string, unknown> }
interface TermRow { term: string; definition: string; cognate?: string }

const mkId = () => `b${Math.random().toString(36).slice(2, 8)}`

function fromDocument(doc: BlockDocument | undefined): BlockState[] {
  const blocks = doc?.blocks ?? []
  return blocks.map((b): BlockState => {
    const { id, type, ...rest } = b as unknown as { id?: string; type: string } & Record<string, unknown>
    return { id: id || mkId(), type, data: rest }
  })
}

const inputStyle = { background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' } as const

export default function LessonBlockBuilder({
  lessonId, lessonTitle, lessonSlug, initial,
}: { lessonId: string; lessonTitle: string; lessonSlug: string; initial?: BlockDocument }) {
  const [dayType, setDayType] = useState<string>(initial?.dayType ?? 'STANDARD')
  const [blocks, setBlocks] = useState<BlockState[]>(fromDocument(initial))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [sims, setSims] = useState<{ slug: string; title: string }[]>([])

  useEffect(() => {
    fetch('/api/simulations')
      .then((r) => r.json())
      .then((d: { simulations?: { slug: string; title: string }[] }) => {
        setSims((d.simulations ?? []).map((s) => ({ slug: s.slug, title: s.title })))
      })
      .catch(() => {})
  }, [])

  const addBlock = (type: string) => setBlocks((prev) => [...prev, { id: mkId(), type, data: {} }])
  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id))
  const moveBlock = (id: string, dir: -1 | 1) =>
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = prev.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const setField = (id: string, key: string, value: unknown) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b)))

  const save = async () => {
    setSaving(true); setMsg(null)
    const doc: BlockDocument = {
      schemaVersion: 1,
      dayType: dayType as BlockDocument['dayType'],
      blocks: blocks.map((b) => {
        const def = DEF_BY_TYPE.get(b.type)
        return { id: b.id, type: b.type, ...(def?.capture ? { capture: true } : {}), ...b.data } as unknown as BlockDocument['blocks'][number]
      }),
    }
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_blocks: doc }),
      })
      setMsg(res.ok ? 'Saved ✓' : 'Could not save')
    } catch { setMsg('Could not save') } finally { setSaving(false) }
  }

  return (
    <div className="max-w-4xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div>
          <Link href={`/admin/lessons/${lessonId}/edit`} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>← Lesson settings</Link>
          <h1 className="text-xl font-semibold tracking-tight mt-1">Build: {lessonTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={dayType} onChange={(e) => setDayType(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={inputStyle}>
            {DAY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <Link href={`/lessons/${lessonSlug}`} target="_blank" className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Preview ↗</Link>
          <button onClick={save} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>{saving ? 'Saving…' : 'Save lesson'}</button>
          {msg && <span className="text-sm" style={{ color: msg.includes('✓') ? 'var(--success)' : 'var(--destructive)' }}>{msg}</span>}
        </div>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Add blocks, fill them in, reorder, and save. Saving writes the lesson — no deploy needed.</p>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0,1fr) 220px' }}>
        {/* block list */}
        <div className="flex flex-col gap-3 order-2 md:order-1">
          {blocks.length === 0 && <p className="text-sm rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No blocks yet — add one from the palette.</p>}
          {blocks.map((b, i) => {
            const def = DEF_BY_TYPE.get(b.type)
            return (
              <div key={b.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold">{def?.label ?? b.type}{def?.capture ? <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--reward-foreground)' }}>captures work</span> : null}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveBlock(b.id, -1)} disabled={i === 0} className="text-sm px-2 py-1 rounded disabled:opacity-30" style={{ border: '1px solid var(--border)' }} aria-label="move up">↑</button>
                    <button onClick={() => moveBlock(b.id, 1)} disabled={i === blocks.length - 1} className="text-sm px-2 py-1 rounded disabled:opacity-30" style={{ border: '1px solid var(--border)' }} aria-label="move down">↓</button>
                    <button onClick={() => removeBlock(b.id)} className="text-sm px-2 py-1 rounded" style={{ border: '1px solid var(--border)', color: 'var(--destructive)' }} aria-label="remove">✕</button>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {(def?.fields ?? []).map((f) => (
                    <FieldEditor
                      key={f.key}
                      field={f}
                      value={b.data[f.key]}
                      sims={sims}
                      blockType={b.type}
                      blockData={b.data}
                      onChange={(v) => setField(b.id, f.key, v)}
                      onPatch={(patch) => Object.entries(patch).forEach(([k, v]) => setField(b.id, k, v))}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* palette */}
        <div className="order-1 md:order-2">
          <div className="rounded-xl border p-3 sticky top-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Add a block</div>
            {(['Teach', 'Practice'] as const).map((group) => (
              <div key={group} className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>{group}</div>
                <div className="flex flex-col gap-1.5">
                  {BLOCK_DEFS.filter((d) => d.group === group).map((d) => (
                    <button key={d.type} onClick={() => addBlock(d.type)} className="text-left text-sm rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>+ {d.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field editors
// ---------------------------------------------------------------------------
function FieldEditor({ field, value, onChange, sims, blockType, blockData, onPatch }: {
  field: FieldDef; value: unknown; onChange: (v: unknown) => void;
  sims?: { slug: string; title: string }[];
  blockType?: string; blockData?: Record<string, unknown>; onPatch?: (patch: Record<string, unknown>) => void;
}) {
  const label = <div className="text-xs font-semibold mb-1" style={{ color: 'var(--secondary-foreground)' }}>{field.label}</div>

  if (field.kind === 'visualgen') {
    return (
      <div>{label}
        <VisualGenField
          prompt={String(value ?? '')}
          placeholder={field.placeholder}
          target={blockType === 'graph' ? 'graph' : 'diagram'}
          diagramKind={String(blockData?.kind ?? 'free_body')}
          data={blockData ?? {}}
          onPromptChange={(p) => onChange(p)}
          onPatch={(patch) => onPatch?.(patch)}
        />
      </div>
    )
  }

  if (field.kind === 'simref') {
    const cur = String(value ?? '')
    const list = sims ?? []
    return (
      <div>{label}
        <select value={cur} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={inputStyle}>
          <option value="">Choose a simulation…</option>
          {cur && !list.some((s) => s.slug === cur) && <option value={cur}>{cur} (current)</option>}
          {list.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
        </select>
      </div>
    )
  }

  if (field.kind === 'textarea') {
    return <div>{label}<textarea value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-lg border p-2 text-sm" style={inputStyle} /></div>
  }
  if (field.kind === 'number') {
    return <div>{label}<input type="number" value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="w-full rounded-lg border p-2 text-sm" style={inputStyle} /></div>
  }
  if (field.kind === 'select') {
    return <div>{label}<select value={String(value ?? field.options?.[0] ?? '')} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={inputStyle}>{(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
  }
  if (field.kind === 'stringlist') {
    const list = Array.isArray(value) ? (value as string[]) : []
    return (
      <div>{label}
        <div className="flex flex-col gap-1.5">
          {list.map((item, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={item} onChange={(e) => { const next = list.slice(); next[i] = e.target.value; onChange(next) }} className="flex-1 rounded-lg border p-2 text-sm" style={inputStyle} />
              <button onClick={() => onChange(list.filter((_, j) => j !== i))} className="px-2 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={() => onChange([...list, ''])} className="mt-1.5 text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderStyle: 'dashed' }}>+ Add item</button>
      </div>
    )
  }
  if (field.kind === 'terms') {
    const terms = Array.isArray(value) ? (value as TermRow[]) : []
    const setTerm = (i: number, patch: Partial<TermRow>) => { const next = terms.map((t, j) => (j === i ? { ...t, ...patch } : t)); onChange(next) }
    return (
      <div>{label}
        <div className="flex flex-col gap-2">
          {terms.map((t, i) => (
            <div key={i} className="rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-1.5 mb-1.5">
                <input value={t.term ?? ''} onChange={(e) => setTerm(i, { term: e.target.value })} placeholder="term" className="flex-1 rounded border p-1.5 text-sm" style={inputStyle} />
                <input value={t.cognate ?? ''} onChange={(e) => setTerm(i, { cognate: e.target.value })} placeholder="cognate (optional)" className="rounded border p-1.5 text-sm" style={{ ...inputStyle, width: 150 }} />
                <button onClick={() => onChange(terms.filter((_, j) => j !== i))} className="px-2 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>✕</button>
              </div>
              <input value={t.definition ?? ''} onChange={(e) => setTerm(i, { definition: e.target.value })} placeholder="definition" className="w-full rounded border p-1.5 text-sm" style={inputStyle} />
            </div>
          ))}
        </div>
        <button onClick={() => onChange([...terms, { term: '', definition: '' }])} className="mt-1.5 text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderStyle: 'dashed' }}>+ Add term</button>
      </div>
    )
  }
  // text
  return <div>{label}<input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="w-full rounded-lg border p-2 text-sm" style={inputStyle} /></div>
}

// ---------------------------------------------------------------------------
// Visual generator — describe a diagram/graph in plain English, Claude builds
// the structured data, and a live preview renders right here. No JSON.
// ---------------------------------------------------------------------------
function VisualGenField({
  prompt, placeholder, target, diagramKind, data, onPromptChange, onPatch,
}: {
  prompt: string
  placeholder?: string
  target: 'diagram' | 'graph'
  diagramKind: string
  data: Record<string, unknown>
  onPromptChange: (p: string) => void
  onPatch: (patch: Record<string, unknown>) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const generate = async () => {
    if (!prompt.trim()) { setErr('Describe the visual first.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/blocks/generate-visual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, diagramKind, prompt }),
      })
      const j = await res.json()
      if (!res.ok) { setErr(j.error || 'Could not generate'); return }
      onPatch((j.block ?? {}) as Record<string, unknown>)
    } catch { setErr('Could not generate') } finally { setBusy(false) }
  }

  // live preview from whatever structured data is on the block now
  const forces = Array.isArray(data.forces) ? (data.forces as Parameters<typeof PhysicsDiagram>[0]['forces']) : undefined
  const vectors = Array.isArray(data.vectors) ? (data.vectors as Parameters<typeof PhysicsDiagram>[0]['vectors']) : undefined
  const dots = Array.isArray(data.dots) ? (data.dots as number[]) : undefined
  const series = Array.isArray(data.series) ? (data.series as Parameters<typeof FigureGraph>[0]['series']) : undefined
  const hasDiagram = !!(forces?.length || vectors?.length || dots?.length)
  const hasGraph = !!series?.length

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border p-2 text-sm"
        style={inputStyle}
      />
      <div className="flex items-center gap-2 mt-1.5">
        <button
          onClick={generate}
          disabled={busy}
          className="text-xs font-bold rounded-lg px-3 py-1.5"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Building…' : (hasDiagram || hasGraph ? 'Regenerate' : 'Generate')}
        </button>
        {err && <span className="text-xs" style={{ color: 'var(--destructive)' }}>{err}</span>}
        {!err && (hasDiagram || hasGraph) && <span className="text-xs" style={{ color: 'var(--success)' }}>Built ✓ — edit the prompt and regenerate, or tweak the title below.</span>}
      </div>
      {(hasDiagram || hasGraph) && (
        <div className="mt-2 rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Preview</div>
          {target === 'diagram' && hasDiagram && (
            <PhysicsDiagram
              kind={(data.kind as 'free_body' | 'vectors' | 'motion_map') ?? 'free_body'}
              title={typeof data.title === 'string' ? data.title : undefined}
              caption={typeof data.caption === 'string' ? data.caption : undefined}
              forces={forces}
              vectors={vectors}
              dots={dots}
              showResultant={data.showResultant === true}
            />
          )}
          {target === 'graph' && hasGraph && (
            <FigureGraph
              title={typeof data.title === 'string' ? data.title : undefined}
              xLabel={typeof data.xLabel === 'string' ? data.xLabel : undefined}
              yLabel={typeof data.yLabel === 'string' ? data.yLabel : undefined}
              series={series!}
            />
          )}
        </div>
      )}
    </div>
  )
}
