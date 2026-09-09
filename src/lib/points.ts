import { supabaseAdmin } from '@/lib/supabase'
// One XP currency: earnings drive rankings/goals; only balance is spendable.
// Refunds restore spending power without awarding new XP.
export interface EconomyTotals { lifetimeEarned: number; spent: number; balance: number }
// Shared with transactional avatar/store/arcade purchases. Database aggregation
// avoids REST row limits, and failures never masquerade as a zero balance.
export async function getBalance(userId: string): Promise<EconomyTotals> {
  const { data, error } = await supabaseAdmin.rpc('economy_totals', { p_user_id: userId })
  if (error) throw error
  if (!data || !['lifetimeEarned', 'spent', 'balance'].every(k => Number.isFinite(data[k]))) throw new Error('Invalid economy totals')
  return data as EconomyTotals
}
export async function getLifetimeEarned(userId: string): Promise<number> { return (await getBalance(userId)).lifetimeEarned }
export async function getCommittedSpend(userId: string): Promise<number> { return (await getBalance(userId)).spent }
