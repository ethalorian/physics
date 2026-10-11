// Keep the supplied artwork in every release. Run before production builds.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file))
const logo = read('public/brand/antocci-physics.png')
assert.equal(crypto.createHash('sha256').update(logo).digest('hex'), 'ef5d9c0520264b4cd91a20704b3b727b0ce2fe6373c88ae3e2bee827e2f5fce2', 'The approved Antocci Physics logo is missing or changed. Verify a replacement before updating this check.')
assert.ok(read('src/components/BrandLogo.tsx').toString().includes('src="/brand/antocci-physics.png"'), 'The shared logo must use the approved artwork.')
for (const file of ['src/components/navbar.tsx', 'src/app/page.tsx', 'src/app/auth/signin/page.tsx', 'src/components/admin/AdminShell.tsx', 'src/components/present/TeachingStage.tsx', 'src/components/vocabulary/checkpoint/CheckpointPreview.tsx']) {
  assert.ok(read(file).toString().includes('<BrandLogo'), `Missing shared logo: ${file}`)
}
for (const [file, size] of [['src/app/icon.png', 512], ['src/app/apple-icon.png', 180]]) {
  const png = read(file)
  assert.equal(png.subarray(1,4).toString(), 'PNG', `Invalid icon: ${file}`)
  assert.equal(png.readUInt32BE(16), size)
  assert.equal(png.readUInt32BE(20), size)
}
const icon=read('src/app/favicon.ico')
assert.equal(icon.readUInt16LE(2), 1, 'Invalid favicon')
assert.equal(icon.readUInt16LE(4), 3, 'Favicon must include all three sizes')
assert.ok(read('public/decks/unit-1-teaching/logo.png').equals(logo), 'Teaching decks must use the same artwork.')
for (const file of fs.readdirSync(path.join(root,'public/decks/unit-1-teaching')).filter(f=>f.endsWith('.html'))) {
  assert.ok(read('public/decks/unit-1-teaching/'+file).toString().includes('<img src="./logo.png"'), `Missing teaching-deck logo: ${file}`)
}
console.log('Brand audit passed: approved artwork, six app surfaces, browser icons, and teaching decks.')
