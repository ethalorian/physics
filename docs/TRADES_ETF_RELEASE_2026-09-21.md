# MVP Engineering: published ETF project course

Published September 21, 2026 (America/New_York), at the teacher's explicit request to change the app course.

- Production: https://www.antocciphysics.com/trades-etf/index.html
- First student lesson: https://www.antocciphysics.com/lessons/mvp-etf-1-01
- First teacher plan: https://www.antocciphysics.com/admin/teacher/plans?unit=trades-etf-1&day=1&class=33c5a178-998f-4158-aea9-f8589ade37b0
- First printable student lesson: https://www.antocciphysics.com/trades-etf/mvp-etf-1-01.html
- Supplied drawings: https://www.antocciphysics.com/trades-etf/drawings.html
- Vocabulary assignment: https://www.antocciphysics.com/admin/vocabulary/assign?class=33c5a178-998f-4158-aea9-f8589ade37b0

## Course implemented

Four connected ETF projects replace the 36 separate jobs: useful organizers; a building of the future; a boat or fluid machine; electrical control systems. There are 30 core project meetings, four practice/revision meetings, and two exhibition meetings. Each is planned for 110 minutes; this is a sequence, not a verified annual calendar.

Trades math, measuring/layout/inspection, and supplied-plan interpretation are explicit, separately checked priorities in every project. Students build early, test, physically revise, and retest. The app collects one concise individual response per meeting; the notebook and physical work hold the remaining evidence.

Published resources: 36 student lessons, 36 matched teacher plans with answer keys, 11 original supplied drawings, 36 printable HTML lesson sheets, 20 targets (five per project), and four performance tasks. The first lesson, “Build a Stand That Works,” is open for MVP Engineering; the other lessons follow the existing teacher-release workflow.

There are 36 published vocabulary sets, eight words each, with definitions and examples. In Assign vocabulary, select the matching **ETF Pn · NN** set and the project's `etf26.pN.vocabulary` Knowledge target. Preview three or four words at the bench; assign the full set or a smaller selection for review. No student vocabulary assignments or grades were created.

The boat route is conditional on a complete teacher-piloted setup. The actual syringe-machine route is explicitly identified as a shortened ETF Project 3, not equivalent heat-engine evidence. Electrical lessons require working matched low-voltage kits. Preparation notes are in the teacher plans; no materials were purchased or physical trials claimed on the teacher's behalf.

## Preservation and publishing

New lesson IDs and `trades-etf-1` through `trades-etf-4` units preserve historical evidence. The prior 36 lessons are unpublished, their units labeled Archive, and their targets excluded from current growth. Old vocabulary sets are unpublished; there were zero assignments against them. No old lesson content, student answers, mastery records, grades, or enrollments were overwritten or deleted. Historical teacher plans remain in source and accessible through the shared plan lookup.

The old public course-map URL forwards to the new map. The lesson reader enlarges ETF drawings and provides a full-size link; other case-board images retain their existing layout.

Database staging asserted exact JSON content/metadata matches before activation. All 36 teacher-plan fingerprints match the staged lesson revisions. Activation was a separate guarded transaction after application build verification.

## Verification

- Curriculum checks: four projects, 36 lessons, 216 practical stages, 110 minutes per meeting, one valid capture per lesson, 20 targets, matched teacher plans, vocabulary, assets, and representative trade calculations.
- Actual React lesson-reader fixture: one answer saves/reloads, submission locks, all 216 stages render, drawings decode, teacher plans render, widths 320–1366 px have no horizontal page overflow. Synthetic APIs only; no production student submissions.
- Visual review: stand and building plans, fluid-machine and circuit drawings, desktop/mobile reader, and the full-size drawing link. Corrected the two-branch schematic so each switch controls only its own lamp.
- Production build: style audit, compilation, lint/type checks and all 313 static pages passed. Existing repository warnings remain.
- Live checks: all 49 public HTML/SVG artifacts return 200 and match local SHA-256 hashes; old map points to ETF; signed-out student lesson redirects with 307; teacher-plan API returns 401 without authentication.
- Database readback: 36 published lessons, 36 teacher-plan links, 20 active targets, 36 published vocabulary sets/288 entries, only `mvp-etf-1-01` open for the class. All 36 old lesson content hashes unchanged. Enrollment count remains 15, lesson-progress count remains 327, vocabulary-assignment count remains zero.
- Initial ten-minute Vercel runtime scan found no errors. This is a bounded release check, not ongoing monitoring.

## Deploy result

- Deployment: `dpl_He38JV5m9Brqf2k7MUWLbEnGEQDp`
- Target: production; status: READY and promoted to www.antocciphysics.com.
- Framework: Next.js 15.5.19, inherited from verified production source.
- Build duration: approximately 148 seconds.
- Commit: no new commit; isolated authored source snapshot.
- Isolated source: `/private/tmp/trades-etf-release`.
- Baseline: `dpl_BeVTCq8R7Kin8fEKrSq75HXXNJPQ`; 1,943 uploaded source files verified by SHA-1 before assembling the release. Five existing files changed, with new course resources added. Unrelated working-tree changes were not deployed.

## Authoring and restore references

Authored lessons: `scripts/trades-etf/course.py`; generator: `build.py`; vocabulary: `vocabulary.py`; guarded initial installer: `build_sql.py`. Teacher data is generated in `src/data/trades-etf-plans.json` and `trades-etf-units.json`. After publication, do not rerun the initial staging SQL: it deliberately rejects existing IDs. Future edits require fresh content/version checks.

Local release evidence: `/private/tmp/trades-etf-release-manifest.json`, `/private/tmp/etf-live-verification.json`, `/private/tmp/etf-staged-catalog.json`, `/private/tmp/etf-plan-links.sql`.

Restore metadata: `/private/tmp/etf-before-publish.json` and `/private/tmp/etf-restore-prior-course.sql`. Restore is prepared but was not executed. It restores prior visibility/releases without deleting either curriculum; application rollback would also require promoting the recorded baseline deployment.
