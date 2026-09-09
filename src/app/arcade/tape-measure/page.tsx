import Link from 'next/link'

export default function TapeMeasurePage() {
  return (
    <div className="mx-auto max-w-6xl p-3 sm:p-5">
      <Link href="/arcade" className="mb-3 inline-block text-sm" style={{ color: 'var(--muted-foreground)' }}>← Back to arcade</Link>
      <iframe
        src="/games/tape-workshop/index.html"
        title="Tape Workshop — trades measurement practice"
        className="w-full rounded-xl border"
        style={{ height: 'calc(100dvh - 145px)', minHeight: 650, borderColor: 'var(--border)', background: '#0b1820' }}
      />
    </div>
  )
}
