# Vocabulary class overview

Published at `/admin/control-room?view=vocabulary` on September 16, 2026.

The Vocabulary tab now opens a class overview. **By assignment** shows each student's latest teacher rating, practice progress, and waiting evidence. **By word** shows scored check accuracy and progress toward the selected assignment's practice goal. Selecting an assigned cell opens the matching student and assignment for review. Saving a rating immediately updates the overview.

Student count cards and filters identify work awaiting review, students needing practice, fully rated students, students with no completed checks, and students without assignments. The full active class roster is included, even when a student has no vocabulary assignment. Class, unit, teacher, and student-search scopes continue to apply. Word view counts use the selected assignment.

Practice accuracy is not a Knowledge grade. Missing evidence is not zero accuracy, unscored writing waits for review, and new evidence retains the previous teacher rating while reopening review. Existing teacher-only append-only mastery grading is unchanged. No schema migration was required.

## Verification

- Ten model tests passed across vocabulary mastery and overview helpers.
- Vocabulary API permission and roster tests passed, including active unassigned students and exclusion of removed/foreign students.
- The existing real-route and disposable PostgreSQL flow passed assignment, six quiz formats, submission/review, canonical mastery writes, decay, retry, stale-evidence, and enrollment checks.
- Browser fixture verified assignment cell → correct student → rating → updated counts; the saved rating persisted after reload. Word cells opened the correct learner; unscored writing displayed `Review answer`, not zero. Unassigned filtering worked.
- Desktop 1366px and mobile 390px layouts passed. Controls were at least 44px tall, cells were 76px tall, student names stayed pinned, and table overflow stayed within its region. Browser console was clean.
- TypeScript passed in both workspace and isolated release. Changed-file ESLint, style audit, and diff whitespace checks passed.

All grading tests used disposable local students. The fixture server was stopped and its database removed. Live authenticated browser verification was interrupted by the user actively grading; their session was left intact.

## Release

- Previous production: `dpl_EE7whapyvNCqJvhsNESwyuQYaAGT`.
- New production: `dpl_BJLy4dD3Y3SkVPtNwcoDUit5LkPJ`.
- Candidate URL: `https://physics-h5yk5n9w3-ethalorians-projects.vercel.app`.
- Release directory: `/private/tmp/vocab-overview-release`.
- All 1,815 baseline source files were checked against the previous deployment's SHA-1 manifest before overlaying ten dashboard-related files. All 1,819 uploaded files matched the tested release.
- Vercel production build completed successfully. Promotion succeeded, and the live domain resolved to the new Ready deployment. Post-deploy error-log query returned no logs.
