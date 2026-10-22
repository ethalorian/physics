import type { LessonCompletion } from './lesson-completion'
/** Student-safe catalog metadata. A connection describes ideas, never access. */
export interface ConceptLesson {
  id: string
  title: string
  label: string
  unitId: string
  unit: string
  kind: string
  sequence?: number
  focus: string
  targets: { slug: string; statement: string }[]
  access: 'open' | 'locked' | 'scheduled' | 'closed'
  opensAt?: string
  completion?: LessonCompletion
  progress: number
  href?: string
  watchHref?: string
}
export interface ConceptConnection { from: string; to: string; label: string }
export interface LessonConceptMapData { nodes: ConceptLesson[]; connections: ConceptConnection[] }

export const CONCEPT_LABELS: Record<number, string> = {
  1: 'Units & precision', 2: 'The language of motion', 3: 'Position & displacement',
  4: 'Position in 2D & 3D', 5: 'Scalars & vectors', 6: 'Signs & direction',
  7: 'Rates of change', 8: 'Velocity & speed',
  9: 'Graph scales', 10: 'Scientific notation', 11: 'SI & metric prefixes', 12: 'Unit conversions',
  13: 'Tip-to-tail addition', 14: 'Vector components', 15: 'Dot & cross products',
}
/** Reviewed conceptual links for the current video sequence. These are not
 * prerequisite locks or claims that watching establishes mastery. */
export const VIDEO_CONNECTIONS: [number, number, string][] = [
  [1, 2, 'Give motion its units'], [1, 3, 'Measure a location'],
  [2, 3, 'Describe where'], [2, 7, 'Describe change'],
  [3, 4, 'Add dimensions'], [3, 5, 'Include direction'],
  [5, 6, 'Read direction from a sign'],
  [7, 8, 'Compare rates'], [6, 8, 'Distinguish speed from velocity'],
  [1, 10, 'Write large and small measurements'], [10, 11, 'Give powers of ten a prefix'],
  [11, 12, 'Convert equivalent units'], [12, 9, 'Choose units for your axes'],
  [8, 9, 'Plot motion on a readable scale'],
  [5, 13, 'Combine vector arrows'], [13, 14, 'Add with components'],
  [6, 14, 'Keep component signs'],
  [14, 15, 'Multiply vectors in two ways'],
]
export function nextConceptLesson(nodes: ConceptLesson[]) {
  const open = nodes.filter(n => n.access === 'open' && n.href)
  return open.find(n => n.progress > 0 && n.progress < 100) ?? open.find(n => n.progress < 100) ?? open[0]
}
export interface PositionedConcept { lesson: ConceptLesson; x: number; y: number }
export const NODE_WIDTH = 220, NODE_HEIGHT = 116, MAP_WIDTH = 1140
const positions: Record<number, [number, number]> = {
  1: [600, 24], 2: [320, 206], 3: [880, 206],
  7: [320, 388], 5: [600, 388], 4: [880, 388],
  8: [320, 570], 6: [600, 570],
  10: [40, 206], 11: [40, 388], 12: [40, 570], 9: [320, 752],
  13: [880, 570], 14: [880, 752], 15: [880, 934],
}
export function conceptLayout(nodes: ConceptLesson[]) {
  const used = new Set<number>(); let extra = 0
  const placed = nodes.map(lesson => {
    const fixed = lesson.sequence && !used.has(lesson.sequence) ? positions[lesson.sequence] : undefined
    if (fixed) used.add(lesson.sequence!)
    const extraStart = Math.max(...Object.values(positions).map(([, y]) => y)) + 182
    const [x, y] = fixed ?? [40 + (extra % 4) * 280, extraStart + Math.floor(extra++ / 4) * 182]
    return { lesson, x, y }
  })
  return { nodes: placed, width: MAP_WIDTH, height: Math.max(730, ...placed.map(n => n.y + NODE_HEIGHT + 38)) }
}
export function connectionPath(from: PositionedConcept, to: PositionedConcept): string {
  if (from.y === to.y) {
    const right = to.x > from.x, x1 = from.x + (right ? NODE_WIDTH : 0), x2 = to.x + (right ? 0 : NODE_WIDTH)
    const y = from.y + NODE_HEIGHT / 2
    return `M ${x1} ${y} C ${(x1+x2)/2} ${y}, ${(x1+x2)/2} ${y}, ${x2} ${y}`
  }
  const x1 = from.x + NODE_WIDTH / 2, y1 = from.y + NODE_HEIGHT
  const x2 = to.x + NODE_WIDTH / 2, y2 = to.y, mid = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
}
