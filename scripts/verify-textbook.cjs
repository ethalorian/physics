const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

// The honors reader's page map is tied to this exact 1,773-page edition.
const file = path.join(__dirname, '../public/textbooks/college-physics-ap-courses-2e.pdf')
const expectedBytes = 266882977
const expectedSha256 = 'de438d7a0ed13339340d3e6bb93346920ef146c99e1275e8c84ba476555943d7'

async function main() {
  if (!fs.existsSync(file) || fs.statSync(file).size !== expectedBytes) {
    throw new Error('The honors textbook is missing or incomplete. Install Git LFS, run "git lfs install" and "git lfs pull", then retry. Enable Git LFS in Vercel project settings for Git deployments.')
  }
  const hash = createHash('sha256')
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk)
  if (hash.digest('hex') !== expectedSha256) {
    throw new Error('The honors textbook does not match its verified page map. Restore the Git LFS asset before deploying; a replacement edition requires reviewing the page map.')
  }
  console.log('Honors textbook verified: complete PDF and expected SHA-256.')
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
