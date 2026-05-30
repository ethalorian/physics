"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Plus, ArrowRight, KeyRound, Trash2 } from 'lucide-react'

interface Course { id: string; name: string; section?: string | null }
interface Target { id: string; statement: string; domain: string; unit_id: string }
interface Session {
  id: string; code: string; task_type: string; grouping_mode: string
  group_size: number; status: string; prompt: string | null; created_at: string
}

const MODES = [
  { v: 'random', label: 'Random' },
  { v: 'near_peer', label: 'Near-peer (mix, not top+bottom)' },
  { v: 'matched', label: 'Matched (similar levels)' },
]
const TASKS = [
  { v: 'short_response', label: 'Short response' },
  { v: 'drawing', label: 'Drawing' },
  { v: 'question', label: 'Question' },
  { v: 'proof', label: 'Proof they talked' },
  { v: 'jigsaw', label: 'Jigsaw (each student holds a piece)' },
]

export default function LobbyAdminPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [targets, setTargets] = useState<Target[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [courseId, setCourseId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [task, setTask] = useState('short_response')
  const [mode, setMode] = useState('random')
  const [size, setSize] = useState(4)
  const [prompt, setPrompt] = useState('')
  const [pieces, setPieces] = useState('')
  const [busy, setBusy] = useState(false)

  const loadSessions = () =>
    fetch('/api/lobby/sessions').then((r) => r.json()).then((d) => setSessions(d.sessions ?? [])).catch(() => {})

  useEffect(() => {
    fetch('/api/courses').then((r) => r.json()).then((d: { courses?: Course[] }) => {
      const cs = d.courses ?? []
      setCourses(cs)
      if (cs[0]) setCourseId(cs[0].id)
    }).catch(() => {})
    fetch('/api/lobby/targets').then((r) => r.json())
      .then((d: { targets?: Target[] }) => setTargets(d.targets ?? [])).catch(() => {})
    loadSessions()
  }, [])

  const create = async () => {
    if (!courseId) return
    setBusy(true)
    const r = await fetch('/api/lobby/sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId, task_type: task, grouping_mode: mode, group_size: size, prompt,
        target_id: targetId || null,
        jigsaw_pieces: task === 'jigsaw' ? pieces.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
      }),
    })
    setBusy(false)
    const d = await r.json().catch(() => ({}))
    if (d.session?.id) router.push(`/admin/lobby/${d.session.id}`)
  }

  const del = async (e: React.MouseEvent, sid: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!window.confirm('Delete this lobby session? This permanently removes its groups and any student submissions.')) return
    await fetch(`/api/lobby/sessions/${sid}`, { method: 'DELETE' }).catch(() => {})
    loadSessions()
  }

  const card: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)' }
  const field: React.CSSProperties = {
    borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)',
  }

  return (
    <div className="max-w-3xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Users size={22} style={{ color: 'var(--primary)' }} />
        <h1 className="text-2xl font-semibold tracking-tight">Lobby Sessions</h1>
      </div>

      <div className="rounded-2xl border p-5 mb-6" style={card}>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Plus size={15} /> New session</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Class
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm mt-1" style={field}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.section ? `${c.name} · ${c.section}` : c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">Task
            <select value={task} onChange={(e) => setTask(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm mt-1" style={field}>
              {TASKS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </label>
          <label className="text-sm">Grouping
            <select value={mode} onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm mt-1" style={field}>
              {MODES.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
            </select>
          </label>
          <label className="text-sm">Group size
            <input type="number" min={2} max={6} value={size}
              onChange={(e) => setSize(Math.max(2, Math.min(6, Number(e.target.value) || 4)))}
              className="w-full rounded-lg border p-2 text-sm mt-1" style={field} />
          </label>
          {(mode === 'near_peer' || mode === 'matched') && (
            <label className="text-sm sm:col-span-2">Learning target <span style={{ color: 'var(--muted-foreground)' }}>(optional — group on this target&apos;s mastery)</span>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border p-2 text-sm mt-1" style={field}>
                <option value="">Overall mastery (no specific target)</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>{t.statement.slice(0, 80)}</option>
                ))}
              </select>
            </label>
          )}
          {task === 'jigsaw' && (
            <label className="text-sm sm:col-span-2">Jigsaw pieces <span style={{ color: 'var(--muted-foreground)' }}>(one per line — each student is dealt one; the group can&apos;t answer without all of them)</span>
              <textarea value={pieces} onChange={(e) => setPieces(e.target.value)} rows={5}
                placeholder={'mass of elevator + rider = 80 kg\nupward acceleration = 2 m/s²\nonly forces are tension (up) and gravity (down)\ng = 9.8 m/s²; solve for the cable tension'}
                className="w-full rounded-lg border p-2 text-sm mt-1 font-mono" style={field} />
            </label>
          )}
          <label className="text-sm sm:col-span-2">Prompt (what students do)
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
              placeholder="e.g. Sketch the free-body diagram for the block on the ramp."
              className="w-full rounded-lg border p-2 text-sm mt-1" style={field} />
          </label>
        </div>
        <button onClick={create} disabled={busy || !courseId || (task === 'jigsaw' && pieces.split('\n').map((s) => s.trim()).filter(Boolean).length < 2)}
          className="mt-4 text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
          {busy ? 'Creating…' : 'Create lobby'}
        </button>
      </div>

      <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Your sessions</h2>
      <div className="grid gap-2">
        {sessions.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No sessions yet.</p>
        )}
        {sessions.map((s) => (
          <Link key={s.id} href={`/admin/lobby/${s.id}`}
            className="rounded-xl border p-3 flex items-center justify-between hover:opacity-90" style={card}>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-mono font-bold text-lg tracking-widest"
                style={{ color: 'var(--primary)' }}><KeyRound size={16} />{s.code}</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>
                {s.status}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {s.grouping_mode} · size {s.group_size} · {s.task_type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => del(e, s.id)} title="Delete session" aria-label="Delete session"
                className="rounded-md p-1.5" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}>
                <Trash2 size={15} />
              </button>
              <ArrowRight size={16} style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
