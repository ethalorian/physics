// Extract canonical questions from the pinned, trusted local export; preserve the original design.
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'
const manifest = JSON.parse(fs.readFileSync('src/data/explainers/claude-manifest.json', 'utf8'))
const source = manifest.find(item => item.id === 'units')
const html = fs.readFileSync('src/data/explainers/claude-source/' + source.file, 'utf8')
if (crypto.createHash('sha256').update(html).digest('hex') !== source.sha256) throw new Error('Original export changed. Review before rebuilding the notebook.')
const literal = html.match(/const quizDefs = (\[[\s\S]*?\n    \]);/)?.[1]
if (!literal) throw new Error('Could not find the original quiz.')
const questions = vm.runInNewContext('(' + literal + ')', {}, { timeout: 1000 })
fs.writeFileSync('src/data/explainers/units-notebook.json', JSON.stringify({ sourceId: source.id, sourceHash: source.sha256, questions }, null, 2) + '\n')
console.log(`Extracted ${questions.length} original questions without changing the design.`)
