import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

const manifest = JSON.parse(fs.readFileSync('src/data/class-day-tools.json', 'utf8'))
assert.deepEqual(manifest.lessons.map(tool => `${tool.unit}:${tool.day}`), [
  ...Array.from({ length: 20 }, (_, i) => `unit-1:${i + 1}`),
  ...Array.from({ length: 15 }, (_, i) => `unit-2:${i + 1}`),
  ...Array.from({ length: 13 }, (_, i) => `unit-3:${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `unit-4:${i + 1}`),
])
for (const [name, expected] of Object.entries(manifest.files)) {
  for (const directory of ['src/data/explainers/claude-source/class-days', 'public/explainers/claude/class-days']) {
    const bytes = fs.readFileSync(path.join(directory, name))
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, `Original export changed: ${directory}/${name}`)
  }
}
for (const tool of manifest.lessons) {
  const html = fs.readFileSync(`public/explainers/claude/class-days/${tool.file}`, 'utf8')
  assert.ok(manifest.files[tool.guide])
  for (const match of html.matchAll(/(?:src|from)="(\.\/[^\"]+)"/g)) {
    for (const source of match[1].split(' ')) assert.ok(manifest.files[source.slice(2)], `Missing dependency: ${source}`)
  }
  const scenes = JSON.parse(html.match(/window.OM_SCENES = '(.*)';/)[1])
  assert.equal(scenes.reduce((total, scene) => total + scene.dur, 0), tool.duration)
  let start = 0
  assert.deepEqual(tool.scenes, scenes.map(scene => {
    const entry = { ...scene, start }
    start += scene.dur
    return entry
  }))
}
// Exercise the actual Next page so a multi-digit prepared day can be launched,
// while an unknown day or malformed route still returns not found.
const { build } = await import('esbuild')
const output = fs.mkdtempSync('/private/tmp/class-day-page-')
const mocks = {
  'next/navigation': 'export function notFound() { throw new Error("NOT_FOUND") }',
  '@/components/teaching-tools/ClassDayPlayer': 'export default function Player() { return null }',
}
await build({ entryPoints: { page: 'src/app/admin/teacher/tools/[day]/page.tsx', tools: 'src/lib/class-day-tools.ts' }, outdir: output, outExtension: { '.js': '.cjs' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', plugins: [{ name: 'page-fixtures', setup(builder) {
  builder.onResolve({ filter: /.*/ }, args => mocks[args.path] ? { path: args.path, namespace: 'fixture' } : undefined)
  builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path], loader: 'js' }))
} }] })
const { default: module } = await import(output + '/page.cjs')
const { default: helpers } = await import(output + '/tools.cjs')
for (const tool of manifest.lessons) {
  const href = new URL(helpers.classDayToolHref(tool.day, 'test course & group', tool.unit), 'https://example.test')
  const result = await module.default({ params: Promise.resolve({ day: href.pathname.split('/').pop() }), searchParams: Promise.resolve(Object.fromEntries(href.searchParams)) })
  assert.equal(result.props.tool.file, tool.file)
  assert.equal(result.props.tool.unit, tool.unit)
  assert.equal(result.props.courseId, 'test course & group')
}
assert.equal(helpers.classDayToolHref(7), '/admin/teacher/tools/7')
assert.equal(helpers.classDayTool('unit-1', 19).file, 'Unit 1 Workshop and Revision - In Class.dc.html')
for (const day of ['0', '-1', '07', '1.5', '21', '../7', '1e1', 'Infinity']) {
  await assert.rejects(module.default({ params: Promise.resolve({ day }), searchParams: Promise.resolve({}) }), /NOT_FOUND/)
}
for (const [unit, day] of [['unit-2', '16'], ['unit-3', '14'], ['unit-4', '6'], ['unit-5', '1'], ['unit-02', '1'], ['../unit-1', '1'], ['', '1']]) {
  await assert.rejects(module.default({ params: Promise.resolve({ day }), searchParams: Promise.resolve({ unit }) }), /NOT_FOUND/)
}
console.log(`Verified ${manifest.lessons.length} lessons and ${Object.keys(manifest.files).length} original files: unchanged export bytes, complete dependencies, timeline metadata, launch routes and invalid-day rejection.`)
