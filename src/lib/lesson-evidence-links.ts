import { supabaseAdmin } from '@/lib/supabase'

/** Repair attribution without rewriting append-only responses or submitted snapshots. */
export async function evidenceWithLinks<T extends { id?: string; lesson_id: string | null; target_id?: string | null }>(rows: T[]): Promise<T[]> {
  const ids = rows.map((r) => r.id).filter((id): id is string => Boolean(id))
  if (!ids.length) return rows
  const { data, error } = await supabaseAdmin.from('lesson_evidence_links').select('response_id, lesson_id, target_id').in('response_id', ids)
  if (error) throw error
  const byId = new Map((data ?? []).map((link) => [link.response_id, link]))
  return rows.map((row) => {
    const link = row.id ? byId.get(row.id) : null
    return link ? { ...row, lesson_id: link.lesson_id ?? row.lesson_id, target_id: link.target_id ?? row.target_id } : row
  })
}
