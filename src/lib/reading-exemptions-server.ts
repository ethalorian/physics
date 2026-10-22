import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { readingRows } from './textbook-assignments-server'

export async function readingExemptions(assignmentIds: string[], userId?: string) {
  if (!assignmentIds.length) return []
  return readingRows<{ assignment_id: string; user_id: string }>((from, to) => {
    let query = supabaseAdmin.from('textbook_reading_exemptions').select('assignment_id,user_id').in('assignment_id', assignmentIds)
    if (userId) query = query.eq('user_id', userId)
    return query.order('assignment_id').order('user_id').range(from, to)
  })
}
