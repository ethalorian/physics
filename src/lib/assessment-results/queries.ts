import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { readingRows } from '@/lib/textbook-assignments-server'
import type { ResultStudent } from './types'

type Query = ReturnType<ReturnType<typeof supabaseAdmin.from>['select']>
export function read<T>(table: string, fields: string, filter: (q: Query) => Query, order: string[]) {
  return readingRows<T>((from, to) => {
    let query = filter(supabaseAdmin.from(table).select(fields))
    for (const key of order) query = query.order(key)
    return query.range(from, to) as unknown as PromiseLike<{ data: T[] | null; error: unknown }>
  })
}
export async function byIds<T>(table: string, fields: string, key: string, ids: string[], order: string[], filter: (q: Query) => Query = q => q): Promise<T[]> {
  const result: T[] = []
  for (let start = 0; start < ids.length; start += 100) result.push(...await read<T>(table, fields, q => filter(q.in(key, ids.slice(start, start + 100))), order))
  return result
}
export type Scope = { course: { id: string; name: string; section: string | null; program: string; track?: string | null }; students: ResultStudent[]; targets: Map<string, string>; targetIdsBySlug: Map<string, string>; targetRows: { id: string; slug: string; unit_id: string; statement: string; lesson_id: string | null }[]; includes: (unitIds: string[]) => boolean }

