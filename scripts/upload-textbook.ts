/**
 * Upload the Conceptual Physics chapter PDFs to the PRIVATE `textbook` bucket.
 *
 * Usage:
 *   npm run textbook:upload -- "/Users/craigantocci/Desktop/Current/Conc. Text teachers copy/student-edition"
 *
 * Expects files named cpNN.pdf (student edition, teacher column stripped by
 * scripts/strip-teacher-column.py) or cpteNN.pdf (raw teacher edition) and
 * stores them as cpNN.pdf. Point it at the student-edition folder — the raw
 * TE files carry the answer column.
 * Needs the real SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase dashboard →
 * Project Settings → API Keys → service_role). Re-running upserts, so it is safe
 * to run again after swapping in a student edition.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { TEXTBOOK_BUCKET, textbookChapter, textbookObjectPath } from '../src/data/textbook'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key || key.startsWith('PASTE_')) {
  console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and a real SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const folder = process.argv[2]
if (!folder || !fs.existsSync(folder)) {
  console.error('❌ Pass the folder containing cpteNN.pdf files as the first argument')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function main() {
  const files = fs.readdirSync(folder).filter((f) => /^cp(te)?\d{2}\.pdf$/i.test(f)).sort()
  if (!files.length) { console.error('❌ No cpNN.pdf / cpteNN.pdf files found'); process.exit(1) }

  let ok = 0
  for (const f of files) {
    const n = Number(f.replace(/\D/g, ''))
    const meta = textbookChapter(n)
    if (!meta) { console.warn(`⚠️  ${f}: chapter ${n} is not in src/data/textbook.ts — skipped`); continue }
    const bytes = fs.readFileSync(path.join(folder, f))
    const dest = textbookObjectPath(n)
    const { error } = await supabase.storage.from(TEXTBOOK_BUCKET).upload(dest, bytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (error) console.error(`❌ ${f} → ${dest}: ${error.message}`)
    else { ok++; console.log(`✅ ${f} → ${dest}  (${(bytes.length / 1048576).toFixed(1)} MB)  Ch ${n}: ${meta.title}`) }
  }
  console.log(`\nDone: ${ok}/${files.length} uploaded to bucket "${TEXTBOOK_BUCKET}".`)
}

main().catch((e) => { console.error(e); process.exit(1) })
