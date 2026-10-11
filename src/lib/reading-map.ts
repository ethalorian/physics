import type { SyllabusStep } from './reading-syllabus'

export interface ReadingMapEdge { from: string; to: string; count: number; kind: 'prerequisite' | 'assignment' }
export interface ReadingMapNode { id: string; kind: 'concept' | 'reading' | 'resource'; title: string; x: number; y: number; width: number; height: number; unit?: string; concept?: string; count?: number; context?: boolean }
export interface ReadingMapRegion { id: string; title: string; x: number; y: number; width: number; height: number }
export interface ReadingMapGraph { nodes: ReadingMapNode[]; edges: ReadingMapEdge[]; regions: ReadingMapRegion[]; width: number; height: number }
export interface ReadingConcept { id: string; title: string; description: string; readings: string[]; x: number; y: number }
export type ReadingMapMode = 'concepts' | 'readings' | 'focus'
export const MAP_RESOURCES = [
  ['reading', 'Reading & response'], ['practice', 'Vocabulary practice'], ['readingQuiz', 'Reading quiz'], ['vocabularyQuiz', 'Vocabulary quiz'],
] as const

// Display neighborhoods do not change the prerequisites or the course sequence.
const CONCEPTS: ReadingConcept[] = [
  { id: 'measurement', title: 'Measurement & rates', description: 'Quantities, scale, units and rates', readings: ['quantities', 'metric-prefixes', 'scientific-notation', 'unit-conversions', 'measurement-precision', 'rates', 'graph-scales'], x: 210, y: 155 },
  { id: 'motion', title: 'Describing motion', description: 'Position, velocity, acceleration and graphs', readings: ['position', 'distance-displacement', 'speed-velocity', 'acceleration', 'position-graphs', 'motion-graphs'], x: 540, y: 175 },
  { id: 'forces', title: 'Explaining motion', description: 'Vectors, forces and Newton’s laws', readings: ['vectors', 'vector-components', 'forces', 'inertia', 'equilibrium', 'second-law', 'friction', 'third-law'], x: 680, y: 445 },
  { id: 'gravity', title: 'Gravity & orbits', description: 'Falling, fields, projectiles and orbits', readings: ['free-fall', 'mass-weight', 'gravitation', 'fields', 'projectiles', 'circular-orbits'], x: 1080, y: 160 },
  { id: 'momentum', title: 'Momentum & collisions', description: 'Interactions, impulse and conservation', readings: ['momentum', 'impulse', 'momentum-conservation', 'collisions'], x: 230, y: 560 },
  { id: 'energy', title: 'Energy & work', description: 'Transfer, storage and energy accounting', readings: ['work', 'kinetic-energy', 'potential-energy', 'energy-conservation', 'power', 'efficiency'], x: 1030, y: 720 },
  { id: 'thermal', title: 'Heat & matter', description: 'Temperature, transfer and thermodynamics', readings: ['temperature-heat', 'specific-heat', 'heat-transfer', 'phase-change', 'first-law', 'thermal-second-law', 'thermodynamics'], x: 650, y: 960 },
  { id: 'waves', title: 'Waves, sound & light', description: 'Oscillation, transport and superposition', readings: ['waves', 'wave-speed', 'interference', 'sound', 'light', 'reflection', 'refraction'], x: 1430, y: 990 },
  { id: 'fields', title: 'Electric interactions', description: 'Charge, forces, fields and voltage', readings: ['charge', 'coulombs-law', 'electric-field', 'voltage'], x: 1410, y: 420 },
  { id: 'circuits', title: 'Circuits & magnetism', description: 'Current, electrical power and induction', readings: ['current', 'resistance', 'series', 'parallel', 'electrical-power', 'magnetism', 'induction'], x: 1740, y: 680 },
  { id: 'applications', title: 'Putting it together', description: 'From electrical energy to vehicle motion', readings: ['car-energy', 'car-motion'], x: 1870, y: 1050 },
]

export function readingConcepts(steps: SyllabusStep[], units: readonly (readonly [string, string])[]): ReadingConcept[] {
  const ids = new Set(steps.map(step => step.id)), assigned = new Set(CONCEPTS.flatMap(concept => concept.readings))
  const concepts = CONCEPTS.map(concept => ({ ...concept, readings: concept.readings.filter(id => ids.has(id)) })).filter(concept => concept.readings.length)
  const extras = [...new Set(steps.filter(step => !assigned.has(step.id)).map(step => step.unit))]
  extras.forEach((unit, index) => concepts.push({ id: `unit:${unit}`, title: units.find(([id]) => id === unit)?.[1] ?? unit, description: 'Additional syllabus readings', readings: steps.filter(step => step.unit === unit && !assigned.has(step.id)).map(step => step.id), x: 240 + index * 380, y: 1370 }))
  return concepts
}

