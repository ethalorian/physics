"use client"

import { useState, useEffect, useRef, Component, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import MathMarkdown from '@/components/MathMarkdown'
import { ContentBlock, BlockType, isBlockComplete, type DiagramForce, type DiagramVector, type GraphSeries, type CircuitComponent, type EnergyChainLink, type DiagramScene, type LabNotebookBlock } from '@/data/content-blocks'
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
  const [touched, setTouched] = useState(false)
  // Re-sync when the saved value loads/changes (responses fetch resolves after
  // mount), but never clobber text the student has started typing.
  useEffect(() => { if (!touched) setText(value ?? '') }, [value, touched])
  const canSave = text.trim().length > 0
  return (
    <div>
      <p className="text-sm mb-1" style={{ color: C.indigo }}>{prompt}</p>
      {frame && <p className="text-sm italic mb-1" style={{ color: C.muted }}>{frame}</p>}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); setTouched(true) }}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-md border p-2 text-sm"
        style={{ borderColor: C.hairline, color: C.indigo, background: 'var(--card)' }}
      />
      <div className="flex items-center gap-2 mt-1">
        {/* Only persist real content — an empty save would create a blank
            "completed" card and a hollow grading record. */}
        <button
          onClick={() => { if (!canSave) return; onSave(text.trim()); setSaved(true); setTouched(false) }}
          disabled={!canSave}
          className="text-xs rounded-md border px-3 py-1 disabled:opacity-50"
          style={{ borderColor: C.hairline, color: C.indigo, background: 'var(--card)', cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          Save
        </button>
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
// Step-driven worked example, framed as GEWA so students see solved problems in
// the EXACT structure they fill in (Given → Equation → Work → Answer). Each step
// is a numbered, color-coded node on a connector rail; math renders via MathMarkdown.
const GEWA_STEPS = [
  { key: 'given', letter: 'G', label: 'Given', hint: 'pull out what you know', color: 'var(--primary)' },
  { key: 'equation', letter: 'E', label: 'Equation', hint: 'the relationship', color: '#3A6FA5' },
  { key: 'work', letter: 'W', label: 'Work', hint: 'substitute & solve', color: 'var(--reward)' },
  { key: 'answer', letter: 'A', label: 'Answer', hint: 'with units, boxed', color: 'var(--success)' },
] as const
function GewaWorkedExample({ prompt, given, equation, work, answer }: { prompt: string; given?: string; equation?: string; work?: string; answer?: string }) {
  const vals: Record<string, string | undefined> = { given, equation, work, answer }
  const shown = GEWA_STEPS.filter((s) => vals[s.key])
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>Worked example · GEWA</div>
      <div className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}><MathMarkdown content={prompt} /></div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} className="space-y-3">
        {shown.map((s, i) => {
          const isAnswer = s.key === 'answer'
          return (
            <li key={s.key} className="relative" style={{ paddingLeft: 46 }}>
              {i < shown.length - 1 && <span style={{ position: 'absolute', left: 16, top: 36, bottom: -14, width: 2, background: 'var(--border)' }} />}
              <span className="grid place-items-center rounded-full text-sm font-bold" style={{ position: 'absolute', left: 0, top: 0, width: 34, height: 34, background: `color-mix(in oklch, ${s.color} 18%, var(--card))`, color: s.color, border: `2px solid ${s.color}` }}>{s.letter}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</span>
                <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{s.hint}</span>
              </div>
              <div className="text-sm mt-1 rounded-lg px-3 py-2" style={{ background: isAnswer ? 'color-mix(in oklch, var(--success) 12%, var(--card))' : 'var(--secondary)', color: 'var(--foreground)', fontWeight: isAnswer ? 600 : 400 }}>
                <MathMarkdown content={vals[s.key] as string} />
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// A physics diagram rendered as the annotation background behind a sketch.
// Title/caption are dropped so only the figure sits under the student's ink.
function DiagramBackground({ scene }: { scene: DiagramScene }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#FFFFFF' }}>
      <PhysicsDiagram
        kind={scene.kind}
        forces={scene.forces}
        vectors={scene.vectors}
        showResultant={scene.showResultant}
        dots={scene.dots}
        components={scene.components}
        links={scene.links}
        leftMag={scene.leftMag}
        rightMag={scene.rightMag}
        veerDir={scene.veerDir}
      />
    </div>
  )
}

// Lab-notebook capture: an annotatable sketch + labeled reasoning boxes. Either
// the sketch's "Save drawing" or a reasoning box blur persists the WHOLE response
// ({ strokes, fields }) so thinking and work are logged together.
const LAB_DEFAULT_FIELDS = ['What I did', 'What I observed', 'What it means']
function LabNotebook({ b, saved, save }: { b: LabNotebookBlock; saved: unknown; save: SaveFn }) {
  const fields = b.fields && b.fields.length ? b.fields : LAB_DEFAULT_FIELDS
  const prev = (saved as { strokes?: Stroke[]; fields?: Record<string, string> } | undefined) ?? {}
  const strokesRef = useRef<Stroke[]>(prev.strokes ?? [])
  const [text, setText] = useState<Record<string, string>>(prev.fields ?? {})
  const [savedFlag, setSavedFlag] = useState(false)
  const persist = (strokes: Stroke[], t: Record<string, string>) => {
    save(b.id, 'lab_notebook', { strokes, fields: t })
    setSavedFlag(true)
  }
  return (
    <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <p className="text-sm font-medium" style={{ color: 'var(--secondary-foreground)' }}>{b.instruction}</p>
      <DoodleCanvas
        instruction="Sketch / show your work"
        palette={b.palette}
        grid={b.grid}
        backgroundNode={b.backgroundDiagram ? <DiagramBackground scene={b.backgroundDiagram} /> : undefined}
        initialStrokes={prev.strokes ?? []}
        onSave={(strokes) => { strokesRef.current = strokes; persist(strokes, text) }}
      />
      <div className="space-y-2">
        {fields.map((label) => (
          <label key={label} className="block">
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
            <textarea
              value={text[label] ?? ''}
              onChange={(e) => { setText((p) => ({ ...p, [label]: e.target.value })); setSavedFlag(false) }}
              onBlur={() => persist(strokesRef.current, text)}
              rows={2}
              className="mt-1 w-full rounded-lg border px-2.5 py-1.5 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
            />
          </label>
        ))}
      </div>
      {savedFlag && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
    </div>
  )
}

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
      return <GewaWorkedExample prompt={b.prompt} given={b.given} equation={b.equation} work={b.work} answer={b.answer} />
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
          grid={b.grid}
          backgroundNode={b.backgroundDiagram ? <DiagramBackground scene={b.backgroundDiagram} /> : undefined}
          initialStrokes={((saved as { strokes?: Stroke[] })?.strokes) ?? []}
          onSave={(strokes) => save(b.id, 'doodle', { strokes })}
        />
      )
    case 'lab_notebook':
      return <LabNotebook b={b} saved={saved} save={save} />
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
      const components = (b.components ?? (s.components as CircuitComponent[] | undefined)) ?? []
      const links = (b.links ?? (s.links as EnergyChainLink[] | undefined)) ?? []
      const leftMag = b.leftMag ?? (s.leftMag as number | undefined)
      const rightMag = b.rightMag ?? (s.rightMag as number | undefined)
      const veerDir = b.veerDir ?? (s.veerDir as 'left' | 'right' | undefined)
      return (
        <PhysicsDiagram
          kind={b.kind}
          title={b.title}
          caption={b.caption}
          forces={forces}
          vectors={vectors}
          dots={dots}
          showResultant={showResultant}
          components={components}
          links={links}
          leftMag={leftMag}
          rightMag={rightMag}
          veerDir={veerDir}
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
      return <ConceptExercise chapter={b.chapter} sectionIds={b.sectionIds} value={saved as ConceptValue | undefined} onSave={(v) => save(b.id, 'concept_exercise', v)} />
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
