# Student choice calendar

Implementation is local and has not been deployed. Both pending migrations must be applied before deploying the application changes. Existing assignment records and submissions are not rewritten.

## Teacher workflow

In Home → Calendar, select a Physics class and create a Student choice section. Add existing published class activities as single choices or teacher-defined sequences of activities. Reading quizzes linked by the current syllabus are included automatically. Instructor-led labs can stand alone or include preparation/report assignments. Set the opening time, deadline, number required, points per choice, and category minimums, then publish.

Use Lab calendar & groups to add adjustable blocks (30 minutes by default). Each block creates two simultaneous groups, each with at most four seats. Students reserve seats immediately. The teacher can move students, release seats, cancel sessions, and mark hands-on work complete. Similar/mixed mastery grouping uses the selected Physics targets and the existing mastery calculation; suggestions are booked only after teacher confirmation. Students without mastery evidence are listed for manual placement, never treated as low mastery.

Draft choices are editable. Published activity and grading rules remain fixed; titles and availability dates can be edited as long as existing plans and sessions remain inside the window. Pause availability stops new student changes while retaining work and grades.

## Student workflow

The choice section appears alongside required work on the calendar. A horizontal carousel holds the available activities. Students drag each activity onto a date, or use its date picker. Students may schedule and open activities in any order, including activities within a teacher-defined sequence; attached quizzes still require their own native prerequisite. A sequence counts as one choice, completed when all its required activities are submitted. A lab booking has its own date and does not move the independent preparation/report activities. They may choose more than the required number. Booking a lab places its session on the calendar. Cancelling a reservation retains the choice so a different time can be booked.

Unstarted choices can be removed freely. Removing started work requests teacher approval; work and reservations remain until approval. Approval removes the plan/reservation, preserves submissions, and keeps attempted work in grading.

Submissions count toward choice completion independently of attached quizzes. Labs also require the instructor to mark the hands-on work complete. Vocabulary practice counts submitted checks covering the assigned words and check count, without imposing a mastery-score threshold. Existing quiz prerequisite enforcement remains authoritative.

## Gradebook rules confirmed by Craig

- Unchosen, unattempted choices receive EX once requirements are satisfied or the deadline passes; before then they are available choices.
- EX is excluded from grades. Existing required assignments remain required.
- Every attempted choice, including extras and approved swaps, remains gradable.
- Attached quizzes retain their own grades and automatic unlock rules. Unchosen quizzes are hidden from the student's unfinished-work list and display EX in the quiz gradebook when applicable.
- After the deadline, each unmet required choice creates a separate zero worth the section's points per choice. Category/count deficits overlap rather than double-counting the same missing requirement.
- Craig explicitly confirmed that the missing-choice zero stays separate even if attempted, unsubmitted work earns partial credit.
- Late completion or a deadline extension recalculates the missing-choice entries. These zeros do not create mastery records.

## Scope and data boundaries

Enabled for enrolled Physics classes; trades and daily math remain outside the choice layer. The initial activity picker supports released lessons, readings, vocabulary tasks, quizzes, and instructor-led labs. Simulations embedded in existing lesson/report assignments use those assignments' existing submission flow. The legacy standalone simulation-assignment table has no connected student submission path, so those records are not offered as completable choices.

`/api/choice-calendar` uses existing authentication and class scoping. Student identity comes from the authenticated context. Student snapshots include only that student's work and reservations, plus aggregate lab seat counts. Mastery data and roster names remain teacher-only. All new tables use RLS and are accessible only through service-side operations. Mutation functions serialize section changes and reservations, protect capacity and appointment conflicts, and write an audit trail.

Source ownership is exclusive within each class: an existing assignment cannot be reused in two choice sections. Use a separate assignment copy if the same content must also be separately required. Existing assignment visibility/release windows still apply.

## Validation

- 47 choice, reflection, submission, quiz-comparison/insight, calendar, and student-banner rule/regression tests passed; the additional reflection-catalog integration case and existing catalog tests also passed.
- `scripts/test-choice-calendar-api.cjs`: actual handler with scoped authentication/catalog fixtures; permissions, identity spoofing, input validation, linked quizzes, and editing conflicts passed.
- `scripts/test-choice-calendar-db.cjs`: actual migration/functions against a disposable local PostgreSQL database; simultaneous seat contention, overlapping groups, atomic booking, enrollment, permissions, swaps, editing/version conflicts, and cancellation passed.
- `scripts/test-choice-calendar-browser.cjs`: actual React components against fixture API data; drag/drop and date planning, extras, quiz reveal, EX/zeros, bookings, teacher editing/grading/group confirmation, failed saves, read-only access, and 320–1366px layouts passed.
- The existing full home-calendar browser regression passed with a choice section alongside required assignments, including teacher date editing and read-only previews.
- Full TypeScript check and style audit passed. Production schema types were checked read-only for compatibility.

These are local checks, not a production end-to-end test. Browser/API/database tests use separate fixtures. Before release, apply `supabase/migrations/20261021012450_student_choice_calendar.sql` and `supabase/migrations/20261021015805_reflection_artifacts.sql` together and verify the authenticated flow on a preview deployment using dedicated test users. The current checkout also contains unrelated pre-existing changes; include only reviewed release changes.

## Metacognitive assignments (October 20 clarification)

The lesson draft form offers Manga and Short-story templates, also linked from the choice-section editor. Create a separate draft for each week so earlier student work remains attached to its original prompts. Select the week's physics target, edit the prompts, preview, publish, and release to the class using the existing lesson workspace. The released assignment then appears in the choice activity inventory. Leave it outside a choice section for ordinary required assignment.

Both templates ask students to connect this week's physics to their own life, create a product, explain a before/after change in thinking with evidence, evaluate a learning strategy, and plan a concrete next step. Review emphasizes metacognition and accurate physics, rather than artwork, grammar, or literary polish. The student workspace offers Assignment / Work / Side by side and uses canonical block responses, drafts, submission snapshots, feedback, and locking; it does not route into PhysicsPathView.

Manga: upload a hand-drawn/digital page as JPEG, PNG, WebP, or PDF (up to 4 MB), plus a physics caption. Short story: type a few focused paragraphs into the existing text response. No in-app drawing is required for manga. Uploaded products use a private storage bucket and service-only receipt table. The upload and download routes check lesson access, ownership/teacher roster, and submission locking. Only receipt IDs are saved in response JSON. Replacing a file keeps older files available for existing submission snapshots. Merely uploading is an attempt, not completion; all responses must be submitted.

Additional checks: `src/lib/reflection-assignments.test.ts`, `scripts/test-reflection-api.cjs`, `scripts/test-reflection-browser.cjs`, and `scripts/test-reflection-db.sql`. Local browser tests cover the real reader and draft store, teacher PDF downloads, and pointer/touch carousel dragging using fixture endpoints; a production account/upload integration remains a release check.
