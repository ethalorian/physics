import Link from 'next/link'

export const metadata = {
  title: 'Unit Lab | Physics Classroom',
  description: 'Build conversion chains, cancel units, and check physics relationships.',
}

export default function UnitLabPage() {
  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-5">
      <Link href="/arcade" className="mb-3 inline-block text-sm" style={{ color: 'var(--muted-foreground)' }}>← Back to arcade</Link>
      <iframe
        src="/games/unit-lab/index.html"
        title="Unit Lab — units and dimensional analysis"
        className="w-full rounded-xl border"
        style={{ height: 'calc(100dvh - 145px)', minHeight: 700, borderColor: 'var(--border)', background: '#0b1420' }}
      />
    </div>
  )
}
