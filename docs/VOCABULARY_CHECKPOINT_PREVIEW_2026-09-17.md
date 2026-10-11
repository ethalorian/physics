# Vocabulary checkpoint screen preview

Review URL: http://127.0.0.1:4332/checkpoint

Start or restart from the app repository with:

```sh
node scripts/preview-vocab-checkpoint.cjs
```

This is an interactive screen approval build, using synthetic students and browser-local storage. It has no authentication, database, API, or live grade writes. It is not enabled in the production application. The preview imports the app's shared Button/Card components and design tokens.

## Screens

1. **Class dashboard:** student search, status filters, pending scoring, draft grades, released grades, independent Knowledge judgments.
2. **Set up checkpoint:** title, sample class, optional due date, instructions, fixed motion word set, 20-point blueprint, question and answer-guide review.
3. **Student quiz:** ungraded rehearsal, 8 automatically checked questions and 2 written explanations, diagrams, optional sentence starters, saved answers, resume at first unanswered question, answer review, final submission.
4. **Grade responses:** sample roster, 0–4 scoring buttons, answer guide and two-criterion rubric, optional feedback, automatic advance, release action, independent 1–3 Knowledge rating.
5. **Student results:** released quiz percentage and section totals, submitted answers, explanations and teacher feedback. Pending work never appears as zero.

The initial sample class contains 8 students with completed, pending, ready-to-release, in-progress, and not-started states. The student walkthrough uses Emery Patel. Reset demo restores the samples after a confirmation.

## Verified

- Four scoring tests: incomplete work cannot release; partial credit and percentage calculation; zero versus missing and invalid scores; complete submission and idempotency.
- Browser: rehearsal feedback, all eight automatic questions, both written responses, refresh/resume, submission, new work in teacher queue, partial-credit scoring, automatic advance, release, student feedback, settings persistence.
- Verified 10/12 + 6/8 = 16/20 (80%) on one sample and 3/12 + 8/8 = 11/20 (55%) on the walkthrough attempt. Knowledge remained unrated unless deliberately selected.
- Desktop 1366px and mobile 390px checks: no document overflow, touch buttons at least 44px tall, grading buttons 94px desktop and over 85px mobile. Browser console clean.
- TypeScript, changed-file ESLint, and repository style audit passed.

## After screen approval

Integrate the approved UI with the existing vocabulary assignment/check APIs. Production work must include additive question/assessment snapshots, server-only answer keys, rubric points and review versions, teacher-authorized grade release, scoped student feedback, equivalent reassessment versions and grade-history policy, and the existing canonical mastery write endpoint. Class, word-set, target, and audience controls must use the real catalog. Preview-local scoring must never be treated as production authorization or a grading authority.

Respect A-2 (additive schema), A-7 (design tokens and accessibility), M-1 (teacher-only, append-only Knowledge mastery), and M-4 (canonical mastery records). Retakes and live gradebook integration are not part of this screen preview.
