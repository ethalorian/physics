"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { GraduationCap, Check, Clock } from 'lucide-react'

interface Status { isTeacher: boolean; request: { status: string } | null }

export default function TeacherAccessPage() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<Status | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    fetch('/api/teacher/access-request')
      .then((r) => r.json())
      .then((d: Status & { error?: string }) => { if (!d.error) setStatus(d) })
      .catch(() => {})
  }
  useEffect(() => { load() }, [])

  const submit = async () => {
    setBusy(true)
    await fetch('/api/teacher/access-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    }).catch(() => {})
    setBusy(false)
    load()
  }

  const reqStatus = status?.request?.status
  const isTeacher = status?.isTeacher ?? false

  return (
    <div className="max-w-xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="grid place-items-center mb-3" style={{ width: 48, height: 48, borderRadius: 12, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
          <GraduationCap size={24} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Teacher access</h1>

        {!session?.user?.email && (
          <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>Sign in with your school Google account to request teacher access.</p>
        )}

        {isTeacher && (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--success)' }}>
            <Check size={16} /> You already have teacher access. Head to your dashboard.
          </div>
        )}

        {!isTeacher && session?.user?.email && (
          <>
            <p className="text-sm mt-2 mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Signed in as <strong>{session.user.email}</strong>. Request teacher access — your administrator is alerted and approves it.
            </p>
            {reqStatus === 'pending' ? (
              <div className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2.5" style={{ color: 'var(--reward-foreground)', background: 'color-mix(in oklch, var(--reward) 18%, transparent)' }}>
                <Clock size={16} /> Request pending — you’ll get access once an admin approves it.
              </div>
            ) : reqStatus === 'denied' ? (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Your previous request wasn’t approved. You can ask your administrator directly, or submit again.</p>
            ) : (
              <>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Optional: which classes/subject do you teach?"
                  className="w-full rounded-lg border p-2 text-sm mb-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <button
                  onClick={submit}
                  disabled={busy}
                  className="text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                >
                  {busy ? 'Sending…' : 'Request teacher access'}
                </button>
              </>
            )}
            {reqStatus === 'denied' && (
              <button onClick={submit} disabled={busy} className="text-sm font-semibold rounded-lg px-4 py-2 mt-3" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                {busy ? 'Sending…' : 'Request again'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
