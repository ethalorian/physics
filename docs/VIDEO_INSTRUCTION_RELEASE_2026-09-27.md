# Video instruction release — September 27, 2026

Deployed and promoted to https://www.antocciphysics.com on September 27, 2026, at approximately 22:14 UTC.

- Teacher entry: https://www.antocciphysics.com/admin/dashboard → Video instruction.
- Student entry: https://www.antocciphysics.com/lessons.
- Deployment: `dpl_H1QGhEqv35a7f9Y2bVpmsXSHj2Z7`.
- Immutable URL: https://physics-r93lfeyy8-ethalorians-projects.vercel.app.
- Previous production / rollback target: `dpl_7cG7LVBWytv77E4mu9hLUUhL2E5c` at https://physics-a6jbh4drj-ethalorians-projects.vercel.app.

## Result

Physics libraries default to Video instruction → Suggested sequence, with Browse by target available. Eight published channel videos have reviewed direct-instruction and preparation mappings. Teacher list, workspace, and teaching-picker titles omit historical Day N prefixes. Existing video lessons are distinguished from related practice; new videos can prefill canonical lesson drafts through the existing authoring workflow.

Drafts contain Watch & understand, Check your thinking, and Apply & explain, using the existing student reader, teaching display, preview, release, and evidence paths. The practice evidence label is corrected to Practice check. Draft questions and answer keys live in the authoring module, separate from the shared resource catalogue and student imports.

The first three videos already have published lessons. Five newer videos have catalogue mappings and draft templates; this deployment did not create their lesson records, publish them, or assign them to classes. Video 9, Setting a graph scale, remains in preparation because no published URL was verified. Student resource availability still follows open lesson access. Watching videos does not confer mastery.

## Release isolation

The release was assembled from the freshly verified production source rather than the repository's unrelated working changes. Uploaded source hashes verified all 2,255 files: 2,238 unchanged production files, eight changed existing files, and nine additions. No database migration or production lesson/student write was performed.

The initial staged candidate `physics-83o1smdxh-ethalorians-projects.vercel.app` was superseded before promotion when the draft answer keys were separated from the shared catalogue. Only the corrected candidate above was promoted.

## Verification

- Hosted production build, TypeScript checking, brand/style checks, and scoped ESLint passed. Existing unrelated lint warnings remain.
- 74 unit/API/access checks passed: 29 focused video/notebook/workspace tests, 11 lesson-journey checks, and 34 lesson-access/review checks. The focused 29 were rerun after prompt separation and passed.
- Existing physics-learning checks passed, including the 151-target map and canonical lesson seeds.
- A bundle dependency check confirmed the student VideoInstructionLibrary excludes video-lesson-authoring and physics-video-prompts.
- Eleven staged HTTP route checks and eleven live checks passed, including expected sign-in redirects and unauthorized API responses.
- Live new artwork, the original Units and Dimensions notebook, and the brand logo matched their expected source hashes.
- The Vercel production alias was confirmed on the corrected deployment. A deployment-scoped error/fatal runtime query returned no entries at 22:14 UTC.
- Before deployment, actual components with synthetic fixtures were checked for sequence browsing, target filtering, draft creation, feedback, lesson progression, and access handling; iPad portrait at 820 px had no horizontal overflow.

The production browser was signed out, so full authenticated teacher/student UI interactions were not repeated live. Correct YouTube embed URLs were checked locally, but third-party streaming playback remained blank in the in-app localhost browser and was not confirmed. The existing player was unchanged. No real student response or mastery record was created for testing.

## Local evidence and rollback

Release directory: `/private/tmp/video-instruction-release`.

Evidence directory: `/private/tmp/video-instruction-release-work`, containing release-manifest.json, staged-verification.json, staged-smoke.json, live-verification.json, live-smoke.json, student-bundle-check.json, deploy.log, and promote.log. These are temporary local artifacts; this record preserves the deployment identities and outcome.

If rollback is needed, promote the previous deployment above using the project's normal Vercel promotion workflow. No database rollback is needed for this interface release.

This release record and the deployed-status documentation updates were written after promotion; they are local records, not additional code changes in the immutable deployment.
