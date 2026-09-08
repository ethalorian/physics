# Tether — rotational motion arcade

Tether is implemented as a nine-rescue campaign with unlimited retries, replay ghosts, keyboard/pointer controls, pause and automatic pause on focus loss, and an explicit finish-and-bank action. It uses the existing free physics-cabinet economy. No lesson/mastery ratings are written.

## Play and rollout

- Local practice: `npm run preview:tether` prints a localhost URL. This serves only Tether's four static assets; it reads no credentials or student data.
- Deployed practice path: `/games/rotation-tether.html`.
- Ranked cabinet path after registration and enablement: `/arcade/tether`.
- Migration: `supabase/migrations/20260908004027_tether_rotation_cabinet.sql` registers a free cabinet with unit “Rotational Motion” and a 25,000-point plausibility cap. It starts disabled and preserves existing enablement on rerun.
- Deploy the HTML and three scripts under `/games/tether/`, apply the registration migration through the project's deployment workflow, verify the file is available, then enable Tether in `/admin/arcade`.

**Deployment status:** code and migration are prepared locally; no production deployment or database mutation was performed. The prior audit's production credential was rejected, so production authentication, wallet changes, and registration remain unverified. Browser integration below uses simulated API responses and the real React cabinet host. The SQL check used temporary tables in local PostgreSQL and rolled back.

## Learning sequence

| Act | Missions | Mechanics and concepts |
|---|---|---|
| I — The tangent | First responder; The turning point; Rescue in motion | Hold to swing and release to fly. Tangential release, nonzero acceleration at turning points, inward acceleration, and moving targets. |
| II — Radius & inertia | Choose your radius; Heavy cargo; Long way home | Prelaunch rope selection and a heavier pod. Distinguish v and omega, recognize mass-independent gravity swings, and apply I = mr². |
| III — Torque crew | Give it a turn; Use the lever; Last light | Finite-duration thrusters, thrust-angle selection, and a moving final net. Net torque changes angular velocity; motor work changes mechanical energy. |

A short conceptual check follows each rescue, with feedback for either answer. It is a **post-rescue rotation check**, not evidence that the student predicted their trajectory beforehand. First responses count; unlimited retries of a failed physical rescue do not create duplicate solves. Each new campaign resets all totals.

Live measurements include angular position (radians), linear speed, angular speed, inward acceleration, net torque, angular acceleration, rotational inertia, and motor work. Cyan arrows show velocity and gold arrows show the inward acceleration component. Readouts hold the release state during free flight; the flight arrow continues to show current velocity.

## Physics model

`public/games/tether/physics.js` is a pure, independently testable SI engine. `levels.js` contains campaign data and physically derived target positions. `game.js` handles input, canvas rendering, overlays, scoring, and messaging; the entry HTML contains the responsive layout. Small separate scripts keep numerical tests from depending on UI code. There are no libraries, fonts, or images to fetch from external services.

The pod is a point mass on a massless, fixed-length flexible tether; the pivot is fixed and frictionless. Coordinates have y upward. Theta is measured from downward vertical, positive counterclockwise:

- x = anchorX + r sin(theta), y = anchorY − r cos(theta)
- vx = r omega cos(theta), vy = r omega sin(theta)
- I = mr², gravity torque = −mgr sin(theta)
- alpha = net torque / I; inward acceleration = v²/r

A fixed 1/120 s step with RK4 integrates angular motion. Free flight uses the exact constant-gravity increment. Landing detects the downward crossing of the net plane and interpolates the ballistic intersection, including the moving net's position at that time. The net absorbs landing energy; it is not a rigid platform requiring near-zero impact speed. A flexible tether releases if maintaining the constraint would require negative tension.

The thruster applies force at the pod. For the 30° option, the tangential component is half of the 90° option; the effective moment arm halves while pod radius and inertia remain fixed. Its radial component is included in the tension condition. Fuel is time at thrust, not a claimed energy budget. Signed motor work is integrated as torque times angular displacement. Braking can remove mechanical energy. Rope length changes only before launch, so no unaccounted winching energy is introduced.

