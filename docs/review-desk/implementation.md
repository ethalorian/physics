# Review desk implementation

The lesson mastery drawer uses `MasteryReviewDesk` and the math drawer uses `MathControlRoom`.

## Mastery flow

- Select a student, full learning target, and (when relevant) lesson.
- Every current response must receive 1, 2, or 3, or an explicit exclusion with a reason.
- The arithmetic mean uses only rated responses, equally weighted. The final 1–3 level rounds the unrounded mean to the nearest integer (2.50 becomes 3).
- Written feedback remains visible. Review & send opens a final confirmation; it does not send immediately.
- The evidence-review API reloads authoritative evidence and rejects incomplete, duplicate, or stale response identities. Snapshots receive a SHA-256 identity including their response content.
- One database transaction creates the per-evidence review, longitudinal mastery record, and student feedback. A persisted UUID protects retries from duplicate writes.
- Lesson completion is recorded only after all required targets have a review of that submission snapshot. This path bypasses the older per-record completion bridge.
- Students see the overall result, teacher note, and expandable per-evidence scores in teacher feedback.
- The existing math feedback submission foreign key remains reserved for math warm-ups.

## Keyboard

1 / 2 / 3 select an evidence rating. Shift + number rates and advances. Arrow keys move evidence; Shift + arrows move students. F focuses feedback. R opens final review. Command/Control + Enter opens final review, then sends when pressed in that review. Escape leaves a field or closes the current dialog. ? opens shortcut help. Letter and number shortcuts pause inside text inputs.

The math drawer uses number keys, arrows for pending responses, Shift + arrows for students, F for feedback, and Command/Control + Enter to explicitly save an enabled review.

## Drafts and history

Drafts are kept in session storage by student, target, and lesson; each evidence decision also uses the authoritative response identity. Navigating away and back restores the student's own draft. Sent reviews are immutable and displayed read-only for that exact evidence snapshot. New evidence produces a new review. Drafts do not survive clearing the browser session.

## Verification

- `npx tsx --test src/lib/evidence-rating.test.ts`
- `node scripts/test-evidence-review-api.cjs`
- `node scripts/test-evidence-review-db.cjs` (isolated PostgreSQL database `review_desk_test` on localhost:55439)
- `node scripts/test-mastery-review-browser.cjs`
- `node scripts/test-math-review-browser.cjs`
- `node scripts/test-evidence-feedback-browser.cjs`
- TypeScript and scoped ESLint checks

Production migration: `supabase/migrations/20260909042350_evidence_review_desk.sql`. New tables and functions are service-role-only; API routes enforce actor role and roster ownership.
