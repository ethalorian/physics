"use client"

import { useState, useEffect, Component, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import MathMarkdown from '@/components/MathMarkdown'
import { ContentBlock, BlockType, isBlockComplete, type DiagramForce, type DiagramVector, type GraphSeries } from '@/data/content-blocks'
import DoodleCanvas, { Stroke } from './DoodleCanvas'
import PhysicsDiagram from './PhysicsDiagram'
import type { ConceptValue } from './ConceptExercise'
import GewaInteractive, { type GewaValue } from './GewaInteractive'
import EquationSandbox, { type SandboxValue } from './EquationSandbox'
import DataBlockInteractive, { type DataValue } from './DataBlockInteractive'
import { useBlockResponses, type BlockResponseMap } from './useBlockResponses'
import { SIM_COMPONENTS } from '@/components/simulations/registry'
import {
  Target, Orbit, BookA, Calculator, MessageSquareQuote, FlaskConical, Sigma,
  Pencil, Gauge, Ticket, PencilRuler, Table, Eye, HelpCircle, ClipboardCheck,
  Rocket, Check, Shapes, LineChart as LineChartIcon, BookOpen, type LucideIcon,
} from 'lucide-react'

// Heavy, self-contained interactive component — rendered natively (no iframe),
// lazy-loaded so it doesn't bloat lessons that don't use it.
const EquationVisualizer = dynamic(() => import('@/components/vocabulary/EquationVisualizer'), { ssr: false, loading: () => null })
const LessonVocabView = dynamic(() => import('./LessonVocabView'), { ssr: false, loading: () => null })
// recharts is heavy — lazy-load the read-the-graph block so text-only lessons stay light.
const FigureGraph = dynamic(() => import('./FigureGraph'), { ssr: false, loading: () => null })
// react-pdf is client-only + heavy — lazy-load the reader/exercise block.
const ConceptExercise = dynamic(() => import('./ConceptExercise'), { ssr: false, loading: () => null })

const C = {
  indigo: 'var(--foreground)',
  muted: 'var(--muted-foreground)',
  lavender: 'var(--primary)',
  sage: 'var(--success)',
  periwinkle: 'var(--muted-foreground)',
  hairline: 'var(--border)',
  tint: 'var(--secondary)',
}

type SaveFn = (blockId: string, blockType: string, response: unknown) => void

// ---------------------------------------------------------------------------
// Block identity: each block belongs to a "kind of thinking" (K/R/S/P) and
// carries that domain's accent + an icon + a friendly label. Color is drawn
// from the app's own palette so the playful flow stays on-brand and calm:
//   K Knowledge → lavender (--primary)   R Reasoning → quiet periwinkle
//   S Skill     → sage (--success)       P Product   → gold (--reward)
//   meta        → muted (reflection / self-check)
// ---------------------------------------------------------------------------

type Domain = 'K' | 'R' | 'S' | 'P' | 'meta'

const ACCENT: Record<Domain, string> = {
  K: 'var(--primary)',
  R: 'oklch(0.58 0.10 255)',
  S: 'var(--success)',
  P: 'var(--reward)',
  meta: 'var(--muted-foreground)',
}
// Icon-chip foreground: gold is light, so its chip needs dark text.
const CHIP_FG: Record<Domain, string> = {
  K: 'var(--primary-foreground)', R: 'white', S: 'white', P: 'var(--reward-foreground)', meta: 'var(--card)',
}
const DOMAIN_WORD: Record<Domain, string> = { K: 'Knowledge', R: 'Reasoning', S: 'Skill', P: 'Product', meta: 'Reflect' }

interface Meta { label: string; domain: Domain; Icon: LucideIcon }
const BLOCK_META: Partial<Record<BlockType, Meta>> = {
  target: { label: "Today's target", domain: 'K', Icon: Target },
  asteroid_thread: { label: 'Asteroid 2026-XJ', domain: 'K', Icon: Orbit },
  vocab: { label: 'Key terms', domain: 'K', Icon: BookA },
  worked_example: { label: 'Worked example', domain: 'S', Icon: Calculator },
  sentence_frame: { label: 'Sentence frame', domain: 'R', Icon: MessageSquareQuote },
  sim_embed: { label: 'Simulation', domain: 'S', Icon: FlaskConical },
  equation_visualizer: { label: 'Equation explorer', domain: 'S', Icon: Sigma },
  doodle: { label: 'Sketch it', domain: 'S', Icon: Pencil },
  marzano: { label: 'Self-check', domain: 'meta', Icon: Gauge },
  exit_ticket: { label: 'Exit ticket', domain: 'P', Icon: Ticket },
  gewa: { label: 'Solve it', domain: 'S', Icon: PencilRuler },
  equation_sandbox: { label: 'Equation sandbox', domain: 'S', Icon: Sigma },
  data_table: { label: 'Collect data', domain: 'R', Icon: Table },
  observation: { label: 'Observe & interpret', domain: 'R', Icon: Eye },
  question: { label: 'Question', domain: 'R', Icon: HelpCircle },
  self_assessment: { label: 'Self-assessment', domain: 'meta', Icon: ClipboardCheck },
  transfer_prompt: { label: 'Transfer task', domain: 'P', Icon: Rocket },
  diagram: { label: 'Diagram', domain: 'R', Icon: Shapes },
  graph: { label: 'Read the graph', domain: 'R', Icon: LineChartIcon },
  concept_exercise: { label: 'Read & practice', domain: 'R', Icon: BookOpen },
}
// Blocks that read best as clean editorial content — no colored shell.
const BARE: Set<BlockType> = new Set(['prose', 'callout', 'lesson_vocab', 'figure'])

function BlockShell({ meta, done, children }: { meta: Meta; done?: boolean; children: ReactNode }) {
  const accent = ACCENT[meta.domain]
  const { Icon } = meta
  return (
    <div style={{ borderRadius: 16, border: `0.5px solid color-mix(in oklch, ${accent} 28%, var(--border))`, overflow: 'hidden', background: 'var(--card)' }}>
      <div className="flex items-center gap-2" style={{ padding: '8px 14px', background: `color-mix(in oklch, ${accent} 12%, var(--card))` }}>
        <span className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: '50%', background: accent, color: CHIP_FG[meta.domain] }}>
          <Icon size={15} />
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: `color-mix(in oklch, ${accent} 55%, var(--foreground))` }}>{meta.label}</span>
        <span className="ml-auto flex items-center gap-2">
          {done && (
            <span className="inline-flex items-center gap-1" style={{ fontSize: 11, color: 'var(--success)' }}>
              <Check size={13} /> done
            </span>
          )}
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: `color-mix(in oklch, ${accent} 50%, var(--muted-foreground))` }}>
            {DOMAIN_WORD[meta.domain]}
          </span>
        </span>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Interactive (data-capturing) sub-components
