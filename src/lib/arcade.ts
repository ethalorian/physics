import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'

/**
 * Arcade cabinet helpers. The arcade is a pure XP SINK: a coin costs XP
 * (committed via reward_redemptions, same ledger as the store) and buys one
 * ranked run whose only payout is leaderboard position. Weekly boards reset
 * Monday 00:00 UTC; all-time bests form the Hall of Fame.
 */

export const PLAY_MAX_AGE_MS = 6 * 60 * 60 * 1000 // a coin is good for 6 hours

export type ArcadeGame = {
  slug: string
  name: string
  blurb: string | null
  src_path: string
  cost_xp: number
  unit: string | null
  accent: string | null
  max_plausible_score: number
  enabled: boolean
  sort_order: number
}

export type PlayRow = {
  id: string
  user_id: string
  game_slug: string
  status: string
  score: number
  meta: Record<string, unknown> | null
  created_at: string
}

/** Most recent Monday 00:00 UTC — the weekly season boundary. */
export function weekStartISO(): string {
  const d = new Date()
  const day = (d.getUTCDay() + 6) % 7 // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - day)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Staff plays are free and never rank (kept out of student boards). */
export function isStaff(ctx: Pick<AuthContext, 'role' | 'realRole'>): boolean {
  return ctx.realRole === 'admin' || ctx.role === 'teacher' || ctx.role === 'admin'
}

/**
 * Peer-facing display names: prefer the student's chosen alias, fall back to
 * real name (same policy as the lobby/leaderboard surfaces).
 */
export async function displayNames(userIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  if (userIds.length === 0) return names
  const { data } = await supabaseAdmin
    .from('students')
    .select('google_user_id, name, alias')
    .in('google_user_id', userIds)
  for (const s of (data ?? []) as { google_user_id: string | null; name: string | null; alias: string | null }[]) {
    if (s.google_user_id) names.set(s.google_user_id, s.alias || s.name || 'Student')
  }
  return names
}

/** Best ranked (non-staff) score per user from a set of plays, descending. */
export function rankPlays(plays: PlayRow[]): { user_id: string; score: number }[] {
  const best = new Map<string, number>()
  for (const p of plays) {
    if (p.meta && (p.meta as Record<string, unknown>).staff) continue
    if (p.score <= 0) continue
    best.set(p.user_id, Math.max(best.get(p.user_id) ?? 0, p.score))
  }
  return [...best.entries()]
    .map(([user_id, score]) => ({ user_id, score }))
    .sort((a, b) => b.score - a.score)
}
