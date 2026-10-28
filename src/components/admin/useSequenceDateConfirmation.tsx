'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { confirmedDateRequest, proposedSequenceDates, sequenceRoleLabels, type SequenceDateContext, type SequenceDateMode, type SequenceRole } from '@/lib/sequence-date-change'
import { sourcePresentation } from '@/lib/assignment-source-presentation'
import s from './SequenceDateConfirmation.module.css'

const roles: SequenceRole[] = ['foundation', 'review', 'quiz']
function label(value: string | null) {
  if (!value) return 'Not assigned'
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  return new Date(dateOnly ? value + 'T12:00:00Z' : value).toLocaleString('en-US', { timeZone: dateOnly ? 'UTC' : 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', ...(dateOnly ? {} : { hour: 'numeric', minute: '2-digit' }) })
}
export function useSequenceDateConfirmation() {
  const [context, setContext] = useState<SequenceDateContext | null>(null), [mode, setMode] = useState<SequenceDateMode>('single')
  const resolver = useRef<((mode: SequenceDateMode | null) => void) | null>(null)
  useEffect(() => () => { resolver.current?.(null); resolver.current = null }, [])
  const confirm = useCallback((next: SequenceDateContext) => new Promise<SequenceDateMode | null>(resolve => {
    resolver.current?.(null); resolver.current = resolve; setMode('single'); setContext(next)
  }), [])
  const finish = (choice: SequenceDateMode | null) => { const resolve = resolver.current; resolver.current = null; setContext(null); resolve?.(choice) }
  const send = useCallback(<T,>(url: string, body: unknown, method = 'POST') => confirmedDateRequest<T>(url, body, confirm, method), [confirm])
  const dates = context ? proposedSequenceDates(context, mode) : null
  const roleLabel = (role: SequenceRole) => context && role !== 'quiz' ? sourcePresentation({kind:'interactive',sourceId:context.snapshot[role].slug,title:''}).label : sequenceRoleLabels[role]
  const confirmation = context && dates ? <Dialog open onOpenChange={open => { if (!open) finish(null) }}><DialogContent className={s.dialog}><DialogTitle>Confirm linked assignment dates</DialogTitle><DialogDescription>You are changing the {roleLabel(context.role).toLowerCase()} date.</DialogDescription>
    <p className={s.warning} role="alert">The usual rule places the review three school days after the in-class activity, with the quiz due the same day as the review. You can override that spacing.</p>
    {context.role !== 'quiz' && <fieldset className={s.choices}><legend>What should move?</legend><label><input type="radio" name="sequence-date-mode" checked={mode === 'single'} onChange={() => setMode('single')} />Only this activity — keep the other two dates</label><label><input type="radio" name="sequence-date-mode" checked={mode === 'linked'} onChange={() => setMode('linked')} />Move the linked dates together — use normal spacing</label></fieldset>}
    <div className={s.dates}>{roles.map(role => <div key={role}><strong>{roleLabel(role)}</strong><span>Now: {label(context.snapshot[role].date)}</span><span>After confirmation: <strong>{label(dates[role])}</strong></span></div>)}</div>
    <p>Students must still submit the in-class activity before the review, and both before the quiz. An earlier deadline does not bypass these requirements. Saved work, grades and private feedback stay intact.</p>
    <p className={s.timezone}>Quiz times are Eastern. Nothing changes until you confirm.</p>
    <div className={s.actions}><button type="button" onClick={() => finish(null)}>Cancel</button><button type="button" className={s.confirm} onClick={() => finish(mode)}>{mode === 'single' ? 'Confirm date override' : 'Confirm linked dates'}</button></div>
  </DialogContent></Dialog> : null
  return { send, confirmation }
}
