"use client"

// XP Challenges — create daily challenges (a target in a game source, live over
// a date range, target resets daily, bonus XP on completion) and assign them to
// class and student slices. Scoped to the signed-in teacher.

import { useCallback, useEffect, useState } from 'react'
import { Swords, Plus, Trash2, Pause, Play } from 'lucide-react'

interface Assignment { course_id: string | null; student_id: string | null; label: string }
interface Challenge {
  id: string; title: string; kind: string; game_slug: string | null; metric: string
  target: number; bonus_xp: number; starts_on: string; ends_on: string; active: boolean
  assignments: Assignment[]; completedToday: number
}
interface CourseRow { id: string; label: string }
interface GameRow { slug: string; name: string }

const KIND_LABEL: Record<string, string> = {
  'arcade-any': 'Any arcade game', 'arcade-game': 'Specific arcade game',
  'vocab-games': 'Vocabulary games', math: 'Math spine',
}

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [games, setGames] = useState<GameRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // create form
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('arcade-any')
  const [gameSlug, setGameSlug] = useState('')
  const [metric, setMetric] = useState<'xp' | 'plays'>('xp')
  const [target, setTarget] = useState(25)
  const [bonus, setBonus] = useState(10)
  const [startsOn, setStartsOn] = useState(todayStr())
  const [endsOn, setEndsOn] = useState(todayStr())
  const [pickedCourses, setPickedCourses] = useState<Set<string>>(new Set())
  const [studentEmails, setStudentEmails] = useState('')

  const load = useCallback(() => {
    fetch('/api/teacher/challenges')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setChallenges(d.challenges ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    fetch('/api/courses').then((r) => r.json())
      .then((d: { courses?: { id: string; name: string; section: string | null }[] }) =>
        setCourses((d.courses ?? []).map((c) => ({ id: c.id, label: [c.name, c.section].filter(Boolean).join(' · ') }))))
      .catch(() => {})
    fetch('/api/arcade/cabinet').then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.games) setGames(d.games.map((g: { slug: string; name: string }) => ({ slug: g.slug, name: g.name ?? g.slug }))) })
      .catch(() => {})
  }, [load])

  const autoTitle = () => {
    const what = kind === 'arcade-game' ? (games.find((g) => g.slug === gameSlug)?.name ?? 'the game') : KIND_LABEL[kind].toLowerCase()
    return metric === 'plays' ? `Play ${target} runs — ${what}` : `Earn ${target} XP — ${what}`
  }

  const create = async () => {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/teacher/challenges', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || autoTitle(),
          kind, game_slug: kind === 'arcade-game' ? gameSlug : undefined,
          metric: kind === 'math' ? 'xp' : metric, target, bonus_xp: bonus,
          starts_on: startsOn, ends_on: endsOn,
          course_ids: [...pickedCourses],
          student_emails: studentEmails.split(/[\s,;]+/).filter(Boolean),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Create failed')
      setTitle(''); setStudentEmails(''); setPickedCourses(new Set())
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (c: Challenge) => {
    await fetch('/api/teacher/challenges', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    }).catch(() => {})
    load()
  }
  const remove = async (c: Challenge) => {
    if (!confirm(`Delete "${c.title}"? Students lose the challenge; already-paid bonuses stay.`)) return
    await fetch(`/api/teacher/challenges?id=${c.id}`, { method: 'DELETE' }).catch(() => {})
    load()
  }

  const inputCls = 'rounded-lg px-3 py-2 text-sm'
  const inputStyle = { border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' } as const
  const ended = (c: Challenge) => c.ends_on < todayStr()

  return (
    <div className="max-w-4xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center gap-3 mb-1">
        <div className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in oklch, var(--reward) 18%, transparent)', color: 'var(--reward)' }}>
          <Swords size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">XP Challenges</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Daily targets in a game source. The target resets each day of the range; hitting it pays the bonus once per day.
          </p>
        </div>
      </div>

      {/* create */}
      <div className="rounded-2xl border p-4 mt-4 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="text-sm font-bold mb-3">New challenge</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label className="block text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Source
            <select value={kind} onChange={(e) => { setKind(e.target.value); if (e.target.value === 'math') setMetric('xp') }} className={`${inputCls} w-full mt-1`} style={inputStyle}>
              {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          {kind === 'arcade-game' && (
            <label className="block text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Game
              <select value={gameSlug} onChange={(e) => setGameSlug(e.target.value)} className={`${inputCls} w-full mt-1`} style={inputStyle}>
                <option value="">Pick a game…</option>
                {games.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Measure
            <select value={metric} disabled={kind === 'math'} onChange={(e) => setMetric(e.target.value as 'xp' | 'plays')} className={`${inputCls} w-full mt-1 disabled:opacity-60`} style={inputStyle}>
              <option value="xp">XP earned</option>
              <option value="plays">Plays / runs</option>
            </select>
          </label>
          <label className="block text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Daily target
            <input type="number" min={1} max={1000} value={target} onChange={(e) => setTarget(Math.max(1, Math.min(1000, parseInt(e.target.value || '1', 10) || 1)))} className={`${inputCls} w-full mt-1 tabular-nums`} style={inputStyle} />
          </label>
          <label className="block text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Bonus XP on hit
            <input type="number" min={0} max={100} value={bonus} onChange={(e) => setBonus(Math.max(0, Math.min(100, parseInt(e.target.value || '0', 10) || 0)))} className={`${inputCls} w-full mt-1 tabular-nums`} style={inputStyle} />
          </label>
          <label className="block text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Starts
            <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={`${inputCls} w-full mt-1`} style={inputStyle} />
          </label>
          <label className="block text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>Ends
            <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={`${inputCls} w-full mt-1`} style={inputStyle} />
          </label>
        </div>

        <label className="block text-xs font-semibold mt-3" style={{ color: 'var(--secondary-foreground)' }}>Title (optional — auto-named if blank)
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={autoTitle()} className={`${inputCls} w-full mt-1`} style={inputStyle} maxLength={120} />
        </label>

        <div className="text-xs font-semibold mt-3 mb-1.5" style={{ color: 'var(--secondary-foreground)' }}>Assign to</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {courses.map((c) => {
            const on = pickedCourses.has(c.id)
            return (
              <button key={c.id} type="button"
                onClick={() => setPickedCourses((prev) => { const n = new Set(prev); if (on) n.delete(c.id); else n.add(c.id); return n })}
                className="rounded-full px-3 py-1.5 text-sm font-semibold"
                style={{ border: `1.5px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'color-mix(in oklch, var(--primary) 12%, transparent)' : 'var(--background)', color: on ? 'var(--primary)' : 'var(--foreground)', cursor: 'pointer' }}>
                {on ? '✓ ' : ''}{c.label}
              </button>
            )
          })}
          {courses.length === 0 && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No classes found.</span>}
        </div>
        <input value={studentEmails} onChange={(e) => setStudentEmails(e.target.value)} placeholder="…and/or specific students: emails, comma-separated" className={`${inputCls} w-full`} style={inputStyle} />

        <div className="flex items-center gap-3 mt-3">
          <button onClick={create} disabled={saving || (kind === 'arcade-game' && !gameSlug) || (pickedCourses.size === 0 && !studentEmails.trim())}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
            <Plus size={15} /> {saving ? 'Creating…' : 'Create challenge'}
          </button>
          {error && <span className="text-xs" style={{ color: 'var(--destructive)' }}>{error}</span>}
        </div>
      </div>

      {/* manage */}
      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}
      {!loading && challenges.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No challenges yet — create your first above.</p>}
      <div className="space-y-3">
        {challenges.map((c) => (
          <div key={c.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)', opacity: c.active && !ended(c) ? 1 : 0.65 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[15px]">{c.title}</span>
              <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                {KIND_LABEL[c.kind] ?? c.kind}{c.game_slug ? ` · ${c.game_slug}` : ''}
              </span>
              <span className="text-xs rounded-full px-2 py-0.5 tabular-nums" style={{ background: 'color-mix(in oklch, var(--reward) 16%, transparent)', color: 'var(--reward-foreground)' }}>
                +{c.bonus_xp} XP
              </span>
              {ended(c) ? <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>ended</span>
                : !c.active ? <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>paused</span>
                : <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>live</span>}
              <span className="ml-auto flex gap-1.5">
                {!ended(c) && (
                  <button onClick={() => toggle(c)} title={c.active ? 'Pause' : 'Resume'} className="rounded-md border p-1.5" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                    {c.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                )}
                <button onClick={() => remove(c)} title="Delete" className="rounded-md border p-1.5" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {c.metric === 'plays' ? `${c.target} plays/day` : `${c.target} XP/day`} · {c.starts_on} → {c.ends_on}
              {' · '}<b style={{ color: 'var(--foreground)' }}>{c.completedToday}</b> hit it today
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {c.assignments.map((a, i) => (
                <span key={i} className="text-xs rounded-full px-2 py-0.5" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>{a.label}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
