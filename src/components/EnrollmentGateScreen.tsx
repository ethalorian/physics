import Link from 'next/link'
import { GraduationCap, Smile, Mail } from 'lucide-react'

// Server-renderable "you're not in a class yet" screen. Used by both the
// client-side <EnrollmentGate> wrapper and any RSC page that needs to early-
// return the gate before leaking content into the initial HTML payload.
// No hooks, no client APIs — pure JSX so RSCs can render it directly.

export default function EnrollmentGateScreen({ firstName }: { firstName?: string }) {
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
          {firstName ? `You're signed in, ${firstName}.` : "You're signed in."}
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
          You&rsquo;re not in a class yet, so lessons, scores, and the leaderboard are hidden until your teacher adds you to their roster.
        </p>

        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted-foreground)' }}>
            <Mail size={14} />
            <span className="text-xs font-semibold uppercase tracking-widest">What to do</span>
          </div>
          <p className="text-sm">
            Send your teacher your school email and ask them to add you to their Google Classroom or to the class roster in this app. Once they do, this page will unlock automatically &mdash; just refresh.
          </p>
        </div>

        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>While you wait</div>
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
