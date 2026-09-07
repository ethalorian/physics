# Lesson system: teacher usability audit

Implementation update: the initial recommendations have now been implemented locally. See [implementation and validation](LESSON_TEACHER_UX_IMPLEMENTATION_2026-09-07.md). The audit below records the original findings before implementation.

Date: September 7, 2026. Scope: current local source, lesson APIs, database migrations, and existing automated tests. This is an audit and proposal; application code, routes, and database were not changed. No authenticated browser walkthrough or live database inspection was performed. Findings describe the checked-out implementation, not independently verified production behavior.

The main problem is inconsistent workflow and meaning across screens. Teachers must connect curriculum publication, class release, lesson plans, authoring, several previews, student checkpoints, and review themselves. The first improvement should be a coherent teacher journey using existing pages and data.

## Recommended teacher journey

Start on the existing class page. Keep the selected class, unit, and lesson as the teacher moves through:

**Choose lesson → Read teacher plan / Preview student work → Open for this class → Teach → Review submissions.**

The selected lesson should show its title, curriculum, class access, and a small set of contextual actions. Authors additionally get **Edit lesson**. Preserve the underlying distinction between globally published curriculum and class-specific access, but explain it in everyday language.

All initial recommendations below can use existing routes and schema. Query parameters, shared components, and changes to existing endpoint validation are sufficient. New query-parameter support is implementation work, not a claim that the parameters already work.

## Priority 1: repair misleading or blocked behavior

### 1. Release controls can report success after failure

Evidence: `src/app/admin/lesson-access/page.tsx:102` updates local windows after a fetch without checking its status; network failures are swallowed. `LessonAccessSnapshot.tsx:37` does the same. Initial loading can stay at “Loading…” indefinitely. The single-class window DELETE also ignores database errors before returning success.

Teacher impact: “I opened it, but students cannot see it” can be a real UI/backend disagreement.

Recommendation: check every response; show confirmed state or roll back optimistic state; retain schedule input on failure; provide Retry and a clear error. Bulk operations need a summary of successes and failures. Return database deletion errors from the existing windows endpoint.

Impact: UI and existing API changes only. No new route or schema.

### 2. “Open next” is not reliably the next applicable lesson

Evidence: the board’s `summary()` loops through all published lessons without its existing `applies()` curriculum filter. It selects the first closed/ended lesson, including an earlier lesson deliberately closed. The dashboard snapshot has its own similar implementation and can also offer a future-scheduled lesson as “next.” The `open-all` endpoint selects owned course IDs without curriculum or lesson publication checks. The single-class endpoint likewise accepts a lesson ID without verifying curriculum/publication compatibility. Whole-lesson track visibility is not included in the board’s lesson payload.

Recommendation: share one applicability and ordering implementation across cards, matrix, and mutation endpoints. Base curriculum identity/order on `unit_id` and `units.order_index`, then lesson order. Derive a suggested next lesson from the current class/pacing context where available; always show the complete proposed title and allow selection. Do not treat deliberately ended lessons as upcoming automatically. Respect applicable tracks without excluding shared lessons.

Rename ambiguous “all” to “Open for matching classes (N).” Show affected classes before a broad change, especially the admin fallback to all classes. Do not silently overwrite a future schedule through “Open next.”

Impact: shared helpers, queries, existing API validation. No new route or schema.

### 3. Editing a schedule can shift its time

Evidence: `lesson-access/page.tsx:31` formats `datetime-local` input using UTC (`toISOString().slice(0,16)`), then parses it as local time.

Reproduction in `America/New_York`: an 8:00 a.m. September 8 opening becomes a displayed 12:00 input; saving it unchanged moves the stored instant four hours later.

Recommendation: format local date/time components for the input; label the timezone; reject invalid dates and close-before-open in the existing endpoint. Ensure expired lessons remain discoverable: the board has an `ended` state but no corresponding status filter.

Impact: UI/helper/API validation only. No new route or schema. A separately configurable school timezone would be a distinct requirement; it is not needed to fix this conversion defect.

### 4. Preview shows different content depending on where it is opened

Evidence: `AdminLessonPreview.tsx:285` renders `lesson.content` (legacy Markdown). `/lessons/[slug]` renders `content_blocks` via `BlockLessonViewer`. Settings save redirects to the legacy preview. The builder has a third preview, using the current block document. The settings preview additionally displays legacy Markdown even though the settings page explicitly says students do not see that field.

Recommendation: keep `/admin/lessons/[id]/preview`, but render the same hydrated block document and viewer as the student route. Share vocabulary, target hydration, track filtering, and reader configuration. Offer “Student preview: CPA / Honors” and a clearly separate teacher view. Put metadata inspection behind a secondary disclosure. A staff login on `/lessons/[slug]` currently bypasses student access gates; label that distinction rather than presenting it as proof a student can enter.

