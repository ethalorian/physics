"use client"

import { signIn, signOut } from 'next-auth/react'
import { ShieldAlert, LogIn, LogOut } from 'lucide-react'
import { STUDENT_EMAIL_DOMAIN } from '@/lib/access'

// Blocking modal shown when a student is signed in with a non-school account.
// Not dismissible — the only ways out are switching to the school account or
// signing out. The real access enforcement is server-side; this is the UX.
export default function SchoolAccountModal({ email }: { email?: string | null }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="school-account-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'color-mix(in oklch, var(--background) 70%, transparent)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        className="rounded-2xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', maxWidth: 440, width: '100%', padding: 28, color: 'var(--foreground)' }}
      >
        <div className="flex justify-center mb-3">
          <div className="rounded-full p-3" style={{ background: 'color-mix(in oklch, var(--primary) 14%, transparent)' }}>
            <ShieldAlert size={28} style={{ color: 'var(--primary)' }} />
          </div>
        </div>

        <h1 id="school-account-title" className="text-lg font-semibold text-center">Use your school account</h1>

        <p className="text-sm text-center mt-2" style={{ color: 'var(--muted-foreground)' }}>
          This app is for students signed in with their school Google account
          (<span className="font-mono">@{STUDENT_EMAIL_DOMAIN}</span>).
        </p>

        {email && (
          <p className="text-sm text-center mt-3 rounded-lg px-3 py-2" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            You&apos;re signed in as <span className="font-medium" style={{ color: 'var(--foreground)' }}>{email}</span>.
            Switch to your school account to continue.
          </p>
        )}

        <div className="flex flex-col gap-2 mt-5">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' }, { prompt: 'select_account' })}
            className="w-full text-sm font-semibold rounded-lg px-4 py-2.5 inline-flex items-center justify-center gap-2"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
          >
            <LogIn size={16} /> Switch to school account
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-sm rounded-lg px-4 py-2.5 inline-flex items-center justify-center gap-2"
            style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--muted-foreground)' }}>
          Already use your school account? Ask your teacher to add you to a class.
        </p>
      </div>
    </div>
  )
}
