"use client"
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MathMarkdownProps {
  content: string
}

function processContent(content: string) {
  // First process callouts
  let processed = content.replace(
    /:::(\w+)\s*(.*?)\n([\s\S]*?):::/g,
    (match, type, title, content) => {
      const cleanTitle = title.trim()
      const cleanContent = content.trim()
      
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

export default function MathMarkdown({ content }: MathMarkdownProps) {
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
        {processContent(content)}
      </ReactMarkdown>
    </div>
  )
}
