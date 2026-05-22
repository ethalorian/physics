import { supabaseAdmin } from '@/lib/supabase'

/**
 * Points economy helpers. Lifetime EARNED is computed the same way the leaderboard
 * computes it (games + lesson engagement + graded submissions), so the spendable
 * balance never diverges from the leaderboard standing.
 *
 *   lifetimeEarned = Σ game scores
 *                  + Σ (lesson_progress.progress_percentage + 5·video_questions_correct)
 *                  + Σ graded submission scores
 *   balance        = lifetimeEarned − Σ committed redemptions (status <> 'denied')
 */

export async function getLifetimeEarned(userId: string): Promise<number> {
  let total = 0

  const { data: games } = await supabaseAdmin
    .from('vocabulary_game_scores')
    .select('score')
    .eq('user_id', userId)
  for (const g of games ?? []) total += g.score || 0

  const { data: lessons } = await supabaseAdmin
    .from('lesson_progress')
    .select('progress_percentage, video_questions_correct')
    .eq('user_id', userId)
  for (const l of lessons ?? []) total += (l.progress_percentage || 0) + (l.video_questions_correct || 0) * 5

  const { data: subs } = await supabaseAdmin
    .from('submissions')
    .select('score')
    .eq('user_id', userId)
    .eq('status', 'graded')
  for (const s of subs ?? []) total += s.score || 0

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
