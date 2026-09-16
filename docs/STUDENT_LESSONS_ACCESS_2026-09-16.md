# Student Lessons navigation fix — September 16, 2026

Students clicking the top navigation’s Lessons link received a failed catalog request even when their teacher had opened lessons for their class. Vercel runtime logs showed PostgreSQL error `42703`: `column lessons.difficulty does not exist`. The student-only SELECT named that missing column; the staff SELECT used `*`, which hid the issue during staff testing.

## Changes

- Removed the unsupported difficulty column, filter and badge from the student catalog query and lesson browser. Old URLs carrying a difficulty parameter no longer trigger a database error.
- Enabled the existing API lesson-type filter, including older lessons whose null type is displayed as Reading.
- Fetch the authorized catalog once and apply search, unit and type filters locally. This removes duplicate initial requests and prevents filters from discarding unit choices or allowing a slower request to overwrite newer results.
- Preserve enrollment, curriculum, track, publication and class-window checks. Open lessons are accessible; closed lesson history remains locked; future, unreleased and other-class lessons remain hidden. Student list responses contain metadata only.

## Verification

- The new schema-aware regression test fails against the previous production source with the exact missing-column error, then passes against the fix.
- The corrected SELECT succeeds against the live database (195 total lessons, 157 published at verification). Existing class release windows were confirmed; no lesson content, enrollment or release schedules were changed.
- `node scripts/test-student-lessons-browser.cjs`: real navbar, Lessons page, enrollment endpoint, published-list endpoint, lesson server page and reader; synthetic student data with real enrollment/program/track/window helpers. Covers CPA, Honors, Trades, Project Physics, other-class denial, locked history, filters, failed-load Retry, desktop and mobile navigation. No browser runtime errors.
- `node scripts/test-lesson-access-review.cjs`: 30 behavioral tests passed.
- `node scripts/test-lesson-audit.cjs`: 24 scenarios passed, including the earlier manual-save fix.
- TypeScript and focused ESLint checks passed.

Browser screenshots: `/var/folders/mr/ppn00px97h3bxbx0bmx9xwk40000gn/T/student-lessons-yKIzTr/`.

## Release

Built from the exact prior production release (`dpl_EHHDAn1mjGPGktnNY2RZm88J8Sfq`) in `/private/tmp/student-lessons-release`. Only the published-list route, LessonBrowser and new regression script differ. Unrelated workspace changes are excluded.

Production deployment: `dpl_E7LK7tpcyTmxL2Zwjt728B4Vx2vW` (`physics-50hf9o6xz-ethalorians-projects.vercel.app`). The build passed and the deployment was promoted to `www.antocciphysics.com`; Vercel confirms that domain resolves to the new READY deployment. Uploaded file hashes match the tested route, browser, regression script and prior manual-save route.

Post-promotion checks: sign-in returns HTTP 200; unauthenticated lesson-list requests return the expected HTTP 401. The complete authenticated student journey was verified in the isolated browser fixture, with the corrected SELECT separately checked against production data. A staged CLI HTTP check was blocked by the local certificate chain; the public-site checks above succeeded with the system CA bundle.
