# Physics Classroom codebase audit

November 7, 2026 · Local Git baseline `46ee834c`

The checkout contained 178 App Router pages and 287 route handlers. This change replaces one page with a framework redirect, removes seven unused component and stylesheet files, and repairs two sources of a broken teacher link. The compiled route manifest contains every other original page and handler.

## Changes

| Area | Change and evidence |
| --- | --- |
| Distance and displacement | Craig chose to retire the five-question browser-only exercise. Its old assignment URL now returns HTTP 307 to the current **Out & Back** investigation. The old exercise kept its answers in React state. A production-mode localhost request verified the redirect, repeated query parameters, and the destination. |
| Teacher reading sequences | The Assign work menu and the class-work API emitted the nonexistent `/admin/reading-syllabus`. Both use the existing reading-dashboard URL builder. A fictional class containing spaces, a slash and an ampersand arrived intact from the menu and from draft reading, practice, reading-quiz and vocabulary-quiz links. |
| Student home and foundation lessons | Removed `AvatarSpotlight`, its private `HomeSectionHeader`, `LearningPace`, and `DailyLessonSequence`. None had an active import from a page, test or build script. The home calendar still consumes pace data for warmups and school dates. The spotlight and sequence APIs also received production requests. |
| Stylesheets | Removed the unused Class Overview, Asteroid Story, and Simulation Studio CSS modules. In three shared stylesheets, 76 selectors belonged exclusively to removed components. A parsed comparison verified the other 537 selectors, their declarations, media conditions and ordering. |

## Production traffic

The route scan identified **22 pages and 48 handlers** without a matching URL literal or template in another scanned application source file. The scan reads TypeScript, TSX, JavaScript and JSX in `src`. Configured cron jobs, external integrations, stored links, generated URLs, scripts and bookmarks can all reach these routes.

Vercel returned production requests for **15 of the 69 flagged route labels queried** between October 8 at 00:00 UTC and November 7 at 00:00 UTC. Craig reserved the roster diagnostic for separate review. The numbers below are requests grouped by Vercel's route label. They include automated traffic and earlier releases.

| Route | Requests | HTTP 2xx |
| --- | ---: | ---: |
| `/api/cron/grading` | 15,736 | 15,735 |
| `/api/home/plan` | 1,797 | 1,769 |
| `/api/assignment-submissions` | 863 | 852 |
| `/api/student-activity/summary` | 862 | 720 |
| `/review/unit-1` | 414 | 262 |
| `/review/unit-1-honors` | 243 | 197 |
| `/api/teacher/cockpit` | 71 | 71 |

Keep the annual rollover handlers in `/api/admin/lifecycle`, Google's `/api/risc/webhook`, and the admin vocabulary redirects. Their callers are documented in the rollover runbook, webhook setup, or the redirect pages themselves. Archived worksheet, deck and binder editions have public or version-pinned URLs, so identical bytes alone do not establish that an edition can be removed.

## Retirement of the admin overview and stats APIs

The old dashboard stopped fetching `/api/admin/stats` on May 22 (`7b9a6a39`). The admin home stopped fetching `/api/admin/overview` on September 9 (`e08dceb7`). The current Oversight page fetches `/api/admin/oversight` and uses a different response shape.

From October 3 at 00:00 UTC through November 7 at 13:00 UTC, Vercel reported zero production requests and zero function invocations for either route. A separate incoming-path query included the trailing-slash forms and also returned zero. Production traffic was present on all 35 complete days in the query window for `/api/home`, and the grading cron received 780 requests in the final 13 hours.

The app repository has no GitHub Actions workflows. Its only configured Vercel cron calls the grading endpoint. The linked Supabase project has no Cron job table or deployed Edge Functions, and neither route appeared in database routine definitions or trigger arguments. Direct searches of six other GitHub repositories' default branches, local curriculum and planning scripts, Postman data, and local scheduling files found no client. The matching planning files were route inventories, build artifacts, or source copies. Private tools outside those sources and requests outside the measured window remain unknown.

In the local change, authorized GET requests return HTTP 410 with a JSON error and `Cache-Control: private, no-store`. Overview keeps its admin gate. Stats keeps its teacher and admin gate. The handlers no longer run the dashboard queries. To restore either response contract, recover its original handler from `46ee834c`. The retirement has not been deployed.

## Next cleanup candidates

| Candidate | Evidence and decision |
| --- | --- |
| `/api/arcade/hub` and `/api/arcade/focus` | The arcade browser fixture explicitly expects the landing page to skip these requests. Neither appeared in the traffic results. Check direct game clients before removing either handler. |
| `/admin/orphans` and `/admin/migrations/check` | Both are functional maintenance pages with no matching application link or returned traffic group. The first repairs roster enrollment and the second can seed missing simulations. Confirm whether staff still need direct access before changing either page. |
| `/api/roster/test` | Its authenticated GET handler calls roster synchronization functions and deletes records using fixed test identifiers. Craig requested separate review. The audit inspected its source only. |

## Verification and repeatability

- The follow-up exercised both retired handlers with the application's role wrapper and Next.js request and response objects. All 12 checks passed across signed-out, student, observer, teacher, admin and admin-viewing-as-teacher identities. The checks cover 401, 403 and 410 responses, JSON error bodies and cache headers for authorized clients.
- After the retirement, TypeScript passed with a 6 GiB Node heap limit. ESLint passed on both changed handlers. The unused-source and route audits again reported zero unreachable files and zero unresolved concrete navigation or fetch targets.
- `npm run audit:unused` traversed 2,419 source, script and stylesheet files and reported zero remaining unreachable candidates. It recognizes Next entry files, CSS modules, the folder-discovered simulation definitions, and authored deck and explainer sources. Tests and manual scripts are preserved as entry points.
- `npm run audit:routes` prints the current review list and unresolved concrete navigation or fetch targets. The baseline reproduced the broken teacher link. The updated scan reported zero unresolved concrete targets in its supported forms.
- The isolated production build passed all prebuild checks, compilation, lint and type validation. It used fictional credentials, cached Inter font files, one build CPU and disabled webpack disk caching. HTTP checks verified the simulation redirect, destination, reading-dashboard URL and an existing worksheet packet redirect. The build ran locally.
- Of 40 focused tests, 39 passed. The remaining test requires the literal word *revise* in a DOK 4 canvas prompt. Two additional test harnesses failed while bundling because their fixtures lack `teacherCanAccessStudent` and `asProgram`. All three failures reproduced on the original baseline. The failing browser harness did not reach its browser assertions.
