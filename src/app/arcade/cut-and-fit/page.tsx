import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cut & Fit | Trades Workshop',
  description: 'Plan, cut, and fit wood, pipe, and conduit in twelve hands-on trades work orders.',
}

export default function CutAndFitPage() {
  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-5">
      <Link href="/arcade" className="mb-3 inline-block text-sm" style={{ color: 'var(--muted-foreground)' }}>← Back to arcade</Link>
      <iframe
        src="/games/cut-and-fit/index.html"
        title="Cut & Fit — carpentry, plumbing, and electrical practice"
        className="w-full rounded-xl border"
        style={{ height: 'calc(100dvh - 145px)', minHeight: 650, borderColor: 'var(--border)', background: '#10282d' }}
      />
    </div>
  )
}
