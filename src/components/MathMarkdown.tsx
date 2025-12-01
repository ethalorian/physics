"use client"
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MathMarkdownProps {
  content: string
  /** If true, skip auto-detection of unwrapped LaTeX (default: false) */
  skipAutoDetect?: boolean
}

/**
 * Detects if a string contains LaTeX patterns that aren't already wrapped in \( \) or \[ \]
 * and wraps them appropriately
 */
function autoWrapLatex(content: string): string {
  // If content already has proper delimiters, return as-is
  if (/\\\(.*?\\\)|\\\[[\s\S]*?\\\]/g.test(content)) {
    return content
  }

  // Common LaTeX patterns that indicate math content
  const latexPatterns = [
    /\\text\s*\{[^}]*\}/,           // \text{...}
    /\\frac\s*\{[^}]*\}\s*\{[^}]*\}/, // \frac{...}{...}
    /\\sqrt\s*\{[^}]*\}/,           // \sqrt{...}
    /\\vec\s*\{[^}]*\}/,            // \vec{...}
    /\\overrightarrow\s*\{[^}]*\}/, // \overrightarrow{...}
    /\\(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|psi|omega|Delta|Omega|Gamma|Sigma|Pi)\b/, // Greek letters
    /\\(times|div|cdot|pm|mp|leq|geq|neq|approx|equiv|propto)\b/, // Math operators
    /\\(quad|qquad|,|;|!)\b/,       // Spacing commands
    /\\(sum|int|prod|lim|infty)\b/, // Calculus operators
    /\\(sin|cos|tan|log|ln|exp)\b/, // Functions
    /\^[\{_]/,                       // Superscript with brace or combined with subscript
    /_[\{^]/,                        // Subscript with brace or combined with superscript
    /\^\d+/,                         // Simple superscript like ^2
    /_\d+/,                          // Simple subscript like _0
    /[A-Za-z]\s*=\s*[\d.]+\s*\\text/, // Variable = number \text pattern
  ]

  // Check if content matches any LaTeX pattern
  const hasLatexPattern = latexPatterns.some(pattern => pattern.test(content))
  
  if (!hasLatexPattern) {
    return content
  }

  // Process the content to wrap LaTeX segments
  // Split content into lines to handle multi-line content
  const lines = content.split('\n')
  const processedLines = lines.map(line => {
    // Skip lines that are already wrapped or are markdown headers
    if (/^\s*#/.test(line) || /\\\(.*?\\\)|\\\[.*?\\\]/.test(line)) {
      return line
    }

    // Check if this line has LaTeX patterns
    const lineHasLatex = latexPatterns.some(pattern => pattern.test(line))
    if (!lineHasLatex) {
      return line
    }

    // Find segments that contain LaTeX and wrap them
    // Match sequences that look like equations (variables, operators, numbers with LaTeX commands)
    const result = line.replace(
      /([A-Za-z_][A-Za-z0-9_]*(?:\s*[=<>≤≥≈]\s*[\d.]+(?:\s*\\text\s*\{[^}]*\})?(?:\s*,\s*)?)+|(?:[A-Za-z_][A-Za-z0-9_]*\s*=\s*)?\\(?:frac|sqrt|vec|text|alpha|beta|gamma|delta|theta|omega|mu|pi|sigma|tau|times|cdot|quad|qquad)[^,.\s]*(?:\s*\{[^}]*\})*(?:\s*\{[^}]*\})?(?:\s*[=<>+\-*/^_]?\s*[\d.A-Za-z]*)*)/g,
      (match) => {
        // Don't double-wrap if already in delimiters
        if (match.includes('\\(') || match.includes('\\[')) {
          return match
        }
        return `\\(${match}\\)`
      }
    )

    return result
  })

  return processedLines.join('\n')
}

/**
 * More aggressive auto-wrapping for content that clearly contains LaTeX
 * This handles patterns like "F = 400 \text{ N}, \quad m = 80 \text{ kg}"
 */
