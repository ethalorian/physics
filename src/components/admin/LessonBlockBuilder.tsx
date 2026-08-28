"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BlockDocument, type ContentBlock } from '@/data/content-blocks'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import PhysicsDiagram from '@/components/blocks/PhysicsDiagram'
import FigureGraph from '@/components/blocks/FigureGraph'
import { PHYSICS_FORMULAS, FORMULA_CATEGORIES, MCAS_SYMBOLS } from '@/data/physics-reference'

// ---------------------------------------------------------------------------
// Field schema — drives a generic editor for each block type
// ---------------------------------------------------------------------------
type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'stringlist' | 'terms' | 'simref' | 'visualgen' | 'imageupload' | 'formulapicker' | 'solvefor' | 'toggle' | 'svggen'
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
  { type: 'procedure', label: 'Build steps / procedure', group: 'Teach', fields: [
    { key: 'title', label: 'Title (e.g. "Build steps 10–15")', kind: 'text' },
    { key: 'intro', label: 'Intro line (optional, markdown)', kind: 'textarea' },
    { key: 'steps', label: 'Steps (one per line)', kind: 'stringlist' },
    { key: 'startNumber', label: 'First step number (default 1)', kind: 'number' },
  ] },
  { type: 'sentence_frame', label: 'Sentence frame', group: 'Teach', fields: [
    { key: 'frame', label: 'Frame (use ___ for blanks)', kind: 'text' },
    { key: 'wordBank', label: 'Word bank', kind: 'stringlist' },
  ] },
  { type: 'sim_embed', label: 'Simulation embed', group: 'Teach', fields: [
    { key: 'simulationSlug', label: 'Simulation', kind: 'simref' },
  ] },
  { type: 'animation_3d', label: '3D animation (watch & predict)', group: 'Teach', fields: [
    { key: 'animationSlug', label: 'Animation slug (e.g. approach-geometry)', kind: 'text' },
    { key: 'caption', label: 'Caption — frame what to watch for (optional)', kind: 'textarea' },
  ] },
  { type: 'equation_visualizer', label: 'Equation visualizer', group: 'Teach', fields: [] },
  { type: 'lesson_vocab', label: 'Lesson vocabulary', group: 'Teach', fields: [] },
  { type: 'figure', label: 'Figure / image', group: 'Teach', fields: [
    { key: 'src', label: 'Image — upload a file or paste a URL', kind: 'imageupload', placeholder: 'https://…' },
    { key: 'alt', label: 'Alt text (what the image shows)', kind: 'text' },
    { key: 'caption', label: 'Caption (optional)', kind: 'text' },
    { key: 'credit', label: 'Credit / source (optional)', kind: 'text' },
    { key: 'align', label: 'Size', kind: 'select', options: ['center', 'full'] },
  ] },
  { type: 'diagram', label: 'Physics diagram', group: 'Teach', fields: [
    { key: 'kind', label: 'Diagram type', kind: 'select', options: ['free_body', 'vectors', 'motion_map', 'circuit', 'energy_chain', 'friction_asymmetry'] },
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
  { type: 'sketch', label: 'Sketch / draw (with optional trace-over)', group: 'Practice', capture: true, fields: [
    { key: 'instruction', label: 'Task — what to draw and how', kind: 'textarea' },
    { key: 'prompts', label: 'Checklist bullets (shown under the canvas)', kind: 'stringlist' },
    { key: 'scaffoldSvg', label: 'Trace-over background (describe it, or paste SVG)', kind: 'svggen' },
    { key: 'grid', label: 'Coordinate grid behind the canvas', kind: 'toggle' },
    { key: 'xLabel', label: 'X-axis label (if grid on)', kind: 'text' },
    { key: 'yLabel', label: 'Y-axis label (if grid on)', kind: 'text' },
  ] },
  { type: 'lab_notebook', label: 'Lab notebook (sketch + log)', group: 'Practice', capture: true, fields: [
    { key: 'instruction', label: 'Instruction', kind: 'text' },
    { key: 'fields', label: 'Reasoning prompts (boxes)', kind: 'stringlist' },
  ] },
  { type: 'gewa', label: 'GEWA solve', group: 'Practice', capture: true, fields: [
    { key: 'prompt', label: 'Problem prompt', kind: 'textarea' },
    { key: 'givenHint', label: 'Given hint', kind: 'text' },
    { key: 'equationHint', label: 'Equation hint', kind: 'text' },
    { key: 'equationIds', label: 'Formula bank — pick the formulas students may use', kind: 'formulapicker' },
    { key: 'solveFor', label: 'Solve for (the unknown to isolate)', kind: 'solvefor' },
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
  { type: 'concept_exercise', label: 'Read & practice (textbook + exercise)', group: 'Practice', capture: true, fields: [
    { key: 'chapter', label: 'Chapter number (must be loaded in concept_exercises)', kind: 'number' },
    { key: 'title', label: 'Title (optional override)', kind: 'text' },
    { key: 'sectionIds', label: 'Assigned sections (e.g. 4.4) — blank = whole chapter', kind: 'stringlist' },
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
  // Transient UI feedback: which block just changed (pulse) / is leaving (collapse).
  const [flashId, setFlashId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const flash = (id: string) => { setFlashId(id); window.setTimeout(() => setFlashId((c) => (c === id ? null : c)), 850) }

  // ── Canvas: each block renders live & interactive; play state is throwaway ──
  const [viewAs, setViewAs] = useState<'author' | 'cpa' | 'honors'>('author')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [play, setPlay] = useState<BlockResponseMap>({})
  const playSave = (id: string, _type: string, value: unknown) =>
    setPlay((m) => ({ ...m, [id]: { response: value, created_at: new Date().toISOString() } }))

  // ── Drag-to-reorder + clickable outline ──
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const reorder = (srcId: string, destId: string) => setBlocks((prev) => {
    const from = prev.findIndex((b) => b.id === srcId); const to = prev.findIndex((b) => b.id === destId)
    if (from < 0 || to < 0 || from === to) return prev
    const next = prev.slice(); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next
  })
  const jumpTo = (id: string) => { document.querySelector(`[data-bid="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(id) }
  const snippetOf = (d: Record<string, unknown>): string => {
    const raw = (d.title ?? d.statement ?? d.prompt ?? (typeof d.markdown === 'string' ? (d.markdown as string).replace(/[#*_`>]/g, '') : '')) as string
    return raw ? raw.trim().slice(0, 30) : ''
  }

  const liveOf = (b: BlockState): ContentBlock => {
    const def = DEF_BY_TYPE.get(b.type)
    return { id: b.id, type: b.type, ...(def?.capture ? { capture: true } : {}), ...b.data } as unknown as ContentBlock
  }
  const seesBlock = (track: 'cpa' | 'honors', b: BlockState) => {
    const g = b.data.visibilityTrack as string | undefined
    return !g || g === track
  }
  // Track identity colors — used on the card rail, the corner badge, the
  // outline chips, and the toggle buttons, so CPA vs Honors reads at a glance.
  const TRACK_UI: Record<'cpa' | 'honors', { label: string; color: string; fg: string }> = {
    cpa: { label: 'CPA only', color: 'var(--success)', fg: 'var(--success)' },
    honors: { label: 'Honors only', color: 'var(--reward)', fg: 'var(--reward-foreground)' },
  }
  const trackOf = (b: BlockState): 'cpa' | 'honors' | undefined => {
    const g = b.data.visibilityTrack as string | undefined
    return g === 'cpa' || g === 'honors' ? g : undefined
  }

  useEffect(() => {
    fetch('/api/simulations')
      .then((r) => r.json())
      .then((d: { simulations?: { slug: string; title: string }[] }) => {
        setSims((d.simulations ?? []).map((s) => ({ slug: s.slug, title: s.title })))
      })
      .catch(() => {})
  }, [])

  const addBlock = (type: string) => {
    const id = mkId()
    setBlocks((prev) => [...prev, { id, type, data: {} }])
    flash(id)
    // Let it mount, then scroll the new card into view so the add is unmistakable.
    window.setTimeout(() => { document.querySelector(`[data-bid="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 40)
  }
  const removeBlock = (id: string) => {
    // Play the collapse-out, then actually drop it from state.
    setRemovingId(id)
    setSelectedId((c) => (c === id ? null : c))
    window.setTimeout(() => {
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      setRemovingId((c) => (c === id ? null : c))
    }, 260)
  }
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
    <div className="max-w-7xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <style>{`
        @keyframes bbFlash { 0% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--primary) 70%, transparent); background: color-mix(in oklch, var(--primary) 9%, var(--card)); } 100% { box-shadow: 0 0 0 12px transparent; background: var(--card); } }
        @keyframes bbOut { from { opacity: 1; max-height: 1200px; } to { opacity: 0; transform: translateX(12px); max-height: 0; margin-top: -12px; padding-top: 0; padding-bottom: 0; } }
        @keyframes bbPress { 50% { transform: scale(0.94); } }
        .bb-btn:active { animation: bbPress 0.15s ease; }
      `}</style>
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
          <span className="text-xs tabular-nums rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }} title="Blocks every track shares · CPA-only · Honors-only">
            {blocks.filter((b) => !trackOf(b)).length} shared
            <span style={{ color: 'var(--success)' }}> · {blocks.filter((b) => trackOf(b) === 'cpa').length} CPA</span>
            <span style={{ color: 'var(--reward-foreground)' }}> · {blocks.filter((b) => trackOf(b) === 'honors').length} Honors</span>
          </span>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }} title="Preview the canvas as a student of this track">
            {(['author', 'cpa', 'honors'] as const).map((v) => {
              const on = viewAs === v
              return (
                <button key={v} onClick={() => setViewAs(v)} className="text-xs font-semibold px-2.5 py-2"
                  style={{ background: on ? 'var(--primary)' : 'transparent', color: on ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
                  {v === 'author' ? 'Author' : v === 'cpa' ? 'CPA' : 'Honors'}
                </button>
              )
            })}
          </div>
          <button onClick={() => setPlay({})} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }} title="Clear your play answers">Reset play</button>
          <Link href={`/lessons/${lessonSlug}`} target="_blank" className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Open ↗</Link>
          <button onClick={save} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>{saving ? 'Saving…' : 'Save lesson'}</button>
          {msg && <span className="text-sm" style={{ color: msg.includes('✓') ? 'var(--success)' : 'var(--destructive)' }}>{msg}</span>}
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Your lesson is the canvas. Click a block to edit it in the panel; the edit you make appears instantly. Saving writes the lesson — no deploy needed.</p>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: selectedId ? 'minmax(0,1fr) 196px 360px' : 'minmax(0,1fr) 196px' }}>
        {/* CANVAS — the lesson as students see it, the star */}
        <div className="flex flex-col gap-3">
          {blocks.length === 0 && <p className="text-sm rounded-xl border p-10 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No blocks yet — add one from the palette on the right.</p>}
          {blocks.map((b) => {
            const removing = removingId === b.id
            const flashing = flashId === b.id
            const sel = selectedId === b.id
            const hidden = viewAs !== 'author' && !seesBlock(viewAs, b)
            return (
              <div key={b.id} data-bid={b.id} className="group relative rounded-xl"
                onClick={() => setSelectedId(b.id)}
                onDragOver={(e) => { if (dragId && dragId !== b.id) { e.preventDefault(); if (overId !== b.id) setOverId(b.id) } }}
                onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, b.id); setDragId(null); setOverId(null) }}
                style={{
                  border: `1px solid ${sel || overId === b.id ? 'var(--primary)' : trackOf(b) ? `color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 45%, transparent)` : 'transparent'}`,
                  borderLeft: trackOf(b) ? `4px solid ${TRACK_UI[trackOf(b)!].color}` : undefined,
                  boxShadow: sel ? '0 0 0 1px var(--primary)' : overId === b.id ? '0 -3px 0 0 var(--primary)' : undefined,
                  opacity: dragId === b.id ? 0.4 : hidden ? 0.42 : 1,
                  background: trackOf(b) ? `color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 4%, var(--card))` : 'var(--card)', padding: 12, cursor: 'pointer',
                  overflow: removing ? 'hidden' : undefined,
                  animation: removing ? 'bbOut 0.26s ease forwards' : flashing ? 'bbFlash 0.85s ease' : undefined,
                }}>
                {/* hover / selected chrome */}
                <div className={`absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border px-1 py-0.5 transition-opacity ${sel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
                  <button draggable
                    onDragStart={(e) => { setDragId(b.id); const card = e.currentTarget.closest('[data-bid]') as HTMLElement | null; if (card) e.dataTransfer.setDragImage(card, 16, 16); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { setDragId(null); setOverId(null) }}
                    title="Drag to reorder" aria-label="drag to reorder"
                    className="bb-btn text-base px-1 leading-none" style={{ cursor: 'grab', color: 'var(--muted-foreground)', border: 'none', background: 'none' }}>⠿</button>
                  <div className="flex rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }} title="Who sees this block">
                    {([['All', undefined], ['CPA', 'cpa'], ['Honors', 'honors']] as const).map(([lbl, val]) => {
                      const on = ((b.data.visibilityTrack as string | undefined) ?? undefined) === val
                      const onBg = val === 'cpa' ? 'var(--success)' : val === 'honors' ? 'var(--reward)' : 'var(--primary)'
                      const onFg = val === 'honors' ? 'var(--reward-foreground)' : '#fff'
                      return <button key={lbl} type="button" onClick={() => setField(b.id, 'visibilityTrack', val)} className="text-[10px] font-semibold px-1.5 py-0.5" style={{ background: on ? onBg : 'transparent', color: on ? onFg : 'var(--muted-foreground)' }}>{lbl}</button>
                    })}
                  </div>
                  <button onClick={() => removeBlock(b.id)} className="bb-btn text-sm px-1.5 rounded" style={{ border: 'none', background: 'none', color: 'var(--destructive)' }} aria-label="remove">✕</button>
                </div>
                <BlockRenderer blocks={[liveOf(b)]} lessonId={`play:${lessonId}`} responses={play} save={playSave} />
                {hidden && <div className="absolute left-2 top-2 z-10 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>hidden for {viewAs}</div>}
                {!hidden && trackOf(b) && (
                  <div className="absolute left-2 top-2 z-10 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5"
                    style={{ background: `color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 18%, var(--card))`, color: TRACK_UI[trackOf(b)!].fg, border: `1px solid color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 50%, transparent)` }}>
                    {TRACK_UI[trackOf(b)!].label}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* RIGHT RAIL — outline + palette */}
        <div className="sticky top-4 flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Outline · {blocks.length}</div>
            {blocks.length === 0
              ? <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No blocks yet.</p>
              : <ol className="flex flex-col gap-0.5">
                  {blocks.map((b, i) => {
                    const def = DEF_BY_TYPE.get(b.type); const snip = snippetOf(b.data); const ht = b.data.visibilityTrack as string | undefined
                    const sel = selectedId === b.id
                    return (
                      <li key={b.id}>
                        <button onClick={() => { setSelectedId(b.id); jumpTo(b.id) }} className="w-full text-left text-xs rounded px-1.5 py-1 flex items-center gap-1.5"
                          style={{ background: sel ? 'color-mix(in oklch, var(--primary) 16%, transparent)' : flashId === b.id ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}>
                          <span style={{ color: 'var(--muted-foreground)', minWidth: 14 }}>{i + 1}</span>
                          <span className="truncate flex-1"><span style={{ fontWeight: 600 }}>{def?.label ?? b.type}</span>{snip && <span style={{ color: 'var(--muted-foreground)' }}> · {snip}</span>}</span>
                          {ht === 'honors' && <span title="Honors only" className="rounded px-1" style={{ background: 'color-mix(in oklch, var(--reward) 22%, transparent)', color: 'var(--reward-foreground)', fontWeight: 700 }}>H</span>}
                          {ht === 'cpa' && <span title="CPA only" className="rounded px-1" style={{ background: 'color-mix(in oklch, var(--success) 22%, transparent)', color: 'var(--success)', fontWeight: 700 }}>C</span>}
                        </button>
                      </li>
                    )
                  })}
                </ol>}
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Add a block</div>
            {(['Teach', 'Practice'] as const).map((group) => (
              <div key={group} className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>{group}</div>
                <div className="flex flex-col gap-1.5">
                  {BLOCK_DEFS.filter((d) => d.group === group).map((d) => (
                    <button key={d.type} onClick={() => addBlock(d.type)} className="bb-btn text-left text-sm rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>+ {d.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDE PANEL — edit the selected block */}
        {selectedId && (() => {
          const b = blocks.find((x) => x.id === selectedId)
          if (!b) return null
          const def = DEF_BY_TYPE.get(b.type)
          return (
            <div className="sticky top-4 rounded-xl border" style={{ borderColor: 'var(--primary)', background: 'var(--card)', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
              <div className="flex items-center justify-between gap-2 p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-bold truncate">Edit · {def?.label ?? b.type}{def?.capture ? <span className="ml-1.5 text-xs font-semibold" style={{ color: 'var(--reward-foreground)' }}>captures work</span> : null}</span>
                <button onClick={() => setSelectedId(null)} className="bb-btn text-sm px-2 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }} aria-label="close editor">✕</button>
              </div>
              <div className="p-3 flex flex-col gap-3">
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Who sees this block</div>
                  <div className="flex rounded-md border overflow-hidden w-max" style={{ borderColor: 'var(--border)' }}>
                    {([['All tracks', undefined], ['CPA only', 'cpa'], ['Honors only', 'honors']] as const).map(([lbl, val]) => {
                      const on = ((b.data.visibilityTrack as string | undefined) ?? undefined) === val
                      const onBg = val === 'cpa' ? 'var(--success)' : val === 'honors' ? 'var(--reward)' : 'var(--primary)'
                      const onFg = val === 'honors' ? 'var(--reward-foreground)' : '#fff'
                      return <button key={lbl} type="button" onClick={() => setField(b.id, 'visibilityTrack', val)} className="text-xs font-semibold px-2.5 py-1" style={{ background: on ? onBg : 'transparent', color: on ? onFg : 'var(--muted-foreground)' }}>{lbl}</button>
                    })}
                  </div>
                </div>
                {(def?.fields ?? []).length === 0
                  ? <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>This block has no editable fields.</p>
                  : (def?.fields ?? []).map((f) => (
                      <FieldEditor key={f.key} field={f} value={b.data[f.key]} sims={sims} blockType={b.type} blockData={b.data}
                        onChange={(v) => setField(b.id, f.key, v)}
                        onPatch={(patch) => Object.entries(patch).forEach(([k, v]) => setField(b.id, k, v))} />
                    ))}
                <button onClick={() => removeBlock(b.id)} className="mt-1 text-xs font-semibold rounded-lg border px-3 py-2 self-start" style={{ borderColor: 'color-mix(in oklch, var(--destructive) 40%, var(--border))', color: 'var(--destructive)', background: 'transparent' }}>Delete block</button>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field editors
// ---------------------------------------------------------------------------
// Image field: paste a URL OR upload a file to the lesson-media bucket. On a
// successful upload we drop the returned public URL straight into the field.
function ImageUploadField({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const upload = async (file: File) => {
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'figures')
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) { setErr(d.error || 'Upload failed'); return }
      onChange(d.url)
    } catch {
      setErr('Could not upload the file')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg border p-2 text-sm" style={inputStyle} />
        <label className="text-xs font-semibold rounded-lg border px-3 py-2 whitespace-nowrap" style={{ borderColor: 'var(--border)', color: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 8%, transparent)', cursor: busy ? 'default' : 'pointer' }}>
          {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} style={{ display: 'none' }} />
        </label>
      </div>
      {err && <div className="text-xs mt-1" style={{ color: 'var(--destructive)' }}>{err}</div>}
      {value && !err && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ marginTop: 8, maxHeight: 120, borderRadius: 8, border: '1px solid var(--border)' }} />
      )}
    </div>
  )
}

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

  if (field.kind === 'imageupload') {
    return <div>{label}<ImageUploadField value={String(value ?? '')} placeholder={field.placeholder} onChange={(v) => onChange(v)} /></div>
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
  if (field.kind === 'solvefor') {
    return (
      <div>{label}
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || undefined)} className="w-full rounded-lg border p-2 text-sm" style={inputStyle}>
          <option value="">(auto — the formula&apos;s own subject)</option>
          {MCAS_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    )
  }
  if (field.kind === 'formulapicker') {
    const ids = Array.isArray(value) ? (value as string[]) : []
    const toggle = (id: string) => onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
    return (
      <div>{label}
        <p className="text-[11px] mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Check the formulas relevant to this unit — only those appear in the student&apos;s bank. Leave all unchecked to show every formula.</p>
        <div className="flex flex-col gap-2">
          {FORMULA_CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--primary)' }}>{cat}</div>
              <div className="flex flex-wrap gap-1.5">
                {PHYSICS_FORMULAS.filter((f) => f.category === cat).map((f) => {
                  const on = ids.includes(f.id)
                  return (
                    <button key={f.id} type="button" onClick={() => toggle(f.id)} title={f.name} className="rounded-md px-2 py-1 text-xs"
                      style={{ border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)', color: 'var(--foreground)', fontFamily: 'Georgia, serif' }}>
                      {on ? '✓ ' : ''}{f.display}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (field.kind === 'toggle') {
    return (
      <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--secondary-foreground)', cursor: 'pointer' }}>
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    )
  }
  if (field.kind === 'svggen') {
    return <div>{label}<SvgGenField value={String(value ?? '')} onChange={(v) => onChange(v || undefined)} /></div>
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
// Generate (or paste) a faint, traceable SVG that sits behind a sketch canvas —
// e.g. a race-track oval the student traces to show distance vs. displacement.
function SvgGenField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const generate = async () => {
    if (!prompt.trim()) { setErr('Describe what to trace over first.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/blocks/generate-visual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'scaffold', prompt }),
      })
      const j = await res.json()
      if (!res.ok) { setErr(j.error || 'Could not generate'); return }
      if (typeof j.block?.scaffoldSvg === 'string') onChange(j.block.scaffoldSvg)
      else setErr('No SVG returned')
    } catch { setErr('Could not generate') } finally { setBusy(false) }
  }
  return (
    <div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
        placeholder="Describe a faint drawing to trace over — e.g. “an oval race track seen from above with a start/finish line at the top”"
        className="w-full rounded-lg border p-2 text-sm" style={inputStyle} />
      <div className="flex items-center gap-2 mt-1.5">
        <button onClick={generate} disabled={busy} className="text-xs font-bold rounded-lg px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Drawing…' : (value ? 'Regenerate SVG' : 'Generate SVG')}
        </button>
        {value && <button onClick={() => onChange('')} className="text-xs rounded-lg border px-2 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Clear</button>}
        {err && <span className="text-xs" style={{ color: 'var(--destructive)' }}>{err}</span>}
        {!err && value && <span className="text-xs" style={{ color: 'var(--success)' }}>Set ✓ — students trace over this.</span>}
      </div>
      {value && (
        <div className="mt-2 rounded-lg border" style={{ borderColor: 'var(--border)', maxWidth: 360, aspectRatio: '16 / 9', overflow: 'hidden', background: '#fff' }} dangerouslySetInnerHTML={{ __html: value }} />
      )}
      <details className="mt-2">
        <summary className="text-xs" style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}>or paste your own SVG</summary>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="<svg …>…</svg>" className="w-full rounded-lg border p-2 text-xs mt-1" style={{ ...inputStyle, fontFamily: 'monospace' }} />
      </details>
    </div>
  )
}

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
  const components = Array.isArray(data.components) ? (data.components as Parameters<typeof PhysicsDiagram>[0]['components']) : undefined
  const links = Array.isArray(data.links) ? (data.links as Parameters<typeof PhysicsDiagram>[0]['links']) : undefined
  const hasFrictionMags = typeof data.leftMag === 'number' && typeof data.rightMag === 'number'
  const series = Array.isArray(data.series) ? (data.series as Parameters<typeof FigureGraph>[0]['series']) : undefined
  const hasDiagram = !!(forces?.length || vectors?.length || dots?.length || components?.length || links?.length || hasFrictionMags)
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
              kind={(data.kind as 'free_body' | 'vectors' | 'motion_map' | 'circuit' | 'energy_chain' | 'friction_asymmetry') ?? 'free_body'}
              title={typeof data.title === 'string' ? data.title : undefined}
              caption={typeof data.caption === 'string' ? data.caption : undefined}
              forces={forces}
              vectors={vectors}
              dots={dots}
              showResultant={data.showResultant === true}
              components={Array.isArray(data.components) ? (data.components as Parameters<typeof PhysicsDiagram>[0]['components']) : undefined}
              links={Array.isArray(data.links) ? (data.links as Parameters<typeof PhysicsDiagram>[0]['links']) : undefined}
              leftMag={typeof data.leftMag === 'number' ? data.leftMag : undefined}
              rightMag={typeof data.rightMag === 'number' ? data.rightMag : undefined}
              veerDir={data.veerDir === 'left' || data.veerDir === 'right' ? data.veerDir : undefined}
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
