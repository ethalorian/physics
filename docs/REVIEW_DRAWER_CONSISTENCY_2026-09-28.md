# Lesson and Math review consistency

Lesson mastery reviews now follow the Math Spine review desk: student queue, prompt and evidence, 1–3 rating, visible written feedback with starters, explicit save, response navigation, and the student identity/navigation bar at the bottom. The queue finishes every pending lesson/target for one student before pausing at the next student. Ratable roster and the existing class/unit/lesson/submission scope are preserved.

Both drawers use the same React controls for the queue, rating buttons, feedback, and student navigation. Lesson-specific target selection and optional per-response scoring remain available. Saved assessment history is retained.

Selecting a rating never writes mastery. Feedback and ratings remain in per-review session drafts. Failed or ambiguous lesson saves freeze the draft and reuse its request ID when retried. A rating that commits before a revision-return failure can be retried without duplicating the rating, including after closing and reopening the drawer. A lesson revision request requires a written next step. “Need more evidence before rating” returns the submission with feedback through the existing API without recording a mastery level. No schema or XP economy changes.

## Verification

- Full TypeScript check, targeted ESLint, style and brand checks passed.
- Existing evidence-review API behavior checks and all 41 lesson access/review tests passed, including teacher-of-record authorization, immutable submission scope, and server validation.
- New queue regression tests cover student-first order, completed-item removal, and exact lesson/target/submission filtering.
- CUA browser verification used actual components with synthetic students and stub APIs: draft selection, feedback, switching students, lost-response retry, partial rating/return retry, detailed scoring, next-student gate, feedback-only return, and Math draft/revision controls.
- Browser fixture recorded one rating after three retries with the same request ID; feedback-only return recorded no rating.
- Checked desktop 1280×720 and 1440×1000, iPad 820×1180, and phone 390×844. No horizontal overflow or runtime errors in the successful fixture. Student identity/navigation stays at the bottom.
- Updated existing browser regression scripts for the common controls and student-first workflow; browser interaction during this task ran through CUA, not the shell-based browser runner.

Production source is built from the exact previously deployed release plus these changes. Live verification checks the deployed source hashes and authenticated-route boundaries; no real student work is rated as a test.
