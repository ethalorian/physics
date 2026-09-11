interface Activity {
  arcade: { points: number | null; reference: string | null; awarded_at: string }[]
  plays: { game_slug: string; finished_at: string | null; meta: Record<string, unknown> | null }[]
  vocab: { score: number | null; game_type: string; completed_at: string }[]
  math: { points: number | null; awarded_at: string }[]
}
export function bountyProgress(c: { kind: string; metric: string; game_slug: string | null }, window: { startIso: string; endIso: string }, activity: Activity): number {
  const inside = (date: string | null) => !!date && Date.parse(date) >= Date.parse(window.startIso) && Date.parse(date) < Date.parse(window.endIso)
  const positive = (n: number | null) => Number.isFinite(n) ? Math.max(0, n ?? 0) : 0
  if (c.kind === 'arcade-any' || c.kind === 'arcade-game') {
    const matches = (slug: string | null) => c.kind === 'arcade-any' || slug === c.game_slug
    if (c.metric === 'plays') return activity.plays.filter(p => inside(p.finished_at) && matches(p.game_slug) && !p.meta?.staff && !p.meta?.spam_guard).length
    return Math.round(activity.arcade.filter(g => inside(g.awarded_at) && matches(g.reference)).reduce((sum, g) => sum + positive(g.points), 0))
  }
  if (c.kind === 'vocab-games') {
    const rows = activity.vocab.filter(v => inside(v.completed_at) && (!c.game_slug || v.game_type === c.game_slug))
    return c.metric === 'plays' ? rows.length : rows.reduce((sum, v) => sum + Math.min(25, Math.round(positive(v.score) / 10)), 0)
  }
  return Math.round(activity.math.filter(g => inside(g.awarded_at)).reduce((sum, g) => sum + positive(g.points), 0))
}
