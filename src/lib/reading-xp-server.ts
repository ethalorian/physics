import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { READING_ASSIGNMENT_XP, type ReadingXpStatus } from '@/lib/xp-policy'

/** Access must already be authorized. Receipts never trust a client-provided user. */
export async function readingXpStatus(assignmentId: string, userId: string): Promise<ReadingXpStatus> {
  const { data, error } = await supabaseAdmin.from('economy_point_grants').select('points,awarded_at')
    .eq('user_id', userId).eq('dedupe_key', `reading-assignment:${assignmentId}:${userId}`).maybeSingle()
  // A receipt lookup failure must not make a committed submission look unsaved.
  if (error) return { earned: null, available: READING_ASSIGNMENT_XP, awardedAt: null }
  return { earned: data?.points ?? 0, available: READING_ASSIGNMENT_XP, awardedAt: data?.awarded_at ?? null }
}
