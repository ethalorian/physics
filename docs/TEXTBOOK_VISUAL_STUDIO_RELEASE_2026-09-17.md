# Visual reading studio — production release

- Live route: https://www.antocciphysics.com/admin/readings
- Deployment: `dpl_9oMWygf3HXDsaMjy9jWuggzKFz69`
- Deployment URL: https://physics-c0bbfzovz-ethalorians-projects.vercel.app
- Previous production: `dpl_EBPNJpoi1k21RgVhGG6CnbMY6PVr`
- Isolated release source: `/private/tmp/reading-visual-release`
- Uploaded file manifest: `/private/tmp/reading-visual/uploaded.json`
- Source verification: `/private/tmp/reading-visual/verify-release.cjs`

Built from the exact previous production source, with 13 explicit overlays: three existing files changed and ten files added. All 1,861 untouched production files retained their original uploaded hashes, including student home, avatars, mastery mappings, and APIs. The original generated TypeScript cache was retrieved from the prior deployment and verified by hash before upload. Total uploaded files: 1,874.

Production build completed successfully, including lint, type validation, style audit, page generation, and function packaging. Existing unrelated lint warnings remain. The standalone cold TypeScript check exceeded Node's default 2 GB heap; rerunning with a 6 GB heap passed. No code workaround or relaxed checks were introduced.

The exact isolated release passed the full browser fixture flow using real React components, synthetic classroom data, and actual student-edition PDFs. This includes page navigation/rendering, keyboard-accessible selection controls, 320–1366 pixel layouts, dark mobile mode, PDF failure/retry, draft/publish, three distinct mapped targets, student submission, revision/resubmission, and teacher ratings. All ten focused unit tests and the existing API authorization tests passed. See `TEXTBOOK_VISUAL_STUDIO_2026-09-17.md` for details.

The ready deployment was promoted and the www domain resolved to the new deployment ID. Post-promotion browser smoke test reached the expected sign-in page with no uncaught browser errors. Anonymous access to `/api/readings`, `/api/readings/catalog`, and `/api/textbook/4` remained blocked. Deployment-scoped error/fatal runtime log query returned no matching entries during the smoke-check window.

Live authenticated teacher/student sessions were not available in this run; authenticated classroom behavior was exercised through the synthetic fixture and existing API tests. No real student work or assignments were created, modified, or published by verification. Temporary preview server and browser sessions were closed.
