import type { BlockDocument } from '@/data/content-blocks'
import { supabaseAdmin } from '@/lib/supabase'
import { filterDocumentForViewer } from '@/lib/track-visibility'
import { physicsProblemFormat } from '@/lib/physics-problem-format'
import { lessonCompletion, type LessonCompletion, type SavedLessonAnswer } from './lesson-completion'
import { readIdBatches } from './read-id-batches'

// A student can accumulate many attempts. Never silently stop at PostgREST's row limit.
export async function readLessonRows<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 500) {
    const { data, error } = await read(from, from + 499)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < 500) return rows
  }
}
export async function getLessonCompletions(userId: string, lessons: { id: string; content_blocks?: BlockDocument | null }[], track: string | null): Promise<Record<string, LessonCompletion>> {
  const current = lessons.filter(l => l.content_blocks?.presentation === 'physics-path')
  if (!current.length) return {}
  const ids = current.map(l => l.id)
  const [answers, submissions, drafts] = await Promise.all([
    readLessonRows<SavedLessonAnswer & { lesson_id: string }>((from,to) => supabaseAdmin.from('block_responses').select('lesson_id,block_id,response,created_at').eq('user_id',userId).in('lesson_id',ids).order('created_at').order('id').range(from,to)),
    readLessonRows<{ id: string; lesson_id: string; submitted_at: string }>((from,to) => supabaseAdmin.from('lesson_submissions').select('id,lesson_id,submitted_at').eq('user_id',userId).in('lesson_id',ids).order('submitted_at').order('id').range(from,to)),
    readLessonRows<{ lesson_id: string; block_id: string; updated_at: string }>((from,to) => supabaseAdmin.from('block_drafts').select('lesson_id,block_id,updated_at').eq('user_id',userId).in('lesson_id',ids).order('lesson_id').order('block_id').range(from,to)),
  ])
  const latest = new Map<string, typeof submissions[number]>()
  for (const s of submissions) latest.set(s.lesson_id,s)
  const reviews = await readIdBatches<{ submission_id: string }>([...latest.values()].map(s=>s.id), batch => supabaseAdmin.from('lesson_reviews').select('submission_id').in('submission_id',batch))
  const reviewed = new Set(reviews.map(r=>r.submission_id))
  const answersByLesson = new Map<string, typeof answers>()
  for (const answer of answers) {
    const rows = answersByLesson.get(answer.lesson_id) ?? []
    rows.push(answer)
    answersByLesson.set(answer.lesson_id, rows)
  }
  const draftsByLesson = new Map<string, typeof drafts>()
  for (const draft of drafts) {
    const rows = draftsByLesson.get(draft.lesson_id) ?? []
    rows.push(draft)
    draftsByLesson.set(draft.lesson_id, rows)
  }
  return Object.fromEntries(current.map(l => {
    const document = filterDocumentForViewer(physicsProblemFormat(l.id,l.content_blocks!),{role:'student',track})
    const submission = latest.get(l.id)
    return [l.id,lessonCompletion(document.blocks,answersByLesson.get(l.id) ?? [],submission ? {...submission,reviewed:reviewed.has(submission.id)} : undefined,draftsByLesson.get(l.id) ?? [])]
  }))
}
