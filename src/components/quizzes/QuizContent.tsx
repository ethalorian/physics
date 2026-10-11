'use client'
import ReactMarkdown, {type Components} from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {quizMathContent} from '@/lib/quizzes/presentation'
import s from './Quiz.module.css'

// Student responses use this renderer too. No raw HTML, remote images, or
// trusted TeX commands are executed. KaTeX retains its accessible MathML.
const components: Components = {
  img: ({alt}) => <span>{alt ? `[Image: ${alt}]` : '[Image]'}</span>,
  table: ({children}) => <div className={s.richTable}><table>{children}</table></div>,
}
const inlineComponents: Components = {
  ...components,
  p: ({children}) => <span>{children}</span>,
  div: ({children, className}) => <span className={className}>{children}</span>,
  a: ({children}) => <span>{children}</span>,
}
export default function QuizContent({content,inline=false}:{content?:string|null;inline?:boolean}) {
  const Tag = inline ? 'span' : 'div'
  return <Tag className={`${s.richText} ${inline ? s.richInline : ''}`}><ReactMarkdown skipHtml remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[[rehypeKatex,{throwOnError:false,trust:false,macros:{'\\tfrac':'\\frac'}}]]} components={inline ? inlineComponents : components}>{quizMathContent(content ?? '')}</ReactMarkdown></Tag>
}
