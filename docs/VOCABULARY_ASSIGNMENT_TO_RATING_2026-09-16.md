# Vocabulary assignment-to-rating audit

## Completed path

Published word set → assignment with a Knowledge target → student Home card →
assigned-word practice → saved check/quiz → Control Room evidence → teacher
rating → append-only `mastery_records` → existing 0.60 Knowledge rollup → student
assignment rating. Game scores and practice accuracy never create mastery grades.

## Gaps closed

- Both assignment forms now require a Knowledge target. The server validates the
  target domain and class program; the catalog supplies only Knowledge targets.
- Assignment reports link directly to their task, class, and unit in the Control
  Room. Its assignment link opens the assignment form with the class selected.
- Assigned games retain the task on their return links. Practice answers survive
  reload/resume in the same tab. A ref guard and database unique index prevent
  simultaneous starts from creating multiple unfinished checks.
- Exact duplicate assignments remain blocked. Different student audiences or
  quiz formats can use the same words, enabling individual review and a written
  follow-up to a multiple-choice quiz.
- Recognition submissions validate available options. Teacher evidence resolves
  stored option IDs into the actual words from the assignment snapshot.
- Tracking and access honor active enrollment and archived classes. Written quiz
  review verifies active assignment membership as well as teacher ownership.
- Students see their saved teacher vocabulary rating on assignment cards and the
  work screen. Private teacher notes are excluded from these responses.

## Existing data repaired

Nine previously unlinked assignments owned by `antoccic@fitchburg.k12.ma.us` were
linked to existing Knowledge targets: seven active and two archived. A colleague's
assignment was left unchanged. All updates were restricted to `target_id IS NULL`,
the named assignment titles, teacher ownership, Knowledge domain and matching
program. No student scores or ratings were created or changed.

| Assignment | Existing target |
| --- | --- |
| Asteroid 2026-XJ vocab; Graphing Motion vocab | Physics unit 1: precise motion vocabulary, scalars and vectors (`3af8808d-9188-4878-98c7-b1b0877c16be`) |
| Trades Unit 1 — Measurement and evidence | Trades unit 1: nominal, actual, tolerance and deviation (`11a27559-c0ab-4325-a144-03194beb3cc7`) |
| Week vocab · Read the track · Describing motion | Projects unit 1: interpret motion graphs in words (`09c751dc-2db7-4cba-a42b-3b061fc4d49b`) |

These are the closest existing targets, not new vocabulary-only targets. They
remain editable through the assignment's Knowledge selector.

## Verification

- `scripts/test-vocab-integrity.cjs`: actual API handlers, actual SQL migrations,
  a disposable local PostgreSQL database, synthetic authentication only. Tests
  assignment permissions/domain/program, audience/format duplicates, assigned
  game words, check resume/uniqueness, invalid responses, all six quiz formats,
  written-answer review, stale evidence/review versions, idempotent rating saves,
  canonical grade rows and decay, student feedback/privacy, removed enrollment,
  and archived classes.
- Browser walkthrough against the same database: create practice assignment,
  open student card, answer and reload/resume, submit, inspect readable evidence,
  rate, reload, see the student rating. Repeated with a written-definition quiz:
  rating disabled until answers reviewed, then saved successfully.
- SQL confirmed both browser-created ratings matched their canonical records.
  Browser error/warning logs were empty.
- Existing vocabulary API/assessment tests and 14 learning/mastery unit tests
  passed. TypeScript, changed-file ESLint, style audit and whitespace checks passed.
- Production integrity migration applied. Read-only audit found no missing target
  or program mismatch among this teacher's assignments; production vocabulary
  rating count remained zero. Security advisories for vocabulary are the expected
  service-only tables with RLS and no public policies; no new security exposure.

## Release isolation

The release starts from all 1,810 SHA-verified files of deployment
`dpl_EGms7KkXn2vbQDHh5XzQyHJwVn8c`. Only the 19 vocabulary audit files are overlaid.
The shared arcade end screen uses the live baseline plus the return-link change;
unrelated local XP work is deliberately excluded. Other in-progress work in the
main checkout remains untouched.

## Live release result

- Ready deployment: `dpl_EE7whapyvNCqJvhsNESwyuQYaAGT`,
  `https://physics-c2mza9zkf-ethalorians-projects.vercel.app`.
- All 1,815 uploaded files matched the isolated release SHA hashes. Promoted to
  production after verifying the previous production release had not changed.
- The signed-in Control Room showed three completed vocabulary ratings during
  final verification. No production rating buttons were pressed by this audit.
  A subsequent read-only SQL check confirmed all three reviews have matching
  canonical `mastery_records` with identical student, target, and level.
- The browser was left under the user's control after its state changed during
  navigation. The user's active rating session was not reloaded or interrupted.
