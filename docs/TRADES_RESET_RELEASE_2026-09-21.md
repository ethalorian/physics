# MVP Engineering reset: production verification

- Production deployment: `dpl_BeVTCq8R7Kin8fEKrSq75HXXNJPQ`, READY and promoted.
- Live course map: https://www.antocciphysics.com/trades-reset/index.html
- Live Day 1: https://www.antocciphysics.com/lessons/mvp-job-01
- Isolated source: `/private/tmp/trades-reset-release`.
- Baseline production: `dpl_9oMWygf3HXDsaMjy9jWuggzKFz69`.
- 1,943 uploaded source files verified by SHA-1. Seven existing files changed; all other baseline files were preserved. New curriculum data, print directions, diagrams, and tests were added.

The production build passed style audit, lint (existing warnings), TypeScript validation, static generation, and deployment. The local full TypeScript check passed with an increased Node heap. The actual React reader passed save/reload, three selected responses, submit locking, all 216 stage renders, image decoding, and widths 320–1366 px. Teacher plans render and link to print materials. Existing student navigation, class/program/track gating, enrollment checks, and reader authorization passed their browser fixture suite.

The connected Supabase tool staged all data in a transaction. A readback compared each stored document and key metadata with its authored source: 36/36 exact matches. A later activation transaction published 36 jobs, retired 30 old lessons, archived old units, marked old targets excluded from growth, and opened only mvp-job-01 for MVP Engineering (15 enrollments). The course contains 24 new learning targets and six phase performance tasks. All 36 teacher plans have content/plan fingerprint links. No student answers, grades, or enrollments were written.

Live course map and both Day 1 PDFs returned HTTP 200 and matched local SHA-256 hashes. The signed-out lesson correctly redirects to sign-in, and the teacher-plan API returns 401 without authentication. The initial ten-minute runtime-error query found no errors.

Authenticated student writes were tested with synthetic APIs, not real production students. Production verification covered deployment/source integrity, database content and release rules, public artifacts, and unauthenticated access controls.

Restore references: /private/tmp/trades-reset-before-publish.json captures original flags, units, targets, and the class release window; /private/tmp/trades-reset-activation.sql records activation; /private/tmp/trades-reset-release-manifest.json and /private/tmp/trades-reset-release-verification.json record deployment scope.

Authoring remains in scripts/trades-reset/course.py with generated outputs. The optional REST publisher expects a valid server credential; this release used the connected database tool because the local development key was stale. No credentials were changed or committed.
