'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PULSE_OPTIONS } from '@/lib/presentation-tools'
import { commandRequest } from '@/lib/classroom-command'
import type { LiveSession } from './PresentLiveProvider'

export default function StudentLiveTools({ session }: { session: LiveSession | null }) {
  const [choice, setChoice] = useState<number | null>(null)
  const [help, setHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  useEffect(() => { setChoice(session?.pulseChoice ?? null); setError('') }, [session?.pulse?.id, session?.pulseChoice])
  useEffect(() => { setHelp(session?.helpRequested ?? false) }, [session])
  if (!session) return null
  async function send(action: string, value?: number) {
    if (!session || pending.current) return
    pending.current = true; setBusy(true); setError('')
    try {
      await commandRequest('/api/present/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: session.id, action, pulse_id: session.pulse?.id, choice: value }) })
      if (action === 'pulse') setChoice(value ?? null)
      else setHelp(action === 'help')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send. Try again.') }
    finally { pending.current = false; setBusy(false) }
  }
  return <Card className="mx-4 my-3 gap-3 p-4" aria-label="Live class check-in">
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-caption">Live class</span><Button variant="outline" className="min-h-12" disabled={busy} onClick={() => send(help ? 'cancel_help' : 'help')}>{help ? 'Help requested · cancel' : 'Ask teacher for help'}</Button></div>
    {session.pulse?.status === 'open' && <><h2 className="text-title-3">{session.pulse.kind === 'readiness' ? 'How ready are you to move on?' : 'How confident do you feel?'}</h2><p className="text-caption text-muted-foreground">{session.pulse.anonymous ? 'Anonymous check: your teacher sees totals without names.' : 'Your teacher can see your response and offer help.'}</p><div className="flex flex-wrap gap-2">{PULSE_OPTIONS[session.pulse.kind].map((label, i) => <Button key={label} variant={choice === i ? 'default' : 'outline'} aria-pressed={choice === i} className="min-h-12 flex-1 whitespace-normal" disabled={busy} onClick={() => send('pulse', i)}>{label}</Button>)}</div>{choice !== null && <p role="status" className="text-caption">Response saved.</p>}</>}
    {help && <p role="status" className="text-caption">Your teacher can see that you need help.</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </Card>
}
