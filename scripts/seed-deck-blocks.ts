/**
 * Seed Unit 1 `deck` blocks into lessons.content_blocks.
 *
 * For each Unit 1 lesson (slug u1-d01 … u1-d22) this PREPENDS a `deck` content
 * block pointing at the day's slide deck in /public/decks/unit-1/ (the
 * self-contained HTML bundles — see docs/Deck-Integration-Handoff.md). The deck
 * block is teacher-facing only: track-visibility strips it for students, and
 * BlockRenderer shows it as a "Present" launch card.
 *
 * Multi-day decks are shared: d11+d12 → "Day 11-12 - Derive F=ma",
 * d21+d22 → "Day 21-22 - Transfer Task". Day 1's anchor deck is
 * "U1 Day 1 - The Briefing" (Something Is Coming — the self-hosted design export); Day 2 has its own vocabulary deck.
 *
 * IDEMPOTENT: any existing blocks with type === 'deck' are stripped from the
 * lesson before the fresh block is prepended, so re-running replaces rather
 * than duplicates.
 *
 * Usage:
 *   npx tsx scripts/seed-deck-blocks.ts            # DRY RUN — prints a plan, writes nothing
 *   npx tsx scripts/seed-deck-blocks.ts --commit   # apply the changes
 *
 * Requires (.env.local): NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
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

const DECK_DIR = path.join(process.cwd(), 'public', 'decks', 'unit-1')

interface Block { id: string; type: string; [k: string]: unknown }
interface Doc { schemaVersion?: number; dayType?: string; blocks?: Block[] }

/** slug → deck file (in public/decks/unit-1/) + presenter-card title. */
const DECKS: Record<string, { file: string; title: string }> = {
  'u1-d01': { file: 'U1 Day 1 - The Briefing.html', title: 'Day 1 — The Briefing: Something Is Coming' },
  'u1-d02': { file: 'Day 2 - Motion Vocabulary.dc.html', title: 'Day 2 — Motion Vocabulary' },
  'u1-d03': { file: 'Day 3 - Graphs as Claims.dc.html', title: 'Day 3 — Graphs as Claims' },
  'u1-d04': { file: 'Day 4 - Velocity-Time and Vectors.dc.html', title: 'Day 4 — Velocity-Time and Vectors' },
  'u1-d05': { file: 'Day 5 - Predicting Position.dc.html', title: 'Day 5 — Predicting Position' },
  'u1-d06': { file: 'Day 6 - Vector Addition.dc.html', title: 'Day 6 — Vector Addition' },
  'u1-d07': { file: 'Day 7 - Acceleration.dc.html', title: 'Day 7 — Acceleration' },
  'u1-d08': { file: 'Day 8 - Equations of Motion.dc.html', title: 'Day 8 — Equations of Motion' },
  'u1-d09': { file: "Day 9 - Newton's 1st Law.dc.html", title: "Day 9 — Newton's 1st Law" },
  'u1-d10': { file: 'Day 10 - Forces.dc.html', title: 'Day 10 — Forces' },
  'u1-d11': { file: 'Day 11-12 - Derive F=ma.dc.html', title: 'Day 11–12 — Derive F=ma' },
  'u1-d12': { file: 'Day 11-12 - Derive F=ma.dc.html', title: 'Day 11–12 — Derive F=ma' },
  'u1-d13': { file: 'Day 13 - F=ma in Practice.dc.html', title: 'Day 13 — F=ma in Practice' },
  'u1-d14': { file: "Day 14 - Newton's 3rd Law.dc.html", title: "Day 14 — Newton's 3rd Law" },
  'u1-d15': { file: 'Day 15 - Free Body Diagrams 1.dc.html', title: 'Day 15 — Free Body Diagrams 1' },
  'u1-d16': { file: 'Day 16 - Free Body Diagrams 2.dc.html', title: 'Day 16 — Free Body Diagrams 2' },
  'u1-d17': { file: 'Day 17 - Friction.dc.html', title: 'Day 17 — Friction' },
  'u1-d18': { file: 'Day 18 - Equilibrium.dc.html', title: 'Day 18 — Equilibrium' },
  'u1-d19': { file: 'Day 19 - Workshop.dc.html', title: 'Day 19 — Workshop' },
  'u1-d20': { file: 'Day 20 - Synthesis.dc.html', title: 'Day 20 — Synthesis' },
  'u1-d21': { file: 'Day 21-22 - Transfer Task.dc.html', title: 'Day 21–22 — Transfer Task' },
  'u1-d22': { file: 'Day 21-22 - Transfer Task.dc.html', title: 'Day 21–22 — Transfer Task' },
}

async function main() {
  console.log(COMMIT ? '🚀 COMMIT mode — writing to Supabase\n' : '🔎 DRY RUN — no writes. Pass --commit to apply.\n')

  // Every referenced deck file must actually exist in public/decks/unit-1.
  const missing = [...new Set(Object.values(DECKS).map((d) => d.file))].filter(
    (f) => !fs.existsSync(path.join(DECK_DIR, f)),
  )
  if (missing.length) {
    console.error('❌ Deck files missing from public/decks/unit-1:\n  ' + missing.join('\n  '))
    process.exit(1)
  }

  let touched = 0
  let skipped = 0

  for (const [slug, deck] of Object.entries(DECKS)) {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, slug, title, content_blocks')
      .eq('slug', slug)
      .maybeSingle()
    if (error) {
      console.error(`❌ ${slug}: fetch failed — ${error.message}`)
      continue
    }
    if (!lesson) {
      console.warn(`⚠️  ${slug}: no lesson row — skipped`)
      skipped++
      continue
    }

    const doc = (lesson.content_blocks ?? { schemaVersion: 1, blocks: [] }) as Doc
    const blocks = doc.blocks ?? []
    const withoutDecks = blocks.filter((b) => b.type !== 'deck')
    const replacing = blocks.length - withoutDecks.length

    const deckBlock: Block = {
      id: `${slug}-deck`,
      type: 'deck',
      src: `/decks/unit-1/${deck.file}`,
      title: deck.title,
      note: 'Teacher presenter deck — students never see this block.',
    }
    const next: Doc = { ...doc, schemaVersion: doc.schemaVersion ?? 1, blocks: [deckBlock, ...withoutDecks] }

    console.log(
      `${COMMIT ? '✍️ ' : '📝'} ${slug} (“${lesson.title}”): prepend deck → ${deck.file}` +
      (replacing ? ` (replaces ${replacing} existing deck block${replacing > 1 ? 's' : ''})` : ''),
    )

    if (COMMIT) {
      const { error: upErr } = await supabase.from('lessons').update({ content_blocks: next }).eq('id', lesson.id)
      if (upErr) {
        console.error(`❌ ${slug}: update failed — ${upErr.message}`)
        continue
      }
    }
    touched++
  }

  console.log(`\n${COMMIT ? '✅ Updated' : '📋 Would update'} ${touched} lesson(s); skipped ${skipped}.`)
  if (!COMMIT) console.log('Run again with --commit to apply.')
}

main().catch((e) => { console.error(e); process.exit(1) })
