# Cut & Fit

Added as a second Workshop activity at `/arcade/cut-and-fit`. Standalone game assets live under `public/games/cut-and-fit`. The arcade card has a real gameplay preview, supports searches for the three trades/materials, and is included in the category and free-activity counts.

## Student flow

Choose All trades (12 jobs) or Carpentry, Plumbing, or Electrical (4 jobs each). Read the dimensioned drawing, enter a finished length in inches, place the mark, optionally fine-adjust it by sixteenths, then cut and test. Long parts can be trimmed from the original reference end. Short parts must be replaced. Two-piece jobs reuse the remaining stock, including the specified cutting loss on the waste side.

The first set introduces quarter-inch work, then eighths, sixteenths, and repeat cuts. New sets shift the supplied reference spans by quarter inches while keeping the same skills and a feasible stock length. Five numerical variants cycle. Jobs supply all clearances and fitting dimensions; pipe and conduit fitting dimensions are explicitly specific to the training job, not universal trade specifications.

Each completed work order earns 10 practice points independently or 5 after a hint or unsuccessful fit. The workshop report shows job-level independence, skill, worked calculation, cut/fit attempts, stock lengths used, and the remainder on the current stock. Students can revisit only jobs completed with help or rework.

State lasts for the current visit. Changing benches or starting a new set resets it. There are no game API calls, XP awards, leaderboard writes, or mastery ratings.

## Answer key for the first set

| Job | Trade | Finished length | Pieces |
| --- | --- | --- | --- |
| The utility shelf | Carpentry | 20 in | 1 |
| Join the couplings | Plumbing | 13 1/2 in | 1 |
| Connect the boxes | Electrical | 17 1/2 in | 1 |
| A rail between sides | Carpentry | 22 7/8 in | 1 |
| Read the centerlines | Plumbing | 16 3/8 in | 1 |
| From box centers | Electrical | 21 3/8 in | 1 |
| A little breathing room | Carpentry | 18 1/4 in | 1 |
| Seat both ends | Plumbing | 15 11/16 in | 1 |
| Different connectors | Electrical | 19 11/16 in | 1 |
| Two rails, one board | Carpentry | 20 7/8 in | 2 |
| A matching pair | Plumbing | 18 1/4 in | 2 |
| Twin conduit runs | Electrical | 21 1/4 in | 2 |

## Verification

- `node scripts/test-cut-and-fit.cjs`: independently calculated answer keys; all five variants fit their stock; input parsing; no silent rounding; cutting loss; trim conservation; fit direction; repeated cuts.
- `node scripts/test-cut-and-fit-browser.cjs`: 12 jobs and 15 parts completed through real UI actions, long/short correction paths, fresh stock, hints, keyboard marks, stale-mark invalidation, duplicate-cut protection, reports, targeted retries, variants, and responsive layouts. No page errors or API calls.
- `node scripts/test-arcade-hub-browser.cjs`: real hub and route components with fixture API data; Workshop count, trade/material search, card navigation, actual game iframe, successful cut, and return to the arcade. Existing arcade regression checks also pass.
- `npm run type-check`, focused ESLint on the two arcade pages, and `npm run audit:styles` pass.

Local browser evidence is in `/private/tmp/cut-and-fit-verification` and `/private/tmp/arcade-ui-verification`. These checks use local assets and fixture transport rather than live student data. Production deployment and live verification are recorded below.

For a local standalone preview, run `node scripts/preview-cut-and-fit.cjs` and open `http://127.0.0.1:3186/games/cut-and-fit/index.html`.

To refresh the arcade image, run `PREVIEW_ONLY=cut-and-fit node scripts/capture-arcade-previews.cjs`.

## Blueprint drawing revision

The job schematics now use fabrication drawing sheets with dark blue vector linework on light paper. Each sheet has a named sectional assembly view, arrowed dimensions and extension lines tied to the measured features, an unknown finished length L, A/B detail callouts, enlarged end conditions, material section hatching, centerlines where appropriate, a line legend, and a title block with units, quantity, revision, and NTS scale.

Trade-specific geometry distinguishes cabinet panels, coupling mouths and seats, 90-degree elbows, and electrical boxes with connectors. Left and right details explicitly identify the surfaces or centerlines used for each allowance. Full drawings open in a keyboard-accessible dialog; on small screens the assembly can be panned while end details stack at a readable size. The written dimensions control; these educational schematics are not scale drawings or installation documents.

Cut results now appear in a separate fit comparison. The job drawing stays unchanged after an incorrect cut. Browser coverage checks all twelve sheets, label bounds, unique SVG definition IDs in expanded/inline views, dialog closing and focus restoration, mobile panning, and the existing complete game flow.

Drawing conventions were checked against [Linn-Benton Community College / Open Oregon, Basic Blueprint Reading: Dimensioning](https://openoregon.pressbooks.pub/blueprint/chapter/unit-5-dimensioning/). All graphics are generated locally from the job data; no external image or font service is required.

## Production release

Published September 22, 2026 at the user's explicit request.

- Live page: https://www.antocciphysics.com/arcade/cut-and-fit
- Placement: Arcade → Workshop → Cut & Fit.
- Deployment: `dpl_BHs9gqMNDFCXbeq1UqqaxSq5ExU7`; READY and promoted.
- Deployment URL: https://physics-fnw8988fq-ethalorians-projects.vercel.app
- Previous production baseline: `dpl_He38JV5m9Brqf2k7MUWLbEnGEQDp`.
- Isolated release source: `/private/tmp/cut-and-fit-release`. All 2,014 baseline files were verified against production SHA-1 hashes before overlaying four existing files and eleven new files. All 2,025 uploaded source files were verified afterward; other source and the published ETF course were preserved.
- Vercel production build: Next.js 15.5.19, style audit, compilation, type checking, and 314 static pages passed. Existing lint warnings remain. Deployment used the cached Vercel CLI 59.15.1 after the installed 44.4.1 CLI was rejected as outdated.
- Live checks: all six public game/preview assets returned 200 and matched release hashes; Arcade and the game route returned 200. The live page's iframe, enlarged drawing dialog, successful cut, and return link passed in Chrome.
- Full live game browser verification: all 12 jobs / 15 parts, corrections, stock accounting, hints, variants, report, keyboard controls, blueprint label bounds, dialog focus, and 320–1440 px layouts passed with no browser errors or game API calls.
- Initial runtime error query found no matching error logs for this deployment. This was a bounded release check.
- Release records: `/private/tmp/cut-and-fit-release-manifest.json`, `/private/tmp/cut-and-fit-staged-verification.json`, `/private/tmp/cut-and-fit-live-verification.json`. Live browser evidence: `/private/tmp/cut-and-fit-live-browser`.

No database changes or student-record writes were needed for this release. No new Git commit was created. This publication record was added locally after deployment; the isolated uploaded source snapshot remains unchanged for integrity checks.
