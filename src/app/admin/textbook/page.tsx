"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { BookText, Upload, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

// /admin/textbook — see which Conceptual Physics chapters are in the private
// `textbook` bucket and drop PDFs in to (re)upload them. Files are named
// cpNN.pdf (student edition, from scripts/strip-teacher-column.py) or
// cpteNN.pdf (raw teacher edition — accepted but flagged, since it carries the
// answer column). Each file goes browser → Supabase Storage via a signed URL
// minted by /api/textbook/admin, so uploads aren't capped by Vercel's body limit.

type Status = 'student' | 'fallback-te' | 'missing'
interface Row { n: number; title: string; status: Status; size: number | null; updatedAt: string | null }
interface Job { name: string; chapter: number | null; te: boolean; state: 'queued' | 'uploading' | 'done' | 'error'; msg?: string }

const C = { fg: 'var(--foreground)', muted: 'var(--muted-foreground)', line: 'var(--border)', card: 'var(--card)', primary: 'var(--primary)', ok: 'var(--success)', warn: 'var(--reward)' }

function chapterFromName(name: string): { n: number | null; te: boolean } {
  const m = /^cp(te)?(\d{2})\.pdf$/i.exec(name.trim())
  return m ? { n: Number(m[2]), te: !!m[1] } : { n: null, te: false }
}

const STATUS_UI: Record<Status, { label: string; icon: typeof CheckCircle2; color: string }> = {
  'student': { label: 'Student edition in bucket', icon: CheckCircle2, color: C.ok },
  'fallback-te': { label: 'Falling back to public TEACHER copy', icon: AlertTriangle, color: C.warn },
  'missing': { label: 'Not available to students', icon: XCircle, color: 'var(--destructive, #c0392b)' },
}

export default function TextbookAdminPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/textbook/admin').then((x) => x.json()).catch(() => ({ error: 'Could not load' }))
    if (r.error) setError(r.error); else setRows(r.chapters)
  }, [])
  useEffect(() => { load() }, [load])

  const uploadAll = async (files: File[]) => {
    const list: Job[] = files.map((f) => { const { n, te } = chapterFromName(f.name); return { name: f.name, chapter: n, te, state: n ? 'queued' : 'error', msg: n ? undefined : 'Name must be cpNN.pdf' } })
    setJobs(list); setBusy(true)
    for (let i = 0; i < files.length; i++) {
      const job = list[i]
      if (!job.chapter) continue
      const update = (patch: Partial<Job>) => setJobs((js) => js.map((j, k) => (k === i ? { ...j, ...patch } : j)))
      update({ state: 'uploading' })
      try {
        const sign = await fetch('/api/textbook/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chapter: job.chapter }) }).then((r) => r.json())
        if (!sign.signedUrl) throw new Error(sign.error || 'Could not sign upload')
        const put = await fetch(sign.signedUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'true' }, body: files[i] })
        if (!put.ok) throw new Error(`Storage said ${put.status}`)
        update({ state: 'done' })
      } catch (e) {
        update({ state: 'error', msg: e instanceof Error ? e.message : 'Upload failed' })
      }
    }
    setBusy(false)
    load()
  }

  const onFiles = (fl: FileList | null) => { if (!fl?.length) return; uploadAll(Array.from(fl).filter((f) => f.name.toLowerCase().endsWith('.pdf')).sort((a, b) => a.name.localeCompare(b.name))) }

  const counts = rows ? { student: rows.filter((r) => r.status === 'student').length, te: rows.filter((r) => r.status === 'fallback-te').length, missing: rows.filter((r) => r.status === 'missing').length } : null
  const teUploads = jobs.filter((j) => j.te).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>Content library</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 mb-1" style={{ color: C.fg }}>
        <BookText className="h-6 w-6" style={{ color: C.primary }} /> Textbook chapters
      </h1>
      <p className="text-sm mb-5" style={{ color: C.muted }}>
        Private bucket <code>textbook</code>. Drop the <code>cpNN.pdf</code> student-edition files here — the whole folder at once is fine. Re-uploading a chapter replaces it.
      </p>

      {/* drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer mb-6"
        style={{ borderColor: C.line, background: C.card, opacity: busy ? 0.6 : 1 }}
      >
        <Upload className="h-6 w-6 mx-auto mb-2" style={{ color: C.primary }} />
        <div className="font-semibold" style={{ color: C.fg }}>{busy ? 'Uploading…' : 'Drop chapter PDFs here, or click to choose'}</div>
        <div className="text-xs mt-1" style={{ color: C.muted }}>cp02.pdf … cp40.pdf · up to 15 MB each</div>
        <input ref={inputRef} type="file" accept="application/pdf" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {teUploads > 0 && (
        <div className="rounded-xl border px-4 py-3 text-sm mb-4" style={{ borderColor: C.warn, color: C.fg }}>
          {teUploads} file{teUploads > 1 ? 's' : ''} named <code>cpteNN.pdf</code> — that&apos;s the teacher edition with the answer column. Run <code>scripts/strip-teacher-column.py</code> first unless you mean to give students the answers.
        </div>
      )}

      {jobs.length > 0 && (
        <div className="rounded-xl border mb-6 text-sm" style={{ borderColor: C.line, background: C.card }}>
          {jobs.map((j, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-1.5 border-b last:border-b-0" style={{ borderColor: C.line, color: C.fg }}>
              <span><code>{j.name}</code>{j.chapter ? ` → chapter ${j.chapter}` : ''}</span>
              <span style={{ color: j.state === 'done' ? C.ok : j.state === 'error' ? 'var(--destructive, #c0392b)' : C.muted }}>
                {j.state === 'done' ? 'uploaded' : j.state === 'error' ? j.msg : j.state}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-sm mb-4" style={{ color: 'var(--destructive, #c0392b)' }}>{error}</div>}

      {counts && (
        <div className="flex flex-wrap gap-3 text-sm mb-3" style={{ color: C.muted }}>
          <span><b style={{ color: C.ok }}>{counts.student}</b> student edition</span>
          <span><b style={{ color: C.warn }}>{counts.te}</b> falling back to teacher edition</span>
          <span><b style={{ color: 'var(--destructive, #c0392b)' }}>{counts.missing}</b> missing</span>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden text-sm" style={{ borderColor: C.line, background: C.card }}>
        {rows?.map((r) => {
          const ui = STATUS_UI[r.status]; const Icon = ui.icon
          return (
            <div key={r.n} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-2 border-b last:border-b-0" style={{ borderColor: C.line }}>
              <span className="tabular-nums font-semibold" style={{ color: C.muted }}>{r.n}</span>
              <span style={{ color: C.fg }}>{r.title}</span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: ui.color }} title={r.updatedAt ?? undefined}>
                <Icon className="h-4 w-4" /> {ui.label}{r.size ? ` · ${(r.size / 1048576).toFixed(1)} MB` : ''}
              </span>
            </div>
          )
        }) ?? <div className="p-4" style={{ color: C.muted }}>Loading…</div>}
      </div>
    </div>
  )
}
