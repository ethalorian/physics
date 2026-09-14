'use client'

export default function LessonSaveConflict({ local, current }: { local: unknown; current: unknown }) {
  return <section role="alert" className="my-4 space-y-3 rounded-xl border border-destructive p-4 text-sm">
    <h3 className="font-semibold">This lesson changed in another tab or editor.</h3>
    <p>Your changes are still here. Compare them with the saved version, download your work, then reload the latest lesson and reapply the changes you want to keep.</p>
    <div className="grid gap-3 md:grid-cols-2">{[['Your changes', local], ['Latest saved lesson', current]].map(([label, value]) => <details key={String(label)}><summary className="min-h-11 cursor-pointer font-medium">{String(label)}</summary><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border p-3 text-xs">{JSON.stringify(value, null, 2)}</pre></details>)}</div>
    <button type="button" className="min-h-11 rounded border px-4" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(local, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'lesson-unsaved-changes.json'; a.click(); URL.revokeObjectURL(url) }}>Download your changes</button>
    <button type="button" className="ml-3 min-h-11 rounded border px-4" onClick={() => window.open(window.location.href, '_blank', 'noopener')}>Open latest in a new tab</button>
  </section>
}
