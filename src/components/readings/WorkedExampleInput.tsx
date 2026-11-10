'use client'

import { useId, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { joinWorkedAnswer, splitWorkedAnswer } from '@/lib/worked-example-answer'
import WorkedEquationField from './WorkedEquationField'
import s from './WorkedExample.module.css'

type Step = { id: number; latex: string }

export default function WorkedExampleInput({ value, onChange, disabled = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean
}) {
  const id = useId()
  const { equations, explanation } = splitWorkedAnswer(value)
  const [steps, setSteps] = useState<Step[]>(() => (equations.length ? equations : ['']).map((latex, i) => ({ id: i, latex })))
  const nextId = useRef(steps.length)
  const [active, setActive] = useState(0)
  const [focusNew, setFocusNew] = useState<number | null>(null)
  const [error, setError] = useState('')

  function commit(next: Step[], text: string) {
    const serialized = joinWorkedAnswer(next.map(step => step.latex), text)
    if (serialized.length > 10000) {
      setError('Your equations and explanation must fit within 10,000 characters.')
      return false
    }
    setError('')
    setSteps(next)
    onChange(serialized)
    return true
  }
  function addStep() {
    const key = nextId.current++
    setSteps(previous => [...previous, { id: key, latex: '' }])
    setActive(key)
    setFocusNew(key)
  }
  return <fieldset className={s.workspace} disabled={disabled}>
    <legend>Show your work</legend>
    <p className={s.hint}>Write one equation per step. Include units where they apply.</p>
    <ol className={s.steps}>{steps.map((step, i) => <li key={step.id}>
      <div className={s.stepHeader}><span>Step {i + 1}</span>
        {(steps.length > 1 || step.latex) && <button type="button" className={s.remove} aria-label={'Remove step ' + (i + 1)}
          onClick={() => {
            const remaining = steps.length === 1 ? [{ ...step, latex: '' }] : steps.filter(row => row.id !== step.id)
            if (commit(remaining, explanation)) setActive(remaining[Math.min(i, remaining.length - 1)].id)
          }}><X size={15} aria-hidden="true"/></button>}
      </div>
      <WorkedEquationField label={'Equation step ' + (i + 1)} value={step.latex} disabled={disabled}
        active={active === step.id} focusOnMount={focusNew === step.id} onFocus={() => setActive(step.id)}
        onChange={latex => commit(steps.map(row => row.id === step.id ? { ...row, latex } : row), explanation)}/>
    </li>)}</ol>
    <button type="button" className={s.add} onClick={addStep}><Plus size={16} aria-hidden="true"/>Add equation step</button>
    <label htmlFor={id}>Explain your reasoning</label>
    <textarea id={id} value={explanation} rows={3} placeholder="What does your result tell you?"
      onChange={event => commit(steps, event.target.value)} />
    {error && <p role="alert">{error}</p>}
  </fieldset>
}
