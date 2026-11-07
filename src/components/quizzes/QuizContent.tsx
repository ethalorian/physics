'use client'
import ReactMarkdown, {type Components} from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkAssignmentEmphasis from '@/lib/remark-assignment-emphasis'
import rehypeForceNotation from '@/lib/rehype-force-notation'
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
export default function QuizContent({content,inline=false,allowFigures=false,questionEmphasis=false}:{content?:string|null;inline?:boolean;allowFigures?:boolean;questionEmphasis?:boolean}) {
  const Tag = inline ? 'span' : 'div'
  const renderedComponents:Components = allowFigures && !inline ? {...components,img:({src,alt})=>typeof src==='string'&&/^\/assignment-figures\/[a-z0-9-]+\.svg$/.test(src)?<a href={src} target="_blank" rel="noopener noreferrer" className={s.figureLink}><img src={src} alt={alt??''} className={s.assignmentFigure}/><span>Open diagram at full size</span></a>:<span>{alt?`[Image: ${alt}]`:'[Image]'}</span>} : inline ? inlineComponents : components
  return <Tag className={`${s.richText} ${inline ? s.richInline : ''}`}><ReactMarkdown skipHtml remarkPlugins={questionEmphasis?[remarkGfm,remarkMath,remarkAssignmentEmphasis]:[remarkGfm,remarkMath]} rehypePlugins={[rehypeForceNotation,[rehypeKatex,{throwOnError:false,trust:false,macros:{'\\tfrac':'\\frac'}}]]} components={renderedComponents}>{quizMathContent(content ?? '')}</ReactMarkdown></Tag>
}
