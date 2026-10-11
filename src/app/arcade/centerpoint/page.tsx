import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dead Center | Trades Workshop',
  description: 'Find and mark exact midpoints and the centers of rectangular material in twelve trades layout challenges.',
}

export default function CenterpointPage() {
  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-5">
      <Link href="/arcade" className="mb-3 inline-block text-sm" style={{ color: 'var(--muted-foreground)' }}>← Back to arcade</Link>
      <iframe
        src="/games/centerpoint/index.html"
        title="Dead Center — find and mark the center of material"
        className="w-full rounded-xl border"
        style={{ height: 'calc(100dvh - 145px)', minHeight: 650, borderColor: 'var(--border)', background: '#f5f3ed' }}
      />
    </div>
  )
}