Impact: existing page and shared rendering code only. No new route or schema.

### 5. Staff browsing can be blocked by checkpoints they cannot answer

Evidence: `BlockLessonViewer.tsx` disables persisted responses for `staffView`, makes blocks read-only, and returns false from staff saves. It nevertheless computes `firstLockedIndex(pages, committed, gating)` with gates enabled. The experience endpoint defaults staff to gates on. Consequently a gated capture block can prevent navigation to later sections with no way for a teacher to satisfy it.

Recommendation: teacher view should freely navigate every section. Interactive student preview should use isolated temporary answers and demonstrate gates. Keep real student gates and submission protections intact.

Impact: viewer logic only. No new route or schema.

## Priority 2: simplify authoring and release

### 6. Make the existing authoring pages feel like one editor

Evidence: dashboard rows link separately to Build blocks, Preview, and Settings. Settings links back to the builder and sends users to preview after saving. Vocabulary is a separate editor below the builder. The builder has unsaved-change protection and local recovery; settings has no comparable unsaved-navigation protection.

Recommendation: a shared lesson header and consistent **Content / Settings / Preview** navigation across the existing three URLs. Make the builder the default authoring entry, preserve class/unit context, and keep Save in a consistent position. Stay on settings after saving. Protect unsaved settings when opening the builder. Accurately distinguish saved content from separately saved vocabulary; do not show “Everything saved” if one operation failed.

Move legacy Markdown, raw glossary JSON, slug editing, and technical metadata behind Advanced. Replace glossary JSON with term/definition rows. Show common activity types first and the existing full block catalog under More activities. Existing `BLOCK_DEFS` already groups blocks: build on that grouping. Add optional section presets using existing block types, preserving block IDs for already-authored work.

Impact: shared UI and existing calls. No new route or schema.

### 7. Give “ready” and “open” different, consistent meanings

Evidence: publication appears as a dashboard switch and settings selection; class access is managed elsewhere. Vocabulary has its own published flag, which its API says gates arcade availability. These are distinct purposes expressed with similar language.

Recommendation: show two independent states: **Curriculum: Draft / Published** and **This class: Closed / Scheduled / Open / Ended**. Explain Published as “Ready for teachers to release.” Label the vocabulary switch “Available in vocabulary games.” Keep class release near the selected lesson without creating another independent release implementation.

Display an access explanation, such as “Published · Open for Period 2 · Honors content,” with any blocking condition. A class-level open window does not guarantee every student passes enrollment/program/track checks; the interface should not imply it does.

Impact: UI, shared access summary, extensions to existing response payloads. No new route or schema.

### 8. Fix target and publication readiness inconsistencies

Evidence: settings’ `targetCount` counts only `learning_targets.lesson_id`; the save endpoint correctly uses `targetIdsForLesson`, which includes block references to shared targets. Settings’ “Learning Objectives” edits a separate `objectives` field and does not attach those required targets. The dashboard publication toggle silently reverts on failure. The server returns block/language-support errors, but the builder mainly displays the combined error text.

Recommendation: use the same target resolver and readiness rules in every authoring surface. Show attached/shared assessment targets separately from optional introductory objectives. Put an actionable target selector or a contextual link to existing target tooling beside the error. Show validation issues at the offending block with “Go to activity.” Reuse current validators and existing lesson API; avoid a new readiness table.

Role consistency also needs correction: navigation and dashboard labels describe publishing as admin-only, while `PUT /api/lessons/[id]` uses `withContentEditor` without a separate publication-role check. Implement the intended admin-only publication policy in the existing endpoint, or explicitly revise labels/policy. Do not rely on hidden buttons as the rule. Navigation also hides the authoring hub from non-admin collaborators even though the hub supports lesson edit grants.

Impact: existing API authorization/validation and capability-aware navigation. No new route or schema.

### 9. Reduce navigation choices through context, not route removal

Current destinations have legitimate distinct jobs:

| Existing route | Recommended role |
|---|---|
| `/admin/classes/[courseId]` | Everyday starting point: selected class and lesson, access, plan, teach, review |
| `/admin/lesson-access` | Class-first release view; retain cross-class matrix as an advanced view |
| `/admin/teacher/plans` | Teacher instructions and downloads for the selected day |
| `/admin/command-center` | Live classroom controls with the selected context carried in |
| `/admin/control-room` | Lesson submissions and mastery review |
| `/admin/dashboard` | Clearly named Lesson library for authorized authors; currently titled “Manage” |
| `/admin/workshop` | Curriculum coverage and target tooling for administrators |
| `/admin/lessons/[id]/build`, `/edit`, `/preview` | Consistent parts of the same authoring experience |
| `/lessons`, `/lessons/[slug]` | Student library and reader, with explicit staff-view behavior |

