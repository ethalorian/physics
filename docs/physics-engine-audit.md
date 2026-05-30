# Physics Engine Audit — May 30, 2026

Audit of all 20 simulation engines in `src/app/simulations/*/engine.ts`. The goal
you set was "as good as possible," and you asked me to surface the
physics-vs-pedagogy tradeoffs per engine rather than decide them for you. So this
report separates two things deliberately:

- **Fixes applied** — unambiguous correctness/robustness wins with no pedagogical
  cost. These are in the code.
- **Decisions (now resolved)** — places where making the physics "more correct"
  would change what a student sees and learns. These were flagged for you rather
  than decided unilaterally; you've since made the calls, and the outcomes are
  recorded below. Each was really a teaching decision wearing a physics costume.

*Update (this revision): the two unambiguous fixes plus the resolved decisions are
all enacted and verified — four code changes total across `monkey-hunter`,
`projectile-motion`, and `astronaut-thrust`. See the summary table at the end.*

---

## The headline: these engines are already good

Before the findings, the thing worth internalizing about your own codebase, because
it changes what "audit" even means here:

1. **Integration is handled centrally and correctly.** `SimLab.tsx` drives every
   engine through a fixed-substep accumulator at `dt = 1/120 s`, clamped against
   tab-switch gaps (`MAX_SUBSTEPS = 10`). No engine owns a `requestAnimationFrame`
   loop. This means the classic simulation failure modes — frame-rate-dependent
   speed, blow-ups on slow frames, tunneling through walls — are designed out at
   the platform level. An individual engine can only reintroduce them by ignoring
   the `dt` it's handed, and none do (the one hardcoded `dt` I found was in a
   render-only preview path, now aligned — see below).

2. **Closed-form where closed-form exists.** `freefall-cliff` and
   `uniformly-accelerated-motion` evaluate the exact kinematic equations
   (`x = v₀t + ½at²`, `v = v₀ + at`) rather than integrating — zero numerical
   error. `car-race`, `race-track`, `riverboat-crossing`, and `constant-velocity`
   are constant-velocity, where Euler is already exact.

3. **The force-driven engines use semi-implicit (symplectic) Euler** — velocity
   updated *before* position — which is the stable, energy-respecting choice, and
   at `dt = 1/120` the residual error is negligible.

4. **`vacuum-chamber` is the most physically rigorous of the set.** Real quadratic
   drag `F = ½ρv²C_dA` with `v·|v|` sign handling, realistic masses/areas/drag
   coefficients for a feather vs. a bowling ball, terminal velocity emerging
   naturally. I checked it for stiffness (a real risk: tiny feather mass, large
   drag) — the relaxation time near terminal velocity is ~0.13 s, comfortably
   larger than the 1/120 s step, so it's stable. Leave it alone.

So this was not a salvage job. The findings below are a short list, not a long one.

---

## Fixes applied

### 1. `monkey-hunter` — false misses on the canonical demo (FIXED)

**The problem.** Collision was detected by sampling the dart–monkey distance once
per frame: `if (√((dartX−monkeyX)² + (dartY−monkeyY)²) < 0.3) → hit`. For a fast
dart the per-step displacement can exceed the 0.3 m capture window, so the dart
visually passes *through* the monkey and the sim reports **no hit** — in the one
demo whose entire pedagogical promise is "aimed straight at the monkey, it
*always* hits."

**Verification (before the fix).** Replaying the exact integration at
`dt = 1/120`, direct-aim shots register as expected up to ~40 m/s, then the
point-sample **fails at 80 and 120 m/s** (reports a miss while the true minimum
separation is 0.0000 m — a dead-center hit).

**The fix.** Continuous (swept) collision detection. Because both dart and monkey
move in straight segments over a substep, their *relative* position is linear in
`s ∈ [0,1]`, so the true minimum separation over the interval is an exact
point-to-segment distance. The hit instant is interpolated (`hitTime = t − dt +
s·dt`). I confirmed the new test is a strict superset of the old one: it catches
every hit the old test caught, plus the high-speed hits it missed, and introduces
**no** new false hits.

**Why this was safe to just do:** it changes detection only, never the motion. The
beautiful property that makes this demo work — dart and monkey share the same
integrator and `dt`, so they accumulate *identical* vertical error and stay exactly
aligned — is untouched.

### 2. `projectile-motion` — predicted arc didn't match the real flight (FIXED)

**The problem.** The dashed "predicted landing" arc was integrated at `dt = 0.02 s`
while the live flight runs at the shell's `1/120 s`. With drag off this is
invisible; with **drag on**, two Euler integrations at different step sizes diverge,
so the predicted landing marker sat slightly off from where the ball actually
landed. For a tool where a student might explicitly compare prediction to outcome,
that's a small but real credibility leak.

**The fix.** The preview now integrates at `1/120 s` too. Prediction and flight are
now the same computation, so they land in the same place. (Cost: a few hundred
extra loop iterations per render frame — negligible.)

---

## Decisions (physics vs. pedagogy) — RESOLVED

Each of these was a fork where "more physically faithful" and "better for the
lesson" point in different directions. Craig made the calls; this section records
what was decided and what's now in the code.

### A. `astronaut-thrust` — the bounce that contradicted Newton's First Law → ELASTIC (enacted)

When the astronaut hit a canvas edge, the wall reflected it at **80% speed**
(`velocity = ±|velocity| * 0.8`), purely to keep it on screen. The problem: with
zero thrust this sim is supposed to *be* Newton's First Law — no force, constant
velocity, forever. A student watching it coast into a wall and come away **slower**,
with no force shown, was being quietly taught that things slow down on their own —
the exact misconception the sim exists to kill.

