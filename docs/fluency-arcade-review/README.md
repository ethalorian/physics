# Fluency games and arcade library review

Implemented locally on `codex/fluency-arcade-upgrade` in `/Users/craigantocci/Documents/Codex/2026-10-03/task/fluency-arcade`.

Preview: http://127.0.0.1:4180/arcade — local fixture accounts and in-memory saves only. Restart with `node scripts/preview-fluency-arcade.cjs`. It requires the checkout's existing dependencies. No production deployment, push, merge, migration, or student-data changes were performed.

## Scope and changes

The current app identifies these seven React Math Missions through its **Build fluency** mode. They cover 13 competencies. They are separate from the eight HTML math cabinets upgraded in the previous release.

| Game | Improvements |
| --- | --- |
| Numberline Navigator | Rover and readable place-value scale; equal-part strip connects fractions to magnitude. Typed fractions now display correctly instead of becoming zero. Negative place-value wording explicitly distinguishes magnitude from sign. |
| Ratio Reactor | Visible reference batch; both vessels share a scale. Testing a prediction shows the batch it would produce, so learners can compare it with the requested amount. Multiplicative and inverse relationships remain explicit. |
| Unit Courier | Full scientific-notation product is visible, including both advanced factors. Coefficient/power display and interactive unit bridges show cancellation; area conversion explains both dimensions. |
| Precision Observatory | Hall proportions use the actual dimensions and shade the chosen usable area; fractional assumptions use the same parser as the model. The ruler shows resolution. Reporting rules and worked results explain precision; equivalent scientific notation is accepted only when its value and precision match. |
| Balance Bay | Both-side operations, undo and an operation trail make rearrangement visible. Signed substitution and dimensions are explained. The grader now requires the supplied values in a valid substitution, rejecting a final answer with `+ 0`. |
| Motion Mapper | Endpoints and rise/run clarify slope. A scrubber connects velocity areas to position and distance. Transformed scatter plots show residuals; changing axes clears the previous fit. Large typed velocities stay within a rescaled graph. |
| Vector Rescue | Equal-scale axes, target thrust, student components, tip-to-tail wind and resultant arrows clarify the geometry. Reference-axis and rotation wording remain explicit. |

All missions now introduce a learning goal and three concrete moves. Practice defaults to a recorded guided start; students can opt out. Challenges remain independent and ranked unless help is used. Support fades on the next task. Correct checks reveal the worked solution without retroactively marking independent answers as assisted. Teacher review, assignments, delayed checks and existing mastery policy are preserved.

Save requests have a 15-second timeout and an explicit retry that retains the exact action, revision and answer. Controls pause while an uncertain save is resolved. Startup requests also time out safely and retain their request identity.

## Arcade front page

Cards use consistent 16:9 imagery, concise descriptions, compact rewards and three visible record rows. Shared XP policy appears at the floor level. Unit Lab and Conversion Workshop now have real local captures; all seven mission captures were refreshed with close views of their instruments. An illustrated fallback replaces missing/broken imagery. Top-level navigation and cabinet route behavior were not edited.

The 22-card browser fixture contains 22 unique working images. At 1440 pixels, cards measured 431–552 pixels tall (Math Mission cards: 541 pixels). Layouts passed at 1440, 1024, 768, 390 and 320 pixels, in light and dark themes.

## Verification

- **PASS:** 20 math/session tests, including 2,600 generated task keys across all 13 competencies, independent slope/area calculations, fractions, precision, signed substitution, assistance evidence and worked-solution visibility.
- **PASS:** Real API handlers with an in-memory database: ownership, idempotent start/save, failed-save retry, completion reward, challenge eligibility, delayed checks, teacher scope, assignments and feedback.
- **PASS:** All seven complete six-task browser playthroughs; all 13 competency forms on mobile, drafts, pause/reload/resume, hint recording, teacher assignment/feedback and reduced motion.
- **PASS:** Failed save, repeated click, byte-identical retry, response lost after an already-saved next step, and response lost after completion. No skipped tasks; one XP grant.
- **PASS:** Fraction model display, keyboard slider, axis-change fit reset, guided practice versus independent challenge, all seven Chromebook layouts at 1366×768 with 4× CPU throttling, and broken-image fallback. No browser exceptions.
- **PASS:** Arcade search/filter/reset, all images, shared caps, Midway pricing, spin failure/retry, workshop routes, return navigation and fullscreen regression.
- **PASS:** Previous eight HTML math cabinets' browser suite, seeded logic and save-route tests; 35 adjacent answer-check/bridge tests.
- **PASS:** Production build with Node 22.17.1 / Next 15.5.19, style/brand audits, and targeted ESLint. The full build retains unrelated pre-existing lint warnings. External-service configuration used local placeholders.
- **Not run:** Live authenticated student flows, real database integration and a physical Chromebook. These require live access or hardware; no live student records were modified. CPU throttling is a performance approximation.

The initial sandboxed build could not fetch Google Fonts; the network-enabled build passed. One npm test wrapper could not open its local IPC socket; its underlying tests passed using `node --import tsx --test`.

## Review paths and integration notes

Main changes: `src/components/math-missions/`, `src/lib/math-missions/`, `src/app/arcade/`, `src/components/arcade/`, and `public/arcade/previews/`. New regression suite: `scripts/test-fluency-upgrade-browser.cjs`. Logs are alongside this report. Full screenshots are in `docs/math-missions-verification/`; the labeled contact sheet is `fluency-arcade-contact-sheet.png`.

This branch starts with a local snapshot commit `41d422e2c9a629ca35ba296ae56a9212df6fd16d` of the authoritative worktree, above the previously deployed math commit `d6ca84d9b1667ef87c1e004d71efe78b0a6ed028`. Integrate only the subsequent fluency commit, not the snapshot wholesale.

The original checkout received concurrent worksheet and presentation changes while this task ran. At the preservation check, 418 baseline files had changed and its status listed 1,784 entries; none overlapped the fluency files. See `../math-missions-verification/source-preservation.json`. Those changes were left untouched. Reconcile with the current worktree before any future merge or deployment.

Library saving was attempted through the supported upload workflow but was unavailable. The report, labeled contact sheet and individual screenshots remain available at the local paths above.
