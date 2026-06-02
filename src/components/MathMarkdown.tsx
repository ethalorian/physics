"use client"
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'

interface MathMarkdownProps {
  content: string
  /** Retained for back-compat with existing call sites; no longer used now that
   *  rendering is delimiter-driven (we never guess where math is). */
  skipAutoDetect?: boolean
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

export default function MathMarkdown({ content }: MathMarkdownProps) {
  const processed = transformCallouts(normalizeDelimiters(content ?? ''))
  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, macros: KATEX_MACROS }]]}
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
