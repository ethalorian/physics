'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MathfieldElement } from 'mathlive'
import s from './WorkedExample.module.css'

const tools = [
  ['Fraction', 'a⁄b', '\\frac{#0}{#?}'],
  ['Exponent', 'xⁿ', '^{#0}'],
  ['Subscript', 'xᵢ', '_{#0}'],
  ['Square root', '√', '\\sqrt{#0}'],
  ['Delta', 'Δ', '\\Delta'],
] as const

const units = ['m', 's', 'm/s', 'm/s²', 'kg', 'N', 'N/kg'] as const

type Props = {
  label: string; value: string; disabled: boolean; active: boolean; focusOnMount: boolean
  onFocus: () => void; onChange: (value: string) => boolean
}

export default function WorkedEquationField(props: Props) {
  const host = useRef<HTMLDivElement>(null), field = useRef<MathfieldElement | null>(null)
  const latest = useRef(props)
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading')
  useLayoutEffect(() => {
    latest.current = props
  })
  useLayoutEffect(() => {
    const element = field.current
    if (!element) return
    if (element.readOnly !== props.disabled) element.readOnly = props.disabled
    element.setAttribute('aria-label', props.label)
    if (element.value !== props.value) element.setValue(props.value, { silenceNotifications: true })
  }, [props.disabled, props.label, props.value])

  useEffect(() => {
    let mounted = true
    let releaseKeyboard: (() => void) | undefined
    const changed = () => {
      const element = field.current
      if (element && !latest.current.onChange(element.value)) {
        element.setValue(latest.current.value, { silenceNotifications: true })
      }
    }
    import('mathlive').then(({ MathfieldElement }) => {
      if (!mounted || !host.current) return
      // The app already serves the KaTeX fonts from its own global stylesheet.
      MathfieldElement.fontsDirectory = null
      MathfieldElement.soundsDirectory = null
      const element = new MathfieldElement()
      field.current = element
      element.setAttribute('aria-label', latest.current.label)
      element.readOnly = latest.current.disabled
      element.value = latest.current.value
      element.addEventListener('input', changed)
      element.addEventListener('change', changed)
      host.current.replaceChildren(element)
      element.menuItems = []
      const dialog = host.current.closest('dialog')
      if (dialog) {
        const keyboard = window.mathVirtualKeyboard
        keyboard.container = dialog
        releaseKeyboard = () => { keyboard.hide(); keyboard.container = document.body }
      }
      setState('ready')
      if (latest.current.focusOnMount) element.focus()
    }).catch(() => {
      if (!mounted) return
      field.current?.remove()
      field.current = null
      setState('fallback')
    })
    return () => {
      mounted = false
      releaseKeyboard?.()
      field.current?.removeEventListener('input', changed)
      field.current?.removeEventListener('change', changed)
      field.current?.remove()
      field.current = null
    }
  }, [])

  function insert(latex: string) {
    const element = field.current
    if (!element || latest.current.disabled) return
    element.focus()
    element.insert(latex, { format: 'latex', selectionMode: 'placeholder' })
    if (!latest.current.onChange(element.value)) element.setValue(latest.current.value, { silenceNotifications: true })
  }

  return <div className={s.entry} onFocus={props.onFocus}>
    <div className={s.fieldHost} ref={host}/>
    {state === 'loading' && <small role="status">Opening equation field…</small>}
    {state === 'fallback' && <label>Equation in LaTeX
      <input aria-label={props.label} value={props.value} disabled={props.disabled}
        onChange={event => props.onChange(event.target.value)}/>
    </label>}
    {state === 'ready' && props.active && <div className={s.tools} role="group" aria-label={props.label + ' symbols'}>
      {tools.map(([label, symbol, template]) => <button key={label} type="button" title={label} aria-label={label}
        disabled={props.disabled} onMouseDown={event => event.preventDefault()} onClick={() => insert(template)}>{symbol}</button>)}
      <select value="" aria-label="Insert units" disabled={props.disabled} onChange={event => {
        if (event.target.value) insert('\\,\\mathrm{' + event.target.value.replace('²', '^{2}') + '}')
      }}>
        <option value="">Units</option>
        {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
      </select>
    </div>}
  </div>
}
