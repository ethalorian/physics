import { supabaseAdmin } from '@/lib/supabase'
import type { MathXpStatus } from '@/lib/xp-policy'

export async function getMathXpStatus(userId: string): Promise<MathXpStatus> {
  const { data, error } = await supabaseAdmin.rpc('math_daily_xp_status', { p_user: userId })
  if (error) throw error
  if (!data || ![data.dailyEarned, data.dailyCap, data.remaining].every(Number.isFinite)) throw new Error('Math XP total unavailable')
  return data as MathXpStatus
}
