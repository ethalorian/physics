import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Import an exported Claude project without modifying its HTML, JSX or guides.
// Existing lessons and shared runtime files must match before adding new days.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2] && path.resolve(process.argv[2])
if (!input || !fs.statSync(input).isDirectory()) throw new Error('Pass the extracted Claude project directory.')
const options = process.argv.slice(3)
if (options.length && (options.length !== 2 || options[0] !== '--unit' || !/^unit-[1-9]\d*$/.test(options[1]))) {
  throw new Error('Usage: node scripts/import-class-day-tools.mjs <export-directory> [--unit unit-N]')
}
const selectedUnit = options[1]
const manifestPath = path.join(root, 'src/data/class-day-tools.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
for (const tool of manifest.lessons) tool.unit ??= 'unit-1'
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const pending = new Map()
function include(name) {
  if (path.basename(name) !== name) throw new Error(`Unexpected dependency path: ${name}`)
  const bytes = fs.readFileSync(path.join(input, name))
  const digest = hash(bytes)
  if (manifest.files[name] && manifest.files[name] !== digest) throw new Error(`Existing source differs: ${name}. Review that change separately.`)
  pending.set(name, bytes)
  return bytes.toString('utf8')
}
const lessons = []
// This unnumbered export accompanies the existing Unit 1 Day 19 course plan.
const namedDays = { 'Unit 1 Workshop and Revision - In Class.dc.html': { unit: 'unit-1', day: 19, title: 'Workshop and Revision' } }
const seen = new Set()
for (const file of fs.readdirSync(input)) {
  const match = file.match(/^(?:Unit ([1-9]\d*) )?Day ([1-9]\d*) - (.+) - In Class\.dc\.html$/)
  const identity = namedDays[file] ?? (match ? { unit: `unit-${match[1] ?? '1'}`, day: Number(match[2]), title: match[3] } : null)
  if (!identity) continue
  const { unit, day, title } = identity
  if (selectedUnit && unit !== selectedUnit) continue
  const key = `${unit}:${day}`
  if (seen.has(key)) throw new Error(`More than one export for ${key}`)
  seen.add(key)
  const html = include(file)
  const guide = file.replace(' - In Class.dc.html', ' - Teacher Guide.md')
  include(guide)
  for (const dependency of html.matchAll(/(?:src|from)="(\.\/[^\"]+)"/g)) {
    for (const source of dependency[1].split(' ')) include(source.replace(/^\.\//, ''))
  }
  const sceneData = html.match(/window\.OM_SCENES = '(.*)';/)
  if (!sceneData) throw new Error(`Missing timeline in ${file}`)
  let duration = 0
  const scenes = JSON.parse(sceneData[1]).map(scene => {
    if (!scene.name || !Number.isFinite(scene.dur) || scene.dur <= 0) throw new Error(`Invalid scene in ${file}`)
    const start = duration
    duration += scene.dur
    return { ...scene, start }
  })
  const existing = manifest.lessons.find(tool => tool.unit === unit && tool.day === day)
  if (existing && existing.file !== file) throw new Error(`Existing lesson renamed: ${key}. Review that change separately.`)
  if (!existing) lessons.push({ unit, day, title, file, guide, duration, scenes })
}
if (!lessons.length) { console.log('No new prepared days in this export.'); process.exit(0) }
// All inputs are validated before writing either copy or the manifest.
for (const [name, bytes] of pending) {
  for (const directory of ['src/data/explainers/claude-source/class-days', 'public/explainers/claude/class-days']) {
    fs.writeFileSync(path.join(root, directory, name), bytes)
  }
  manifest.files[name] = hash(bytes)
}
manifest.lessons.push(...lessons)
manifest.lessons.sort((a, b) => Number(a.unit.slice(5)) - Number(b.unit.slice(5)) || a.day - b.day)
manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)))
manifest.exportedAt = new Date().toISOString().slice(0, 10)
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log('Imported original teaching tools: ' + lessons.map(tool => `${tool.unit} Day ${tool.day} · ${tool.title}`).join('; '))