Targets are authored from ballistic trajectories and checked for reachability under default setups. The motor missions were adjusted after numerical reachability checks. The game does not yet include rolling bodies, gyroscopic precession, or conservation of angular momentum under changing radius.

References: [OpenStax rotational variables](https://openstax.org/books/university-physics-volume-1/pages/10-1-rotational-variables), [OpenStax torque](https://openstax.org/books/university-physics-volume-1/pages/10-6-torque).

## Scoring and arcade integration

Each rescue gives 1,000 points, up to 400 for net-center precision, and up to 200 for efficient attempts. A correct rotation check adds 250. Nine perfect rescues score at most 16,650; the registered cap is 25,000. There is no speed bonus.

Existing payout formula: floor(min(25, solved × 2 × accuracy²)), zero below 50% answer accuracy; shared 75 XP/day limit still applies. A perfect nine-rescue run is 18 XP before that limit. A partial campaign may be finished at a briefing, during play, on pause, after a miss, or after answering a rescue check. Practice never submits a play or XP claim. Staff runs retain the existing free/unranked/no-XP behavior.

Tether uses protocol 2 through `src/lib/tether-bridge.ts`. The parent checks the exact iframe source and same origin; the controller checks the Tether slug, message source/version, request ID, and current play ID. It waits for an explicit coin reply, serializes checkpoints and final saves, keeps a failed final available for retry, and acknowledges only after score and payout responses. Final responses are cached for duplicate messages.

Two narrow route changes support retries: a finished Tether play returns its stored score after ownership validation, and a previously granted Tether payout returns its original XP receipt before reevaluating today's cap. Existing cabinets retain their old bridge and closed-run behavior. This does not overhaul the existing arcade's client-reported evidence model or shared daily-cap concurrency behavior.

Run state and retryable final packets are in memory. A pending final triggers the browser's leave-page confirmation. Reloading before saving can lose the unsaved attempt; account-based resumable campaigns are a future addition. Checkpoints preserve already acknowledged ranked scores.

## Verification

- `npm run test:tether`: numerical tests, bridge tests, and real API-handler tests with an isolated transport.
- `npm run test:tether-browser`: real React cabinet page, real game, simulated API transport, Chrome.
- TypeScript `tsc --noEmit`, focused ESLint, JavaScript syntax checks, and `git diff --check` passed.
- Local PostgreSQL registration check passed insertion, expected free/disabled/cap fields, rerun behavior, and preservation of enablement; temporary work rolled back.
- Numerical checks: energy conservation over 60 seconds, tangent/velocity preservation, mass cancellation, radius-squared inertia, motor work/energy agreement, ballistic intersection, and reachability of all nine default targets.
- Browser checks: all nine rescues and correct conceptual answers through real keyboard controls; missed landing and ghost retry; pause/release/resume; delayed ranked approval; failed payout and successful retry; new-run score/stat reset; practice isolation; responsive mobile layout and help. No browser JavaScript errors observed.
- Screenshots in `docs/tether-verification/`. These are development verification artifacts, not production screenshots.

No full accessibility audit, long-duration student playtest, or real Chromebook hardware test was performed. Reachability is verified, but difficulty and enjoyment still need classroom observation.

## Proposed next game: FLYWHEEL

Students operate a rotating rescue station. Cargo slides along radial rails: pull it inward to reduce I and increase omega; move it outward to slow the spin. With no external torque, angular momentum L = I omega remains constant. Students must distinguish that conservation from kinetic energy: moving cargo inward requires work, which must be shown in the energy budget.

Then add short external thruster bursts to change angular momentum and align a docking port. Progress from a single cargo pair to several masses, then compare a ring-like and disk-like mass distribution. Reward docking accuracy and fuel use, not rapid clicking.

This would complement Tether by teaching redistribution of mass and angular-momentum conservation in an extended system, rather than another fixed-radius pendulum. A first prototype would use one rotating platform, two movable cargo masses, a target orientation, and visible I, omega, L, torque, and energy indicators.
