// throwaway probe: how many templates would reject a legitimate 2-sig-fig answer?
import * as fs from 'fs'
import { instantiateTemplate, type ItemTemplate } from './src/lib/math-item-template'
import { checkAnswer } from './src/lib/math-answer-check'

interface Row { id: string; code: string; prompt: string; template: ItemTemplate }
const rows: Row[] = JSON.parse(fs.readFileSync('.tmp-bank-snapshot.json', 'utf8'))
function roundSig(v: number, s: number) {
  if (v === 0) return 0
  const f = Math.pow(10, s - 1 - Math.floor(Math.log10(Math.abs(v))))
  return Math.round(v * f) / f
}
let hits = 0
for (const r of rows) {
  let bad = 0, n = 0
  for (let s = 0; s < 200; s++) {
    let it
    try { it = instantiateTemplate(r.prompt, r.template, 'probe-' + s) } catch { continue }
    n++
    const num = parseFloat(it.answerKey)
    if (!Number.isFinite(num) || num === 0) continue
    const twoSf = String(parseFloat(roundSig(num, 2).toPrecision(12)))
    if (checkAnswer(twoSf, it.answerKey) !== 'match') bad++
  }
  if (bad > 0) { hits++; console.log(`${r.code} ${r.id}  ${bad}/${n} seeds reject a 2-sig-fig answer`) }
}
console.log(`\n${hits} of ${rows.length} templates reject a legitimate 2-significant-figure answer on some roll`)
