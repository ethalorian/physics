import Link from 'next/link'
import { GraduationCap, Smile, KeyRound, Mail } from 'lucide-react'
import GateJoinCode from '@/components/student/GateJoinCode'

// "You're not in a class yet" screen, framed as a welcome + checklist rather
// than a dead-end. Server-renderable shell (RSC-safe); the join-code input and
// the auto-unlock poller live in the <GateJoinCode> client island.
//
// Two ways in, in priority order:
//  1. Self-serve: type the class code from the board → enrolled on the spot.
//  2. Wait for a roster add → the poller unlocks this page automatically.
// Meanwhile the avatar builder is offered as a real first step, not a coping
// activity — the checklist framing makes the wait feel like onboarding.

export default function EnrollmentGateScreen({ firstName }: { firstName?: string }) {
  const stepBadge = (n: number) => (
    <span
      className="grid place-items-center shrink-0 text-xs font-bold"
      style={{ width: 24, height: 24, borderRadius: '50%', background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}
    >
      {n}
    </span>
  )

  return (
    <div className="max-w-2xl mx-auto px-5 py-10" style={{ color: 'var(--foreground)' }}>
      <div
        className="rounded-2xl border p-7"
        style={{
          borderColor: 'color-mix(in oklch, var(--primary) 35%, var(--border))',
          background: 'radial-gradient(80% 120% at 90% -10%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%), var(--card)',
        }}
      >
        <div className="grid place-items-center mb-4" style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in oklch, var(--primary) 18%, transparent)', color: 'var(--primary)' }}>
          <GraduationCap size={26} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {firstName ? `Welcome, ${firstName} — let’s get you into your class.` : 'Welcome — let’s get you into your class.'}
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
          You&rsquo;re signed in. One step left: connect to your class so lessons, scores, and the leaderboard show up.
        </p>

        {/* Step 1 — self-serve class code */}
        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-1">
            {stepBadge(1)}
            <span className="text-sm font-semibold inline-flex items-center gap-1.5">
              <KeyRound size={14} style={{ color: 'var(--primary)' }} /> Have a class code? Join yourself.
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Your teacher may have written a 6-character code on the board. Type it here and you&rsquo;re in — no waiting.
          </p>
          <GateJoinCode />
        </div>

        {/* Step 2 — roster add + auto-unlock */}
        <div className="mt-3 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-1">
            {stepBadge(2)}
            <span className="text-sm font-semibold inline-flex items-center gap-1.5">
              <Mail size={14} style={{ color: 'var(--muted-foreground)' }} /> No code? Your teacher can add you.
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Tell your teacher your school email and they&rsquo;ll add you to the roster. This page checks on its own and unlocks the moment you&rsquo;re in — no refreshing needed.
          </p>
        </div>

        {/* Step 3 — a real first task while waiting */}
        <div className="mt-3 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-2">
            {stepBadge(3)}
            <span className="text-sm font-semibold">Meanwhile, set up your identity.</span>
          </div>
          <Link
            href="/avatar"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Smile size={16} /> Build your Mii and pick a leaderboard name
          </Link>
        </div>
      </div>
    </div>
  )
}
