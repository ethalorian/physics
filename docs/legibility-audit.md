# Simulation Legibility Audit — overlapping vectors & labels

**Standard:** no arrow, number, or label may overlap another piece of information,
at *any* slider value or moment in a run. Triggered by overlap in the sumo sim;
this is a code-level sweep of all 20 engines' `render()` paths for the patterns
that cause it: labels dropped at vector *midpoints*, fixed offsets that don't scale
with object size, and labels anchored to objects that converge.

Computer use is disabled, so the first pass was reasoned from the rendering code and
verified with geometry checks at worst-case slider values. A later pass added a
**headless render harness** (node-canvas + esbuild — see "Visual verification" at the
end) that renders each engine to a PNG, so the fixes are now confirmed by pixels and
new issues surfaced that code-reasoning had missed.

## Found via visual rendering (harness)

These were caught only once the sims were actually rendered:

- **riverboat-crossing — physics bug (not a label issue).** At the default 90°
  heading the across/downstream velocity components were swapped (`cos` drove the
  across component, so `cos 90° = 0`), so the boat travelled *straight downstream and
  never crossed the river*. Fixed so 90° heads straight across (across = `sin`, the
  boat's own downstream component = `−cos`); 60° now aims upstream against the
  current, 120° downstream. Verified by re-rendering: the boat now tracks the correct
  diagonal and the boat/current/resultant vectors read correctly. (My earlier
  code-only audit verified the vector *addition* but never checked that the default
  heading actually crosses — exactly the gap a visual pass closes.)
- **sumo-forces — bodies interpenetrated at high mass.** At 250 kg vs 80 kg the
  wrestler circles overlapped so far the "kg" labels were buried. Each wrestler is now
  offset by its own body radius, so they *touch* at the contact point instead of
  merging, and both mass labels stay legible. Verified at the 250/80 extreme.
- **atwood-machine — "Target" chip collided with the weight chip.** As the descending
  mass reached the target line, its "W=…N" chip (left of the mass) overlapped the
  "Target: …m" chip (also left). The Target chip now anchors to the right end of the
  target line. Verified with the mass rendered right at the 2 m line.
- **freefall-cliff — falling-rock time labels stacked.** A time chip was stamped on
  every position trace, but `h = ½gt²` grows slowly at first, so the early traces
  bunched near the top and their labels piled into a clipped smear. Labels are now
  drawn only when they clear the previous one vertically (≥18 px); every dot still
  shows. Verified.
- **uniformly-accelerated-motion — oil-spot time labels smeared.** Same family: at low
  speed the first spots sit on top of each other, collapsing "0s" and "1s" into one
  blob. Labels are now gated on ≥22 px horizontal spacing. Verified.

### Full visual sweep (18 of 20 rendered)

Rendered and eyeballed every engine the harness can drive. Confirmed clean (no
overlap): projectile-motion, car-race, vacuum-chamber, race-track, astronaut-thrust,
measurement-precision, distance-displacement, constant-velocity, plus all the fixes
above. Two **minor** items were then also fixed and re-verified: monkey-hunter's
"x (meters)" axis title (moved to its own line below the tick numbers, right-aligned,
so it clears the "20" tick); and area-under-curve's "h = …" chip (clamped clear of
the rotated "Velocity (m/s)" axis title when a point sits near the left edge). Not
rendered: riverboat-crossing-3d (WebGL) and maze-vectors (keyboard) — they need a
browser-based harness.

## Fixed

### sumo-forces
The two push-force arrows pointed toward each other on one line, and both numbers
sat at the arrow midpoints → arrows and numbers collided dead-center. Now: each
force on its own stacked lane above the wrestlers, each number anchored over its
own wrestler, net force on its own lane below, all spaced off the largest wrestler.
Verified: 0 overlaps across 6 extreme force/mass combinations.

### monkey-hunter
"Dart (x, y)" and "Monkey (x, y)" chips were both offset to the same side of two
objects that *converge and collide* — so they stacked at impact. Now: shown only
while the dart is in flight (the Hit chip / fell-short banner take over after), with
the dart label biased up-left and the monkey label down-right. Verified clear even
when the two objects occupy the same point.

### carts-third-law (also a physics fix)
Two problems. (1) The interaction-force signs pushed the carts *toward* each other,
so they passed through one another — contradicting the code's own "compressed spring
pushes them apart" description and the wall-bounce logic. Signs corrected: Cart A
(left) is driven left, Cart B (right) driven right. (2) The velocity vectors and the
"Cart A/B" names shared a line, so they collided whenever the carts were near each
other. Now each cart's velocity arrow + chip and its name sit on separate vertical
lanes, so they stay clear even if the carts coincide. Verified at coincidence.

### atwood-machine
`vectorScale = 8 px/N` made a 5 kg weight (~49 N) draw a ~390 px arrow — arrow and
label shot off the canvas. And the W/T chips were offset *inward* (toward the
pulley), so at `position ≈ 0` (the start of every run, and the equal-mass
equilibrium) all four force chips piled up at the center. Now: every vector is
scaled off the largest force so the longest arrow is a fixed 56 px, and each mass's
W/T chips are placed *outward* (mass1 left, mass2 right) with a floored vertical gap.
Verified: across the full 0.5–5 kg × 0.5–5 kg grid, no chip overlaps another chip or
a block, and no arrow exceeds the canvas.

