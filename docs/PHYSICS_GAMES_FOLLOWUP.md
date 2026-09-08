# Physics game follow-up

Investigated Push, Cascade, Impact, Orbit, Resonance, Furnace, Flux, Garage and Redline locally. The raw runtime audit is in `docs/physics-verification/runtime-audit.json`. This was a development audit, not a production usage report.

## Implemented

| Cabinet | Change and purpose |
| --- | --- |
| Push | Brief → try → mission check → continue/bank. Checks use the current crate, force, surface or ramp; questions alternate between related concepts. Retry feedback includes the actual stopping point. |
| Cascade | Same flow with energy, friction and generator checks. The starting-energy receipt now uses the spring energy actually supplied. A work/energy correction caps dissipative transfers, enforces the reachable height, and derives speed from remaining kinetic energy so fixed-step drift cannot create energy. |
| Orbit | An unknown asteroid forecast (`Infinity`) no longer satisfies the rescue objective or fills the success indicator. |
| Resonance | Starts off the target frequency so the introductory standing-wave mission requires tuning instead of winning automatically. |
| Furnace | Sorting starts with equal mean particle energies in both chambers, including odd particle counts in endless play. Closed-gate collisions retain the original side even if a step crosses the wall. A lucky random initial temperature difference can no longer win an idle mission. |
| Impact, Orbit, Resonance, Furnace, Flux, Garage | Fresh credits reset learning counters; advancing within an existing ranked credit preserves its evidence. |
| Redline | All three acts passed introductory simulation checks. No changes in this pass. |

Push and Cascade share `public/games/physics-cabinet.js`: acknowledged ranked starts and final saves, a retained payload for retries, pause/resume and finish/bank. Each act is a distinct run; endless play can extend it. Questions count as completed mission evidence only when answered. Incorrect answers reveal feedback and permit continuation. A student can finish from a briefing, failure, answered check, act completion, or pause without deliberately losing remaining lives. Direct-file play remains practice.

## Verification and limits

- All 27 act introductions across nine cabinets ran without observed JavaScript errors. Automated runtime checks advance roughly 10 simulation seconds or until the attempt resolves; they are not complete campaign playthroughs.
- Push and Cascade browser tests use the real React cabinet and game with mocked API transport: actual first-mission docking via the physics integrator, Act II/III docking boundary fixtures, correct/incorrect checks, duplicate-answer protection, delayed approval, failed payout/retry, empty bank, new-run counters, act unlock and banking, mobile layout, keyboard/pointer pause, and focus-loss pause.
- Cascade energy tests exercise every campaign level with alternating brake/boost inputs. Across 17,240 sampled steps, relative bookkeeping error was below 1e-7 and stores stayed finite and nonnegative. Conservation does not prove every trajectory or level difficulty is accurate; the motion model is still a numerical approximation.
- Orbit tests reject the unknown forecast and verify that the initial natural trajectory predicts impact. Resonance tests verify idle play does not clear the first standing-wave mission and correct tuning does. Furnace tests check 20 randomized starts, including odd-count endless levels, for equal temperatures and no idle win with a closed gate. A selective gate-control pilot completed all three seeded first-mission runs.
- Actual route-handler fixtures check score/payout retry ownership and immutable receipts. Bridge tests cover source isolation and serialized requests. TypeScript and targeted ESLint pass.

Commands: `node scripts/audit-physics-browser.cjs`, `node scripts/test-physics-flow-browser.cjs push`, `node scripts/test-physics-flow-browser.cjs cascade`, `node scripts/test-tether-routes.cjs`, and `npx tsx --test src/lib/tether-bridge.test.ts`.

## Remaining work

Impact, Orbit, Resonance, Furnace, Flux, Garage and Redline still use the older save/start flow. Their connection timeout and lack of an acknowledged bank action need a separate conversion and full cabinet integration tests. Flux and Garage warrant longer solution-path tests; introductory simulation success alone does not prove a full campaign is completable. Progress remains browser-local. Existing server-side payout concurrency and client-reported evidence limitations are unchanged.

Local only; no production data or deployment changed. No migration is needed. Deploy the shared script, Push/Cascade HTML, cabinet host and score/payout routes together. The shared script must accompany these two HTML files for offline use.
