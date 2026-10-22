import 'server-only'
import type { ContentBlock } from '@/data/content-blocks'
import { supabaseAdmin } from '@/lib/supabase'
import { ARTIFACT_ID } from './lesson-artifacts'

/** Verify ownership before either a draft or committed response references a file. */
export async function ownsLessonArtifact(block: ContentBlock, response: unknown, lessonId: string, userId: string) {
  if (block.type !== 'sketch' || block.submission !== 'upload') return true
  const id = (response as { attachmentId?: string } | null)?.attachmentId
  if (!id) return true // An incomplete draft can contain just the caption.
  if (!ARTIFACT_ID.test(id)) return false
  const result = await supabaseAdmin.from('lesson_artifacts').select('id').match({ id, lesson_id: lessonId, user_id: userId, block_id: block.id }).maybeSingle()
  if (result.error) throw result.error
  return !!result.data
}