// ---------------------------------------------------------------------------

function MarzanoInput({ value, onSave }: { value?: number; onSave: (n: number) => void }) {
  const levels = [
    { v: 1, label: 'Not yet' },
    { v: 2, label: 'Almost' },
    { v: 3, label: 'Got it' },
  ]
  return (
    <div>
      <div className="text-sm font-medium" style={{ color: 'var(--secondary-foreground)' }}>Where are you right now?</div>
      <div className="flex flex-wrap gap-2 mt-2">
        {levels.map((l) => (
          <button
            key={l.v}
            onClick={() => onSave(l.v)}
            className="text-sm rounded-md border px-3 py-1.5"
            style={{
              borderColor: C.hairline,
              background: value === l.v ? C.sage : 'var(--card)',
              color: value === l.v ? 'var(--card)' : C.indigo,
            }}
          >
            {l.v} · {l.label}
          </button>
        ))}
      </div>
      <p className="text-xs mt-1" style={{ color: C.muted }}>
        Your own check-in — separate from your teacher&apos;s mastery record.
      </p>
    </div>
  )
}

function TextCapture({
  prompt, frame, placeholder, value, onSave,
}: { prompt: string; frame?: string; placeholder?: string; value?: string; onSave: (t: string) => void }) {
  const [text, setText] = useState(value ?? '')
  const [saved, setSaved] = useState(false)
  return (
    <div>
      <p className="text-sm mb-1" style={{ color: C.indigo }}>{prompt}</p>
      {frame && <p className="text-sm italic mb-1" style={{ color: C.muted }}>{frame}</p>}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false) }}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-md border p-2 text-sm"
        style={{ borderColor: C.hairline, color: C.indigo, background: 'var(--card)' }}
      />
      <div className="flex items-center gap-2 mt-1">
        <button onClick={() => { onSave(text); setSaved(true) }} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.hairline, color: C.indigo, background: 'var(--card)' }}>Save</button>
        {saved && <span className="text-xs" style={{ color: C.sage }}>Saved ✓</span>}
      </div>
    </div>
  )
}

// Render the simulation inside an IFRAME pointing at a chrome-free embed route.
// The iframe is a hard layout boundary (the sim's elements can't escape into the
// lesson) and a separate document (a sim crash can't take down the lesson). The
// embedded SimLab posts its real height back so the frame sizes to fit — no more
// fixed 640px clipping. (Sims not yet migrated keep the fallback height.)
function SimEmbed({ slug }: { slug: string }) {
  const [height, setHeight] = useState(560)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data
      if (d && d.type === 'sim-embed-height' && d.slug === slug && typeof d.height === 'number') {
        setHeight(Math.max(240, Math.ceil(d.height)))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [slug])

  if (!SIM_COMPONENTS[slug]) {
    return (
      <div className="text-sm" style={{ color: C.muted }}>
        Simulation &ldquo;{slug}&rdquo; isn&apos;t available.
      </div>
    )
  }
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `0.5px solid ${C.hairline}` }}>
      <iframe
        src={`/embed/sim/${slug}`}
        title={`Simulation: ${slug}`}
        loading="lazy"
        style={{ width: '100%', height, border: 'none', display: 'block', background: 'var(--card)' }}
      />
    </div>
  )
}