function autoWrapLatexAggressive(content: string): string {
  // If content already has proper delimiters everywhere, return as-is
  if (/^\s*\\\([\s\S]*\\\)\s*$/.test(content) || /^\s*\\\[[\s\S]*\\\]\s*$/.test(content)) {
    return content
  }

  // Pattern to detect LaTeX math content that needs wrapping
  // This matches common physics equation patterns
  const equationPattern = /([A-Za-z_][A-Za-z0-9_]*\s*=\s*[\d.]+\s*\\text\s*\{[^}]*\}(?:\s*,?\s*\\quad\s*)?)+/g
  
  // Check if we have this specific pattern
  if (equationPattern.test(content)) {
    // Reset lastIndex after test
    equationPattern.lastIndex = 0
    
    // If the entire content is basically one equation block, wrap the whole thing
    const trimmed = content.trim()
    if (/^[A-Za-z_\s=\d.,\\{}^_]+$/.test(trimmed) && /\\text|\\quad|\\frac|\\vec/.test(trimmed)) {
      return `\\(${trimmed}\\)`
    }

    // Otherwise, wrap individual equation segments
    return content.replace(equationPattern, (match) => `\\(${match}\\)`)
  }

  return autoWrapLatex(content)
}

function processContent(content: string, skipAutoDetect: boolean = false) {
  let processed = content

  // Auto-detect and wrap LaTeX patterns if not skipped
  if (!skipAutoDetect) {
    processed = autoWrapLatexAggressive(processed)
  }

  // First process callouts
  processed = processed.replace(
    /:::(\w+)\s*(.*?)\n([\s\S]*?):::/g,
    (match, type, title, calloutContent) => {
      const cleanTitle = title.trim()
      const cleanContent = calloutContent.trim()
      
      return `
<div class="admonition-${type}">
${cleanTitle ? `**${cleanTitle}**` : ''}
${cleanTitle ? '\n\n' : ''}${cleanContent}
</div>
`
    }
  )

  // Then process math expressions - convert LaTeX to HTML
  // Handle display math \[ ... \]
  processed = processed.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (match, math) => {
      return `<div class="math-display">${math.trim()}</div>`
    }
  )

  // Handle inline math \( ... \)
  processed = processed.replace(
    /\\\((.*?)\\\)/g,
    (match, math) => {
      return `<span class="math-inline">${math.trim()}</span>`
    }
  )

  return processed
}

export default function MathMarkdown({ content, skipAutoDetect = false }: MathMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadKatex = async () => {
      if (typeof window !== 'undefined' && containerRef.current) {
        const katex = await import('katex')
      
        // Process display math
        const displayMath = containerRef.current.querySelectorAll('.math-display')
        displayMath.forEach((element) => {
          try {
            const math = element.textContent || ''
            element.innerHTML = katex.renderToString(math, { 
              displayMode: true,
              throwOnError: false,
              macros: {
                "\\tfrac": "\\frac"
              }
            })
            element.className = 'katex-display math-display'
          } catch (e) {
            console.log('KaTeX display error:', e)
            element.innerHTML = `<code>Error rendering: ${element.textContent}</code>`
          }
        })

        // Process inline math
        const inlineMath = containerRef.current.querySelectorAll('.math-inline')
        inlineMath.forEach((element) => {
          try {
            const math = element.textContent || ''
            element.innerHTML = katex.renderToString(math, { 
              displayMode: false,
              throwOnError: false,
              macros: {
                "\\tfrac": "\\frac"
              }
            })
            element.className = 'katex math-inline'
          } catch (e) {
            console.log('KaTeX inline error:', e)
            element.innerHTML = `<code>Error: ${element.textContent}</code>`
          }
        })
      }
    }
    loadKatex()
  }, [content])

  return (
    <div ref={containerRef} className="markdown-content max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {processContent(content, skipAutoDetect)}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Lightweight inline math component for rendering pure KaTeX without markdown wrapper.
 * Use this for inline contexts like badges, table cells, or anywhere block elements break layout.
 */
interface InlineMathProps {
  /** The LaTeX math expression (without delimiters) */
  math: string
  /** Whether to render in display mode (centered, larger) */
  displayMode?: boolean
  /** Additional CSS class */
  className?: string
}

export function InlineMath({ math, displayMode = false, className = '' }: InlineMathProps) {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const renderMath = async () => {
      if (typeof window !== 'undefined' && spanRef.current) {
        try {
          const katex = await import('katex')
          spanRef.current.innerHTML = katex.renderToString(math, {
            displayMode,
            throwOnError: false,
            macros: {
              "\\tfrac": "\\frac"
            }
          })
        } catch (e) {
          console.log('KaTeX error:', e)
          if (spanRef.current) {
            spanRef.current.textContent = math
          }
        }
      }
    }
    renderMath()
  }, [math, displayMode])

  return <span ref={spanRef} className={`inline-math ${className}`} />
}