### riverboat-crossing
Three velocity vectors (boat, current, resultant) all radiate from the boat, and
their three numeric labels sat at the arrow midpoints — so at low current/speed,
with short arrows, all three numbers collapsed onto the boat. Now: the arrows stay
on the boat (color-coded), and the numbers move to a fixed, opaque legend in the
top-left corner (clear of the mid-height docks and the boat's path). Overlap is
impossible by construction.

## Reviewed — clear as written

- **projectile-motion** — the vx/vy/resultant arrows share an origin (standard
  decomposition) but carry no text labels, so nothing collides. The only chips
  ("no drag", score) are at fixed edges.
- **vacuum-chamber** — feather and ball are always in separate horizontal columns,
  so their height labels and "LANDED" tags never meet.
- **car-race** — the two cars are on separate horizontal lanes; their distance
  chips and the graph legend are on fixed, separated rows.
- **race-track, constant-velocity, uniformly-accelerated-motion, freefall-cliff,
  distance-displacement, maze-vectors, riverboat-crossing-3d, measurement-precision,
  area-under-curve** — single moving object or fixed/edge-anchored labels; no
  converging-label or midpoint-label patterns.

## Previously flagged — now FIXED

### free-body-diagram — all numbers moved to a fixed legend
Force labels used to sit at each arrow's midpoint, so two forces at similar angles
stacked their labels (and Applied/Gravity even share a colour). Every magnitude now
lives in a fixed, opaque legend (top-right): each force as a colour swatch +
`Name  magnitude N @ angle°`, then Net Force and acceleration. The angle in each row
disambiguates same-coloured arrows; the arrows themselves stay colour-coded. No
on-canvas number can overlap another. The `showLabels` toggle still hides it.

### slope-calculator — paired labels biased outward + small-triangle gating
The P1/P2 coordinate chips and the v₀/v chips are biased by screen position (left
point's label extends left, right point's extends right), so they stay clear even
when the two draggable points sit on the same spot — verified at coincidence. The
Δx/Δy chips now draw only when their triangle leg has room (>48 px run, >30 px rise);
the dashed legs still show for tiny triangles, just without colliding numbers.

### carts-third-law — elastic cart–cart collision added
The carts no longer pass through each other. A 1-D elastic collision (conserves both
momentum and kinetic energy) fires when they touch and are closing, then pushes them
to exactly touching so the bodies and their inside "kg" tags never overlap. Verified
in simulation: across five mass/force combinations the surface gap never goes
negative, and momentum and KE are conserved to ~1e-15 at every collision.

### atwood-machine — geometry FIXED
Separately from the labels: each mass started `maxRopeLength/2 = 1.5 m` below the
pulley, but the `targetDistance` slider goes to 2.5 m — so the rising mass was asked
to travel farther than it physically could, and was drawn climbing *past* the pulley
while the fixed `80 px/m` ran the falling mass off the bottom. The position clamp
also limited at the *full* rope length (3 m) rather than the half-rope (when the
rising mass reaches the pulley). Fixed three ways: (1) each mass now rests
`START_DEPTH = 4.0 m` below the pulley — deeper than the largest target — so every
target is reachable with clearance; (2) pixels-per-meter is derived per-frame from
the canvas height so the full descent always fits between the pulley and the bottom
readouts; (3) the clamp now stops the rising mass at the pulley (the real limit),
not the full rope. This is purely visual + the clamp — `position` stays in metres,
so the physics is unchanged. Verified across target 0.5–2.5 m, mass 0.5–5 kg, and
canvas heights 420–640 px: nothing leaves the canvas, the falling mass always clears
the bottom labels, and at the real canvas height (≥500 px) the rising mass clears the
pulley by ~16 px.

## Verification

All eight edited engines pass `tsc --noEmit` (the only repo `tsc` errors are
pre-existing missing-module errors in an unrelated teacher PDF route). Geometry
checks confirm zero overlaps at worst-case slider values for sumo (6 combos),
atwood (full 100-point mass grid), carts (at coincidence), monkey-hunter (at
convergence), and slope-calculator (paired labels at coincidence). The carts'
elastic collision was simulated across five mass/force combinations: the carts'
surface gap never goes negative (no overlap) and momentum + kinetic energy are
conserved to ~1e-15.

## Visual verification (render harness)

Because computer use is off, I built a headless harness to actually see the sims:
`esbuild` bundles each `def.ts` (engine + the pure `draw.ts`; types erased, no React)
into a CommonJS module, which a small Node driver runs against `@napi-rs/canvas` —
the same Canvas 2D API the browser uses — instantiating the engine, stepping it N
frames, and writing a PNG. This rendered 18 of 20 engines and confirmed the fixes by
pixels; it also surfaced the three issues in "Found via visual rendering" above.

Limitations to keep in mind: node-canvas has no emoji or subscript glyphs, so the
bare "M" (for M₁/M₂) and the missing monkey/astronaut/feather emoji in the PNGs are
*harness* artifacts, not real bugs — a real browser renders them. Two engines need a
different harness: `riverboat-crossing-3d` (WebGL, which node-canvas can't do) and
`maze-vectors` (keyboard-driven).

This harness now lives in the repo at `scripts/sim-render/` — `npm run sim:render`
(eyeball), `sim:render:update` (rebaseline), `sim:check` (pixel-diff vs committed
goldens, exits non-zero on change) — so a future edit that breaks a sim's layout or
motion gets caught. See that folder's README for usage and platform caveats (goldens
are OS-specific; emoji/subscript glyphs don't render headlessly). Run `npm install`
first to pull the four dev deps (esbuild, @napi-rs/canvas, pixelmatch, pngjs).
