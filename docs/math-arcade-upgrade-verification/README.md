# Math arcade upgrade — local verification

This report records verification before the approved local merge. See
[the Desktop main merge report](merge-verification.md) for the final destination,
preserved pending work and checks repeated in the authoritative checkout.

Reviewed, implemented and integrated on 4 October 2026 (UTC).
Branch: `codex/math-arcade-current-integration`.

Working copy: `/Users/craigantocci/Documents/Codex/2026-10-03/task/math-arcade-integrated`.
The upgrade is integrated into the actual current Desktop source, including its
newer local application features. It is ready for local review; no manual patch
integration into an older checkout is required.

## Scope and outcome

Eight standalone **math** cabinets were updated. The seven React math missions and
three measurement/unit workshops were reviewed and regression-tested. Physics
cabinets were distinguished from this scope; their game files were not edited.
Top-level navigation is unchanged. No push, pull request, deployment, migration,
or live student-data operation was performed.

The games now share a lightweight, responsive studio design with strand accents,
visible mathematical models, persistent strategy feedback, an end-of-run recap,
keyboard focus management, sound preferences, reduced motion, and zoom support.
The five falling games pause on a mistake for an explicit retry; missed problems
show a worked answer before continuing. Untimed practice never requests XP.

| Cabinet | Mathematical and learning changes |
| --- | --- |
| Inverse Blitz | Balance-beam model applies the same operation to both sides. Displays the next equation goal so the prescribed path is explicit. Clarifies grouped denominators in physics formula rearrangements and the inverse-operation strategy. |
| Magnitude | Common-scale bars connect fractions, percentages, decimals and exponents to magnitude. Numerically equivalent distractors are removed. Rounded repeating values use approximation signs. |
| Scale Storm | Input/output bars explain direct, inverse and power relationships. Worked factors persist, with honest rounding notation and distinct answer choices. |
| Powers of Ten | Connects scientific notation to expanded value. Explicitly asks for normalized notation; equivalent but unnormalized choices receive an explanation. Fermi questions state the estimate and multiplicative nearest-power rule. |
| Slope Sniper | Adds rise/run triangles, point descriptions, worked slope and area formulas. Computes vector components from trigonometry and rounds at the end. Uses equal-scale vector geometry and specifies the nonnegative domain for square-root linearization. |
| Fusion | Shows the mathematical sum behind merges. Equivalence-audit feedback stays until Continue. Adds directional buttons and accessible board descriptions. |
| Expression Crush | Arrow/Enter/Space keyboard selection and swapping, persistent evaluation traces, and a single board tab stop. Automatic cascades still earn arcade score but no longer inflate the deliberate-answer count used for XP. |
| Daily Mathle | Adds symbols and accessible labels alongside clue colors, explains duplicate-character clues, retains validation feedback without consuming invalid guesses, and avoids Enter double submission. Pins the daily date to the run and prevents harder bonus selection from multiplying the shared daily puzzle's XP. |

## Save and XP reliability

- A tab-local recovery envelope retains the last captured stats, play ID and
  request ID. Reload can bank an interrupted run with its original credit.
- Retry preserves the same final payload, waits for score and payout
  acknowledgement, and clears retained progress only after success.
- Server recovery validates ownership and cabinet. A finished acknowledged run
  is immutable; a raced checkpoint returns a retryable conflict instead of
  overwriting a final score. Legacy clients retain their prior update contract.
- Payout retries return the original receipt, including zero-point receipts.
  A capped run cannot gain XP by being retried on a later UTC day. Receipt or
  daily-total query failures are reported as failures, not treated as zero.
- The existing database cap trigger and dedupe constraint remain responsible
  for cross-request atomicity. No database changes were made.

## Verification

Passing checks:

- Baseline generator suite: 6,000 problems, all algebra/formula states, Fusion
  representation/doubling checks, 200 deterministic daily dates, and expression
  evaluation/precedence.
- New seeded generator suite: 12,000 problems with distinct mathematical choices
  and explanations, 1,000 independently computed vector answers, all formula
  rearrangement paths, 500 daily equations, and parser edge cases.
- Eighteen bridge tests, including lost response/payout retry, original-credit
  recovery, rejected cross-cabinet/unowned recovery, and preservation of deployed
  Pulse/Mic Check paid-run behavior without learning-XP requests.
- Twelve real score/payout handler fixture tests: accuracy-squared XP, empty and
  low-accuracy runs, stable zero receipts across days, concurrent duplicate
  receipts, query errors, ownership, clamping, immutable finals and late
  checkpoint conflicts, database-clamped shared practice caps, and preserved
  rhythm-cabinet retries. Existing acknowledged-cabinet route regressions pass.
- Browser gameplay for all eight cabinets: delayed and denied starts, practice,
  wrong-answer guards, persistent missed-answer feedback, pause/resume, voluntary
  finish, failed final save/retry, restart, and mobile controls.
- All eight at 1366×768, 1280×720, 1024×600 and 390×844: no horizontal overflow,
  usable targets, no header overlap, graph containment, reload recovery without
  another credit, identical retry stats, keyboard save recovery and board swaps,
  reduced motion, and no uncaught page exceptions. API transport is mocked.
- Mission generators: 11 tests and 2,600 task keys; API fixtures; all seven
  mission flows, 13 mobile competencies, hints/drafts and teacher previews.
- Unit Lab: 12 checks; Conversion Workshop: 17 checks; Tape Workshop: all seven
  instrument families.
- Current application's arcade hub: categories, search/reset, workshop links,
  leaders, shared caps, Midway purchases/retry, cabinet entry and return
  navigation, light/dark mode and five responsive sizes. No browser errors.
