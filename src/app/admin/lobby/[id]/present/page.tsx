"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Users, ArrowLeft } from 'lucide-react'

// Projectable JOIN-CODE screen. Deliberately shows ONLY the access code (and how
// to join) — never clues, codes/answers, or progress — so a teacher can safely
// put it on the board for students to join. The answer-laden monitor lives at
// /admin/lobby/[id]; this page intentionally shares nothing with it.
interface SessionRow { code: string; status: string }

export default function PresentCodePage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<SessionRow | null>(null)
  const [joined, setJoined] = useState(0)
  const [origin, setOrigin] = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])
  useEffect(() => {
    const load = () => {
      fetch(`/api/lobby/sessions/${id}`)
        .then((r) => r.json())
        .then((d) => { if (d.session) setSession(d.session); setJoined((d.members ?? []).length) })
        .catch(() => {})
    }
    load(); const t = setInterval(load, 3000); return () => clearInterval(t)
  }, [id])

  const code = session?.code ?? '·····'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ color: 'var(--foreground)' }}>
      <Link href={`/admin/lobby/${id}`} className="absolute top-4 left-4 text-sm inline-flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={14} /> Back to monitor
      </Link>

      <div className="text-sm font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--muted-foreground)' }}>Join the activity</div>

      <p className="text-lg mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Go to <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{origin ? origin.replace(/^https?:\/\//, '') : '…'}/lobby</span> and enter this code:
      </p>

      <div className="rounded-3xl border-4 px-10 py-6 mb-6" style={{ borderColor: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 8%, var(--card))' }}>
        <div className="inline-flex items-center gap-4">
          <KeyRound size={48} style={{ color: 'var(--primary)' }} />
          <span className="font-mono font-extrabold tracking-[0.18em]" style={{ color: 'var(--primary)', fontSize: 'clamp(64px, 14vw, 140px)', lineHeight: 1 }}>{code}</span>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 text-xl font-semibold px-4 py-2 rounded-full" style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)', color: 'var(--success)' }}>
        <Users size={22} /> {joined} joined
      </div>

      {session?.status === 'closed' && (
        <p className="mt-6 text-sm" style={{ color: 'var(--destructive)' }}>This lobby is closed.</p>
      )}
    </div>
  )
}
