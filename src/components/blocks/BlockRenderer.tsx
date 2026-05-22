"use client"

import { useState } from 'react'
import MathMarkdown from '@/components/MathMarkdown'
import { ContentBlock } from '@/data/content-blocks'
import DoodleCanvas, { Stroke } from './DoodleCanvas'
import { useBlockResponses } from './useBlockResponses'

const C = {
  indigo: '#2D2A4A',
  muted: '#6B6890',
  lavender: '#9B8EC4',
  sage: '#7FA68B',
  periwinkle: '#B8C4DB',
  hairline: '#E7E4F0',
  tint: '#F4F2FA',
}

type SaveFn = (blockId: string, blockType: string, response: unknown) => void

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
      <div className="text-sm font-medium" style={{ color: '#4A4470' }}>Where are you right now?</div>
      <div className="flex flex-wrap gap-2 mt-2">
        {levels.map((l) => (
          <button
            key={l.v}
            onClick={() => onSave(l.v)}
            className="text-sm rounded-md border px-3 py-1.5"
            style={{
              borderColor: C.hairline,
              background: value === l.v ? C.sage : '#fff',
              color: value === l.v ? '#fff' : C.indigo,
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
        style={{ borderColor: C.hairline, color: C.indigo, background: '#fff' }}
      />
      <div className="flex items-center gap-2 mt-1">
        <button onClick={() => { onSave(text); setSaved(true) }} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.hairline, color: C.indigo, background: '#fff' }}>Save</button>
        {saved && <span className="text-xs" style={{ color: C.sage }}>Saved ✓</span>}
      </div>
    </div>
  )
}

interface GewaValue { given?: string; equation?: string; work?: string; answer?: string }
function GewaInput({ prompt, givenHint, equationHint, value, onSave }: { prompt: string; givenHint?: string; equationHint?: string; value?: GewaValue; onSave: (v: GewaValue) => void }) {
  const [g, setG] = useState<GewaValue>(value ?? {})
  const [saved, setSaved] = useState(false)
  const field = (key: keyof GewaValue, label: string, hint?: string) => (
    <div>
      <div className="text-xs font-medium" style={{ color: '#4A4470' }}>{label}{hint ? ` — ${hint}` : ''}</div>
      <textarea
        value={g[key] ?? ''}
        onChange={(e) => { setG((p) => ({ ...p, [key]: e.target.value })); setSaved(false) }}
        rows={key === 'work' ? 4 : 2}
        className="w-full rounded-md border p-2 text-sm mt-1"
        style={{ borderColor: C.hairline, color: C.indigo, background: '#fff' }}
      />
    </div>
  )
  return (
    <div>
      <p className="text-sm mb-2" style={{ color: C.indigo }}>{prompt}</p>
      <div className="space-y-2">
        {field('given', 'GIVEN', givenHint)}
        {field('equation', 'EQUATION', equationHint)}
        {field('work', 'WORK')}
        {field('answer', 'ANSWER')}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button onClick={() => { onSave(g); setSaved(true) }} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.hairline, color: C.indigo, background: '#fff' }}>Save work</button>
        {saved && <span className="text-xs" style={{ color: C.sage }}>Saved ✓</span>}
      </div>
    </div>
  )
}

function SimEmbed({ slug, title }: { slug: string; title?: string }) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.hairline }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: C.tint }}>
        <span className="text-sm font-medium" style={{ color: '#4A4470' }}>{title ?? 'Interactive simulation'}</span>
        <a href={`/simulations/${slug}`} target="_blank" rel="noreferrer" className="text-xs" style={{ color: C.lavender }}>Open full screen ↗</a>
      </div>
      <iframe src={`/simulations/${slug}`} title={title ?? slug} style={{ width: '100%', height: 520, border: 'none' }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border p-4" style={{ borderColor: C.hairline, background: '#fff' }}>{children}</div>
}

