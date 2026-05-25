"use client"

import { useState } from 'react'

// Teacher media upload — drop a PDF or image, get a public URL to paste into a
// figure or concept_exercise block. Posts to /api/media/upload (teacher/admin
// only, stores in the public `lesson-media` Supabase bucket).

interface Uploaded { name: string; url: string; size: number }

export default function MediaUploadPage() {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [folder, setFolder] = useState('')
  const [items, setItems] = useState<Uploaded[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true); setErr(null)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        if (folder.trim()) fd.append('folder', folder.trim())
        const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
        const j = await res.json()
        if (!res.ok) { setErr(j.error || `Could not upload ${file.name}`); continue }
        setItems((prev) => [{ name: file.name, url: j.url, size: j.size }, ...prev])
      }
    } catch { setErr('Upload failed') } finally { setBusy(false) }
  }

  const copy = (url: string) => {
    navigator.clipboard?.writeText(url).then(() => { setCopied(url); setTimeout(() => setCopied(null), 1500) }).catch(() => {})
  }

  return (
    <div className="max-w-3xl mx-auto p-6" style={{ color: 'var(--foreground)' }}>
      <h1 className="text-xl font-semibold tracking-tight">Upload media</h1>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted-foreground)' }}>
        PDFs and images, up to 25 MB. You&apos;ll get a public URL to paste into a Figure block or a chapter reader. Files go to the shared <code>lesson-media</code> store.
      </p>

      <div className="mb-4">
        <label className="text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Folder (optional, e.g. <code>chapters</code> or <code>figures</code>)</label>
        <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="chapters"
          className="block w-full mt-1 rounded-lg border p-2 text-sm" style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }} />
      </div>

      <label
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files) }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{busy ? 'Uploading…' : 'Click to choose a file, or drag it here'}</span>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>PDF · PNG · JPG · WEBP · SVG · GIF</span>
        <input type="file" accept="application/pdf,image/*" multiple className="hidden" disabled={busy}
          onChange={(e) => upload(e.target.files)} />
      </label>

      {err && <p className="text-sm mt-3" style={{ color: 'var(--destructive)' }}>{err}</p>}

      {items.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Uploaded</div>
          {items.map((it) => (
            <div key={it.url} className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{it.url}</div>
              </div>
              <button onClick={() => copy(it.url)} className="text-xs font-semibold rounded-lg border px-3 py-1.5 shrink-0"
                style={{ borderColor: 'var(--border)', color: copied === it.url ? 'var(--success)' : 'var(--primary)' }}>
                {copied === it.url ? 'Copied ✓' : 'Copy URL'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
