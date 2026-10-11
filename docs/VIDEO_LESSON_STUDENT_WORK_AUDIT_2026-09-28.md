# Video lessons → Student work audit

Audited 2026-09-28 against production deployment `dpl_E3jCLvQzDUcqzFD1ih6ye4YmNUXU`, live database aggregates and the exact deployed source in `/private/tmp/mvp-video-release`. This is a read-only investigation of production: no student work, ratings, release windows or review status was changed.

## Main finding

Videos 2 and 3 correctly save target-linked responses and create immutable submitted-work snapshots. They use the existing mastery review desk. The remaining difficulty is a fragmented teacher workflow, inconsistent pending counts, and an actual catalog-link defect affecting videos 4–8.

## Current live work

Counts are a point-in-time snapshot, and may increase as students work.

| Scope | Lesson | Students with saved answers | Students submitted | Evidence-desk ratings for this lesson |
| --- | --- | ---: | ---: | ---: |
| MVP Physics | Video 2 — Kinematics | 17 | 15 | 0 |
| MVP Physics | Video 3 — Position & displacement | 9 | 1 | 0 |
| 26-27 MVP Physics | Video 2 | 0 | 0 | 0 |
| 26-27 MVP Physics | Video 3 | 0 | 0 | 0 |

Across all rosters, Video 2 has 38 saved response records and 15 submissions; Video 3 has 128 saved response records and 14 submissions. These are response records, including successive saves, not counts of distinct questions. All 29 submitted lessons have document and answer snapshots; all saved response records for these two lessons carry target IDs. None of those submissions has been returned. No mastery-evidence review has yet been recorded against either new lesson. The position/displacement target has older mastery records from other work; those are separate from rating these video-lesson responses.

## How work moves through the system

1. Watching records playback progress and can award video XP. Playback is engagement information; it does not generate a mastery rating or a question response. Student work currently does not display the video-watching progress.
2. Explicitly saving a question or written response stores a `block_responses` record with the lesson, prompt/block, target and evidence source. Autosaved drafts stay outside the rating queue.
3. Before a first lesson submission, explicit saved answers can already enter the mastery queue. Video 2 captures a checkpoint and an explanation against `u1.kinematics-language`. Video 3 captures its checkpoint, worked problem and explanations against `u1.vocab-position-distance-displacement`.
4. Submit saves changed answers first, then creates a `lesson_submissions` snapshot of the lesson and its saved responses. It locks further edits until the teacher returns the lesson.
5. Student work is scoped by class and unit. The main grid queues student–lesson–target reviews. The separate Lesson review section lists submitted lessons and low-stakes evidence. The drawer shows the submitted snapshot where one exists, with the original prompt, answer choices, student response and available teacher guidance.
6. The default review method is a teacher judgment of 1 / 2 / 3: Not yet / Almost / Got it. The alternative scores each response and rounds the equal-weight average to a target level. Saving stores the review, a mastery record and target feedback atomically. The mastery grid then recomputes the target's recency-weighted value; it is not a lesson percentage grade.
7. Returning the lesson is a separate action. It unlocks revision. Returning work or marking evidence reviewed does not itself record mastery. A new submission is a new review event.

## Findings and recommended changes

### 1. Repair the catalog link for videos 4–8 before release

All five have `unit_id = NULL` and the display unit `Unit 1: Motion & Forces`; the canonical unit name is `Unit 1: Motion & Forces (Asteroid 2026-XJ)`. The existing `sync_lesson_unit_id` database trigger derives the ID from an exact display-name match, overriding the supplied ID. This explains why the insert script's apparent `unit-1` assignment did not persist.

Both discovery paths exclude these rows: the grid/queue query by `unit_id`, while the drawer still queries by the unit's display name. These videos currently have no saved answers or submissions, so there is no demonstrated lost student work. Their questions cannot reliably feed the unit review flow in this state.

Recommended repair: normalize both fields for the five lessons, use the stable unit ID for drawer queries, and validate future catalog imports against the canonical unit. Keep release windows separate from catalog repair.

