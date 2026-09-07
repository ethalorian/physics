/**
 * Audit every templated warm-up item in the bank against its WHOLE variable
 * grid (2026-09-04).
 *
 * The authoring UI's validateTemplate instantiates ONE seed and calls the
 * template good. A template defines a grid, so it can pass on that seed and
 * still deal a student an unanswerable item on another roll: a key of 0, a key
 * equal to a number already printed in the prompt, or a key rounded so coarsely
 * that the self-check marks the exact answer wrong. This script walks the grid
 * with validateTemplateGrid and prints who is broken and how.
 *
 * READ-ONLY. It selects and reports; it never writes to the database.
 *
 * Usage:
 *   npx tsx scripts/validate-math-templates.ts             # report
 *   npx tsx scripts/validate-math-templates.ts --all       # also list clean items
 *   npx tsx scripts/validate-math-templates.ts --cap 5000  # combination cap per item
 *   npx tsx scripts/validate-math-templates.ts --json      # machine-readable
 *   npx tsx scripts/validate-math-templates.ts --student-sig-figs 2
 *                                                          # also flag keys that
 *                                                          # would reject a
 *                                                          # 2-sig-fig answer
 *
 * Requires (.env.local): NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (the anon key works too — this only reads).
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import {
  validateTemplateGrid,
  DEFAULT_MAX_COMBINATIONS,
  type GridValidationResult,
  type ItemTemplate,
} from '../src/lib/math-item-template'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('❌ Missing Supabase credentials in .env.local (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}
const supabase = createClient(url, key)

const SHOW_ALL = process.argv.includes('--all')
const AS_JSON = process.argv.includes('--json')
const capArg = process.argv.findIndex((a) => a === '--cap')
const CAP = capArg >= 0 && process.argv[capArg + 1] ? Number(process.argv[capArg + 1]) : DEFAULT_MAX_COMBINATIONS
const sigArg = process.argv.findIndex((a) => a === '--student-sig-figs')
const STUDENT_SIG_FIGS = sigArg >= 0 && process.argv[sigArg + 1] ? Number(process.argv[sigArg + 1]) : undefined

interface ItemRow {
  id: string
  competency_id: string | null
  prompt: string
  answer_key: string | null
  template: ItemTemplate | null
  check_mode: string | null
}

interface Verdict {
  id: string
  code: string
  checkMode: string
  prompt: string
  result: GridValidationResult
}

function fmtValues(values: Record<string, number>): string {
  return Object.entries(values).map(([k, v]) => `${k}=${v}`).join(', ')
}

function printVerdict(v: Verdict) {
  const r = v.result
  const head = r.ok ? '✅' : '✗ '
  const scope = r.truncated
    ? `${r.sampled} of ${r.total} combos (even sample, cap ${r.cap})`
    : `${r.sampled} combos`
  console.log(`  ${head} ${v.id}  [${v.checkMode}]  ${scope}`)
  console.log(`      ${v.prompt.replace(/\s+/g, ' ').slice(0, 110)}`)
  if (r.error) console.log(`      ⚠️  template rejected by validateTemplate: ${r.error}`)
  for (const issue of r.issues) {
    const pct = r.sampled > 0 ? Math.round((issue.count / r.sampled) * 100) : 0
    console.log(`      • ${issue.kind} ×${issue.count} (${pct}% of rolls)`)
    console.log(`          e.g. ${fmtValues(issue.example.values)} → key "${issue.example.answerKey}"`)
    console.log(`          ${issue.example.detail}`)
  }
}

async function main() {
  const { data: comps, error: compErr } = await supabase
    .from('math_competencies')
    .select('id, code')
  if (compErr) {
    console.error('❌ Could not read math_competencies:', compErr.message)
    process.exit(1)
  }
  const codeById = new Map<string, string>()
  for (const c of (comps ?? []) as { id: string; code: string }[]) codeById.set(c.id, c.code)

  const { data, error } = await supabase
    .from('math_spiral_items')
    .select('id, competency_id, prompt, answer_key, template, check_mode')
    .not('template', 'is', null)
    .order('competency_id', { ascending: true })
  if (error) {
    console.error('❌ Could not read math_spiral_items:', error.message)
    process.exit(1)
  }

  const rows = (data ?? []) as ItemRow[]
  const verdicts: Verdict[] = rows.map((row) => ({
    id: row.id,
    code: (row.competency_id && codeById.get(row.competency_id)) || '(no competency)',
    checkMode: row.check_mode ?? 'numeric',
    prompt: row.prompt,
    result: validateTemplateGrid(row.prompt, row.template as ItemTemplate, {
      maxCombinations: CAP,
      studentSigFigs: STUDENT_SIG_FIGS,
    }),
  }))

  if (AS_JSON) {
    console.log(JSON.stringify(verdicts, null, 2))
    return
  }

  const offenders = verdicts.filter((v) => !v.result.ok)
  console.log(`\n🔎 Template grid audit — ${verdicts.length} templated items, cap ${CAP} combinations each`)
  if (STUDENT_SIG_FIGS) console.log(`   (also requiring that a ${STUDENT_SIG_FIGS}-sig-fig answer is accepted)`)
  console.log('')

  const byCode = new Map<string, Verdict[]>()
  for (const v of SHOW_ALL ? verdicts : offenders) {
    const arr = byCode.get(v.code) ?? []
    arr.push(v)
    byCode.set(v.code, arr)
  }
  for (const code of [...byCode.keys()].sort()) {
    const list = byCode.get(code)!
    const bad = list.filter((v) => !v.result.ok).length
    console.log(`\n── ${code} — ${bad} of ${verdicts.filter((v) => v.code === code).length} templated items broken`)
    for (const v of list) printVerdict(v)
  }

  const totals = new Map<string, number>()
  for (const v of offenders) {
    for (const i of v.result.issues) totals.set(i.kind, (totals.get(i.kind) ?? 0) + 1)
    if (v.result.error) totals.set('template-rejected', (totals.get('template-rejected') ?? 0) + 1)
  }
  console.log(`\n${'─'.repeat(72)}`)
  console.log(`Items walked:   ${verdicts.length}`)
  console.log(`Clean:          ${verdicts.length - offenders.length}`)
  console.log(`Broken:         ${offenders.length}`)
  for (const kind of [...totals.keys()].sort()) {
    console.log(`  ${kind.padEnd(28)} ${totals.get(kind)} item(s)`)
  }
  const capped = verdicts.filter((v) => v.result.truncated).length
  if (capped > 0) console.log(`\n(${capped} item(s) had a grid larger than the cap and were sampled evenly.)`)
  console.log('\nRead-only: nothing was written.\n')
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e)
  process.exit(1)
})