/** Only explicit syllabus prerequisites become learning-dependency arrows. */
export function readingDependencies(steps: SyllabusStep[]): ReadingMapEdge[] {
  const ids = new Set(steps.map(step => step.id))
  return steps.flatMap(step => [...new Set(step.prerequisites)].filter(id => id !== step.id && ids.has(id)).map(id => ({ from: id, to: step.id, count: 1, kind: 'prerequisite' as const })))
}

export function readingConnections(steps: SyllabusStep[], selected: string) {
  const edges = readingDependencies(steps)
  const walk = (reverse: boolean) => {
    const found = new Set<string>(), queue = [selected]
    while (queue.length) {
      const id = queue.shift()!
      for (const edge of edges) {
        const from = reverse ? edge.to : edge.from, to = reverse ? edge.from : edge.to
        if (from === id && to !== selected && !found.has(to)) { found.add(to); queue.push(to) }
      }
    }
    return found
  }
  return { before: walk(true), after: walk(false), parents: edges.filter(edge => edge.to === selected).map(edge => edge.from), children: edges.filter(edge => edge.from === selected).map(edge => edge.to) }
}

function mergeEdges(edges: ReadingMapEdge[], destination: (id: string) => string): ReadingMapEdge[] {
  const merged = new Map<string, ReadingMapEdge>()
  for (const edge of edges) {
    const from = destination(edge.from), to = destination(edge.to)
    if (from === to) continue
    const key = `${from}:${to}`
    merged.set(key, { ...edge, from, to, count: (merged.get(key)?.count ?? 0) + edge.count })
  }
  return [...merged.values()]
}

function neighborhoodNodes(concept: ReadingConcept, steps: SyllabusStep[], cx: number, cy: number): { nodes: ReadingMapNode[]; region: ReadingMapRegion } {
  const members = concept.readings.map(id => steps.find(step => step.id === id)!), count = members.length
  const rx = count > 2 ? Math.max(275, count * 43) : 140, ry = count > 2 ? Math.max(175, count * 26) : 0
  const nodes = members.map((step, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / count
    const x = count === 1 ? cx : count === 2 ? cx + (index ? rx : -rx) : cx + rx * Math.cos(angle)
    const y = count < 3 ? cy : cy + ry * Math.sin(angle)
    return { id: step.id, title: step.title, unit: step.unit, concept: concept.id, kind: 'reading' as const, x: x - 112, y: y - 58, width: 224, height: 116 }
  })
  return { nodes, region: { id: concept.id, title: concept.title, x: cx - rx - 150, y: cy - ry - 120, width: (rx + 150) * 2, height: (ry + 120) * 2 } }
}

function fitBounds(nodes: ReadingMapNode[], regions: ReadingMapRegion[], edges: ReadingMapEdge[]): ReadingMapGraph {
  const all = [...nodes, ...regions], left = (all.length ? Math.min(...all.map(item => item.x)) : 0) - 35, top = (all.length ? Math.min(...all.map(item => item.y)) : 0) - 35
  return { nodes: nodes.map(node => ({ ...node, x: node.x - left, y: node.y - top })), regions: regions.map(region => ({ ...region, x: region.x - left, y: region.y - top })), edges, width: Math.max(...all.map(item => item.x + item.width), 500) - left + 35, height: Math.max(...all.map(item => item.y + item.height), 400) - top + 35 }
}