Evidence: `src/lib/mastery-student-work.ts:89`, `src/app/api/mastery/grid/route.ts`, `src/app/api/mastery/queue/route.ts`, and live trigger/data inspection.

### 2. Track assessment status separately from return status

A submitted lesson returned without any mastery rating disappears from the main pending mastery queue. The pending-submission query omits returned lessons, and the saved-answer branch excludes any lesson that has ever been submitted. A focused test reproduced this transition without writing production data.

Returning insufficient work for revision is valid. The gap is that the panel no longer clearly distinguishes it from completed assessment. Use separate fields/statuses such as Needs assessment, Assessed, Returned for revision—unrated, and Resubmitted. Keep returned work discoverable without requiring a teacher to invent a rating.

Conversely, a saved mastery assessment does not return the submission; it remains in the lesson-return queue. Offer explicit combined actions where appropriate, while keeping Return for revision without a rating available.

Evidence: `src/lib/pending-lesson-work.ts:13`, `src/lib/lesson-review.ts`, `src/components/admin/MasteryReviewDesk.tsx`.

### 3. Make pending counts follow the selected lesson

The drawer's review queue honors the selected lesson, but the Grade pending button counts the whole unit's student–target cells. Several lessons assessing one target also collapse to one counted cell. If the selected lesson has no pending item, the fallback can choose a target pending from another lesson while retaining the selected lesson filter, yielding an empty drawer.

Derive the visible count, launcher and next-review traversal from the same filtered student–lesson–target queue. Display the unit-wide total separately if useful.

Evidence: `src/app/admin/control-room/page.tsx:390–425`.

### 4. Give teachers one clear video-lesson review entry point

The normal Student work page is a target grid with T-number column labels. Lesson submissions sit in a collapsed Lesson review section unless the teacher enters through a lesson-specific link. Quiz and reading inboxes are additional sections. There is no straightforward Video 2 / Video 3 picker or consolidated lesson roster showing work stages.

Recommended interface: Class → Video lesson → student roster with Not started, Watching, Answers saved, Submitted, Needs rating, Assessed and Returned for revision. Selecting a student should open that lesson's exact questions and target ratings in the existing drawer. Show watch/XP context separately from assessment evidence. Prefer visible lesson titles and target statements over requiring teachers to interpret T-numbers.

### 5. Clarify what “grading” means

The current lesson flow records mastery levels and feedback. The old whole-lesson completion/Aspen gradebook flow is retired in the control-room code. Video completion and automatically checked answers do not assign a mastery grade. If a separate lesson percentage or points grade is desired, that is an additional policy and workflow, not currently the same thing as Save mastery.

## Existing route to review the open lessons

- Student work → choose MVP Physics → Unit 1 → expand Lesson review → Submitted lessons → open a student → Assessment targets → record mastery.
- Grade pending also opens the target-rating desk, including explicit saved work before its first submission. Use the lesson-specific links below to reduce ambiguity.
- Video 2: https://www.antocciphysics.com/admin/control-room?class=7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1&unit=unit-1&lesson=eaa95227-1bc7-41e8-af7c-192bdedc8303
- Video 3: https://www.antocciphysics.com/admin/control-room?class=7f1eb6c6-69a8-42cb-9f6c-d85c34688fc1&unit=unit-1&lesson=fc67d63d-a011-426b-b9f3-fd8f1ea7f501

## Verification and limits

- Live database counts, target mappings, immutable snapshots, class scope and unit-sync trigger inspected without reading student answer bodies into the report.
- All 37 existing lesson access/review behavioral tests passed.
- Evidence-review API tests passed for teacher/roster scope, complete evidence validation, stale evidence rejection, exact submission identity and idempotent retry.
- Four focused queue checks verified explicit save, submission, return without assessment and exact assessment behavior. Reproduction: `/private/tmp/video-work-audit/check.cjs`.
- The in-app browser required school sign-in for the authenticated panel. The conclusions therefore rely on production records, deployed code and executable behavior tests; they do not claim a signed-in live UI walkthrough.
