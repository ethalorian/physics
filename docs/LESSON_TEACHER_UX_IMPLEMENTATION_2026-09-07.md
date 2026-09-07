# Lesson workflow implementation

September 7, 2026. Implements the initial recommendations in the teacher usability audit. Changes are local and have not been deployed.

## Teacher workflow

The existing class page now includes the shared lesson release panel. Teachers choose a class and applicable lesson, then use contextual links to the teacher plan, student preview, live teaching, and lesson review. Class, lesson, unit, and day travel in query parameters on existing routes. Teacher plans use the selected class’s track and enforce class ownership. The lesson library uses canonical unit IDs.

The existing Lesson Access page starts with the same class-focused panel; the cross-class matrix is secondary. Global curriculum publication and per-class Closed / Scheduled / Open / Ended states have separate labels. Suggested next lessons use canonical curriculum order and skip previously released, expired, and future-scheduled lessons. Suggestions require explicit selection. Bulk release lists matching classes and reports partial failures; retries only attempt failures.

Schedule fields display local time with the timezone identified. Invalid/reversed schedules are rejected, and unchanged fields retain their original timestamp. Failed writes leave confirmed access unchanged and retain schedule input. Initial load failures offer retry. Existing release endpoints enforce publication, program, track, ownership, and database error handling.

## Authoring and preview

Content, Settings, and Preview share a lesson header and contextual navigation. Settings stays open after a successful save, guards unsaved navigation, and exposes title, canonical unit selection, introductory objectives, attached assessment targets, publication, and optional glossary rows. Legacy content and URL configuration are under Advanced. Legacy videos remain separately saved. Untouched glossary data is retained.

The builder prioritizes common activity types, retains the complete catalog, and adds an optional append-only reading/checkpoint/exit-ticket starter. Existing block IDs survive. Validation issues offer a direct jump to the relevant activity. Target selectors show authored target statements, including referenced shared targets. Vocabulary availability is labeled for vocabulary games.

The existing preview route and builder preview use the actual block viewer, hydrated lesson content, vocabulary, targets, track filters, and selected class reader settings. Student previews use temporary answers; teacher view can navigate past checkpoints and suppresses student submission prompts. Staff previews cannot write student evidence. Admin-only publication is enforced in the API as well as the UI; collaborators retain authorized content editing and library navigation.

Saves to published lessons update shared curriculum immediately, with a visible explanation. A durable private revision of a published lesson remains separate, flagged future work; it was not added.

## Review

The Control Room carries the selected lesson into its review queue and displays pending counts. Submitted snapshots and relevant target assessment links appear together. Opening a target does not mark a submission reviewed. Returning work for revision is explicit. Captured fields and attribution repair remain available as secondary inspection. Existing submission snapshots, evidence, and student save/submit protections are preserved.

## Database and route constraints

**Zero new routes. Zero schema migrations. No live database writes.** New components and helper modules reuse existing pages, endpoints, tables, and fields.

Read-only inspection of the configured PhysicsAPP database verified the required existing lesson, course-reader, and release-window columns. All 190 lessons had matching canonical unit IDs and labels: zero missing IDs and zero conflicting labels. No historical data repair was needed. This was a scoped compatibility check, not a complete production database certification.

## Validation

- TypeScript check passed.
- Changed/new TypeScript and TSX files passed ESLint with zero warnings.
- Lesson audit regression suite: 18 scenarios passed.
- Access/review behavioral suite: 28 scenarios passed.
- Lesson signals suite passed, including intentional query-failure cases.
- New teacher workflow suite: 14 scenarios passed, including release compatibility, ownership, timestamp validation, failed deletes, next-lesson ordering, contextual URLs, and class-scoped plans.
- New Chrome browser suite passed: failed release/retry, schedule roundtrip, partial bulk retries, desktop/phone overflow checks, shared preview, teacher checkpoint navigation, temporary student answers, settings recovery, exact plan selection, append-only builder starter, lesson-filtered review, separate assessment/return actions, initial-load retry, and no runtime page errors.

Browser tests compile the actual components against synthetic HTTP responses; they do not impersonate a production teacher or write live student records. Release, settings, preview, and review screenshots were inspected. Production build status is recorded below.

Production build passed with `NODE_OPTIONS=--max-old-space-size=8192 npm run build`, including 286 static pages. The first attempt reached compilation but exhausted the default Node heap during validation. The successful run reported existing lint warnings outside the changed files and a non-fatal webpack cache ENOSPC warning; output generation completed with exit code 0. No project runtime or build configuration was changed for the larger heap.