Class pages currently send teachers to generic lesson plans links while already preserving class context in Control Room links. Extend that existing pattern. Keep the current lesson selected across planning, release, teaching, and review instead of requiring repeated searches. Teacher plans are backed by authored plan data and the student reader by lessons; label their different purposes and link matching unit/day records without suggesting editing one automatically updates the other.

Impact: existing pages, links, query parsing, shared selection state. No new route or schema.

## Priority 3: simplify review without weakening evidence

`LessonReviewQueue` currently requires explicit submission review to unlock revision and directs teachers to record mastery separately in the target grid. Its distinction is sound but creates extra navigation and decisions.

Recommendation: make submitted work and its relevant target ratings accessible together in the existing Control Room. Keep “Return for revision” separate from mastery assessment in wording and effect. Show pending counts before expanding the queue, and carry the selected lesson into it. If offering a combined save action, report partial failures honestly; do not claim independent endpoint writes are atomic.

Move raw block identifiers, attribution repair, all saved fields, and technical evidence-source details into advanced inspection. Preserve access to them. Preserve immutable submission snapshots, explicit lesson reviews, live-poll separation, and student draft-versus-saved-work rules.

Impact: existing review UI and APIs. No new route or schema.

## Database assessment and change flags

The existing model already separates the necessary responsibilities:

| Existing data | Keep as the source of truth |
|---|---|
| `lessons.content_blocks` | Student lesson document |
| `lessons.published` | Global curriculum publication |
| `lesson_class_windows` | Per-class release schedule |
| `units`, `lessons.unit_id`, `courses.program/track` | Curriculum identity and applicability |
| `learning_targets` plus block target references | Owned and shared assessment targets |
| `vocabulary_sets`, `vocabulary_terms` | Structured lesson vocabulary |
| `block_drafts`, `block_responses` | In-progress answers and saved evidence |
| `lesson_submissions`, `lesson_reviews` | Submitted snapshots and explicit review |
| `lesson_evidence_reviews`, `lesson_evidence_links` | Review/attribution of individual evidence |
| `lesson_section_progress` | Reader progress |

Use `unit_id` consistently. Dashboard grouping currently compares free-text `lesson.unit` with `units.name`; sibling navigation also uses the free-text unit. That can diverge from the canonical ID used for program/access. Settings edits the unit text without updating `unit_id`. Change reads and future writes to use the existing relationship. If live rows have missing or conflicting identifiers, **flag a separate data-repair proposal with affected row counts and a reversible mapping before changing historical data**.

Do not add a second status table, an assignments table for release, a new lesson builder schema, or duplicate targets just to simplify the UI. Do not drop legacy columns until their consumers and data have been inventoried.

**Schema exception to flag if requested later:** editing a private draft of an already-published lesson while keeping its old version live. Current saves update the shared `lessons.content_blocks`; the builder’s local recovery is not a durable unpublished revision. A robust shared revision workflow may need additional persistence after checking existing storage. It is outside this first simplification pass. Also label saves to published lessons as affecting shared curriculum now.

**Live-schema limitation:** the checked-in schema export and migrations are not a verified complete representation of deployment; baseline creation definitions for some referenced lesson tables were not located in the reviewed Supabase files. A read-only live schema/migration comparison is needed before any actual database work. This is a verification dependency, not justification to recreate tables.

## Suggested implementation order and acceptance checks

1. Repair release failures, applicability, schedule conversion, preview mismatch, and staff navigation. Verify rejected writes never show success; 8:00 stays 8:00 after an unchanged save; a Trades class is not offered Physics lessons; staff can reach the final gated section.
2. Add the shared lesson header, class-first release screen, consistent states, contextual links, and simplified settings. Verify a teacher can choose, preview, release, teach, and review without selecting the class repeatedly. Verify collaborator controls match server capabilities.
3. Improve publication readiness and review presentation. Verify shared targets satisfy readiness consistently; target/objective controls are unambiguous; grading does not silently mark a submission reviewed; review preserves original submitted work.

Every initial phase: **zero new routes; zero schema migrations**. Normal saves through existing APIs still update existing records once implementation is authorized. Historical cleanup and a durable published/draft revision workflow are separately flagged work.

Validation performed during this audit: `node scripts/test-lesson-audit.cjs` (16 scenarios passed), `node scripts/test-lesson-access-review.cjs` (28 passed), and `node scripts/test-lesson-signals.cjs` (passed, including intentional query-failure cases). Also reproduced the timezone conversion with Node in America/New_York. These suites use isolated test data/mocks; they do not validate live schema or teacher-browser usability.