// Authors may hand-author a diagram/graph via a JSON `spec` string (the builder
// textarea) instead of structured fields. These helpers prefer structured
// fields, else parse the spec, and NEVER throw — a bad spec just yields empty
// data and the BlockBoundary keeps the lesson alive.
function parseSpec(spec?: string): Record<string, unknown> {
  if (!spec) return {}
  try { const v = JSON.parse(spec); return v && typeof v === 'object' ? (v as Record<string, unknown>) : {} }
  catch { return {} }
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

// Returns the INNER body of a block (no card chrome). The shell — when the
// block type warrants one — provides the rounded card + domain header.
function renderBody(b: ContentBlock, saved: unknown, save: SaveFn, lessonId: string) {
  switch (b.type) {
    case 'target':
      return <div className="text-base font-medium" style={{ color: C.indigo }}>{b.statement}</div>
    case 'asteroid_thread':
      return (
        <>
          {b.whatWeKnow && <p className="text-sm" style={{ color: C.muted }}>{b.whatWeKnow}</p>}
          <p className="text-sm mt-1" style={{ color: C.indigo }}>{b.connection}</p>
        </>
      )
    case 'prose':
      return <div className="markdown-content"><MathMarkdown content={b.markdown} /></div>
    case 'callout': {
      const tone = b.variant === 'warning' || b.variant === 'misconception' ? '#C08B8B' : C.lavender
      return (
        <div className="rounded-lg p-3" style={{ background: C.tint, borderLeft: `4px solid ${tone}` }}>
          {b.title && <div className="text-sm font-medium" style={{ color: C.indigo }}>{b.title}</div>}
          <div className="text-sm" style={{ color: C.indigo }}><MathMarkdown content={b.markdown} /></div>
        </div>
      )
    }
    case 'vocab':
      return (
        <dl className="space-y-1.5">
          {(b.terms ?? []).map((t, i) => (
            <div key={i} className="text-sm">
              <span style={{ color: C.indigo, fontWeight: 500 }}>{t.term}</span>
              {t.cognate && <span style={{ color: C.muted }}> · {t.cognate}</span>}
              <span style={{ color: C.muted }}> — {t.definition}</span>
            </div>
          ))}
        </dl>
      )
    case 'worked_example':
      return (
        <>
          <p className="text-sm mb-1" style={{ color: C.indigo }}>{b.prompt}</p>
          <div className="text-sm" style={{ color: C.muted }}>
            {b.given && <div><b>Given:</b> {b.given}</div>}
            {b.equation && <div><b>Equation:</b> {b.equation}</div>}
            {b.work && <div><b>Work:</b> {b.work}</div>}
            {b.answer && <div style={{ color: C.sage }}><b>Answer:</b> {b.answer}</div>}
          </div>
        </>
      )
    case 'sentence_frame':
      return (
        <>
          <p className="text-sm italic" style={{ color: C.indigo }}>{b.frame}</p>
          {b.wordBank && b.wordBank.length > 0 && (
            <p className="text-xs mt-1" style={{ color: C.muted }}>Word bank: {b.wordBank.join(' · ')}</p>
          )}
        </>
      )
    case 'sim_embed':
      return <SimEmbed slug={b.simulationSlug} />
    case 'equation_visualizer':
      return <EquationVisualizer />
    case 'lesson_vocab':
      return <LessonVocabView lessonId={lessonId} />
    case 'doodle':
      return (
        <DoodleCanvas
          instruction={b.instruction}
          prompts={b.prompts}
          scaffoldSvg={b.scaffoldSvg}
          imageUrl={b.imageUrl}
          palette={b.palette}
          initialStrokes={((saved as { strokes?: Stroke[] })?.strokes) ?? []}
          onSave={(strokes) => save(b.id, 'doodle', { strokes })}
        />
      )
    case 'marzano':
      return <MarzanoInput value={saved as number | undefined} onSave={(n) => save(b.id, 'marzano', n)} />
    case 'exit_ticket':
      return <TextCapture prompt={b.prompt} frame={b.frame} value={saved as string | undefined} onSave={(t) => save(b.id, 'exit_ticket', t)} />
    case 'gewa':
      return <GewaInteractive prompt={b.prompt} givenHint={b.givenHint} equationHint={b.equationHint} equationOptions={b.equationOptions} value={saved as GewaValue | undefined} onSave={(v) => save(b.id, 'gewa', v)} />
    case 'equation_sandbox':
      return <EquationSandbox prompt={b.prompt} variables={b.variables} value={saved as SandboxValue | undefined} onSave={(v) => save(b.id, 'equation_sandbox', v)} />
    case 'data_table':
      return <DataBlockInteractive columns={b.columns} rows={b.rows} plot={b.plot} xCol={b.xCol} yCol={b.yCol} patternPrompt={b.patternPrompt} value={saved as DataValue | undefined} onSave={(v) => save(b.id, 'data_table', v)} />
    case 'observation':
      return (
        <>
          <TextCapture prompt={b.patternPrompt} frame={b.frame} value={(saved as { pattern?: string })?.pattern} onSave={(t) => save(b.id, 'observation', { ...(saved as object), pattern: t })} />
          <div className="h-3" />
          <TextCapture prompt={b.interpretPrompt} value={(saved as { interpret?: string })?.interpret} onSave={(t) => save(b.id, 'observation', { ...(saved as object), interpret: t })} />
        </>
      )
    case 'figure': {
      if (!b.src) return null
      const full = b.align === 'full'
      return (
        <figure style={{ margin: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.src}
            alt={b.alt}
            loading="lazy"
            style={{ display: 'block', width: full ? '100%' : 'auto', maxWidth: '100%', margin: full ? 0 : '0 auto', borderRadius: 12, border: `0.5px solid ${C.hairline}` }}
          />
          {b.caption && <figcaption className="text-sm mt-1.5" style={{ color: C.muted }}>{b.caption}</figcaption>}
          {b.credit && <figcaption className="text-xs mt-0.5" style={{ color: C.muted, opacity: 0.8 }}>{b.credit}</figcaption>}
        </figure>
      )
    }
    case 'diagram': {
      const s = parseSpec(b.spec)
      const forces = (b.forces ?? (s.forces as DiagramForce[] | undefined)) ?? []
      const vectors = (b.vectors ?? (s.vectors as DiagramVector[] | undefined)) ?? []
      const dots = (b.dots ?? (s.dots as number[] | undefined)) ?? []
      const showResultant = b.showResultant ?? (s.showResultant as boolean | undefined)
      return (
        <PhysicsDiagram
          kind={b.kind}
          title={b.title}
          caption={b.caption}
          forces={forces}
          vectors={vectors}
          dots={dots}
          showResultant={showResultant}
        />
      )
    }
    case 'graph': {
      const s = parseSpec(b.spec)
      const series = (b.series ?? (s.series as GraphSeries[] | undefined)) ?? []
      if (series.length === 0) return null
      return <FigureGraph title={b.title} xLabel={b.xLabel} yLabel={b.yLabel} series={series} />
    }
    case 'concept_exercise':
      return <ConceptExercise chapter={b.chapter} value={saved as ConceptValue | undefined} onSave={(v) => save(b.id, 'concept_exercise', v)} />
    default:
      return null
  }
}

function RenderedBlock({ b, saved, save, lessonId }: { b: ContentBlock; saved: unknown; save: SaveFn; lessonId: string }) {
  const body = renderBody(b, saved, save, lessonId)
  if (body === null) return null
  const meta = BLOCK_META[b.type]
  if (!meta || BARE.has(b.type)) return <>{body}</>
  const done = isBlockComplete(b, saved)
  return <BlockShell meta={meta} done={done}>{body}</BlockShell>
}

// One block crashing must never take down the whole lesson — contain it.
class BlockBoundary extends Component<{ label?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) { console.error('Block render error', this.props.label, error) }
  render() {
    if (this.state.failed) {
      return (
        <div className="text-sm rounded-lg border p-3" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}>
          This part of the lesson couldn&apos;t load.
        </div>
      )
    }
    return this.props.children
  }
}

export default function BlockRenderer({
  blocks, lessonId, responses: extResponses, save: extSave,
}: {
  blocks: ContentBlock[]
  lessonId: string
  responses?: BlockResponseMap
  save?: SaveFn
}) {
  // Internal store is the fallback for callers that don't lift response state
  // (e.g. standalone previews). When the viewer passes responses+save down, the
  // header progress bar and the renderer share one source of truth.
  const internal = useBlockResponses(lessonId)
  const responses = extResponses ?? internal.responses
  const save = extSave ?? internal.save
  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <div key={b.id}>
          <BlockBoundary label={b.type}>
            <RenderedBlock b={b} saved={responses[b.id]?.response} save={save} lessonId={lessonId} />
          </BlockBoundary>
        </div>
      ))}
    </div>
  )
}