function renderBlock(b: ContentBlock, saved: unknown, save: SaveFn) {
  switch (b.type) {
    case 'target':
      return (
        <div className="rounded-lg p-3" style={{ background: C.tint, borderLeft: `4px solid ${C.lavender}` }}>
          <div className="text-xs font-medium" style={{ color: C.muted }}>Today&apos;s target</div>
          <div className="text-sm font-medium mt-0.5" style={{ color: C.indigo }}>{b.statement}</div>
        </div>
      )
    case 'asteroid_thread':
      return (
        <Card>
          <div className="text-xs font-medium mb-1" style={{ color: C.lavender }}>Asteroid 2026-XJ</div>
          {b.whatWeKnow && <p className="text-sm" style={{ color: C.muted }}>{b.whatWeKnow}</p>}
          <p className="text-sm mt-1" style={{ color: C.indigo }}>{b.connection}</p>
        </Card>
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
        <Card>
          <div className="text-xs font-medium mb-2" style={{ color: '#4A4470' }}>Key terms</div>
          <dl className="space-y-1.5">
            {b.terms.map((t, i) => (
              <div key={i} className="text-sm">
                <span style={{ color: C.indigo, fontWeight: 500 }}>{t.term}</span>
                {t.cognate && <span style={{ color: C.muted }}> · {t.cognate}</span>}
                <span style={{ color: C.muted }}> — {t.definition}</span>
              </div>
            ))}
          </dl>
        </Card>
      )
    case 'worked_example':
      return (
        <Card>
          <div className="text-xs font-medium mb-1" style={{ color: '#4A4470' }}>Worked example</div>
          <p className="text-sm mb-1" style={{ color: C.indigo }}>{b.prompt}</p>
          <div className="text-sm" style={{ color: C.muted }}>
            {b.given && <div><b>Given:</b> {b.given}</div>}
            {b.equation && <div><b>Equation:</b> {b.equation}</div>}
            {b.work && <div><b>Work:</b> {b.work}</div>}
            {b.answer && <div style={{ color: C.sage }}><b>Answer:</b> {b.answer}</div>}
          </div>
        </Card>
      )
    case 'sentence_frame':
      return (
        <div className="rounded-lg p-3" style={{ background: C.tint }}>
          <p className="text-sm italic" style={{ color: C.indigo }}>{b.frame}</p>
          {b.wordBank && b.wordBank.length > 0 && (
            <p className="text-xs mt-1" style={{ color: C.muted }}>Word bank: {b.wordBank.join(' · ')}</p>
          )}
        </div>
      )
    case 'sim_embed':
      return <SimEmbed slug={b.simulationSlug} />
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
      return <Card><MarzanoInput value={saved as number | undefined} onSave={(n) => save(b.id, 'marzano', n)} /></Card>
    case 'exit_ticket':
      return <Card><TextCapture prompt={b.prompt} frame={b.frame} value={saved as string | undefined} onSave={(t) => save(b.id, 'exit_ticket', t)} /></Card>
    case 'gewa':
      return <Card><GewaInput prompt={b.prompt} givenHint={b.givenHint} equationHint={b.equationHint} value={saved as GewaValue | undefined} onSave={(v) => save(b.id, 'gewa', v)} /></Card>
    case 'observation':
      return (
        <Card>
          <TextCapture prompt={b.patternPrompt} frame={b.frame} value={(saved as { pattern?: string })?.pattern} onSave={(t) => save(b.id, 'observation', { ...(saved as object), pattern: t })} />
          <div className="h-3" />
          <TextCapture prompt={b.interpretPrompt} value={(saved as { interpret?: string })?.interpret} onSave={(t) => save(b.id, 'observation', { ...(saved as object), interpret: t })} />
        </Card>
      )
    default:
      return null
  }
}

export default function BlockRenderer({ blocks, lessonId }: { blocks: ContentBlock[]; lessonId: string }) {
  const { responses, save } = useBlockResponses(lessonId)
  return (
    <div className="space-y-5">
      {blocks.map((b) => (
        <div key={b.id}>{renderBlock(b, responses[b.id]?.response, save)}</div>
      ))}
    </div>
  )
}
