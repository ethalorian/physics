# Wrong-answer math remediation

Deployed on September 29, 2026 after the user authorized release. Development and browser testing used local synthetic data while students were taking quizzes.

## Student behavior

- An incorrect instant check recommends the fluency game for that exact math-spine competency. Correct, unparsed, and unassessed answers do not trigger a recommendation.
- The daily API reconstructs the recommendation from the saved submission, so it survives reloading and appears on the home warm-up card. A completed teacher review takes precedence over the automatic check; a Not yet observation recommends support.
- All 13 competencies map to the existing seven math missions. The recommendation opens Build fluency with the matching skill selected.
- A recommended practice session starts with recorded teaching support. The strategy desk includes the relevant concept, vocabulary, and an authored worked example when it matches the task's operation. This example is separate from the task being answered.
- The next task removes the initial support. Coaching remains available, appears after a wrong practice answer, and is built into the strategy-building stage. The final tasks invite independent application.
- Finishing the game links to a fresh practice problem on the same competency. The destination scrolls and focuses the fresh-check section after loading. Another wrong practice answer offers the matching game again.

## Preserved assessment rules

The daily picker, teacher-rated math spine, quiz routes, authentication, XP limits, and database schema are unchanged. Game completion and practice correctness do not write mastery ratings. First attempts, retries, and supported work remain distinguishable. Guided starts apply only to practice, not ranked challenges. A resumed mission retains its existing progress.

The optional practice `skill` parameter is checked against the catalog and active competencies. Problem issuance and checking remain scoped to the current student with server-held answer keys. Omitting the parameter preserves the existing spine picker.

## Verification

- TypeScript and scoped ESLint passed.
- Style audit passed.
- Remediation and mission tests: 17 passed, including the generated task-key checks, all skill-to-game links, teacher overrides, and supported-versus-independent evidence.
- Math practice API checks passed: selected skill, invalid/inactive skills, ownership, XP behavior, and answer-key protection.
- Actual mission API checks passed: guided starts, challenge separation, ownership, retry/idempotency, teacher scope, and server-controlled rewards.
- Warm-up walkthrough checks passed: read-only behavior, restored recommendations, and teacher override.
- Existing student-input browser checks passed: draft restoration, failed-submission retry, drawing retention, graph input, repeated practice, and mobile layout. Its Next navigation mock and stale XP-copy assertion were updated.
- New browser flow passed: no premature recommendation, correct/unknown suppression, wrong-answer recommendation, reload/home persistence, guided game, fading support, teaching after a miss, all six tasks, same-skill return and focus, mobile fit, and no browser exceptions.
- Local browser preview inspected with agent-browser. All browser fixtures use synthetic data and the mission tests use an in-memory transport for the actual route handlers.

Run the synthetic flow with `node scripts/test-math-remediation-browser.cjs`. Add `--serve` to open a local review server. Screenshots and compiled preview files are written to `/private/tmp/math-remediation-preview`.

The earlier production warm-up error was repaired separately by allowing the read-only `math_daily_xp_status` RPC in walkthroughs; see `MATH_WARMUP_WALKTHROUGH_FIX_2026-09-29.md`.

## Production release

Live deployment: `dpl_7wyPC7sGu3bpnoKA3syXMEzNa6JE`, serving `www.antocciphysics.com`. Built on the latest production snapshot, `dpl_8rJVR44A86PS7RCwTXbWLJHEXz3i`, rather than the older warm-up repair release.

The exact release passed the 17 remediation/mission tests, three API suites, browser flow, and TypeScript. Vercel's production build, style audit, and brand audit passed. The release was built with production settings without assigning the custom domains, checked against the source manifest, then promoted. Fifteen existing files changed and six files were added; all 2,599 other baseline files were preserved, including quiz and authentication source. No migration or student-data change was performed.

After promotion, the live deployment and game asset hashes matched the approved release. The warm-up and Balance Bay pages returned HTTP 200; unauthenticated math APIs returned HTTP 401 as expected. These live checks did not submit student work. The authenticated learning flow was verified with synthetic local fixtures. No error/fatal runtime logs were returned for this deployment during the post-release scan.

Release directory: `/private/tmp/math-remediation-release`. Manifests and verification records: `/private/tmp/math-game-integration-work`.
