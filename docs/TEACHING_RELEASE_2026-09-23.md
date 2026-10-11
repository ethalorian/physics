# Teaching release · 23 September 2026

## Deploy result

- URL: https://www.antocciphysics.com/admin/command-center
- Target: production
- Status: READY; promoted and verified at 2026-09-23 03:20 UTC
- Deployment: dpl_9uyXPTcP2J2sNZwvL37GYrZy8DB9
- Immutable deployment: https://physics-1gqqo3b3d-ethalorians-projects.vercel.app
- Framework: Next.js 15.5.19
- Build duration: approximately 2 minutes
- Source: verified production baseline dpl_BHs9gqMNDFCXbeq1UqqaxSq5ExU7 plus the tested teaching changes. No Git commit was created.

## Delivered

The 22 Unit 1 Teaching Edition decks, 421 daily slides, focused iPad teaching workspace, six native explainers with 68 slides and six interactive models, contextual discussion launches, and textbook-question group launches are live. Use the accompanying PHYSICS_EXPLAINERS_GROUP_WORK_2026-09-23.md guide for classroom setup.

The release preserves existing production functionality and excludes unrelated dirty working-tree changes. All 2,088 uploaded source files were checked: 2,001 unchanged baseline files plus 87 intentional overlays/additions, including TypeScript's regenerated incremental-build cache. Source, schema, and lesson-publication verification required no production data writes. Teacher sessions and student submissions were not created for the smoke test.

## Post-deploy verification

- The production domain resolves to the exact tested deployment.
- All 25 top-level Unit 1 deck assets (22 daily decks, hub, shared CSS, and shared JavaScript) return HTTP 200 and match local SHA-256 hashes.
- Teach returns HTTP 200. Its browser entry correctly enforces the teacher/admin role; the verification browser was not signed into a teacher account.
- The textbook-activity endpoint returns HTTP 401 to an unauthenticated request.
- Deployment-specific error-log scan over the initial 15-minute window returned no error entries. This is an initial scan, not a claim about future classroom traffic.
- Production compilation, type checks, and style audit passed. Existing lint warnings outside the teaching changes remain.
- Full authenticated classroom flows were verified using real components with controlled HTTP fixtures; physical iPad Safari, actual classroom Wi-Fi, and projector placement remain device checks.

QA results, source manifest, screenshots, and all-slide layout report are in docs/explainer-teaching-verification/. Local teaching documentation was updated after staging and is newer than the documentation snapshot uploaded with the application; runtime files match the deployed source manifest.

Rollback reference: dpl_BHs9gqMNDFCXbeq1UqqaxSq5ExU7. No rollback was performed.
