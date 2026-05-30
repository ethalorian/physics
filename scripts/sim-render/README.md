# sim-render — headless simulation renderer & visual regression check

Renders every SimLab engine to a PNG **without a browser**, so you can:

1. **Eyeball a sim** after editing its engine — catch label/vector overlaps,
   off-canvas elements, wrong motion — without clicking through the app.
2. **Guard against regressions** — a committed "golden" image per sim, plus a
   pixel-diff check that fails when a render changes.

How it works: [esbuild](https://esbuild.github.io/) bundles each sim's `def.ts`
(its engine + the pure `src/components/simulations/lab/draw.ts`; TypeScript types
are erased, so no React/Next is pulled in), and
[`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) — the same Canvas 2D
API the browser uses — draws it to a buffer. The SimLab shell's fixed-`dt` loop is
reproduced by stepping `engine.step(1/120)` N times before `engine.render()`.

## Usage

```bash
npm install            # first time: pulls esbuild, @napi-rs/canvas, pixelmatch, pngjs
npm run sim:render            # render all sims -> scripts/sim-render/out/*.png
npm run sim:render:update     # (re)write the golden baselines in golden/
npm run sim:check             # render + diff against golden/, exit 1 on any change
```

Typical loop: change an engine → `npm run sim:render` → open
`scripts/sim-render/out/<sim>.png`. If the change is intentional, re-baseline with
`npm run sim:render:update` and commit the updated golden.

## Scenes

`scenes.mjs` sets each sim's slider params, frame count, and canvas size, chosen to
land the sim in a representative mid-run state (monkey-hunter after the hit, atwood
near the target line, riverboat mid-river, sumo at the heavy-mass extreme). Edit it
to change what gets captured. Renders are deterministic: `Math.random` is seeded
before each frame, so star fields and random measurement targets are stable.

## Limitations (read before trusting a diff)

- **No emoji / some glyphs.** node-canvas can't render emoji (🐵 🧑‍🚀 🪶) or a few
  Unicode glyphs (`₁ ₂ Δ`), so those appear blank. That's a renderer gap, **not a
  bug** in the sim — a real browser shows them.
- **Goldens are platform-specific.** Font rasterization differs across operating
  systems, so a baseline generated on Linux won't pixel-match macOS. Run
  `npm run sim:render:update` once on your machine (or in your CI image) to set
  baselines for that environment before relying on `npm run sim:check`. The
  committed baselines were generated on Linux — best matched by running `sim:check`
  in a Linux CI container.
- **Two engines are skipped:** `riverboat-crossing-3d` (WebGL — node-canvas has no
  GL context) and `maze-vectors` (keyboard-driven). They need a real-browser
  harness (e.g. Playwright) to capture.

## Files

| File | Purpose |
|------|---------|
| `render.mjs` | The renderer + `render` / `update` / `check` modes |
| `scenes.mjs` | Per-sim params, frame counts, tolerances |
| `golden/`    | Committed baseline PNGs (one per sim) |
| `out/`       | Latest renders (git-ignored) |
