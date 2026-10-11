import type { LessonCompletion } from './lesson-completion'
import type { BlockDocument } from '@/data/content-blocks'
import { PHYSICS_VIDEOS } from '@/data/physics-videos'
import { physicsLearningEntry, type PhysicsTarget } from '@/lib/physics-learning'
import { filterDocumentForViewer, isLessonVisible, type Viewer } from '@/lib/track-visibility'
import type { LessonWindowStatus } from '@/lib/lesson-windows'
import { CONCEPT_LABELS, VIDEO_CONNECTIONS, type ConceptLesson, type LessonConceptMapData } from '@/lib/lesson-concept-map'

export interface MapCatalogLesson {
  id: string; title: string; slug: string; unit?: string | null; unit_id?: string | null
  published?: boolean | null; visibility_track?: string | null; content_blocks?: BlockDocument | null
}
export function isMapCatalogLesson(lesson: MapCatalogLesson) {
  return lesson.published === true && lesson.content_blocks?.presentation === 'physics-path' && Boolean(lesson.content_blocks.learningPath)
}
/** Students receive their server-scoped program catalog; observers receive published lessons. Closed nodes
 * reveal names and goals, never documents, media IDs, answers or playable URLs. */
export function buildLessonConceptMap(lessons: MapCatalogLesson[], targets: PhysicsTarget[], statuses: Record<string, LessonWindowStatus>, progress: Record<string, number>, track: string | null, completion: Record<string, LessonCompletion> = {}, observer = false): LessonConceptMapData {
  const viewer: Viewer = observer ? { role: 'admin' } : { role: 'student', track }
  const nodes: ConceptLesson[] = lessons.filter(l => isMapCatalogLesson(l) && isLessonVisible(l.visibility_track, viewer)).map(lesson => {
    const doc = filterDocumentForViewer(lesson.content_blocks!, viewer)
    const learning = physicsLearningEntry({...lesson,content_blocks:doc}, targets)!
    const video = PHYSICS_VIDEOS.find(v => learning.videoIds.includes(v.youtubeId))
    const status = statuses[lesson.id]
    const value = progress[lesson.id]
    return {
      id: lesson.id, title: lesson.title, label: learning.kind === 'lesson' && video ? CONCEPT_LABELS[video.sequence] : lesson.title,
      unitId: lesson.unit_id ?? 'unit-1', unit: lesson.unit ?? 'Physics', kind: learning.kind,
      ...(learning.kind === 'lesson' && video ? {sequence:video.sequence} : {}),
      focus: doc.learningPath?.focus ?? video?.focus ?? '',
      targets: learning.targets.map(t => ({slug:t.slug,statement:t.statement})),
      access: status?.state ?? 'locked', ...(status?.state === 'scheduled' ? {opensAt:status.opens_at} : {}),
      completion: completion[lesson.id],
      progress: Number.isFinite(value) ? Math.min(100,Math.max(0,value)) : 0,
      ...(status?.state === 'open' ? {href:`/lessons/${encodeURIComponent(lesson.slug)}`} : {}),
    }
  }).sort((a,b)=>(a.sequence??1000)-(b.sequence??1000)||a.title.localeCompare(b.title))
  const primary = new Map<number,ConceptLesson>()
  for (const n of nodes) if (n.sequence && !primary.has(n.sequence)) primary.set(n.sequence,n)
  const connections = VIDEO_CONNECTIONS.flatMap(([a,b,label])=>{
    const from=primary.get(a),to=primary.get(b)
    return from&&to?[{from:from.id,to:to.id,label}]:[]
  })
  for (const node of nodes.filter(n=>!n.sequence)) {
    const related=nodes.find(n=>n.sequence && n.targets.some(t=>node.targets.some(target=>target.slug===t.slug)))
    if(related) connections.push({from:related.id,to:node.id,label:node.kind==='investigation'?'Investigate this idea':'Put this idea to work'})
  }
  return {nodes,connections}
}
