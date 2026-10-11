# Lesson workspace and interactive notebook release

Deployed and promoted September 27, 2026 to https://www.antocciphysics.com.

- Deployment: `dpl_7cG7LVBWytv77E4mu9hLUUhL2E5c` — READY, production.
- Immutable URL: https://physics-a6jbh4drj-ethalorians-projects.vercel.app.
- Previous production / rollback target: `dpl_CLVx3dZMHyFw4YQcQyk9gWctVpUX` at https://physics-pp7mvn097-ethalorians-projects.vercel.app.
- Release directory: `/private/tmp/lesson-notebook-release`.
- Source manifest, logs, and verification: `/private/tmp/lesson-notebook-release-work`.
- No Git commit, database migration, production lesson creation, assignment, or student-response change.

Includes the simpler lesson workspace, class context, student preview, read-only student-account inspection, teaching rehearsal, iPad mirroring and classroom-computer flows, explicit teacher-plan links, and the assignable original Units and Dimensions notebook template. Details are in `LESSON_WORKSPACE_2026-09-27.md` and `INTERACTIVE_NOTEBOOK_LESSONS_2026-09-27.md`.

The release was assembled from the current live deployment, then overlaid with this task's changes. All 2,246 uploaded source files were verified: 2,186 unchanged production files, 34 changes, and 26 additions. Unrelated working-tree changes were excluded. Original notebook and brand assets matched their expected hashes on the live domain.

## Verification

- All 63 release checks passed: 18 unit/source tests, 11 lesson-journey API checks, and 34 access/review checks.
- Vercel production build passed: compilation, style/brand audits, type checking, and all 326 static pages. Existing unrelated lint and development-client-secret warnings remain.
- Built with production settings without automatic domain promotion; verified READY/source hashes and HTTP checks before promotion.
- Staged and live HTTP checks: landing page 200; exact original notebook asset 200; student-preview and block-response endpoints reject unauthenticated access with 401; lesson creation redirects unauthenticated access with 307.
- Confirmed the production alias resolves to the new deployment.
- Live browser: original graph-paper/serif design loaded; answering a question updated the score and displayed correct feedback. The sign-in entry reached Google authentication.
- Deployment-scoped error/fatal runtime scan returned no entries during the release checks.

The verification browser had no signed-in teacher session. Authenticated teacher/student flows were tested with the actual application components and synthetic local API fixtures before deployment; production checks did not create real student work. Physical iPad, Apple Pencil, AirPlay/HDMI, and projector acceptance remain outstanding.

To begin: **Lessons → Create lesson → Use this notebook template**, choose targets, preview, publish, and open class access. Deploying the template does not assign a lesson automatically.
