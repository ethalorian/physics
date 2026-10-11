import test from 'node:test'
import assert from 'node:assert/strict'
import type { SyllabusStep } from './reading-syllabus'
import { readingConcepts, readingConnections, readingDependencies, readingMapGraph, readingMapPath } from './reading-map'

const step = (id: string, unit: string, prerequisites: string[]): SyllabusStep => ({ id, unit, prerequisites, title: id, focus: id, chapter: 4, sections: [], words: [], vocabularyTarget: '', readingCheck: { prompt: '', guide: '', target: '' }, quizCheck: { prompt: '', guide: '', target: '' }, honors: { prompt: '', guide: '', target: '' } })
const steps = [step('units', 'u1', []), step('rates', 'u1', ['units']), step('vectors', 'u1', ['units']), step('velocity', 'u2', ['rates', 'vectors']), step('acceleration', 'u2', ['velocity']), step('energy', 'u3', ['acceleration'])]
const units = [['u1', 'Foundations'], ['u2', 'Motion'], ['u3', 'Energy']] as const

test('dependencies preserve actual multiple prerequisites without adding sequence-order links', () => {
  const edges = readingDependencies(steps)
  assert.equal(edges.length, 6)
  assert(!edges.some(edge => edge.from === 'rates' && edge.to === 'vectors'))
  assert.equal(edges.filter(edge => edge.to === 'velocity').length, 2)
  assert.equal(readingDependencies([step('a', 'u1', ['missing', 'a'])]).length, 0)
})
test('traces the complete upstream and downstream support paths with cycle protection', () => {
  const graph = readingConnections(steps, 'velocity')
  assert.deepEqual([...graph.before].sort(), ['rates', 'units', 'vectors'])
  assert.deepEqual([...graph.after].sort(), ['acceleration', 'energy'])
  assert.deepEqual(graph.parents, ['rates', 'vectors'])
  assert.deepEqual(graph.children, ['acceleration'])
  assert.deepEqual([...readingConnections([step('a', 'u1', ['b']), step('b', 'u1', ['a'])], 'a').before], ['b'])
})
test('concept neighborhoods cover each reading once and aggregate only genuine cross-concept links', () => {
  const concepts = readingConcepts(steps, units), graph = readingMapGraph(steps, units, 'concepts', '', '')
  assert.equal(new Set(concepts.flatMap(concept => concept.readings)).size, steps.length)
  assert.equal(concepts.flatMap(concept => concept.readings).length, steps.length)
  assert.equal(graph.nodes.length, concepts.length)
  const owner = (id: string) => `concept:${concepts.find(concept => concept.readings.includes(id))!.id}`
  assert.equal(graph.edges.reduce((total, edge) => total + edge.count, 0), readingDependencies(steps).filter(edge => owner(edge.from) !== owner(edge.to)).length)
  for (const edge of graph.edges) assert(readingDependencies(steps).some(item => owner(item.from) === edge.from && owner(item.to) === edge.to))
})
test('opening a neighborhood keeps its incoming and outgoing concept bridges', () => {
  const graph = readingMapGraph(steps, units, 'readings', 'motion', '')
  assert.deepEqual(graph.nodes.filter(node => node.kind === 'reading').map(node => node.id), ['acceleration'])
  assert(graph.nodes.some(node => node.kind === 'concept' && node.id === 'concept:unit:u2'))
  assert(graph.nodes.some(node => node.kind === 'concept' && node.id === 'concept:unit:u3'))
  assert.equal(graph.edges.length, 2)
  for (const edge of graph.edges) assert(graph.nodes.some(node => node.id === edge.from) && graph.nodes.some(node => node.id === edge.to))
})
test('arrow endpoints stay outside the destination in every direction', () => {
  for (const [x, y] of [[500, 0], [-500, 0], [0, 500], [0, -500], [500, 500]]) {
    const from = { id: 'from', title: 'from', kind: 'reading' as const, x: 0, y: 0, width: 224, height: 116 }, to = { ...from, id: 'to', x, y }
    const path = readingMapPath(from, to, 'prerequisite'), numbers = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number), [endX, endY] = numbers.slice(-2)
    assert(endX < to.x || endX > to.x + to.width || endY < to.y || endY > to.y + to.height)
  }
})
test('reading names never collide with collapsed concept neighborhoods', () => {
  const sample = [step('fields', 'unit-2', []), step('electric-field', 'unit-7', ['fields'])]
  const graph = readingMapGraph(sample, units, 'readings', 'gravity', '')
  assert.deepEqual(graph.nodes.map(node => node.id).sort(), ['concept:fields', 'fields'])
  assert.equal(new Set(graph.nodes.map(node => node.id)).size, graph.nodes.length)
  assert.deepEqual(graph.edges.map(edge => [edge.from, edge.to]), [['fields', 'concept:fields']])
})
test('a focused reading includes direct dependencies and distinct assignment branches', () => {
  const graph = readingMapGraph(steps, units, 'focus', '', 'velocity')
  assert.equal(graph.nodes.filter(node => node.kind === 'resource').length, 4)
  assert.equal(graph.edges.filter(edge => edge.kind === 'assignment').length, 4)
  assert(!graph.nodes.some(node => node.id === 'energy'))
  for (const edge of graph.edges) assert(!readingMapPath(graph.nodes.find(node => node.id === edge.from)!, graph.nodes.find(node => node.id === edge.to)!, edge.kind).includes('NaN'))
})
test('the expanded graph contains every reading once with non-overlapping nodes', () => {
  const graph = readingMapGraph(steps, units, 'readings', '', '')
  assert.equal(new Set(graph.nodes.map(node => node.id)).size, steps.length)
  for (const a of graph.nodes) for (const b of graph.nodes) {
    if (a === b) continue
    assert(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)
  }
})
