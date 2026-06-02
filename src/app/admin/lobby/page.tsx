"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Plus, ArrowRight, KeyRound, Trash2, Search, ArrowDownUp } from 'lucide-react'
import { ESCAPE_ROOMS, getRoom, decodeEscapeConfig, type EscapePrizeTier } from '@/lib/lobby/escape'

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
  { v: 'escape', label: 'Escape room (multi-lock co-op)' },
]
const PRIZE_TIERS: { v: EscapePrizeTier; label: string }[] = [
  { v: 'xp', label: 'XP only (automatic)' },
  { v: 'cosmetic', label: 'XP + cosmetic unlock' },
  { v: 'surprise', label: 'Surprise — real-world reveal' },
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
  const [roomId, setRoomId] = useState(ESCAPE_ROOMS[0]?.id ?? '')
  const [prizeTier, setPrizeTier] = useState<EscapePrizeTier>('xp')
  const [prizeXp, setPrizeXp] = useState(250)
  const [prizeReveal, setPrizeReveal] = useState('')
  const [busy, setBusy] = useState(false)
  // Session-list controls
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('new')
  const [statusFilter, setStatusFilter] = useState('all')

  // When escape is selected, default the group size to whatever the chosen room
  // is authored for (trios for Reactor Lockdown, pairs for Green Light Garage).
  const pickTask = (next: string) => {
    setTask(next)
    if (next === 'escape') setSize(getRoom(roomId)?.recommendedGroupSize ?? 3)
  }
  const pickRoom = (id: string) => {
    setRoomId(id)
    setSize(getRoom(id)?.recommendedGroupSize ?? 3)
  }

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
        room_id: task === 'escape' ? roomId : undefined,
        prize: task === 'escape'
          ? { tier: prizeTier, xp: prizeTier === 'surprise' ? undefined : prizeXp, reveal: prizeReveal.trim() || undefined }
          : undefined,
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

  // For escape sessions, surface the room title (config is stored in the prompt).
  const roomTitleFor = (s: Session): string | null => {
    if (s.task_type !== 'escape') return null
    const cfg = decodeEscapeConfig(s.prompt)
    return cfg ? getRoom(cfg.roomId)?.title ?? null : null
  }

  // Search + filter + sort the session list.
  const STATUS_ORDER: Record<string, number> = { open: 0, grouped: 1, lobby: 2, closed: 3 }
  const q = query.trim().toLowerCase()
  const shownSessions = sessions
    .filter((s) => statusFilter === 'all' || s.status === statusFilter)
    .filter((s) => {
      if (!q) return true
      const hay = `${s.code} ${s.task_type} ${s.grouping_mode} ${roomTitleFor(s) ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'old': return Date.parse(a.created_at) - Date.parse(b.created_at)
        case 'code': return a.code.localeCompare(b.code)
        case 'task': return a.task_type.localeCompare(b.task_type) || Date.parse(b.created_at) - Date.parse(a.created_at)
        case 'status': return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || Date.parse(b.created_at) - Date.parse(a.created_at)
        default: return Date.parse(b.created_at) - Date.parse(a.created_at) // 'new'
      }
    })

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
            <select value={task} onChange={(e) => pickTask(e.target.value)}
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
          {task === 'escape' && (
            <div className="sm:col-span-2 grid gap-3 rounded-lg p-3" style={{ background: 'color-mix(in oklch, var(--primary) 6%, transparent)', border: '1px solid var(--border)' }}>
              <label className="text-sm">Room
                <select value={roomId} onChange={(e) => pickRoom(e.target.value)}
                  className="w-full rounded-lg border p-2 text-sm mt-1" style={field}>
                  {ESCAPE_ROOMS.map((r) => <option key={r.id} value={r.id}>{r.title} — {r.tagline}</option>)}
                </select>
              </label>
              <label className="text-sm">Prize
                <select value={prizeTier} onChange={(e) => setPrizeTier(e.target.value as EscapePrizeTier)}
                  className="w-full rounded-lg border p-2 text-sm mt-1" style={field}>
                  {PRIZE_TIERS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                </select>
              </label>
              {prizeTier !== 'surprise' && (
                <label className="text-sm">XP awarded
                  <input type="number" min={0} max={5000} value={prizeXp}
                    onChange={(e) => setPrizeXp(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-lg border p-2 text-sm mt-1" style={field} />
                </label>
              )}
              <label className="text-sm">Prize reveal <span style={{ color: 'var(--muted-foreground)' }}>(what the vault shows on escape — blank uses the room default)</span>
                <textarea value={prizeReveal} onChange={(e) => setPrizeReveal(e.target.value)} rows={2}
                  placeholder={prizeTier === 'surprise' ? 'e.g. Bring this screen to Mr. Antocci for your prize.' : 'Optional — overrides the default reveal.'}
                  className="w-full rounded-lg border p-2 text-sm mt-1" style={field} />
              </label>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Escape rooms run best as trios — group size is set to 3. Pair it with near-peer grouping to mix stronger and weaker students.</p>
            </div>
          )}
          {task !== 'escape' && (
            <label className="text-sm sm:col-span-2">Task — what students must do <span style={{ color: 'var(--destructive)' }}>*</span> <span style={{ color: 'var(--muted-foreground)' }}>(shown large at the top of every student screen)</span>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
                placeholder="e.g. Sketch the free-body diagram for the block on the ramp and label every force."
                className="w-full rounded-lg border p-2 text-sm mt-1" style={field} />
            </label>
          )}
        </div>
        <button onClick={create} disabled={busy || !courseId || (task !== 'escape' && !prompt.trim()) || (task === 'jigsaw' && pieces.split('\n').map((s) => s.trim()).filter(Boolean).length < 2)}
          className="mt-4 text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
          {busy ? 'Creating…' : 'Create lobby'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Your sessions {sessions.length > 0 && <span style={{ fontWeight: 400 }}>({shownSessions.length}{shownSessions.length !== sessions.length ? ` of ${sessions.length}` : ''})</span>}
        </h2>
      </div>

      {sessions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, task, room…"
              className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-sm" style={field}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border py-1.5 px-2 text-sm" style={field} title="Filter by status" aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="lobby">Lobby</option>
            <option value="grouped">Grouped</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <span className="inline-flex items-center gap-1.5 rounded-lg border py-1.5 px-2" style={field}>
            <ArrowDownUp size={13} style={{ color: 'var(--muted-foreground)' }} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-transparent" style={{ border: 'none', color: 'var(--foreground)', outline: 'none' }} title="Sort" aria-label="Sort sessions">
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="status">Status</option>
              <option value="task">Task type</option>
              <option value="code">Code A–Z</option>
            </select>
          </span>
        </div>
      )}

      <div className="grid gap-2">
        {sessions.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No sessions yet.</p>
        )}
        {sessions.length > 0 && shownSessions.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No sessions match your search.</p>
        )}
        {shownSessions.map((s) => {
          const room = roomTitleFor(s)
          return (
          <Link key={s.id} href={`/admin/lobby/${s.id}`}
            className="rounded-xl border p-3 flex items-center justify-between hover:opacity-90" style={card}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center gap-1 font-mono font-bold text-lg tracking-widest"
                style={{ color: 'var(--primary)' }}><KeyRound size={16} />{s.code}</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>
                {s.status}
              </span>
              <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                {s.grouping_mode} · size {s.group_size} · {room ?? s.task_type}
                <span className="hidden sm:inline"> · {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={(e) => del(e, s.id)} title="Delete session" aria-label="Delete session"
                className="rounded-md p-1.5" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}>
                <Trash2 size={15} />
              </button>
              <ArrowRight size={16} style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </Link>
          )
        })}
      </div>
    </div>
  )
}
