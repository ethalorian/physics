import * as fs from 'fs'
import { validateTemplateGrid, type ItemTemplate } from './src/lib/math-item-template'

interface Row { id: string; code: string; prompt: string; template: ItemTemplate }
const rows: Row[] = JSON.parse(fs.readFileSync('.tmp-bank-snapshot.json', 'utf8'))
let broken = 0
const kindTotals = new Map<string, number>()
for (const r of rows) {
  const v = validateTemplateGrid(r.prompt, r.template, process.argv.includes('--2sf') ? { studentSigFigs: 2 } : {})
  if (v.ok) continue
  broken++
  const scope = v.truncated ? `${v.sampled}/${v.total} sampled` : `${v.sampled} combos`
  console.log(`\n${r.code}  ${r.id}  (${scope})`)
  console.log(`   ${r.prompt.slice(0, 100)}`)
  if (v.error) console.log(`   !! ${v.error}`)
  for (const i of v.issues) {
    kindTotals.set(i.kind, (kindTotals.get(i.kind) ?? 0) + 1)
    const pct = Math.round((i.count / v.sampled) * 100)
    console.log(`   • ${i.kind} x${i.count} (${pct}%) — ${i.example.detail}`)
    console.log(`     e.g. ${JSON.stringify(i.example.values)} key="${i.example.answerKey}" exact=${i.example.exact}`)
  }
}
console.log(`\n=== ${rows.length} templated items, ${broken} broken, ${rows.length - broken} clean`)
for (const [k, n] of [...kindTotals].sort()) console.log(`  ${k}: ${n} items`)
