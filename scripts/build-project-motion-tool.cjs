/** Re-export the editable Claude Design source. Implements A-1, P-1/P-2, C-3; respects E-3/M-1. */
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'src/data/deck-sources/project-physics')
for (const day of [1, 3]) {
const stem = `week-1-day-${day}`
const { manifest, external } = JSON.parse(fs.readFileSync(path.join(source, `${stem}-assets.json`), 'utf8'))
const urls = Object.fromEntries(Object.entries(manifest).map(([id, asset]) => {
  const raw = Buffer.from(asset.data, 'base64')
  const bytes = asset.compressed ? zlib.gunzipSync(raw) : raw
  return [id, `data:${asset.mime};base64,${bytes.toString('base64')}`]
}))
const resources = Object.fromEntries(external.map(asset => [asset.id, urls[asset.uuid]]))
let html = fs.readFileSync(path.join(source, `${stem}.html`), 'utf8')
for (const [id, url] of Object.entries(urls)) html = html.replaceAll(id, url)
html = html.replace('<head>', `<head><script>window.__resources=${JSON.stringify(resources)};</script>`)
html = html.replace('<!-- CLASSROOM_BRIDGE -->', `<script>${fs.readFileSync(path.join(source, 'motion-deck-bridge.js'), 'utf8')}</script>`)
const output = path.join(root, `public/decks/project-physics/${stem}.html`)
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, html)
console.log(`Built ${path.relative(root, output)} (${Buffer.byteLength(html)} bytes)`)
}
