'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MathfieldElement } from 'mathlive'
import WorkedEquationField from '@/components/readings/WorkedEquationField'
import s from './StudentMath.module.css'

export default function EquationDialog({ initial, container, onInsert, onClose }: {
  initial: string
  container: Element
  onInsert: (latex: string, linear: string) => string | undefined
  onClose: () => void
}) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const [latex, setLatex] = useState(initial)
  const [error, setError] = useState('')
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])
  function submit() {
    const field = dialog.current?.querySelector<MathfieldElement>('math-field')
    const math = (field?.value ?? latex).trim()
    if (!math || math.includes('\\placeholder')) { setError('Fill in the equation first.'); return }
    const issue = onInsert(math, field?.getValue('plain-text').trim() ?? math)
    if (issue) setError(issue)
    else onClose()
  }
  return createPortal(<dialog data-equation-editor ref={dialog} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()} className={s.dialog} aria-labelledby={id}
    onCancel={event => { event.preventDefault(); onClose() }}>
    <h2 id={id}>Equation editor</h2>
    <WorkedEquationField label="Equation" value={latex} disabled={false} active focusOnMount
      onFocus={() => {}} onChange={next => { setLatex(next); setError(''); return true }}/>
    {error && <p role="alert">{error}</p>}
    <div className={s.actions}><button type="button" onClick={onClose}>Cancel</button>
      <button type="button" onClick={submit}>Use equation</button></div>
  </dialog>, container)
}
