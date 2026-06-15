/**
 * Seed Unit 1 honors blocks into lessons.content_blocks.
 *
 * Reads the repo snapshots:
 *   - src/data/unit1-blocks/u1-d01.json           (full day; honors blocks extracted)
 *   - src/data/unit1-blocks/honors/u1-dNN.json    (honors overlays, days 2–22)
 * and appends each day's honors-tagged blocks onto the matching lesson row
 * (matched by slug u1-d01 … u1-d22).
 *
 * IDEMPOTENT: before appending, it strips any blocks already tagged
 * visibilityTrack === 'honors' on that lesson, so re-running after editing the
 * JSON replaces rather than duplicates.
 *
 * Usage:
 *   npx tsx scripts/seed-honors-blocks.ts            # DRY RUN — prints a plan, writes nothing
 *   npx tsx scripts/seed-honors-blocks.ts --commit   # apply the changes
 *
 * Requires (.env.local): NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Placement: the honors HOOK + build arc is inserted right after each lesson's
 * intro (its leading target / asteroid_thread blocks); the WORK prompts
 * (JUSTIFY / TRANSFER / …) and the Marzano self-rating go at the END. The dry
 * run prints the per-block placement plan so you can eyeball it before --commit.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('❌ Missing Supabase credentials in .env.local (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}
const supabase = createClient(url, key)
const COMMIT = process.argv.includes('--commit')

const DIR = path.join(process.cwd(), 'src', 'data', 'unit1-blocks')

interface Block { id: string; type: string; visibilityTrack?: string }
interface Doc { schemaVersion?: number; dayType?: string; blocks?: Block[] }

/** Honors-tagged blocks for one day: prefer the honors/ overlay, fall back to a full-day file. */
function honorsBlocksForDay(slug: string): Block[] {
  const overlay = path.join(DIR, 'honors', `${slug}.json`)
  const full = path.join(DIR, `${slug}.json`)
  const file = fs.existsSync(overlay) ? overlay : fs.existsSync(full) ? full : null
  if (!file) return []
  const doc = JSON.parse(fs.readFileSync(file, 'utf-8')) as Doc
  return (doc.blocks ?? []).filter((b) => b.visibilityTrack === 'honors')
}

async function main() {
  console.log(COMMIT ? '🚀 COMMIT mode — writing to Supabase\n' : '🔎 DRY RUN — no writes. Pass --commit to apply.\n')
  let appended = 0
  let touched = 0
  for (let n = 1; n <= 22; n++) {
    const slug = `u1-d${String(n).padStart(2, '0')}`
    const honors = honorsBlocksForDay(slug)
    if (honors.length === 0) { console.log(`·  ${slug}: no honors blocks — skip`); continue }

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, content_blocks')
      .eq('slug', slug)
      .maybeSingle()
    if (error) { console.error(`✖  ${slug}: ${error.message}`); continue }
    if (!lesson) { console.warn(`⚠  ${slug}: no lesson row yet — skip (seed the CPA lesson first)`); continue }

    const doc = (lesson.content_blocks as Doc) ?? { schemaVersion: 1, blocks: [] }
    const base = (doc.blocks ?? []).filter((b) => b.visibilityTrack !== 'honors') // strip old honors → idempotent

    // Place honors blocks so the HOOK leads and the WORK trails:
    //   • work prompts (JUSTIFY/TRANSFER/PLAN/STATE/REBUTTAL/NAME…) + the Marzano
    //     self-rating  → END of the day (homework / close).
    //   • the rest (the "Honors —" hook, the build, vocab, assumptions, predict,
    //     connect-forward) → right AFTER the lesson's intro, in authored order.
    const END_PROMPT = /^\s*(JUSTIFY|TRANSFER|PLAN|STATE|REBUTTAL|NAME THE ASSUMPTION)/i
    const isEnd = (b: Block) =>
      b.type === 'marzano' ||
      (b.type === 'exit_ticket' && END_PROMPT.test((b as { prompt?: string }).prompt ?? ''))
    const afterIntro = honors.filter((b) => !isEnd(b))
    const endBlocks = honors.filter(isEnd)

    // Insertion point: just past the leading run of framing blocks (target / asteroid_thread).
    let k = 0
    while (k < base.length && (base[k].type === 'target' || base[k].type === 'asteroid_thread')) k++

    const mergedBlocks = [...base.slice(0, k), ...afterIntro, ...base.slice(k), ...endBlocks]
    const merged: Doc = { ...doc, schemaVersion: doc.schemaVersion ?? 1, blocks: mergedBlocks }

    console.log(`${COMMIT ? '→' : '· '} ${slug}: base ${base.length} | +${afterIntro.length} after intro (after pos ${k}) | +${endBlocks.length} at end → ${mergedBlocks.length}`)
    if (!COMMIT) {
      for (const b of afterIntro) console.log(`      ┌ after-intro  ${b.id.padEnd(4)} ${b.type}`)
      for (const b of endBlocks) console.log(`      └ end         ${b.id.padEnd(4)} ${b.type}`)
    }
    appended += honors.length
    touched += 1

    if (COMMIT) {
      const { error: upErr } = await supabase.from('lessons').update({ content_blocks: merged }).eq('id', lesson.id)
      if (upErr) console.error(`   ✖ update failed: ${upErr.message}`)
    }
  }
  console.log(`\n${COMMIT ? '✅ wrote' : 'would write'} ${appended} honors blocks across ${touched} lessons.`)
  if (!COMMIT) console.log('Re-run with --commit to apply.')
}

main().catch((e) => { console.error(e); process.exit(1) })
