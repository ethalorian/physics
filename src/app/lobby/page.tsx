"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { KeyRound } from 'lucide-react'

export default function LobbyJoinPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const join = async () => {
    setErr(''); setBusy(true)
    const r = await fetch('/api/lobby/join', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    })
    setBusy(false)
    const d = await r.json().catch(() => ({}))
    if (r.ok && d.code) router.push(`/lobby/${d.code}`)
    else setErr(d.error || 'Could not join')
  }

  return (
    <div className="max-w-sm mx-auto p-5 mt-10" style={{ color: 'var(--foreground)' }}>
      <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="grid place-items-center mx-auto mb-3" style={{ width: 48, height: 48, borderRadius: 12, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
          <KeyRound size={24} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Join a lobby</h1>
        {!session?.user?.email && (
          <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>Sign in with your school account first.</p>
        )}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') join() }}
          maxLength={6}
          placeholder="CODE"
          className="w-full rounded-lg border p-3 text-center font-mono text-2xl tracking-[0.4em] mt-4"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
        {err && <p className="text-sm mt-2" style={{ color: 'var(--destructive)' }}>{err}</p>}
        <button onClick={join} disabled={busy || code.length < 4}
          className="w-full mt-4 text-sm font-semibold rounded-lg px-4 py-2.5 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
          {busy ? 'Joining…' : 'Enter lobby'}
        </button>
      </div>
    </div>
  )
}
