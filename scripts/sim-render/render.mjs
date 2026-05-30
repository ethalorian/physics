// ---------------------------------------------------------------------------
// Headless simulation renderer + golden-image check.
//
// Renders every SimLab engine to a PNG with no browser: esbuild bundles each
// sim's def.ts (engine + the pure draw.ts; types are erased, no React), and
// @napi-rs/canvas — the same Canvas 2D API the browser uses — draws it. Use it
// to eyeball a sim after changing its engine, and to catch layout/motion
// regressions in CI.
//
//   node scripts/sim-render/render.mjs            # render all -> out/ (eyeball)
//   node scripts/sim-render/render.mjs update     # (re)write golden/ baselines
//   node scripts/sim-render/render.mjs check      # diff out vs golden, exit 1 on change
//
// Determinism: Math.random is seeded before every render so star fields, random
// measurement targets, etc. are stable. Each sim's scene (params + frame count)
// lives in scenes.mjs.
//
// LIMITATIONS:
//  - node-canvas has no emoji or some Unicode glyphs (₁ ₂ Δ), so those appear
//    blank in the PNGs — a real browser renders them. They are NOT bugs.
//  - Golden PNGs are platform-specific (font rasterization differs across OSes).
//    Run `update` once on YOUR machine to set baselines before relying on `check`.
//  - Two engines are skipped: riverboat-crossing-3d (WebGL) and maze-vectors
//    (keyboard-driven) — they need a real-browser harness.
// ---------------------------------------------------------------------------

import { build } from 'esbuild'
import { createCanvas } from '@napi-rs/canvas'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { SCENES } from './scenes.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = process.env.SIM_REPO_ROOT || resolve(__dirname, '../..')
const srcDir = join(repoRoot, 'src')
const simDir = join(srcDir, 'app', 'simulations')
const goldenDir = join(__dirname, 'golden')
const outDir = join(__dirname, 'out')
const require = createRequire(import.meta.url)

// Engines the headless harness can't drive.
const SKIP = new Set(['riverboat-crossing-3d', 'maze-vectors'])

const mode = (process.argv[2] || 'render').toLowerCase()

const sims = readdirSync(simDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(simDir, d.name, 'def.ts')))
  .map((d) => d.name)
  .filter((s) => !SKIP.has(s))
  .sort()

// Seeded PRNG (mulberry32) so renders are deterministic.
function seedRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function loadDef(slug) {
  const tmp = join(tmpdir(), `simrender-${slug}-${process.pid}.cjs`)
  await build({
    entryPoints: [join(simDir, slug, 'def.ts')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: tmp,
    alias: { '@': srcDir },
    logLevel: 'silent',
  })
  delete require.cache[tmp]
  const mod = require(tmp)
  rmSync(tmp, { force: true })
  const def = Object.values(mod).find((v) => v && v.createEngine)
  if (!def) throw new Error(`no SimDefinition with createEngine in ${slug}/def.ts`)
  return def
}

function renderSim(def, scene) {
  const dpr = scene.dpr ?? 2
  const cssW = scene.width ?? 760
  const cssH = def.canvasHeight ?? 400

  Math.random = seedRandom(0x9e3779b9) // deterministic before every render
  globalThis.window = { devicePixelRatio: dpr } // the only browser global engines read

  const canvas = createCanvas(Math.round(cssW * dpr), Math.round(cssH * dpr))
  canvas.addEventListener = () => {}
  canvas.removeEventListener = () => {}
  canvas.setPointerCapture = () => {}
  canvas.releasePointerCapture = () => {}
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, right: cssW, bottom: cssH, width: cssW, height: cssH })
  canvas.style = {}

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr) // the SimLab shell pre-applies the DPR transform

  const values = {}
  for (const p of def.params ?? []) values[p.key] = p.default
  Object.assign(values, scene.params ?? {})

  const engine = def.createEngine(canvas, ctx, values)
  engine.setParams(values)
  if (engine.start) engine.start(values)
  for (let i = 0; i < (scene.frames ?? 0); i++) if (engine.step) engine.step(1 / 120)
  engine.render()
  return canvas.toBuffer('image/png')
}

function pixelDelta(aBuf, bBuf) {
  const a = PNG.sync.read(aBuf)
  const b = PNG.sync.read(bBuf)
  if (a.width !== b.width || a.height !== b.height) return Infinity
  return pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 })
}

mkdirSync(outDir, { recursive: true })
if (mode === 'update') mkdirSync(goldenDir, { recursive: true })

let failures = 0
for (const slug of sims) {
  const scene = SCENES[slug] ?? {}
  let buf
  try {
    const def = await loadDef(slug)
    buf = renderSim(def, scene)
  } catch (e) {
    console.log(`ERROR    ${slug}: ${e.message}`)
    failures++
    continue
  }
  writeFileSync(join(outDir, `${slug}.png`), buf)

  if (mode === 'update') {
    writeFileSync(join(goldenDir, `${slug}.png`), buf)
    console.log(`updated  ${slug}`)
  } else if (mode === 'check') {
    const gp = join(goldenDir, `${slug}.png`)
    if (!existsSync(gp)) {
      console.log(`NOGOLDEN ${slug} (run \`update\`)`)
      failures++
      continue
    }
    const delta = pixelDelta(buf, readFileSync(gp))
    const tol = scene.tolerance ?? 200
    if (delta > tol) {
      console.log(`CHANGED  ${slug}: ${delta} px differ (tolerance ${tol})`)
      failures++
    } else {
      console.log(`ok       ${slug} (${delta} px)`)
    }
  } else {
    console.log(`rendered ${slug} -> out/${slug}.png`)
  }
}

console.log(`\n${mode}: ${sims.length - failures}/${sims.length} ok`)
if (mode === 'check' && failures > 0) {
  console.error(`${failures} sim(s) changed or failed — review out/ vs golden/`)
  process.exit(1)
}
