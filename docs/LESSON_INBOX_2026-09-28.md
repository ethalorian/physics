# Lesson evidence inbox — September 28, 2026

The lesson selector previously narrowed the grading queue through a native dropdown, while the submitted-work list started collapsed. Teachers could miss pending work and the page did not refresh when students submitted lessons.

Student work now displays an open Lesson inbox for the selected class/teacher and assessment unit. Lesson buttons show submission, target-review, and saved-response counts, including historical work. Pending submissions are listed oldest first with student, lesson, waiting time, rating status, and direct Review and View submission actions. Review opens the existing shared rating drawer with the exact student, lesson, target, and submission context.

Lesson and student filters keep overall totals visible. A notice counts pending submissions and target reviews outside the current view, with one action to clear lesson, target, student-name, age, source, and skipped-review filters. Target metadata is retained when following a target deep link, so clearing that link restores the whole grid.

The inbox checks every 60 seconds while the page is visible, on focus, and when requested with Refresh submissions. New submission IDs receive an in-page notice and New marker even when another lesson is selected. Initial loading and changing class/unit do not generate false arrival alerts. These are in-page notifications, not email, push, or persistent bell notifications. API failures retain prior results and offer retry. Background refresh does not reset an open submission or unsaved feedback; grid-refresh errors are separate from drawer-loading errors.

The existing authorization, teacher-of-record scope, immutable submission reader, attribution repair, and rating/return endpoints remain in use. Submissions awaiting return, unrated target reviews, saved responses, and returned lessons remain separate counts. Returning feedback does not create mastery. This change does not alter grades, XP, lesson access, or student records.

## Verification

- Seven focused inbox and review-queue tests passed; initial-load/arrival detection, historical evidence retention, counts, and exact grading scope are covered.
- Evidence-review API regressions passed, including authorization, stale/duplicate rejection, snapshot attribution, and scoped retry.
- All 41 lesson access/review behavioral checks passed.
- Full TypeScript, targeted ESLint, style audit, and brand audit passed.
- Browser verification used the actual Student work and review components with synthetic students. Confirmed open submissions, lesson/name/age warnings, hidden new-submission alert, filter clearing, exact direct-review context, failure/retry with draft preservation, unlinked evidence, and target-grid restoration.
- Desktop, 820 px iPad, and 390 px phone layouts checked; no page-level horizontal overflow. No runtime console errors in the final preview.
- Production release is assembled from the prior verified deployment plus only the inbox files, retaining unrelated source exactly. Live authenticated student data was not used for browser tests.