- Current Pulse browser: chart selection and credit binding, leaderboard request
  races and retry, saves during rerenders, five distinct audible tracks, six-key
  mobile controls and outer keyboard handling. Pulse chart API, Pulse/Mic Check
  score ownership, caps, immutable retries and expiration fixtures pass.
- Current learning-XP receipt API: ownership, confirmation, authorization,
  empty receipts and failed lookup fixtures pass. Current mission API and
  generator suites pass. Generated mission screenshots/previews were restored
  to the snapshot after verification so unrelated assets are preserved.
- TypeScript, targeted lint, style and brand audits, and whitespace validation.

The final production build **passed**: compilation, full-project lint/type
checking, page collection, prerendering and optimization completed with exit 0.
It used Node 22.17.1, a 4 GB Node heap and nonfunctional OAuth/Supabase placeholders; the
Supabase address was `http://127.0.0.1:9`, preventing production access. Existing
lint warnings remain outside this change. Earlier attempts exposed an unavailable
Google Font download, the default 2 GB heap limit, and missing required build
configuration; none required changing application code or disabling checks.
This verifies packaging, not authenticated production behavior.

### Reproduce

```sh
npm run test:math-arcade
npm run test:math-arcade-browser
npm run preview:math-arcade
```

The browser harness currently uses this Mac's installed Playwright/Chrome path,
matching the repository's existing local harnesses. This checkout uses an ignored
`node_modules` symlink to the existing local dependency installation (Next 15.5.19).
Use the lockfile and a normal dependency install when validating in CI.

## Visual evidence and preview

[Eight-game labelled contact sheet](math-arcade-integrated-contact-sheet.jpg).
The `*-worked.png` files capture the persistent mathematical explanations;
`*-chromebook.png` captures use 1366×768. `*-mobile*.png` and `*-complete.png`
cover small screens and end states.

Library publication was attempted through the current supported workflow but
was unavailable in this delegated environment. No upload succeeded; the complete
screenshot set is local. The contact sheet was regenerated from the integrated
current-source browser run and visually inspected.

The practice-only preview is served locally at `http://127.0.0.1:4179/` and has no
student API or credentials. Slope Sniper was also opened and played through the
visible Codex browser, including a correct slope answer and its worked feedback.

## Remaining limits

- Read-only live Supabase metadata and function bodies were inspected. The live
  `unit_math_xp` trigger takes a transaction advisory lock, applies the shared cap
  across arcade and math-practice grants, permits zero-point receipts and assigns
  the current unit. `math_daily_xp_status`, `save_math_mission`,
  `award_math_practice_xp`, and `purchase_mathle_daily` retain compatible contracts.
  The unique receipt key and nonnegative points constraint were confirmed. No
  policy drift was found: the live daily caps remain 10 CPA / 15 Honors. No
  migrations or student-data writes were performed. Real concurrent database
  transactions and authenticated student flows remain untested.
- Recovery is limited to the current tab's session storage and the server's play
  expiration policy. Closing the tab, clearing storage, or storage denial can
  prevent reload recovery; in-memory retry remains available during the session.
- Cabinet answer statistics are still client-reported. These changes improve
  correctness and reliability, but do not make arcade XP a server-verified
  assessment or a tamper-proof anti-cheat system.
- Chromebook layouts and reduced-motion behavior were tested in desktop Chrome.
  No physical Chromebook battery/frame-rate benchmark or assistive-technology
  user study was performed. The shared CSS, studio logic and save helper total
  about 24 KB uncompressed; no raster art or framework is added to the cabinets.
- No claim of measured learning gains is made; the changes provide clearer
  representations, feedback and opportunities to reason and retry.

## Current deployment compatibility and integration

The production deployment inspected read-only was
`dpl_Df3zEmqGoE5V6FhVzihtquF887UB`, created on 4 October 2026 at 03:34 UTC and
reported READY. It was deployed through the CLI and records no Git commit.

The matching current local source was located at
`/Users/craigantocci/Desktop/Physics/physics-classroom`. All sixteen inspected
arcade-related source files match that deployment byte-for-byte. The Desktop
checkout contains 695 Git status entries beyond its `43cb719` HEAD, so simply
cloning GitHub would omit substantial existing user work.

The new branch contains a local snapshot commit
`8ad0b2b17c3bfc4ade56e3afbacf894da847758a`: 3,308 tracked and nonignored
untracked files, including existing deletions. The fourteen runtime upgrade
files were applied to this snapshot, together with regression tests and evidence.
Existing package scripts were preserved. Pulse and Mic Check mock database
fixtures were updated to model the score handler's returned-row query; their
gameplay code was not changed. Navigation, coin handling, newer mission flows,
receipt APIs and rhythm features remain in the integrated application.

[Integration provenance](integration-provenance.json) confirms all 3,308 original
source files and the original 695-entry Git status are unchanged. Navigation and
coin-handling files are identical to the snapshot. The complete production build
and all checks reported above ran on this integrated current source.

[Deployment comparison and hashes](live-source-comparison.json) records the earlier
read-only comparison against the historical checkout. Its `matchesCheckoutBase`
and `matchesWorkingTree` fields refer to that earlier comparison, not the new
snapshot. The [fourteen-file runtime patch](math-arcade-production.patch) is retained
as supplementary evidence; its changes are already integrated here.

The captured build, core, browser, acknowledged-save and `current-*` regression
logs in this directory document the completed checks. There are no unresolved
test failures. The original snapshot is separate from the upgrade commit for
review. No push, PR, merge, deployment, migration or student-data write occurred.
Database migration dates only describe existing state.
