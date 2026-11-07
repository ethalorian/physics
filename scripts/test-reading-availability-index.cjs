const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { build } = require('esbuild')
const { availabilityIndex, verifyAvailabilityIndex } = require('./reading-availability-index.cjs')

const root = path.resolve(__dirname, '..')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-availability-'))
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
  return value
}

async function main() {
  await build({
    stdin: { resolveDir: root, loader: 'ts', contents: `
      export {isInteractiveReading, isInteractiveSyllabusStep} from './src/lib/reading-availability'
      export {INTERACTIVE_CHAPTERS, interactiveChapterForAssignment} from './src/components/readings/interactive/registry'
      export {READING_SYLLABUS} from './src/data/reading-syllabus'
      export {TEXTBOOK_SYLLABUS} from './src/data/textbook-syllabus'
      export {HONORS_READING_MAP} from './src/lib/openstax-physics'
    ` },
    bundle: true, platform: 'node', format: 'cjs', outfile: path.join(temp, 'fixture.cjs'),
    plugins: [{ name: 'server-only-test-marker', setup(build) {
      build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'test-marker' }))
      build.onLoad({ filter: /.*/, namespace: 'test-marker' }, () => ({ contents: '' }))
    } }],
  })
  const m = require(path.join(temp, 'fixture.cjs'))
  const index = JSON.parse(fs.readFileSync(path.join(root, 'src/data/interactive-reading-availability.json'), 'utf8'))
  assert.deepEqual(index, availabilityIndex())
  assert.equal(index.length, m.INTERACTIVE_CHAPTERS.length)
  index.forEach(chapter => assert.deepEqual(Object.keys(chapter), ['book', 'chapter', 'language', 'sections']))
  verifyAvailabilityIndex()
  console.log(`PASS: generated metadata matches all ${index.length} canonical chapters.`)

  // Independent oracle: the exact availability behavior before this change.
  function previous(reading) {
    if (!Array.isArray(reading.section_ids) || !Number.isInteger(reading.chapter)) return false
    if (reading.honors_reading && (!Array.isArray(reading.honors_reading.sections) || !reading.honors_reading.sections.length)) return false
    return !!m.interactiveChapterForAssignment(reading)
  }
  function previousStep(step, track) {
    if (step.sourceBook === 'openstax' && track !== 'honors') return false
    return previous({ chapter: step.chapter, section_ids: step.sections, passage: step.passage ?? null,
      honors_reading: step.sourceBook !== 'hewitt' && (step.sourceBook === 'openstax' || track === 'honors')
        ? step.honorsReading ?? m.HONORS_READING_MAP[step.id] ?? null : null })
  }
  const outcome = fn => { try { return { value: fn() } } catch (error) { return { error: error.name } } }
  let comparisons = 0
  const compare = input => {
    const before = JSON.stringify(input)
    freeze(input)
    assert.deepEqual(outcome(() => m.isInteractiveReading(input)), outcome(() => previous(input)), before)
    assert.equal(JSON.stringify(input), before, 'Availability must never mutate saved assignment data')
    comparisons++
  }
  for (const chapter of m.INTERACTIVE_CHAPTERS) {
    const sections = chapter.sections.map(section => section.number)
    const selections = [[], sections, [...sections].reverse(), [sections[0], sections[0]], ['999.99'], [...sections, '999.99'], ...sections.map(section => [section])]
    for (const selected of selections) {
      const base = { chapter: chapter.chapter, section_ids: selected, passage: null, honors_reading: null }
      compare(base)
      compare({ ...base, passage: 'Saved legacy course passage' })
      compare({ ...base, honors_reading: { sections: selected } })
      compare({ ...base, chapter: 999, honors_reading: { sections: selected } })
    }
  }
  const base = { chapter: 4, section_ids: ['4.4'], passage: null, honors_reading: null }
  for (const chapter of [-1, 0, 999, 4.5, '4', null, undefined]) compare({ ...base, chapter })
  for (const section_ids of [null, undefined, '4.4', [null], [4.4], [''], ['4.4', '4.4']]) compare({ ...base, section_ids })
  for (const sections of [null, undefined, [], ['4.4', '5.1'], ['missing'], [null], [4.4]]) compare({ ...base, honors_reading: { sections } })
  compare({ ...base, passage: '', honors_reading: { sections: ['4.4'] } })
  compare({ ...base, passage: 'Honors takes precedence', honors_reading: { sections: ['4.4'] } })
  console.log(`PASS: ${comparisons} assignment comparisons, including every registered section, mixed/unknown sections, legacy passages and malformed input; all inputs unchanged.`)

  let steps = 0
  for (const step of [...m.READING_SYLLABUS, ...m.TEXTBOOK_SYLLABUS]) {
    freeze(step)
    for (const track of ['cpa', 'honors', 'trades', null, undefined]) {
      assert.deepEqual(outcome(() => m.isInteractiveSyllabusStep(step, track)), outcome(() => previousStep(step, track)), `${step.id}: ${track}`)
      steps++
    }
  }
  console.log(`PASS: ${steps} syllabus/track comparisons retain Honors restrictions and selection rules.`)

  const stale = path.join(temp, 'stale.json')
  fs.writeFileSync(stale, JSON.stringify(index.slice(1)))
  assert.throws(() => verifyAvailabilityIndex(stale), /index is stale/)
  assert.throws(() => verifyAvailabilityIndex(path.join(temp, 'missing.json')), /index is stale/)
  const changed = structuredClone(index)
  changed[0].sections.push('999.99')
  fs.writeFileSync(stale, JSON.stringify(changed))
  assert.throws(() => verifyAvailabilityIndex(stale), /index is stale/)
  console.log('PASS: missing, stale and changed-section metadata fail the build guard.')

  const browser = await build({
    absWorkingDir: root, entryPoints: ['src/lib/reading-availability.ts'],
    bundle: true, platform: 'browser', format: 'esm', minify: true, write: false, metafile: true,
  })
  const inputs = Object.keys(browser.metafile.inputs)
  assert(!inputs.some(file => /interactive\/(registry|connected-chapter-catalog|.*-lessons|.*-chapters|source-revisions)\./.test(file)), 'Availability must not pull reader content into the browser')
  assert(!inputs.some(file => file.endsWith('interactive-reader-revisions.json')))
  assert(browser.outputFiles[0].contents.length < 30000, 'Availability import must stay lightweight')
  console.log(`PASS: browser availability import is ${browser.outputFiles[0].contents.length} bytes before compression and contains no full reader catalogue.`)
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => fs.rmSync(temp, { recursive: true, force: true }))
