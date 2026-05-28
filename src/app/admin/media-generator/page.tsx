import Link from 'next/link'

// The AI Media Studio (Google Imagen / Veo) was retired. This route is kept as a
// simple notice so any old bookmark lands somewhere sensible.
export default function MediaGeneratorRemovedPage() {
  return (
    <div className="max-w-md mx-auto mt-20 text-center px-4" style={{ color: 'var(--foreground)' }}>
      <div className="rounded-2xl border p-8" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h1 className="text-xl font-semibold tracking-tight mb-2">AI Media Studio has been removed</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Add images to lessons by uploading a file or pasting a URL in the lesson builder’s figure block, or set a lesson hero image in the lesson editor.
        </p>
        <Link href="/admin/home" className="inline-block mt-5 text-sm font-semibold rounded-lg px-4 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          Back to the command center
        </Link>
      </div>
    </div>
  )
}