**Decision: make the bounce elastic (0.8 → 1.0).** Speed is now conserved across
every bounce, so a thrust-free astronaut keeps its speed indefinitely and the First
Law reads cleanly. A wall is an external force, so the direction change is
legitimate; it was the unexplained *speed loss* that was pedagogically toxic.
Implemented in `engine.ts`.

### B. `monkey-hunter` — two separate questions, both resolved

**B1 — "aim-high misses" at very high speed: NO CHANGE NEEDED.** My first report
warned that "compensate / aim above" mode stops missing at ~80 m/s (the flight gets
so short gravity can't separate dart and monkey). On verification across the *actual*
slider ranges, this can't happen: the dart-speed slider maxes at 30 m/s, and a full
grid sweep (8,379 configs) shows the closest the dart ever comes to the monkey in
aim-high mode is **0.40 m — outside the 0.30 m hit radius. Zero false hits.** The
breakdown is real physics but lives outside what a student can dial in. The original
report overstated this; no action taken.

**B2 — direct mode misses ~11% of reachable settings: EXPLAIN THE MISS IN-SIM (enacted).**
The grid sweep surfaced something more serious. Aiming *dead-on* at the monkey misses
in **965 of 8,379** reachable settings (slow + far + low). The cause is honest
physics: the "always hits" result only holds while *both* objects are still airborne,
and a slow dart hits the floor before reaching the monkey. But to a student it looks
like aiming perfectly still failed — the principle appearing to falsify itself. The
mid-air-hit condition is `speed ≥ L·√(g/2H)`; the worst reachable geometry (18 m
away, 5 m high) needs ~18.5 m/s, while the slider allows down to 10.

**Decision (revised): keep the full 10–30 m/s range and make the miss self-explanatory.**
An earlier revision raised the slider minimum to 19 m/s to make the demo foolproof, but
that hid a true and valuable piece of physics — that "always hits" has a *precondition*.
Craig chose instead to keep the low speeds and surface the reason on screen. The engine
now detects a short fall (dart lands without a hit, short of the monkey's column → new
`fellShort` flag) and draws a banner: *"Dart fell short — 'aim straight = always hits'
only holds while BOTH are still falling. Speed up the dart (or move the monkey closer)
so it arrives mid-air,"* plus an × marking the landing spot. The trigger is precise:
verified to fire on slow/far/low direct shots, to stay silent on hits, and — crucially —
to stay silent in "aim-high" mode, where a miss is an *overshoot* (dart passes the
monkey's column), not a short fall, so the message would be wrong. Implemented in
`engine.ts` (logic + render) and `def.ts` (range restored).

### C. `projectile-motion` — linear drag vs. real (quadratic) drag → KEEP LINEAR (no change)

Air resistance here is `a = −k·v` (linear). Real drag on a cannonball-scale
projectile is `∝ v²`, and `vacuum-chamber` already carries the rigorous `½ρv²C_dA`
treatment. **Decision: keep it linear.** It's the standard pedagogical on-ramp, the
headline of this sim is the no-drag parabola and velocity-component decomposition
rather than the drag law, and the per-sim "right level of abstraction" was judged
more valuable than forcing one drag model across the whole suite. No change.

---

## Engines reviewed, no action needed

`atwood-machine` (`a = g(m₁−m₂)/(m₁+m₂)`, `T = m₁(g−a)` — both correct),
`carts-third-law` (equal/opposite impulses, momentum conserved to machine precision
until walls), `sumo-forces` (`a = ΣF/Σm`), `riverboat-crossing` & `-3d` (exact
vector addition), `race-track` (exact circular motion, distance vs. displacement),
`car-race` (closed-form overtake check against the live event), `constant-velocity`,
`distance-displacement` (correct path-length vs. net-displacement), `slope-calculator`
(guards `Δx = 0`, no divide-by-zero), `area-under-curve` (correct left-Riemann sum;
midpoint would be more accurate but left-endpoint is a valid teaching choice),
`free-body-diagram` (correct component sum and net-force magnitude),
`measurement-precision` (uncertainty/sig-fig logic sound), `vacuum-chamber` (gold
standard, see above), `maze-vectors` (vector navigation; no tunneling at this speed).

---

## Summary

| Engine | Finding | Status |
|---|---|---|
| monkey-hunter | False misses at high dart speed (point-sample collision) | **Fixed** — swept collision |
| projectile-motion | Predicted arc ≠ real flight under drag (mismatched dt) | **Fixed** — matched dt |
| astronaut-thrust | 80% bounce contradicted Newton's 1st Law | **Fixed** — elastic bounce (Decision A) |
| monkey-hunter | Direct aim misses ~11% of reachable settings (dart hits floor first) | **Fixed** — full range kept + on-canvas "fell short" explanation (Decision B2) |
| monkey-hunter | "Aim-high misses" breaks at ~80 m/s | **No change** — unreachable (slider caps at 30); 0 false hits in range (B1) |
| projectile-motion | Linear vs. quadratic drag | **No change** — keep linear by design (Decision C) |
| 15 others | Correct as written | No action |

All changes are in and verified: the swept collision test is a grid-confirmed strict
improvement over the old point-sample; the "fell short" detector was grid-confirmed to
fire on slow/far/low direct shots and to stay silent on hits and on aim-high overshoots;
and `tsc --noEmit` is clean on every simulation file. (The only `tsc` errors in the repo
are pre-existing missing-module errors — `puppeteer-core`, `@sparticuz/chromium` — in an
unrelated teacher PDF route, untouched by this work.)
