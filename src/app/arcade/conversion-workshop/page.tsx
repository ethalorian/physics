import Link from 'next/link'

export const metadata = {
  title: 'Conversion Workshop | Physics Classroom',
  description: 'Learn unit conversions step by step, then practice length, mass, time, rates, and area.',
}

export default function ConversionWorkshopPage() {
  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-5">
      <Link href="/arcade" className="mb-3 inline-block text-sm" style={{ color: 'var(--muted-foreground)' }}>← Back to arcade</Link>
      <iframe
        src="/games/conversion-workshop/index.html"
        title="Conversion Workshop — learn and practice unit conversions"
        className="w-full rounded-xl border"
        style={{ height: 'calc(100dvh - 145px)', minHeight: 700, borderColor: 'var(--border)', background: '#101826' }}
      />
    </div>
  )
}
