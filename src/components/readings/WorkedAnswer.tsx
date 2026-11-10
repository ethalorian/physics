'use client'

import { InlineMath } from '@/components/MathMarkdown'
import { splitWorkedAnswer } from '@/lib/worked-example-answer'
import s from './WorkedExample.module.css'

export default function WorkedAnswer({ value }: { value: string }) {
  const { equations, explanation } = splitWorkedAnswer(value)
  if (!equations.length) return <>{value}</>
  return <div className={s.saved}>
    <ol aria-label="Equation steps">{equations.map((latex, i) => <li key={i}>
      <InlineMath math={latex.replace(/\\placeholder(?:\[[^\]]*\])?\{\}/g, '\\square')} displayMode/>
    </li>)}</ol>
    {explanation && <p>{explanation}</p>}
  </div>
}
