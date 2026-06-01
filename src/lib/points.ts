import { supabaseAdmin } from '@/lib/supabase'

/**
 * Points economy helpers. Lifetime EARNED is the leaderboard standing AND the
 * spendable balance (one pool). Rebalanced 2026-06 so the store rewards LEARNING
 * rather than arcade grinding: games are a small capped bonus, lessons/graded
 * work/mastery are the real paycheck. See docs/XP_ECONOMY_REVIEW.md.
 *
 *   lifetimeEarned = Σ_day  min(50, Σ_play min(25, gameScore/10))   // games: per-play & daily caps
 *                  + Σ (round(progress_percentage/4) + 5·video_questions_correct)  // lessons: ≤25 from progress
 *                  + Σ min(40, graded submission score)             // graded work, capped
 *                  + Σ math-literacy milestone grants               // mastery: best per-event paycheck
 *                  + Σ economy_point_grants (escape room, events)
 *   balance        = lifetimeEarned − Σ committed redemptions (status <> 'denied')
 */

const GAME_PER_PLAY_CAP = 25
const GAME_PER_DAY_CAP = 50
const LESSON_PROGRESS_DIVISOR = 4   // progress_percentage (0–100) → 0–25
const SUBMISSION_CAP = 40

export async function getLifetimeEarned(userId: string): Promise<number> {
  let total = 0

  // Games — a capped bonus, not currency. Each play is worth min(25, score/10);
  // a whole day of games is capped at 50 so the store can't be farmed by grinding.
  const { data: games } = await supabaseAdmin
    .from('vocabulary_game_scores')
    .select('score, created_at')
    .eq('user_id', userId)
  const gamePtsByDay = new Map<string, number>()
  for (const g of games ?? []) {
    const day = String(g.created_at ?? '').slice(0, 10)
    const play = Math.min(GAME_PER_PLAY_CAP, Math.round((g.score || 0) / 10))
    gamePtsByDay.set(day, (gamePtsByDay.get(day) ?? 0) + play)
  }
  for (const dayTotal of gamePtsByDay.values()) total += Math.min(GAME_PER_DAY_CAP, dayTotal)

  // Lessons — pay toward mastery: progress is capped at 25 (down from raw 0–100,
  // i.e. paying to scroll) plus correct in-video questions.
  const { data: lessons } = await supabaseAdmin
    .from('lesson_progress')
    .select('progress_percentage, video_questions_correct')
    .eq('user_id', userId)
  for (const l of lessons ?? []) {
    total += Math.round((l.progress_percentage || 0) / LESSON_PROGRESS_DIVISOR) + (l.video_questions_correct || 0) * 5
  }

  // Graded submissions — real learning work, capped so one big assignment isn't a jackpot.
  const { data: subs } = await supabaseAdmin
    .from('submissions')
    .select('score')
    .eq('user_id', userId)
    .eq('status', 'graded')
  for (const s of subs ?? []) total += Math.min(SUBMISSION_CAP, s.score || 0)

  // Math-literacy spine: milestone grants — the best per-event paycheck (mastery).
  const { data: mathGrants } = await supabaseAdmin
    .from('math_spine_point_grants')
    .select('points')
    .eq('user_id', userId)
  for (const m of mathGrants ?? []) total += m.points || 0

  // General-purpose grants (Escape Room, special events).
  const { data: economyGrants } = await supabaseAdmin
    .from('economy_point_grants')
    .select('points')
    .eq('user_id', userId)
  for (const e of economyGrants ?? []) total += e.points || 0

  return Math.round(total)
}

export async function getCommittedSpend(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('reward_redemptions')
    .select('cost_points, status')
    .eq('user_id', userId)
  let spent = 0
  for (const r of data ?? []) if (r.status !== 'denied') spent += r.cost_points || 0
  return spent
}

export async function getBalance(userId: string): Promise<{ lifetimeEarned: number; spent: number; balance: number }> {
  const [lifetimeEarned, spent] = await Promise.all([getLifetimeEarned(userId), getCommittedSpend(userId)])
  return { lifetimeEarned, spent, balance: lifetimeEarned - spent }
}
