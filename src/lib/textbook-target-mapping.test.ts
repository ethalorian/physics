import test from 'node:test'
import assert from 'node:assert/strict'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'
import { matchReadingTarget, numberedReadingReference, readingMappingCoverage, TEXTBOOK_TARGET_MAP, textbookQuestionSet } from './textbook-target-mapping'
import type { ReadingTarget } from './textbook-assignments'

const slugs = [...new Set(Object.values(TEXTBOOK_TARGET_MAP.chapters).flatMap(c => [...Object.values(c.targets), ...Object.values(c.sections)]))]
const targets: ReadingTarget[] = slugs.map((slug, i) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, slug, statement: slug, domain: 'knowledge', unit_id: 'unit-' + slug[1], program: 'physics' }))
const match = (ch: number, n: number) => matchReadingTarget(ch, numberedReadingReference(ch, n), targets, 'physics').target?.slug

test('question-level mappings distinguish skills within the same chapter and follow the actual Assess sets', () => {
  assert.equal(match(4, 5), 'u1.vocab-position-distance-displacement')
  assert.equal(match(4, 7), 'u1.acceleration-rate-of-change')
  assert.equal(match(4, 10), 'u2.free-fall-g')
  assert.equal(match(5, 39), 'u1.vectors-tip-to-tail')
  assert.equal(match(5, 42), 'u2.s2-projectile-calc')
  assert.equal(match(8, 35), 'u3.r1-extend-time')
  assert.equal(match(8, 58), 'u3.s2-inelastic-solve')
  assert.equal(match(9, 40), 'u4.k2-kinetic-energy')
  assert.equal(match(21, 61), 'u5.k1-specific-heat')
  assert.equal(match(23, 57), 'u5.k3-latent-heat')
  assert.equal(match(29, 50), 'u6.r5-radar-chain')
  assert.equal(match(35, 22), 'u7.s1-series-circuits')
  assert.equal(match(35, 24), 'u7.s2-parallel-circuits')
  assert.equal(match(35, 52), 'u7.s3-combination-circuits')
  assert.equal(numberedReadingReference(4, 44), 'Think and Explain #44')
  assert.equal(numberedReadingReference(4, 51), 'Think and Solve #51')
  assert.equal(numberedReadingReference(9, 34), 'Plug and Chug #34')
  assert.throws(() => numberedReadingReference(4, 44, 'Think and Solve'), /Think and Explain/)
})
test('unknown, ambiguous, unavailable and other-program questions never receive a guessed target', () => {
  assert.equal(match(4, 16), undefined, 'reading a graph is not proof of operating a Vernier detector')
  assert.equal(match(15, 1), undefined, 'relativity is not ordinary kinematics')
  assert.equal(match(12, 45), undefined, 'rotational inertia is not centripetal force')
  assert.equal(match(14, 11), undefined, 'recalling scientist names does not assess orbital reasoning')
  assert.equal(match(2, 47), undefined, 'printed duplicate #47 requires clarification')
  assert.throws(() => numberedReadingReference(2, 46))
  assert.throws(() => numberedReadingReference(4, 999))
  assert.equal(matchReadingTarget(4, 'Think and Solve #44', targets, 'physics').target, null)
  assert.equal(matchReadingTarget(4, 'Check Concepts #5', [], 'physics').target, null)
  assert.equal(matchReadingTarget(4, 'Check Concepts #5', targets, 'trades').target, null)
  assert.equal(matchReadingTarget(4, 'Check Concepts #5', targets, 'physics', 'Explain photosynthesis.').target, null)
  assert.equal(matchReadingTarget(4, 'Q5', targets, 'physics').target, null)
})
test('section concept checks map independently; edited prompts need a teacher choice', () => {
  const prompt = TEXTBOOK_SECTIONS[4].sections.find(s => s.id === '4.4')!.conceptCheck!
  assert.equal(matchReadingTarget(4, 'Section 4.4 · Concept Check', targets, 'physics', prompt).target?.slug, 'u1.acceleration-rate-of-change')
  assert.equal(matchReadingTarget(4, 'Section 4.4 · Concept Check', targets, 'physics', 'A different question').target, null)
  assert.equal(matchReadingTarget(5, 'Section 4.4 · Concept Check', targets, 'physics', prompt).target, null)
})
test('the full alignment catalog has unique question numbers and real section references', () => {
  for (const [ch, map] of Object.entries(TEXTBOOK_TARGET_MAP.chapters)) {
    const numbers = Object.values(map.sets).flat()
    assert.equal(numbers.length, new Set(numbers).size, `duplicate question in chapter ${ch}`)
    for (const [n, slug] of Object.entries(map.targets)) {
      assert.ok(textbookQuestionSet(Number(ch), Number(n)), `${ch} #${n} missing question set`)
      assert.ok(slug.startsWith('u'), slug)
      assert.ok(!/vernier|lab-|anchor-|d\d+/.test(slug) || ['u5.anchor-heat-vs-temp','u6.anchor-energy-not-matter','u7.anchor-charge','u1.d12-fma-limits','u1.d18-forces-synthesis'].includes(slug), `no unrelated lab or scenario target ${slug}`)
      assert.equal(matchReadingTarget(Number(ch), numberedReadingReference(Number(ch), Number(n)), targets, 'physics').target?.slug, slug)
    }
    for (const [id, slug] of Object.entries(map.sections)) {
      const section = TEXTBOOK_SECTIONS[Number(ch)].sections.find(s => s.id === id)
      assert.ok(section?.conceptCheck, `missing section ${id}`)
      assert.equal(matchReadingTarget(Number(ch), `Section ${id} · Concept Check`, targets, 'physics', section.conceptCheck).target?.slug, slug)
    }
  }
  assert.equal(readingMappingCoverage(4, [], 'physics').mapped, 0)
  assert.equal(readingMappingCoverage(4, targets, 'trades').mapped, 0)
})
