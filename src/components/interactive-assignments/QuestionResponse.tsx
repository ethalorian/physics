'use client'

import { useId, type ReactNode } from 'react'
import MathMarkdown from '@/components/MathMarkdown'
import s from './QuestionResponse.module.css'

/** Shared by interactive assignments and the canonical video lesson renderer. */
export function QuestionPrompt({ children, translation }: { children: string; translation?: string | null }) {
  return <div className={s.prompt}><MathMarkdown content={children}/>{translation && <p className={s.translation}>{translation}</p>}</div>
}

export function ChoiceResponse({ options, value, onChange, disabled = false, label = 'Choose one answer' }: {
  options: { id: string; content: ReactNode; revealed?: boolean }[]
  value?: string
  onChange: (id: string) => void
  disabled?: boolean
  label?: string
}) {
  return <fieldset className={s.choices} disabled={disabled}><legend>{label}</legend>{options.map((option, index) => <button
    type="button" key={option.id} aria-pressed={value === option.id} onClick={() => onChange(option.id)}
    className={`${s.choice} ${value === option.id ? s.selected : ''} ${option.revealed ? s.revealed : ''}`}
  ><span className={s.letter} aria-hidden>{String.fromCharCode(65 + index)}</span><span className={s.choiceText}>{option.content}</span><span className={s.mark} aria-hidden>{value === option.id ? '✓' : ''}</span></button>)}</fieldset>
}

export function WrittenResponse({ label, value, onChange, disabled = false, maxLength = 4000, id: providedId, help }: {
  label: string; value: string; onChange: (value: string) => void; disabled?: boolean; maxLength?: number; id?: string; help?: string
}) {
  const uid = useId(), id = providedId ?? uid
  return <div className={s.written}><label htmlFor={id}>{label}</label>{help && <p id={`${id}-help`}>{help}</p>}<textarea id={id} aria-describedby={help ? `${id}-help` : undefined} value={value} maxLength={maxLength} rows={4} disabled={disabled} onChange={event => onChange(event.target.value)} placeholder="Show your reasoning and evidence…"/></div>
}
