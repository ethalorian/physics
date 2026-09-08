# Math arcade audit and improvements

Reviewed September 7, 2026. Changes are local and have not been deployed.

## Cabinet assessment

| Game | Findings and changes |
| --- | --- |
| Inverse Blitz | Added explicit untimed practice, acknowledged ranked entry, Finish & Bank, and retryable saving. Fixed rapid wrong-answer submissions, missed-question accounting, and pause/resume during a solved-card transition. Sampled algebra transformations were checked by substitution. |
| Magnitude | Added the same run flow. Exact-equivalence questions no longer treat rounded thirds such as 33.3% as exactly 1/3. |
| Scale Storm | Added the same run flow. Power-law prompts now identify the actual changing variable and preserve the dependent quantity's full name. |
| Powers of Ten | Added the same run flow and shared timing, accuracy, and transition fixes. Generated questions passed structural checks. |
| Slope Sniper | Added the same run flow. Graphs now have numbered scales; negative-slope endpoints remain within the domain. Linearization statements specify a line through the origin. Vector questions explicitly use approximation and rounding, with diagrams identified as not to scale. |
| Fusion | Fixed labels and best-tile summaries above the predefined tier list so displayed values continue doubling. Also upgraded ranked entry, practice, voluntary Finish & Bank, and acknowledged saving. The final audit still runs before banking when no audit has been answered. |
| Expression Crush | Upgraded ranked entry, practice, voluntary Finish & Bank, and acknowledged saving. Clearing a board now clears its selected tile, preventing stale selections after restarting. Order-of-operations logic checks passed. |
| Mathle | Upgraded ranked entry, practice, voluntary Finish & Bank, and acknowledged saving. An attempted but unfinished puzzle counts as missed when finishing voluntarily; an untouched bonus puzzle does not. Daily share grids now contain only daily guesses, and clipboard failures are handled. Sampled daily puzzles were valid and deterministic; duplicate feedback and invalid-expression checks passed. |

## Shared flow

- In the five falling-block games, untimed practice is an explicit choice, requires no ranked play, awards no XP, and keeps personal records separate. Questions do not fall with time or drop on a wrong answer, and there is no speed bonus.
- A denied-start status message stays clear of the practice controls and does not intercept clicks.
- Ranked entry waits for approval instead of silently switching to practice after 900 ms. A denied request returns to the start screen.
- Finish & Bank ends a run deliberately from the pause menu. Completion shows a neutral RUN COMPLETE summary.
- Final saves remain pending until acknowledged. Failed saves expose a retry using the same request and play IDs; restart controls stay disabled while banking is unresolved.
- Missed questions count toward accuracy. Pausing excludes paused time from the current answer's speed calculation. Solving and immediately pausing no longer leaves the game without a next question.

Fusion, Expression Crush, and Mathle are already untimed. Their new explicit practice option awards no XP and keeps local practice records separate. Finish & Bank asks the player to complete an in-progress move, animation, or audit before trying again. End-state guards prevent duplicate finalization.

The new client is `public/games/math-cabinet.js`. The existing shared host bridge and score/payout retry allowlists now include all eight math slugs. Deploy the shared script, game HTML, host bridge, and API routes together. Local standalone copies also need the shared script. No database migration was added for these improvements.

## Verification

- `node scripts/test-math-arcade-logic.cjs`: passed. Includes 6,000 sampled generated questions, 640 inverse-algebra substitution checks, Fusion ladder and extended-tier checks, 200 dated Mathle puzzles, and Expression Crush evaluation checks. Sampling does not prove every possible generated question.
- `node scripts/test-math-arcade-browser.cjs`: passed for all five upgraded games, covering delayed ranked approval, solve/pause/resume, wrong-answer guarding, missed questions, banking failure/retry, fresh untimed runs, separate practice records, and mobile controls. Denied entry was also checked. Fusion, Expression Crush, and Mathle have extended progression and end-state checks described below.
- `npx tsx --test src/lib/tether-bridge.test.ts`: all 14 tests passed.
- `node scripts/test-tether-routes.cjs`: passed score/payout retry and ownership checks, including all eight math slugs and unchanged legacy rejection behavior.
- Targeted ESLint, shared-client syntax checking, and `git diff --check`: passed.
- Full `npx tsc --noEmit` remains blocked by unrelated concurrent errors in `scripts/test-trades-course.ts`: unknown `b.question` on lines 24–25 and an implicit-any parameter on line 24. That work was left untouched.

Browser API transport was mocked. These tests did not spend student coins, grant production XP, or verify a live deployment. Screenshots are in `docs/math-arcade-verification/`.

## Follow-up verification scope

The extended browser harness uses controlled boards to reach Fusion's no-move final audit and Expression Crush's nine round transitions across all three phases, followed by exhaustion of all three hearts. Mathle solves the actual daily target and then exhausts six valid guesses on a bonus puzzle. Inputs go through game handlers; tests do not assign scores. These fixtures test progression and end-state behavior, not natural-player difficulty or every randomly generated campaign.

Each remaining cabinet is checked for a failed payout followed by an identical final retry, voluntary finishing, a fresh restart, denied ranked entry, explicit practice without a play request, and mobile entry in all three modes. API transport is mocked throughout.

## Recommended next work

1. Deploy the math HTML, shared client, host bridge, and API retry support together, then verify live ranked receipts in the deployed environment.
2. Continue classroom playtesting for difficulty and question variety. Controlled progression fixtures do not establish that every random board is balanced.
3. For the physics arcade, the remaining older save/bank flows are Impact, Orbit, Resonance, Furnace, Flux, Garage, and Redline. Full campaign testing also remains useful beyond the targeted fixes already made.
