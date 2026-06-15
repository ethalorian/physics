/**
 * Seed the learning_targets rows referenced by the honors Marzano self-rating
 * blocks, so those ratings link to a tracked target (mastery + growth tree).
 *
 * Nine honors reasoning targets across Unit 1. Each is upserted by slug
 * (idempotent), and its lesson_id is resolved from the matching lesson slug
 * (u1-dNN) at runtime. Workshop/synthesis metacognition targets (d19, d20) are
 * flagged exclude_from_growth so they don't distort the growth tree.
 *
 * Usage:
 *   npx tsx scripts/seed-honors-targets.ts            # DRY RUN — prints the plan, writes nothing
 *   npx tsx scripts/seed-honors-targets.ts --commit   # apply
 *
 * Requires (.env.local): NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('❌ Missing Supabase credentials in .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}
const supabase = createClient(url, key)
const COMMIT = process.argv.includes('--commit')

interface TargetSeed {
  slug: string
  lessonSlug: string
  statement: string
  content_strand: string
  exclude_from_growth?: boolean
}

// domain is 'reasoning' for all — the honors thread is justify-and-connect.
const TARGETS: TargetSeed[] = [
  { slug: 'u1.d01-inertia-obstacle', lessonSlug: 'u1-d01', content_strand: 'motion-kinematics',
    statement: "I can explain inertia as a mass's resistance to a change in motion, and argue why 2026-XJ's large mass is the obstacle to deflecting it." },
  { slug: 'u1.d08-kinematics-transfer', lessonSlug: 'u1-d08', content_strand: 'motion-kinematics',
    statement: 'I can carry a constant-acceleration model into a new context and state what it can — and cannot yet — predict about 2026-XJ.' },
  { slug: 'u1.d12-fma-limits', lessonSlug: 'u1-d12', content_strand: 'forces',
    statement: 'I can interrogate F = ma — name the hidden assumptions (constant force, fixed mass) and the conditions under which they break.' },
  { slug: 'u1.d16-equilibrium', lessonSlug: 'u1-d16', content_strand: 'forces',
    statement: 'I can defend an equilibrium claim (ΣF = 0) and state the assumptions it rests on.' },
  { slug: 'u1.d17-incline-components', lessonSlug: 'u1-d17', content_strand: 'forces',
    statement: 'I can justify my choice of axes when decomposing forces on an incline, and name the assumptions behind the result.' },
  { slug: 'u1.d18-forces-synthesis', lessonSlug: 'u1-d18', content_strand: 'forces',
    statement: 'I can connect kinematics and forces as one chain — net force → acceleration → motion.' },
  { slug: 'u1.d19-defend-aloud', lessonSlug: 'u1-d19', content_strand: 'metacognition', exclude_from_growth: true,
    statement: 'I can defend my reasoning aloud using claim–evidence–reasoning.' },
  { slug: 'u1.d20-locate-the-arc', lessonSlug: 'u1-d20', content_strand: 'metacognition', exclude_from_growth: true,
    statement: "I can locate Unit 1 in the year's arc — name what it cannot yet answer and which unit will." },
  { slug: 'u1.d22-honors-transfer', lessonSlug: 'u1-d22', content_strand: 'transfer',
    statement: 'I can state my modeling assumptions and connect my analysis across the unit on the transfer task.' },
]

async function main() {
  console.log(COMMIT ? '🚀 COMMIT mode — writing to Supabase\n' : '🔎 DRY RUN — no writes. Pass --commit to apply.\n')
  let n = 0
  for (let i = 0; i < TARGETS.length; i++) {
    const t = TARGETS[i]
    // Resolve lesson_id by slug (best-effort — null is acceptable).
    const { data: lesson } = await supabase.from('lessons').select('id').eq('slug', t.lessonSlug).maybeSingle()
    const lessonId = (lesson as { id: string } | null)?.id ?? null

    const row = {
      slug: t.slug,
      statement: t.statement,
      domain: 'reasoning',
      unit_id: 'unit-1',
      content_strand: t.content_strand,
      exclude_from_growth: t.exclude_from_growth ?? false,
      order_index: 200 + i,
      lesson_id: lessonId,
    }
    console.log(`${COMMIT ? '→' : '· '} ${t.slug}  (lesson ${t.lessonSlug} → ${lessonId ?? 'NOT FOUND'})${row.exclude_from_growth ? '  [excluded from growth]' : ''}`)

    if (COMMIT) {
      const { error } = await supabase.from('learning_targets').upsert(row, { onConflict: 'slug' })
      if (error) { console.error(`   ✖ ${error.message}`); continue }
    }
    n++
  }
  console.log(`\n${COMMIT ? '✅ upserted' : 'would upsert'} ${n} honors learning targets.`)
  if (!COMMIT) console.log('Re-run with --commit to apply.')
}

main().catch((e) => { console.error(e); process.exit(1) })
