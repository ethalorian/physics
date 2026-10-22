import 'server-only'
import { choiceSections, choiceEvidence } from '@/lib/choice-calendar-server'
import { sourceKey, sectionProgress, type ChoiceSelection } from '@/lib/choice-calendar'
import { byIds, type Scope } from './queries'
import { resultUnitIds } from './model'
import type { ResultActivity, ResultCell } from './types'
import type { BlockDocument } from '@/data/content-blocks'

export async function choiceResults(scope: Scope): Promise<ResultActivity[]> {
  const sections = await choiceSections([scope.course.id], false), ids = sections.map(s => s.id), users = scope.students.map(s => s.id)
  if (!ids.length || !users.length) return []
  const [selections, evidence, lessons] = await Promise.all([
    byIds<ChoiceSelection & {score: number | null}>('choice_selections', '*', 'section_id', ids, ['section_id','option_id','user_id'], q => q.in('user_id', users)),
    choiceEvidence(sections, users),
    byIds<{id: string; unit_id: string; content_blocks: BlockDocument}>('lessons', 'id,unit_id,content_blocks', 'id', sections.flatMap(s => s.options.flatMap(o => o.steps.filter(s => s.kind === 'lesson').map(s => s.sourceId))), ['id']),
  ])
  return sections.flatMap(section => {
    const progress = Object.fromEntries(users.map(user => [user, sectionProgress(section, selections.filter(s => s.section_id === section.id && s.user_id === user), evidence[user], Date.now())]))
    const activities: ResultActivity[] = section.options.map(option => {
      const related = lessons.filter(l => option.steps.some(s => s.kind === 'lesson' && s.sourceId === l.id))
      const targetIds = [...new Set([...option.targetIds, ...related.flatMap(l => (l.content_blocks?.blocks??[]).flatMap(b => { const id = b.targetId; return id ? [scope.targetIdsBySlug.get(id) ?? id].filter(id => scope.targets.has(id)) : [] }))])]
      const unitIds = [...new Set([...resultUnitIds(targetIds, scope.targets), ...related.map(l => l.unit_id)])]
      return { key: 'choice:' + section.id + ':' + option.id, sourceId: option.id, choiceSectionId: section.id, sourceKeys: option.steps.filter(s=>!s.followUp).map(sourceKey), followUpKeys:option.steps.filter(s=>s.followUp).map(sourceKey), kind: 'choice', title: option.title, unitIds, targetIds, lessonIds: related.map(l => l.id), dueAt: section.due_at, archived: !section.published,
        cells: Object.fromEntries(users.map(user => {
          const state = progress[user].options.find(o => o.option.id === option.id)!, selection = selections.find(s => s.section_id === section.id && s.option_id === option.id && s.user_id === user)
          const pendingTargets = selection?.artifact_submitted_at ? option.targetIds.filter(id => selection.artifact_ratings?.[id]?.version !== selection.artifact_version) : []
          const score = selection?.score != null ? `${selection.score}/${section.points_per_choice}` : null
          return [user, {state: state.grade === 'EX' ? 'excused' : state.completed ? score ? 'reviewed' : 'submitted' : state.attempted ? 'draft' : 'not_started', label: state.grade === 'EX' ? 'EX' : state.grade === 'missing' ? 'Missing' : score ?? (state.completed ? 'Submitted · Grade pending' : state.attempted ? 'In progress' : state.selected ? 'Planned' : 'Not chosen'), detail: state.grade === 'missing' ? `${state.requiredRemaining} ${option.category} still required${score ? ' · Attempted work: '+score : ''} · Zero recorded once under missing choices` : option.lab && selection?.lab_completed_at && option.artifactInstructions && !selection.artifact_submitted_at ? 'Session complete · Artifact still due' : section.title, needsReview: state.completed && !score || pendingTargets.length > 0, pendingTargets, submittedAt: selection?.artifact_submitted_at } satisfies ResultCell]
        })) }
    })
    const missingCount = Math.max(0, ...Object.values(progress).map(p => p.missingEntries.length))
    for (let i=0; i<missingCount; i++) activities.push({ key: `choice:${section.id}:missing:${i}`, sourceId: '', choiceSectionId: section.id, kind: 'choice', title: `${section.title} · Missing required choice ${i+1}`, unitIds: [...new Set(activities.flatMap(a => a.unitIds))], dueAt: section.due_at, archived: !section.published, cells: Object.fromEntries(users.flatMap(user => { const entry=progress[user].missingEntries[i]; return entry ? [[user, {state:'not_started',label:`0/${entry.possible}`,detail:`Choice section incomplete${entry.reason ? ' · '+entry.reason+' still required' : ''}`,needsReview:false} satisfies ResultCell]] : [] })) })
    return activities
  })
}
