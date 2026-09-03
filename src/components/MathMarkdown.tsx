"use client"
import { useEffect, useRef, createElement, Children, type ReactNode, type HTMLAttributes } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import GlossaryTerm from '@/components/lessons/GlossaryTerm'

export interface GlossaryEntry {
  term: string
  definition: string
  cognate?: string
  /** SEI tier (1 everyday · 2 academic · 3 physics) — shown in the popover. */
  tier?: number
  partOfSpeech?: string
  example?: string
}

interface MathMarkdownProps {
  content: string
  /** Retained for back-compat with existing call sites; no longer used now that
   *  rendering is delimiter-driven (we never guess where math is). */
  skipAutoDetect?: boolean
  /** When provided, the first occurrence of each key term in the prose gets a
   *  dotted underline + a definition popover (lesson reading screen). */
  glossary?: GlossaryEntry[]
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Build ReactMarkdown component overrides that decorate the FIRST occurrence of
 * each key term (in reading order) with a GlossaryTerm popover. Only plain text
 * children are scanned, so math spans, code, and links are never touched. The
 * `used` set is shared across the render pass so a term is linked once, not on
 * every mention.
 */
function buildGlossaryComponents(glossary: GlossaryEntry[]): Components | undefined {
  const entries = glossary.filter((e) => e.term && e.term.trim().length > 1)
  if (entries.length === 0) return undefined
  const byLower = new Map(entries.map((e) => [e.term.toLowerCase(), e]))
  const sorted = [...entries].sort((a, b) => b.term.length - a.term.length)
  const regex = new RegExp(`\\b(${sorted.map((e) => esc(e.term)).join('|')})\\b`, 'gi')
  const used = new Set<string>()

  const decorateText = (text: string, keyBase: string): ReactNode[] => {
    const out: ReactNode[] = []
    let last = 0
    let m: RegExpExecArray | null
    regex.lastIndex = 0
    let n = 0
    while ((m = regex.exec(text)) !== null) {
      const matched = m[0]
      const lower = matched.toLowerCase()
      const entry = byLower.get(lower)
      if (entry && !used.has(lower)) {
        used.add(lower)
        if (m.index > last) out.push(text.slice(last, m.index))
        out.push(
          <GlossaryTerm key={`${keyBase}-${n}`} term={entry.term} definition={entry.definition} cognate={entry.cognate} tier={entry.tier} partOfSpeech={entry.partOfSpeech} example={entry.example}>
            {matched}
          </GlossaryTerm>,
        )
        last = m.index + matched.length
        n += 1
      }
    }
    out.push(text.slice(last))
    return out
  }

  const decorate = (children: ReactNode, keyBase: string): ReactNode =>
    Children.toArray(children).map((child, i) =>
      typeof child === 'string' ? decorateText(child, `${keyBase}-${i}`) : child,
    )

  // Decorate the text-bearing block/inline elements; skip code/pre so literals
  // stay literal. `node` is dropped before the rest is spread onto the element.
  type DecoProps = { node?: unknown; children?: ReactNode } & HTMLAttributes<HTMLElement>
  const wrap = (tag: 'p' | 'li' | 'td' | 'strong' | 'em') => {
    const Decorated = ({ children, ...rest }: DecoProps) => {
      delete (rest as { node?: unknown }).node
      return createElement(tag, rest as HTMLAttributes<HTMLElement>, decorate(children, tag))
    }
    Decorated.displayName = `Glossary_${tag}`
    return Decorated
  }

  return { p: wrap('p'), li: wrap('li'), td: wrap('td'), strong: wrap('strong'), em: wrap('em') } as Components
}

const KATEX_MACROS = { '\\tfrac': '\\frac' }

/**
 * Normalize legacy / loose math delimiters to the standard ones remark-math
 * understands ($ inline, $$ display). Older authored content (and Claude
 * output) used TeX-style \( \) and \[ \]; convert those so everything renders
 * through one reliable pipeline instead of a hand-rolled regex wrapper.
 */
function normalizeDelimiters(src: string): string {
  return src
    // display \[ ... \]  →  $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${String(inner).trim()}$$`)
    // inline  \( ... \)  →  $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${String(inner).trim()}$`)
}

/** Turn the project's ::: callout blocks into styled divs (unchanged behavior). */
function transformCallouts(src: string): string {
  return src.replace(
    /:::(\w+)\s*(.*?)\n([\s\S]*?):::/g,
    (_match, type, title, body) => {
      const cleanTitle = String(title).trim()
      const cleanBody = String(body).trim()
      return `\n<div class="admonition-${type}">\n${cleanTitle ? `**${cleanTitle}**\n\n` : ''}${cleanBody}\n</div>\n`
    },
  )
}

export default function MathMarkdown({ content, glossary }: MathMarkdownProps) {
  const processed = transformCallouts(normalizeDelimiters(content ?? ''))
  const components = glossary ? buildGlossaryComponents(glossary) : undefined
  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, macros: KATEX_MACROS }]]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Lightweight inline math for non-markdown contexts (badges, table cells,
 * anywhere a block element would break layout). Renders pure KaTeX.
 */
interface InlineMathProps {
  /** The LaTeX math expression (without delimiters). */
  math: string
  displayMode?: boolean
  className?: string
}

export function InlineMath({ math, displayMode = false, className = '' }: InlineMathProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (typeof window === 'undefined' || !spanRef.current) return
      try {
        const katex = await import('katex')
        if (cancelled || !spanRef.current) return
        const render = (katex as unknown as { renderToString?: typeof import('katex').renderToString }).renderToString
          ?? katex.default.renderToString
        spanRef.current.innerHTML = render(math, {
          displayMode, throwOnError: false, macros: KATEX_MACROS,
        })
      } catch {
        if (!cancelled && spanRef.current) spanRef.current.textContent = math
      }
    })()
    return () => { cancelled = true }
  }, [math, displayMode])
  return <span ref={spanRef} className={`inline-math ${className}`} />
}
