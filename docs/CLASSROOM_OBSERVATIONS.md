# Classroom observations

Teacher route: `/admin/observe`. Launch from the teacher dashboard, staff navigation/command palette, or Control Room.

Choose a class and unit, then an observation focus. Select a student, choose Not yet (1), Almost (2), or Got it (3), optionally compose feedback, and tap Save & next or Save & stay. Feedback can also be sent without a rating. Skip retains the student's unfinished draft. The focus stays selected as students change. Checkmarks count successful ratings on that target during the current visit.

Ratings use `/api/mastery/records` with `evidence_source: observation`; feedback uses `/api/feedback` with the same student and target. Existing teacher/admin role checks and own-roster authorization remain authoritative. The view only offers students with `ratable: true`. No schema changes. Respects M-1, M-4, A-7, and O-2 in LESSON_SYSTEM_RULES.md.

Saving disables controls and guards repeated taps. If a rating succeeds and feedback fails, the rating is marked saved and a retry sends only feedback. Drafts are keyed by student and target and held in memory while the view is mounted. They are not an offline queue and are not restored after closing the view. A lost response may mean a write reached the server without confirmation; the UI does not automatically retry writes.

Verification: TypeScript and ESLint passed. An isolated browser harness rendered the real page with fixture API responses at 820×1180, 1180×820, and 568×820. Checked minimum 44px controls, horizontal overflow, non-ratable student exclusion, student/target draft isolation, save-and-next, repeated tap suppression, rating failure recovery, partial rating/feedback failure and feedback-only retry, search, request payloads, and browser errors. No production student records were written. Live authenticated Safari and production integration remain deployment smoke checks.
