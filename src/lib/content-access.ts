import { supabaseAdmin } from '@/lib/supabase'

/**
 * Curriculum authoring authorization.
 *
 * Curriculum content (lessons, simulations, vocabulary, …) is SHARED across all
 * classes and teachers. Editing it is therefore NOT a teacher capability — teachers
 * assign curriculum to their own classes but never alter it. Authoring is reserved
 * for admins, plus "collaborators": specific people granted edit rights to specific
 * AREAS via `content_editor_grants` (e.g. a colleague who maintains the vocabulary
 * sets but nothing else).
 */

export type ContentArea = 'lessons' | 'simulations' | 'vocabulary' | 'reading' | 'question_bank'

export const ALL_CONTENT_AREAS: ContentArea[] = ['lessons', 'simulations', 'vocabulary', 'reading', 'question_bank']

/** True if the email may author this area: admins always; otherwise needs a grant. */
export async function canEditArea(email: string, area: ContentArea, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true
  if (!email) return false
  const { data } = await supabaseAdmin
    .from('content_editor_grants')
    .select('id')
    .eq('email', email)
    .eq('area', area)
    .maybeSingle()
  return !!data
}

/** Every area the email may author (all of them for an admin). */
export async function getEditableAreas(email: string, isAdmin: boolean): Promise<ContentArea[]> {
  if (isAdmin) return [...ALL_CONTENT_AREAS]
  if (!email) return []
  const { data } = await supabaseAdmin.from('content_editor_grants').select('area').eq('email', email)
  return ((data ?? []) as { area: ContentArea }[]).map((r) => r.area)
}
