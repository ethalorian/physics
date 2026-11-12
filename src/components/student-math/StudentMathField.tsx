'use client'

import { useRef, useState, type ComponentPropsWithoutRef, type RefObject } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InlineMath } from '@/components/MathMarkdown'
import { joinWorkedAnswer, splitWorkedAnswer } from '@/lib/worked-example-answer'
import { numericMathEntry } from '@/lib/student-math-entry'
import EquationDialog from './EquationDialog'
import s from './StudentMath.module.css'

type MathFormat = 'steps' | 'text' | 'number'
type AnswerProps = { styled?: boolean; value?: string | number; onValueChange: (value: string) => void; mathFormat?: MathFormat }
type TextControl = HTMLTextAreaElement | HTMLInputElement

function EquationTools({ field, value, onValueChange, format, disabled, maxLength }: AnswerProps & {
  field: RefObject<TextControl | null>; format: MathFormat; disabled?: boolean; maxLength?: number
}) {
  const source = String(value ?? '')
  const { equations, explanation } = format === 'steps' ? splitWorkedAnswer(source) : { equations: [], explanation: source }
  const [edit, setEdit] = useState<{ index: number; start: number; end: number; source: string } | null>(null)
  function open(index: number) {
    const input = field.current
    if (!input || disabled || input.matches(':disabled')) return
    setEdit({ index, start: input.selectionStart ?? 0, end: input.selectionEnd ?? source.length, source })
  }
  function insert(latex: string, linear: string) {
    const input = field.current
    if (!edit || !input || disabled || input.matches(':disabled')) return 'This answer is locked.'
    if (edit.source !== source) return 'This answer changed. Close the editor and reopen it to use the latest answer.'
    let result: string
    if (format === 'steps') {
      const next = [...equations]
      next[edit.index] = latex
      result = joinWorkedAnswer(next, explanation)
    } else if (format === 'number') {
      const number = numericMathEntry(linear)
      if (number === null) return 'Enter a number, fraction, or scientific notation for this answer.'
      if (input instanceof HTMLInputElement && input.type === 'number') {
        const check = input.cloneNode(false) as HTMLInputElement
        check.value = number
        if (!check.validity.valid) return 'Use a value within the limits for this field.'
      }
      result = number
    } else {
      if (!linear) return 'This equation cannot be written in this text field.'
      // Keep simple fractions readable by short-answer and quantity checkers.
      const text = linear.replace(/\(([-+]?\d*\.?\d+)\)\/\(([-+]?\d*\.?\d+)\)/g, '$1/$2')
      result = source.slice(0, edit.start) + text + source.slice(edit.end)
    }
    if (maxLength !== undefined && maxLength >= 0 && result.length > maxLength)
      return 'This equation would put your answer over its character limit.'
    onValueChange(result)
  }
  return <>
    {equations.map((equation, i) => <span key={i} className={s.step}>
      <InlineMath math={equation}/>
      {!disabled && <span className={s.edits}><button type="button" aria-label={'Edit equation ' + (i + 1)} onClick={() => open(i)}>Edit</button>
        <button type="button" aria-label={'Remove equation ' + (i + 1)} onClick={() => onValueChange(joinWorkedAnswer(equations.filter((_, j) => i !== j), explanation))}>Remove</button></span>}
    </span>)}
    {!disabled && <button type="button" className={s.trigger} onMouseDown={event => event.preventDefault()}
      onClick={() => open(equations.length)} aria-haspopup="dialog">Add math</button>}
    {edit && !disabled && <EquationDialog container={field.current?.closest('[role="dialog"], dialog') ?? document.body} initial={equations[edit.index] ?? ''} onInsert={insert} onClose={() => setEdit(null)}/>}
  </>
}

type AreaProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'value' | 'onChange'> & AnswerProps
export function StudentMathArea({ value, onValueChange, mathFormat = 'steps', styled, ...props }: AreaProps) {
  const field = useRef<HTMLTextAreaElement>(null)
  const source = String(value ?? '')
  const { equations, explanation } = mathFormat === 'steps' ? splitWorkedAnswer(source) : { equations: [], explanation: source }
  const reserved = equations.length ? joinWorkedAnswer(equations, ' ').length - 1 : 0
  const Area = styled ? Textarea : 'textarea'
  return <><Area {...props} ref={field} value={explanation}
    maxLength={props.maxLength === undefined ? undefined : Math.max(0, props.maxLength - reserved)}
    onChange={event => onValueChange(joinWorkedAnswer(equations, event.currentTarget.value))}/>
    <EquationTools field={field} value={value} format={mathFormat} onValueChange={onValueChange}
      disabled={props.disabled || props.readOnly} maxLength={props.maxLength}/>
  </>
}

type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> & AnswerProps & { inputRef?: RefObject<HTMLInputElement | null> }
export function StudentMathInput({ value, onValueChange, mathFormat = 'text', inputRef, styled, ...props }: InputProps) {
  const ownRef = useRef<HTMLInputElement>(null)
  const field = inputRef ?? ownRef
  const InputControl = styled ? Input : 'input'
  return <><InputControl {...props} ref={field} value={value} onChange={event => onValueChange(event.currentTarget.value)}/>
    <EquationTools field={field} value={value} format={mathFormat} onValueChange={onValueChange}
      disabled={props.disabled || props.readOnly} maxLength={props.maxLength}/>
  </>
}
