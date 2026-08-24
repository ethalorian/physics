/**
 * Seed the Trades Physics content layer: 6 units, 70 learning targets and
 * 2 mastery tasks, all scoped program = 'trades'.
 *
 * Everything is upserted by slug (units by id), so this is idempotent —
 * re-running it updates statements in place rather than duplicating rows.
 *
 * PREREQUISITE 1 — the migration.
 *   supabase/migrations/add_program_to_curriculum.sql must have been applied.
 *   Without the `program` column these rows would be pulled into the physics
 *   growth tree by any unfiltered query.
 *
 * PREREQUISITE 2 — a real secret key.
 *   units / learning_targets / mastery_tasks all have RLS enabled, and `units`
 *   has NO write policy at all, so the anon (publishable) key cannot write
 *   here no matter what. This script needs the service_role / secret key:
 *     Supabase dashboard -> Project Settings -> API Keys
 *     either the legacy `service_role` JWT (eyJ...) or a modern `sb_secret_...`
 *   Put it in .env.local as SUPABASE_SERVICE_ROLE_KEY. It is a full-bypass
 *   credential — never expose it to the browser, never prefix it NEXT_PUBLIC_.
 *
 * Usage:
 *   npx tsx scripts/seed-trades-curriculum.ts            # DRY RUN — writes nothing
 *   npx tsx scripts/seed-trades-curriculum.ts --commit   # apply
 *   npx tsx scripts/seed-trades-curriculum.ts --commit --units-only
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import {
  TRADES_UNITS,
  TRADES_TARGETS,
  TRADES_MASTERY_TASKS,
  TRADES_PROGRAM,
  assertTradesContentValid,
} from '../src/data/trades-curriculum'

dotenv.config({ path: '.env.local' })

const COMMIT = process.argv.includes('--commit')
const UNITS_ONLY = process.argv.includes('--units-only')

// ---------------------------------------------------------------- credentials
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function looksLikePlaceholder(v: string): boolean {
  return /paste|your[_-]?key|xxx|<.*>|change[_-]?me|todo/i.test(v)
}
function looksLikeAKey(v: string): boolean {
  // legacy service_role JWT, or a modern sb_secret_ key
  return v.startsWith('eyJ') || v.startsWith('sb_secret_')
}

function die(...lines: string[]): never {
  for (const l of lines) console.error(l)
  process.exit(1)
}

if (!url) {
  die('❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
}
if (!rawKey) {
  die(
    '❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.',
    '',
    '   These tables have RLS on, and `units` has no write policy at all, so the',
    '   anon key cannot seed them. Get the secret key from:',
    '     Supabase dashboard -> Project Settings -> API Keys',
    '   (the legacy `service_role` JWT, or a modern `sb_secret_...` key)',
  )
}
if (looksLikePlaceholder(rawKey)) {
  die(
    `❌ SUPABASE_SERVICE_ROLE_KEY is still a placeholder ("${rawKey.slice(0, 24)}...").`,
    '',
    '   Replace it with the real secret key from:',
    '     Supabase dashboard -> Project Settings -> API Keys',
    '   (the legacy `service_role` JWT starting eyJ..., or `sb_secret_...`)',
  )
}
if (!looksLikeAKey(rawKey)) {
  console.warn(
    `⚠️  SUPABASE_SERVICE_ROLE_KEY does not look like a Supabase key ` +
      `(expected eyJ... or sb_secret_...). Continuing anyway.`,
  )
}

const supabase: SupabaseClient = createClient(url, rawKey)

// ------------------------------------------------------------------ preflight
type PgErr = { code?: string; message?: string; details?: string; hint?: string }

function classify(e: PgErr): 'auth' | 'no-column' | 'rls' | 'other' {
  const msg = (e.message ?? '').toLowerCase()
  if (e.code === '42703' || msg.includes('column') && msg.includes('does not exist')) return 'no-column'
  if (msg.includes('invalid api key') || msg.includes('jwt') || e.code === 'PGRST301') return 'auth'
  if (e.code === '42501' || msg.includes('row-level security') || msg.includes('violates row-level')) return 'rls'
  return 'other'
}

async function preflight() {
  // 1. Can we reach the API at all, and does the program column exist?
  const { error: readErr } = await supabase.from('learning_targets').select('program').limit(1)
  if (readErr) {
    const kind = classify(readErr as PgErr)
    if (kind === 'auth') {
      die(
        '❌ Supabase rejected the key ("' + readErr.message + '").',
        '',
        '   This is a CREDENTIAL problem, not a schema problem.',
        '   Check SUPABASE_SERVICE_ROLE_KEY in .env.local against:',
        '     Supabase dashboard -> Project Settings -> API Keys',
        '   Also confirm NEXT_PUBLIC_SUPABASE_URL points at the same project.',
      )
    }
    if (kind === 'no-column') {
      die(
        '❌ learning_targets.program does not exist.',
        '   Apply supabase/migrations/add_program_to_curriculum.sql first.',
      )
    }
    die('❌ Could not read learning_targets: ' + JSON.stringify(readErr, null, 2))
  }

  // 2. Can we actually WRITE? Probe before doing 78 upserts, not after 40.
  if (!COMMIT) return
  const probe = { id: '__preflight__', name: '__preflight__', order_index: -1, program: TRADES_PROGRAM }
  const { error: wErr } = await supabase.from('units').upsert(probe, { onConflict: 'id' })
  if (wErr) {
    const kind = classify(wErr as PgErr)
    if (kind === 'rls' || kind === 'auth') {
      die(
        '❌ The key can read but cannot write ("' + wErr.message + '").',
        '',
        '   That means it is the ANON/publishable key, not the secret key.',
        '   RLS is enabled on units / learning_targets / mastery_tasks, and',
        '   `units` has no write policy, so only the service_role / sb_secret_',
        '   key can seed. Fix SUPABASE_SERVICE_ROLE_KEY in .env.local.',
      )
    }
    die('❌ Write probe failed: ' + JSON.stringify(wErr, null, 2))
  }
  await supabase.from('units').delete().eq('id', '__preflight__')
}

// ----------------------------------------------------------------------- main
async function main() {
  assertTradesContentValid()
  await preflight()

  console.log(COMMIT ? '🚀 COMMIT mode — writing to Supabase\n' : '🔎 DRY RUN — no writes. Pass --commit to apply.\n')
  console.log(`   program        ${TRADES_PROGRAM}`)
  console.log(`   units          ${TRADES_UNITS.length}`)
  console.log(`   targets        ${TRADES_TARGETS.length}`)
  console.log(`   mastery tasks  ${TRADES_MASTERY_TASKS.length}\n`)

  for (const u of TRADES_UNITS) {
    const row = {
      id: u.id,
      name: u.name,
      description: u.blurb,
      order_index: u.orderIndex,
      program: TRADES_PROGRAM,
    }
    console.log(`  unit   ${u.id.padEnd(10)} ${u.status.padEnd(8)} ${u.name}`)
    if (!COMMIT) continue
    const { error } = await supabase.from('units').upsert(row, { onConflict: 'id' })
    if (error) die(`    ❌ ${u.id}: ${error.message}`)
  }
  if (UNITS_ONLY) { console.log('\n(units only — stopping here)'); return }

  console.log('')
  let n = 0
  for (const t of TRADES_TARGETS) {
    const row = {
      slug: t.slug,
      statement: t.statement,
      domain: t.domain,
      unit_id: t.unitId,
      content_strand: t.contentStrand,
      standard_refs: t.standardRefs.length ? t.standardRefs : null,
      exclude_from_growth: false,
      order_index: t.orderIndex,
      program: TRADES_PROGRAM,
    }
    const std = t.standardRefs.length ? t.standardRefs.join(' ') : '—'
    console.log(`  target ${t.slug.padEnd(26)} ${t.domain.padEnd(10)} ${std}`)
    if (!COMMIT) { n++; continue }
    const { error } = await supabase.from('learning_targets').upsert(row, { onConflict: 'slug' })
    if (error) die(`    ❌ ${t.slug}: ${error.message}`)
    n++
  }

  console.log('')
  for (const m of TRADES_MASTERY_TASKS) {
    // The DB stores rubric as { dimension: { description } } — match the
    // physics shape exactly so one scoring engine serves both courses.
    const rubric = Object.fromEntries(
      Object.entries(m.rubric).map(([dim, description]) => [dim, { description }]),
    )
    const row = { slug: m.slug, unit_id: m.unitId, prompt: m.prompt, rubric, program: TRADES_PROGRAM }
    console.log(`  task   ${m.slug.padEnd(30)} ${m.unitId}`)
    if (!COMMIT) continue
    const { error } = await supabase.from('mastery_tasks').upsert(row, { onConflict: 'slug' })
    if (error) die(`    ❌ ${m.slug}: ${error.message}`)
  }

  if (!COMMIT) {
    console.log(`\n🔎 Dry run complete — ${n} targets would be written. Re-run with --commit.`)
    return
  }

  console.log(`\n✅ Seeded ${TRADES_UNITS.length} units, ${n} targets, ${TRADES_MASTERY_TASKS.length} mastery tasks.`)

  // The whole point of `program`: prove the physics course is untouched.
  const [{ count: phys }, { count: trades }] = await Promise.all([
    supabase.from('learning_targets').select('*', { count: 'exact', head: true }).eq('program', 'physics'),
    supabase.from('learning_targets').select('*', { count: 'exact', head: true }).eq('program', 'trades'),
  ])
  console.log(`   learning_targets — physics: ${phys} (expected 148, unchanged)  trades: ${trades}`)
  if (phys !== 148) {
    console.warn('   ⚠️  physics target count changed. Investigate before trusting the growth tree.')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
