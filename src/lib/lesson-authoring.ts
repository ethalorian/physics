import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { canEditArea } from '@/lib/content-access'
import { supabaseAdmin } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import { targetIdsForLesson } from '@/lib/lesson-targets'
import { hydrateLessonDocument } from '@/lib/lesson-access'
import type { BlockDocument } from '@/data/content-blocks'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import type { LessonRewardMaps } from '@/lib/xp-policy'

export async function lessonAuthoringData(id: string, editing = true) {
  const session = await auth()
  if (!session?.user?.email) redirect('/api/auth/signin')
  const context = await getEffectiveContext(session.user.email)
  const canEdit = await canEditArea(
    session.user.email,
    'lessons',
    context.realRole === 'admin',
  )
  if (
    editing
      ? !canEdit
      : !canEdit && !['admin', 'teacher'].includes(context.realRole)
  )
    redirect('/home')
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!lesson) notFound()
  const document = lesson.content_blocks as BlockDocument | null
  const [ids, units, targets, vocabulary, hydrated, cpaRewards, honorsRewards] = await Promise.all([
    targetIdsForLesson(id, document),
    supabaseAdmin
      .from('units')
      .select('id, name, program')
      .order('order_index'),
    supabaseAdmin
      .from('learning_targets')
      .select('id, slug, statement, unit_id')
      .eq('unit_id', lesson.unit_id),
    supabaseAdmin
      .from('vocabulary_sets')
      .select('id')
      .eq('lesson_id', id)
      .maybeSingle(),
    document
      ? hydrateLessonDocument(document, lesson.unit_id)
      : Promise.resolve(null),
    supabaseAdmin.rpc('lesson_reward_map', { p_lesson: id, p_track: 'cpa' }),
    supabaseAdmin.rpc('lesson_reward_map', { p_lesson: id, p_track: 'honors' }),
  ])
  if (units.error) throw units.error
  if (targets.error) throw targets.error
  if (vocabulary.error) throw vocabulary.error
  if (cpaRewards.error) throw cpaRewards.error
  if (honorsRewards.error) throw honorsRewards.error
  const rewardMaps: LessonRewardMaps = { cpa: cpaRewards.data ?? {}, honors: honorsRewards.data ?? {} }
  const allTargets = [...(targets.data ?? [])]
  const missingIds = ids.filter(
    (id) => !allTargets.some((target) => target.id === id),
  )
  if (missingIds.length) {
    const extra = await supabaseAdmin
      .from('learning_targets')
      .select('id, slug, statement, unit_id')
      .in('id', missingIds)
    if (extra.error) throw extra.error
    allTargets.push(...(extra.data ?? []))
  }
  let terms: GlossaryEntry[] = []
  if (vocabulary.data) {
    const result = await supabaseAdmin
      .from('vocabulary_terms')
      .select('term, definition, tier, cognate, part_of_speech, example')
      .eq('vocabulary_set_id', vocabulary.data.id)
    if (result.error) throw result.error
    terms = (result.data ?? [])
      .filter((t) => t.term && t.definition && (t.tier ?? 3) >= 2)
      .map((t) => ({
        term: t.term,
        definition: t.definition,
        tier: t.tier ?? undefined,
        cognate: t.cognate ?? undefined,
        partOfSpeech: t.part_of_speech ?? undefined,
        example: t.example ?? undefined,
      }))
  }
  const seen = new Set(terms.map((t) => t.term.toLowerCase()))
  terms.push(
    ...(Array.isArray(lesson.key_terms) ? lesson.key_terms : []).filter(
      (t: GlossaryEntry) =>
        t?.term && t.definition && !seen.has(t.term.toLowerCase()),
    ),
  )
  return {
    lesson,
    rewardMaps,
    document: hydrated,
    terms,
    targetIds: ids,
    targets: allTargets,
    units: units.data ?? [],
    canEdit,
    canPublish: context.realRole === 'admin',
  }
}