export function readingMapGraph(steps: SyllabusStep[], units: readonly (readonly [string, string])[], mode: ReadingMapMode, conceptId: string, selected: string): ReadingMapGraph {
  const edges = readingDependencies(steps), nodes: ReadingMapNode[] = [], regions: ReadingMapRegion[] = []
  const concepts = readingConcepts(steps, units), conceptByReading = new Map(concepts.flatMap(concept => concept.readings.map(id => [id, concept.id] as const)))
  const step = steps.find(item => item.id === selected)
  if (mode === 'focus' && step) {
    const links = readingConnections(steps, step.id), max = Math.max(links.parents.length, links.children.length, 1)
    const rx = Math.max(410, max * 100), ry = Math.max(250, max * 55), cx = rx + 150, cy = ry + 120
    const add = (id: string, x: number, y: number) => { const item = steps.find(step => step.id === id)!; nodes.push({ id, title: item.title, unit: item.unit, concept: conceptByReading.get(id), kind: 'reading', x: x - 112, y: y - 58, width: 224, height: 116 }) }
    add(selected, cx, cy)
    const arc = (ids: string[], upper: boolean) => ids.forEach((id, index) => {
      const angle = ids.length === 1 ? Math.PI / 2 : Math.PI * .08 + index * Math.PI * .84 / (ids.length - 1)
      add(id, cx + rx * Math.cos(angle), cy + (upper ? -1 : 1) * ry * Math.sin(angle))
    })
    arc(links.parents, true); arc(links.children, false)
    if (links.parents.length) regions.push({ id: 'foundations', title: 'Builds on these foundations', x: cx - rx - 150, y: 0, width: 2 * rx + 300, height: ry + 100 })
    if (links.children.length) regions.push({ id: 'applications', title: 'Supports these later readings', x: cx - rx - 150, y: cy + 100, width: 2 * rx + 300, height: ry + 50 })
    const connected = edges.filter(edge => edge.from === selected || edge.to === selected)
    MAP_RESOURCES.forEach(([kind, title], index) => {
      nodes.push({ id: `resource:${kind}`, kind: 'resource', title, x: cx - 504 + index * 258, y: cy + ry + 230, width: 234, height: 100 })
      connected.push({ from: selected, to: `resource:${kind}`, count: 1, kind: 'assignment' })
    })
    return fitBounds(nodes, regions, connected)
  }
  const concept = concepts.find(item => item.id === conceptId)
  if (mode === 'readings' && concept) {
    const members = new Set(concept.readings), relevant = edges.filter(edge => members.has(edge.from) || members.has(edge.to))
    const neighbors = concepts.filter(item => item.id !== concept.id && relevant.some(edge => item.readings.includes(edge.from) || item.readings.includes(edge.to))).sort((a, b) => Math.atan2(a.y - concept.y, a.x - concept.x) - Math.atan2(b.y - concept.y, b.x - concept.x))
    const local = neighborhoodNodes(concept, steps, 720, 500); nodes.push(...local.nodes); regions.push(local.region)
    neighbors.forEach((item, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / neighbors.length
      nodes.push({ id: `concept:${item.id}`, kind: 'concept', context: true, title: item.title, concept: item.id, count: item.readings.length, x: 720 + 585 * Math.cos(angle) - 105, y: 500 + 380 * Math.sin(angle) - 53, width: 210, height: 106 })
    })
    return fitBounds(nodes, regions, mergeEdges(relevant, id => members.has(id) ? id : `concept:${conceptByReading.get(id)!}`))
  }
  if (mode === 'readings') {
    for (const concept of concepts) {
      const local = neighborhoodNodes(concept, steps, concept.x * 3.9, concept.y * 3.9)
      nodes.push(...local.nodes); regions.push(local.region)
    }
    return fitBounds(nodes, regions, edges)
  }
  for (const concept of concepts) {
    nodes.push({ id: `concept:${concept.id}`, kind: 'concept', title: concept.title, concept: concept.id, count: concept.readings.length, x: concept.x - 137, y: concept.y - 85, width: 274, height: 170 })
    regions.push({ id: concept.id, title: '', x: concept.x - 172, y: concept.y - 118, width: 344, height: 236 })
  }
  return fitBounds(nodes, regions, mergeEdges(edges, id => `concept:${conceptByReading.get(id)!}`))
}

/** Connect the facing boundaries so arrowheads stay visible in every direction. */
export function readingMapPath(from: ReadingMapNode, to: ReadingMapNode, kind: ReadingMapEdge['kind']) {
  if (kind === 'assignment') {
    const x1 = from.x + from.width / 2, y1 = from.y + from.height, x2 = to.x + to.width / 2, y2 = to.y - 7
    return `M ${x1} ${y1} C ${x1} ${y2 - 68}, ${x2} ${y2 - 68}, ${x2} ${y2}`
  }
  const x1 = from.x + from.width / 2, y1 = from.y + from.height / 2, x2 = to.x + to.width / 2, y2 = to.y + to.height / 2, dx = x2 - x1, dy = y2 - y1
  const boundary = (node: ReadingMapNode) => node.kind === 'concept'
    ? 1 / Math.sqrt((dx / (node.width / 2 + 8)) ** 2 + (dy / (node.height / 2 + 8)) ** 2 || 1)
    : Math.min((node.width / 2 + 8) / Math.max(.001, Math.abs(dx)), (node.height / 2 + 8) / Math.max(.001, Math.abs(dy)))
  const start = boundary(from), end = boundary(to), ax = x1 + dx * start, ay = y1 + dy * start, bx = x2 - dx * end, by = y2 - dy * end
  const length = Math.hypot(dx, dy) || 1, bend = Math.min(42, length * .075), nx = -dy / length * bend, ny = dx / length * bend
  return `M ${ax} ${ay} C ${ax + (bx - ax) * .32 + nx} ${ay + (by - ay) * .32 + ny}, ${ax + (bx - ax) * .68 + nx} ${ay + (by - ay) * .68 + ny}, ${bx} ${by}`
}
