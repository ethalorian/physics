# Original Claude explainer release

Production: https://www.antocciphysics.com/admin/command-center

Deployment: `dpl_CVDihV37dZNckTnyUTt4t2PugNX4`, READY, promoted and verified September 23, 2026. Immutable deployment: https://physics-4wo6revn6-ethalorians-projects.vercel.app.

The six original Claude exports replace the rewritten explainers in Command Center. Source HTML and support.js remain byte-for-byte identical to the user's design export. The optional direct library is at https://www.antocciphysics.com/explainers/claude/index.html; it does not control a classroom session. Use Command Center for iPad control, projection, explainer discussions, and textbook group work.

## Release verification

- Isolated release based on verified production `dpl_9uyXPTcP2J2sNZwvL37GYrZy8DB9`: 2,112 uploaded source files, 2,073 unchanged baseline files, 39 explicitly overlaid paths. Unrelated workspace edits excluded.
- Vercel production build passed compilation, lint, type validation, and 315-page generation. Existing lint warnings remain; the unmodified exported vendor archive is excluded from app-code linting.
- Nine source/state/lesson-mapping tests passed. API authorization/catalog/group tests passed.
- All six real originals loaded under the production CSP in the classroom browser fixture. Original course animation, walker, motion simulation, dimensional analysis, algebra animation, ramp release, and quiz feedback passed. Group discussion, textbook group work, restoration, refresh, and three iPad viewport layouts passed.
- Live domain returned all eight library assets (six HTML documents, runtime, index) with matching SHA-256 hashes. Command Center returned 200; unauthenticated textbook activity API retained 401.
- Explainer routes serve one scoped CSP allowing the original three version-pinned, SRI-checked runtime scripts. Same-origin framing remains enforced. The Command Center CSP does not allow the external runtime. A prior candidate was restored to the previous production version when the live-browser check identified the runtime being blocked; this deployment fixes that hosting issue.
- Fresh live browser rendered the original Vectors and Scalars heading, all navigation and interactive controls, and quiz feedback without page exceptions. The deployment error-log scan returned no logs.
- Browser tests use controlled API responses rather than live student data. Physical iPad Safari and classroom Wi-Fi remain device checks.

Implementation: [Claude original explainers](CLAUDE_EXPLAINERS_2026-09-23.md). Verification manifests, browser logs, served headers, and SHA checks are in `/private/tmp/claude-exact`; screenshots are in `/private/tmp/claude-exact-browser`.
