"use client"

import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { Swords, Check, X, Clock, Trophy } from 'lucide-react'

interface Duel {
  id: string; status: string; ends_at: string | null
  them_name: string; me_score: number; them_score: number
  won: boolean; lost: boolean; tie: boolean
}
interface Data { incoming: Duel[]; outgoing: Duel[]; active: Duel[]; done: Duel[] }
interface Classmate { user_id: string; name: string }

export default function ChallengePanel() {
  const [data, setData] = useState<Data | null>(null)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [opp, setOpp] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch('/api/challenges').then((r) => r.json()).then(setData).catch(() => setData({ incoming: [], outgoing: [], active: [], done: [] }))
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/avatar/gallery').then((r) => r.json())
      .then((d) => setClassmates((d.avatars ?? []).filter((a: { is_me: boolean }) => !a.is_me).map((a: { user_id: string; name: string }) => ({ user_id: a.user_id, name: a.name }))))
      .catch(() => {})
  }, [])

  const act = async (id: string, action: string) => {
    setBusy(true)
    await fetch('/api/challenges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) })
    setBusy(false); load()
  }
  const start = async () => {
    if (!opp) return
    setBusy(true); setMsg(null)
    const res = await fetch('/api/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opponent_user_id: opp }) }).then((r) => r.json()).catch(() => ({ error: 'Failed' }))
    setBusy(false)
    if (res.error) setMsg(res.error); else { setOpp(''); load() }
  }
  const timeLeft = (iso: string | null) => {
    if (!iso) return ''
    const ms = new Date(iso).getTime() - Date.now()
    if (ms <= 0) return 'finishing…'
    const h = Math.floor(ms / 3600000)
    return h >= 24 ? `${Math.floor(h / 24)}d left` : `${h}h left`
  }

  if (!data) return <div className="text-sm py-6 text-center text-muted-foreground">Loading duels…</div>

  const empty = !data.incoming.length && !data.active.length && !data.outgoing.length && !data.done.length

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 bg-card">
        <div className="text-sm font-semibold flex items-center gap-2 mb-1"><Swords className="h-4 w-4 text-primary" /> Start a duel</div>
        <p className="text-xs text-muted-foreground mb-3">Challenge a classmate — whoever earns the most XP over the next 3 days wins <b className="text-reward">+30 XP</b>. The loser keeps everything they earned; nothing is lost.</p>
        <div className="flex gap-2">
          <select value={opp} onChange={(e) => setOpp(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Pick a classmate…</option>
            {classmates.map((c) => <option key={c.user_id} value={c.user_id}>{c.name}</option>)}
          </select>
          <button onClick={start} disabled={!opp || busy} className="rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-50">Challenge</button>
        </div>
        {msg && <p className="text-xs text-destructive mt-2">{msg}</p>}
      </div>

      {data.incoming.length > 0 && (
        <Section title="Challenges for you">
          {data.incoming.map((d) => (
            <Row key={d.id}>
              <span className="text-sm"><b>{d.them_name}</b> challenged you</span>
              <div className="flex gap-2">
                <button onClick={() => act(d.id, 'accept')} disabled={busy} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-success text-white"><Check className="h-3 w-3" /> Accept</button>
                <button onClick={() => act(d.id, 'decline')} disabled={busy} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold border border-border text-muted-foreground"><X className="h-3 w-3" /> Decline</button>
              </div>
            </Row>
          ))}
        </Section>
      )}

      {data.active.length > 0 && (
        <Section title="In progress">
          {data.active.map((d) => (
            <Row key={d.id}>
              <div className="text-sm">
                <div>You <b className="text-primary">{d.me_score}</b> — <b>{d.them_score}</b> {d.them_name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {timeLeft(d.ends_at)}</div>
              </div>
              <span className="text-xs font-semibold" style={{ color: d.me_score >= d.them_score ? 'var(--success)' : 'var(--muted-foreground)' }}>{d.me_score >= d.them_score ? 'leading' : 'behind'}</span>
            </Row>
          ))}
        </Section>
      )}

      {data.outgoing.length > 0 && (
        <Section title="Waiting for a reply">
          {data.outgoing.map((d) => (
            <Row key={d.id}>
              <span className="text-sm">You challenged <b>{d.them_name}</b></span>
              <button onClick={() => act(d.id, 'cancel')} disabled={busy} className="text-xs text-muted-foreground underline">Cancel</button>
            </Row>
          ))}
        </Section>
      )}

      {data.done.length > 0 && (
        <Section title="Recent results">
          {data.done.map((d) => (
            <Row key={d.id}>
              <span className="text-sm">vs <b>{d.them_name}</b> · {d.me_score}–{d.them_score}</span>
              <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: d.won ? 'var(--success)' : 'var(--muted-foreground)' }}>
                {d.won && <><Trophy className="h-3 w-3" /> Won +30 XP</>}{d.lost && 'Lost'}{d.tie && 'Tie'}
              </span>
            </Row>
          ))}
        </Section>
      )}

      {empty && <div className="text-sm text-center text-muted-foreground py-2">No duels yet — challenge someone above.</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{title}</div><div className="space-y-2">{children}</div></div>
}
function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">{children}</div>
}
