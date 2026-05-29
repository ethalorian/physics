/**
 * One-off: write the authored Unit 8 BlockDocuments (src/data/unit8-blocks/u8-dNN.json)
 * into lessons.content_blocks for slugs u8-d01..u8-d09.
 * Usage: npx tsx scripts/apply-unit8-blocks.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const sb = createClient(url, key)

async function main() {
  for (let i = 1; i <= 9; i++) {
    const d = String(i).padStart(2, '0')
    const slug = `u8-d${d}`
    const doc = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/unit8-blocks', `${slug}.json`), 'utf8'))
    const { error } = await sb.from('lessons').update({ content_blocks: doc }).eq('slug', slug)
    console.log(slug, error ? `ERROR ${error.message}` : `OK (${doc.blocks.length} blocks)`)
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
