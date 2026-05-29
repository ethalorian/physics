/**
 * One-off: wire placeholder target codes (K1, u8-k3, s7, …) in the authored
 * Unit 8 BlockDocuments to the REAL learning_targets.id UUIDs, so marzano /
 * self_assessment blocks credit the right target in mastery_records.
 * Usage: npx tsx scripts/patch-unit8-target-ids.ts
 */
import * as fs from 'fs'
import * as path from 'path'

// code (k/r/s + number) → learning_targets.id (UUID), from the DB.
const ID: Record<string, string> = {
  k1: '968fcf25-cde2-4e32-8dc6-6d3931aa2488',
  k2: 'ce0397c6-905b-4109-a89b-65be71acdf61',
  k3: '3eda5c97-f3a6-45a3-b911-0ab5680ac7fc',
  k4: '1c6e1fcc-63e2-40fc-9093-20352f02f3d6',
  r1: '6964687c-fb59-44b0-a39a-d870f0d4843a',
  r2: 'a0da8983-b50b-4222-9f1d-11352c1f2cf4',
  r3: 'bfd76c34-7786-4ad0-80e8-7bea9136e2db',
  r4: '567971c3-1f85-4da8-bfac-233381593285',
  s1: '108b06c3-58ce-43e7-aa42-93841e1e1dc2',
  s2: '1b90ca55-6be1-4251-ae15-6b7d67ebbffb',
  s3: '1d0721bd-1b72-4921-b1c8-7dadc157786d',
  s4: '2728d6f0-199b-4751-8591-c285abed5e6a',
  s5: 'fae0b910-e74a-4ad9-99f1-8905a02b0619',
  s6: 'c767b249-82ba-4742-8af3-199c26f233bb',
  s7: '1fb2b1c7-3372-4573-81f6-e413185c283c',
}

function resolve(placeholder: string): string {
  const m = String(placeholder).toLowerCase().match(/([krs])\s*-?\s*([0-9])/)
  if (!m) throw new Error(`Cannot map target placeholder: ${placeholder}`)
  const code = m[1] + m[2]
  const id = ID[code]
  if (!id) throw new Error(`No learning_targets.id for code ${code} (from ${placeholder})`)
  return id
}

const dir = path.join(process.cwd(), 'src/data/unit8-blocks')
for (let i = 1; i <= 9; i++) {
  const d = String(i).padStart(2, '0')
  const file = path.join(dir, `u8-d${d}.json`)
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  const changes: string[] = []
  for (const b of doc.blocks) {
    if (b.type === 'marzano' && b.targetId) {
      const next = resolve(b.targetId)
      if (next !== b.targetId) { changes.push(`marzano ${b.targetId}→${next.slice(0, 8)}…`); b.targetId = next }
    }
    if (b.type === 'self_assessment' && Array.isArray(b.targetIds)) {
      b.targetIds = b.targetIds.map((t: string) => resolve(t))
      changes.push(`self_assessment[${b.targetIds.length}] wired`)
    }
  }
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
  console.log(`u8-d${d}: ${changes.length ? changes.join('; ') : 'no target blocks'}`)
}
console.log('done')
